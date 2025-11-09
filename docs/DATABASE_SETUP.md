# 🗄️ Database Setup Guide

Complete guide for setting up your Supabase database for DocCop.

---

## 📋 Quick Setup (3 Steps)

### Step 1: Run the Complete Schema

1. Go to **Supabase Dashboard** → Your Project
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `docs/COMPLETE_SCHEMA.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)

✅ This will create all tables, indexes, RLS policies, and sample data!

### Step 2: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **New Bucket**
3. Name it: `docs`
4. Set it to **Private** (uncheck "Public bucket")
5. Click **Create Bucket**

### Step 3: Configure Storage Policies

1. In **Storage** → Click on the `docs` bucket
2. Click **Policies** tab
3. Click **New Policy**

**Policy 1: Allow Upload**
```sql
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'docs');
```

**Policy 2: Allow View**
```sql
CREATE POLICY "Users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'docs');
```

**Policy 3: Allow Delete**
```sql
CREATE POLICY "Users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'docs');
```

---

## 📊 What Gets Created

### Tables (7):

1. **`documents`** - Core document storage with OCR results and AI analysis
2. **`clients`** - Client management with contact info and metadata
3. **`compliance_rules`** - Configurable compliance checking rules
4. **`compliance_cases`** - Compliance case tracking
5. **`client_activity`** - Activity log for client interactions
6. **`document_comparisons`** - Track document comparison results
7. **`automation_logs`** - Log n8n webhook events and automation

### Indexes:

- 20+ indexes for optimal query performance
- Full-text search indexes on documents and clients
- Foreign key indexes for relationships

### RLS Policies:

- Row Level Security enabled on all tables
- Users can only see/modify their own data
- Service role has full access for automation

### Views (3):

1. **`document_stats`** - Document statistics per user
2. **`client_stats`** - Client statistics with document counts
3. **`compliance_case_summary`** - Compliance case overview

### Triggers:

- Auto-update `updated_at` timestamp on row changes

### Sample Data:

- 7 pre-configured compliance rules for real estate documents

---

## 🔍 Verify Your Setup

Run these queries in the SQL Editor to verify everything is working:

### Check Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'documents', 
  'clients', 
  'compliance_rules', 
  'compliance_cases', 
  'client_activity',
  'document_comparisons',
  'automation_logs'
);
```

Expected: 7 rows

### Check RLS Policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

Expected: 20+ rows

### Check Sample Compliance Rules
```sql
SELECT name, category, severity 
FROM compliance_rules 
ORDER BY severity DESC;
```

Expected: 7 rules

### Check Storage Bucket
```sql
SELECT id, name, public 
FROM storage.buckets 
WHERE name = 'docs';
```

Expected: 1 row with `public = false`

---

## 🔧 Troubleshooting

### Issue: "relation already exists"

**Solution:** Some tables already exist. This is OK! The schema uses `IF NOT EXISTS` so it won't break existing tables.

### Issue: "permission denied"

**Solution:** Make sure you're using the correct role. Go to SQL Editor and ensure you're running as the authenticated user or service role.

### Issue: RLS policies not working

**Solution:** 
1. Check that `auth.uid()` returns a valid UUID when you're logged in
2. Verify your user is authenticated
3. Test with: `SELECT auth.uid();`

### Issue: Storage bucket policies failing

**Solution:**
1. Ensure the `docs` bucket exists first
2. Run storage policies in the Storage → Policies UI, not in SQL Editor
3. Use the "New Policy" button instead of raw SQL

---

## 📊 Database Schema Overview

```
┌─────────────────────────────────────────────────────┐
│                      USERS (auth)                    │
│                    (Supabase Auth)                   │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬───────────────┐
        │              │              │               │
        ▼              ▼              ▼               ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌─────────────┐
│  DOCUMENTS   │ │ CLIENTS  │ │  COMPLIANCE  │ │ AUTOMATION  │
│              │ │          │ │    RULES     │ │    LOGS     │
│ - filename   │ │ - name   │ │              │ │             │
│ - ocr_text   │ │ - email  │ │ - rule_type  │ │ - event_type│
│ - entities   │ │ - phone  │ │ - conditions │ │ - status    │
│ - ai_analysis│ │ - company│ │ - severity   │ │ - event_data│
│ - status     │ │ - status │ │              │ │             │
└──────┬───────┘ └────┬─────┘ └──────────────┘ └─────────────┘
       │              │
       │              │
       │              │
       │         ┌────┴────┐
       │         │ CLIENT  │
       │         │ACTIVITY │
       │         │         │
       │         │ - type  │
       │         │ - desc  │
       │         └─────────┘
       │
       │
       ▼
┌─────────────────┐
│   COMPLIANCE    │
│     CASES       │
│                 │
│ - case_name     │
│ - required_docs │
│ - status        │
│ - results       │
└─────────────────┘
```

---

## 🎯 Database Features

### 1. Full-Text Search

Search across documents and clients:

```sql
-- Search documents
SELECT * FROM documents
WHERE to_tsvector('english', filename || ' ' || ocr_text) 
@@ to_tsquery('english', 'contract & property');

-- Search clients
SELECT * FROM clients
WHERE to_tsvector('english', name || ' ' || email || ' ' || company) 
@@ to_tsquery('english', 'smith & realty');
```

### 2. Real-Time Subscriptions

Your app can subscribe to changes:

```javascript
// Listen to new documents
supabase
  .channel('documents')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'documents' },
    (payload) => console.log('New document:', payload)
  )
  .subscribe();
```

### 3. JSONB Fields for Flexibility

- `documents.entities` - Extracted entities as JSON
- `documents.ai_analysis` - AI insights
- `documents.metadata` - Custom metadata
- `clients.metadata` - Additional client data
- `compliance_rules.conditions` - Rule conditions

### 4. Array Fields

- `clients.tags` - Client tags
- `compliance_cases.required_documents` - Required doc types
- `compliance_cases.document_ids` - Attached documents

---

## 🚀 Performance Tips

1. **Use Indexes**: All common queries are indexed
2. **Limit Results**: Use `LIMIT` and pagination
3. **Use Views**: Pre-built views for common queries
4. **Enable Caching**: Use Supabase cache headers
5. **Optimize JSONB**: Index specific JSONB fields if needed

### Example: Index JSONB field
```sql
-- If you query specific entity types frequently
CREATE INDEX idx_documents_entity_type 
ON documents USING gin ((entities -> 'type'));
```

---

## 📝 Next Steps After Setup

1. ✅ Verify all tables are created
2. ✅ Check storage bucket exists
3. ✅ Test uploading a document from your app
4. ✅ Verify RLS policies work (you see only your data)
5. ✅ Create a test client
6. ✅ Upload a test document
7. ✅ Run OCR processing
8. ✅ Check compliance rules

---

## 🔒 Security Notes

- **RLS is enabled** on all tables - users can only access their own data
- **Storage bucket is private** - files require signed URLs
- **Authentication required** - all API calls need valid JWT token
- **Service role** - Only use for backend automation (n8n, etc.)
- **Never expose** service role key in frontend code

---

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies](https://supabase.com/docs/guides/storage)

---

**Need Help?** Check the Supabase Dashboard logs or run the verification queries above.

