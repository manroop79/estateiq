# 🚀 DocCop Setup Guide

Complete setup instructions for deploying DocCop with all features.

---

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- (Optional) OpenAI or Anthropic API key for AI features
- (Optional) N8N instance for automation

---

## 🗄️ Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Run Database Migrations

Execute these SQL files in order in your Supabase SQL editor:

```sql
-- 1. Run base schema (if not already done)
-- Your existing documents table should be there

-- 2. Add client_id to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Add ai_analysis column for AI insights
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}'::jsonb;
```

Then run:
- `/docs/COMPLETE_SCHEMA.sql` - Complete database schema (includes all tables: documents, clients, compliance, etc.)

### 3. Webhook Tables (Optional - for N8N)

```sql
-- Webhook configurations
CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  data JSONB,
  webhook_url TEXT,
  response_status INTEGER,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(received_at DESC);
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the `doccop` directory:

```bash
# ============================================
# REQUIRED - Supabase Configuration
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================
# OPTIONAL - OCR Configuration
# ============================================
# Set to 'true' for instant mock OCR (great for development)
# Set to 'false' or remove for real Tesseract OCR
NEXT_PUBLIC_USE_MOCK_OCR=false

# ============================================
# OPTIONAL - AI Features (OpenAI or Anthropic)
# ============================================
# Choose one provider
AI_PROVIDER=openai
# or
# AI_PROVIDER=anthropic

# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Anthropic Configuration (alternative)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229

# ============================================
# OPTIONAL - N8N Automation
# ============================================
N8N_WEBHOOK_SECRET=your_random_secret_key_here
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/abc123

# ============================================
# OPTIONAL - Email Notifications
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

---

## 📦 Installation

```bash
# Navigate to doccop directory
cd doccop

# Install dependencies
npm install

# Copy PDF worker (important!)
npm run copy:pdf-worker

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎯 Feature Configuration

### OCR Extraction

**Development Mode (Instant Results):**
```bash
NEXT_PUBLIC_USE_MOCK_OCR=true
```
- Returns mock data in 2 seconds
- Perfect for UI testing
- No API costs

**Production Mode (Real OCR):**
```bash
NEXT_PUBLIC_USE_MOCK_OCR=false
```
- Uses Tesseract.js for real OCR
- Takes 15-30 seconds per document
- Runs in browser (no backend needed)

---

### AI Insights

**Enable AI Features:**

1. Choose your AI provider:
   ```bash
   AI_PROVIDER=openai  # or 'anthropic'
   ```

2. Add your API key:
   ```bash
   # For OpenAI
   OPENAI_API_KEY=sk-your-key-here
   
   # OR for Anthropic
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

3. Restart your dev server

**Available AI Features:**
- Document summarization
- Legal issue detection
- Field validation suggestions
- Risk assessment
- Cross-document analysis
- Insights extraction

**Usage:**
- Go to any processed document
- Click "Analyze with AI" button
- Choose analysis type
- Results are cached in database

**API Endpoints:**
- `POST /api/ai/analyze` - Analyze single document
- `POST /api/ai/compare` - Compare two documents with AI

---

### Client Management

**No configuration needed!** Works out of the box once database is set up.

**Features:**
- Full CRUD for clients
- Search and filtering
- Document linking
- Activity logging
- Stats dashboard

**Access:** Navigate to `/clients`

---

### Document Comparison

**No configuration needed!** Works automatically.

**Usage:**
1. Upload and process 2+ documents
2. Select 2 documents in vault
3. Navigate to `/compare`
4. Toggle between Split View and Compare Entities

---

### Compliance Dashboard

**Setup:**

1. Database tables created automatically from SQL file
2. Default rules are inserted
3. No additional configuration needed

**Create Compliance Case:**
```bash
curl -X POST http://localhost:3000/api/compliance/create-case \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Property Deal #123",
    "description": "Title deed and NOC verification",
    "documentIds": ["doc-uuid-1", "doc-uuid-2"]
  }'
```

**Run Compliance Check:**
```bash
curl -X POST http://localhost:3000/api/compliance/check \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "case-uuid"
  }'
```

**Access:** Navigate to `/compliance-card/[caseId]`

---

### N8N Automation

**Setup:**

1. Deploy N8N instance ([n8n.io](https://n8n.io))

2. Add webhook secret:
   ```bash
   N8N_WEBHOOK_SECRET=your_secret_here
   ```

3. Create webhook in N8N:
   - Add Webhook Trigger node
   - Set method to POST
   - Copy webhook URL

4. Configure in DocCop:
   ```bash
   N8N_WEBHOOK_URL=https://your-n8n.com/webhook/abc123
   ```

**Available Events:**
- `document.uploaded`
- `document.processed`
- `document.failed`
- `compliance.checked`
- `compliance.failed`
- `client.created`

**See:** `/docs/N8N_INTEGRATION.md` for complete guide

---

## 🧪 Testing

### Test OCR (Mock Mode)
```bash
# 1. Set mock mode
NEXT_PUBLIC_USE_MOCK_OCR=true

# 2. Upload any PDF
# 3. Click "Extract Data"
# 4. See results in ~2 seconds
```

### Test OCR (Real Mode)
```bash
# 1. Set real mode
NEXT_PUBLIC_USE_MOCK_OCR=false

# 2. Upload a clear PDF with text
# 3. Click "Extract Data"
# 4. Wait 15-30 seconds
# 5. Review extracted entities
```

### Test AI Analysis
```bash
# 1. Process a document with OCR
# 2. Go to document detail page
# 3. Click "Analyze with AI"
# 4. Choose analysis type
# 5. View insights
```

### Test Document Comparison
```bash
# 1. Process 2 documents
# 2. Go to /vault
# 3. Select both documents
# 4. Click "Compare" in sidebar
# 5. View side-by-side comparison
```

---

## 📊 Performance Optimization

### Production Build

```bash
npm run build
npm run start
```

### Database Indexes

All necessary indexes are included in the SQL files. Verify they're created:

```sql
-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Caching

- PDF signed URLs cached for 1 hour
- AI analysis results stored in database
- OCR results cached permanently

### CDN Setup (Optional)

Configure CDN for:
- `/pdf.worker.min.mjs`
- Static assets in `/public`
- Built JavaScript/CSS

---

## 🔐 Security Checklist

- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Set strong webhook secrets
- [ ] Use HTTPS in production
- [ ] Rotate API keys regularly
- [ ] Enable Supabase email verification
- [ ] Configure CORS properly
- [ ] Set up rate limiting (via middleware)
- [ ] Enable audit logging
- [ ] Review RLS policies
- [ ] Backup database regularly

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
cd doccop
vercel

# 3. Add environment variables in Vercel dashboard
# 4. Redeploy
vercel --prod
```

### Docker (Alternative)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📚 API Documentation

### Document APIs
- `POST /api/upload` - Upload document
- `POST /api/process?docId=` - Process with OCR
- `POST /api/storage/signed-url` - Get signed URL

### AI APIs
- `POST /api/ai/analyze` - AI analysis
- `POST /api/ai/compare` - AI comparison

### Client APIs
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/[id]` - Get client
- `PATCH /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Compliance APIs
- `POST /api/compliance/create-case` - Create case
- `POST /api/compliance/check` - Run checks
- `GET /api/compliance/rules` - List rules
- `POST /api/compliance/rules` - Create rule

### Webhook APIs
- `POST /api/webhooks/n8n` - N8N webhook
- `GET /api/webhooks/n8n` - List configs

---

## 🐛 Troubleshooting

### OCR Not Working
- Check browser console for errors
- Verify `/pdf.worker.min.mjs` exists in `/public`
- Try mock mode first
- Check document is valid PDF

### AI Features Not Available
- Verify API key is set correctly
- Check API key has credits/quota
- Review API error messages in console
- Test API key with curl

### Database Errors
- Verify RLS policies allow access
- Check user is authenticated
- Review Supabase logs
- Confirm tables exist

### Comparison Page Errors
- Ensure both documents are processed
- Check documents have `remoteId`
- Verify signed URLs are accessible
- Check browser console

---

## 📞 Support & Resources

- **Documentation:** All `.md` files in `/docs`
- **Schemas:** SQL files in `/docs`
- **Examples:** See API route files
- **Issues:** Check browser console and server logs

---

## 🎉 You're Ready!

Your DocCop installation is complete. Start by:

1. ✅ Uploading a test document
2. ✅ Processing it with OCR
3. ✅ Creating a client
4. ✅ Testing document comparison
5. ✅ (Optional) Setting up AI features
6. ✅ (Optional) Configuring N8N automation

**Happy Document Managing! 🚀**

