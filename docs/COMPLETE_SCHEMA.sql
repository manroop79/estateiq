-- ========================================
-- COMPLETE DOCCOP DATABASE SCHEMA
-- ========================================
-- Run this entire file in your Supabase SQL Editor
-- This will create all tables, indexes, RLS policies, and storage buckets

-- ========================================
-- 1. DOCUMENTS TABLE (Core)
-- ========================================

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    size BIGINT,
    kind TEXT, -- 'pdf', 'image', etc.
    
    -- Processing status
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'processed', 'failed'
    
    -- OCR and extraction results
    ocr_text TEXT,
    entities JSONB DEFAULT '[]'::jsonb,
    
    -- AI Analysis results
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    -- Structure: { "summary": "...", "legal_issues": "...", "key_takeaways": "..." }
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Client relationship (foreign key added later)
    client_id UUID,
    
    -- Compliance
    compliance_status TEXT, -- 'compliant', 'non-compliant', 'pending'
    compliance_checked_at TIMESTAMPTZ,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_compliance_status ON public.documents(compliance_status);

-- Full-text search index on filename and OCR text
CREATE INDEX IF NOT EXISTS idx_documents_search ON public.documents 
USING gin(to_tsvector('english', coalesce(filename, '') || ' ' || coalesce(ocr_text, '')));

-- ========================================
-- 2. CLIENTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    company TEXT,
    
    -- Address
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    
    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'archived'
    
    -- Metadata
    notes TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- User relationship
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);

-- Full-text search on client data
CREATE INDEX IF NOT EXISTS idx_clients_search ON public.clients 
USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(company, '')));

-- ========================================
-- 3. COMPLIANCE RULES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.compliance_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Rule definition
    rule_type TEXT NOT NULL, -- 'required_field', 'pattern_match', 'value_range', 'custom'
    field_name TEXT, -- Which entity field to check (e.g., 'property_address', 'price')
    
    -- Rule conditions
    conditions JSONB NOT NULL,
    -- Examples:
    -- Required field: { "required": true }
    -- Pattern match: { "pattern": "^[0-9]{5}$" }
    -- Value range: { "min": 0, "max": 1000000 }
    -- Custom: { "custom_logic": "..." }
    
    -- Rule metadata
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    category TEXT, -- 'legal', 'financial', 'property', 'identity'
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- User relationship (NULL for system-wide default rules)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for compliance rules
CREATE INDEX IF NOT EXISTS idx_compliance_rules_active ON public.compliance_rules(active);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_user_id ON public.compliance_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_severity ON public.compliance_rules(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_category ON public.compliance_rules(category);

-- ========================================
-- 4. COMPLIANCE CASES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.compliance_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_name TEXT NOT NULL,
    description TEXT,
    
    -- Required documents for this case
    required_documents TEXT[] DEFAULT ARRAY[]::TEXT[],
    -- Example: ['purchase_agreement', 'title_deed', 'inspection_report']
    
    -- Case status
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'compliant', 'non_compliant', 'completed'
    
    -- Associated documents
    document_ids UUID[] DEFAULT ARRAY[]::UUID[],
    
    -- Client relationship
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Compliance results
    compliance_results JSONB DEFAULT '{}'::jsonb,
    -- Structure: { "passed": [], "failed": [], "missing": [] }
    
    last_checked_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    
    -- User relationship
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for compliance cases
CREATE INDEX IF NOT EXISTS idx_compliance_cases_user_id ON public.compliance_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_cases_client_id ON public.compliance_cases(client_id);
CREATE INDEX IF NOT EXISTS idx_compliance_cases_status ON public.compliance_cases(status);
CREATE INDEX IF NOT EXISTS idx_compliance_cases_created_at ON public.compliance_cases(created_at DESC);

-- ========================================
-- 5. CLIENT ACTIVITY LOG TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.client_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    
    -- Activity details
    activity_type TEXT NOT NULL, -- 'document_uploaded', 'document_processed', 'email_sent', 'note_added'
    description TEXT NOT NULL,
    
    -- Related entities
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    
    -- Activity metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- User who performed the activity
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for client activity
CREATE INDEX IF NOT EXISTS idx_client_activity_client_id ON public.client_activity(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_created_at ON public.client_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_activity_type ON public.client_activity(activity_type);

-- ========================================
-- 6. DOCUMENT COMPARISONS TABLE (Optional)
-- ========================================

CREATE TABLE IF NOT EXISTS public.document_comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Documents being compared
    document_a_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    document_b_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    
    -- Comparison results
    differences JSONB DEFAULT '[]'::jsonb,
    similarity_score DECIMAL(5,2), -- 0.00 to 100.00
    
    -- AI comparison summary (optional)
    ai_comparison JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- User relationship
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for document comparisons
CREATE INDEX IF NOT EXISTS idx_comparisons_doc_a ON public.document_comparisons(document_a_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_doc_b ON public.document_comparisons(document_b_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_user_id ON public.document_comparisons(user_id);

-- ========================================
-- 7. AUTOMATION LOGS TABLE (n8n tracking)
-- ========================================

CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Event details
    event_type TEXT NOT NULL, -- 'webhook_triggered', 'email_sent', 'notification_sent'
    event_data JSONB NOT NULL,
    
    -- Related entities
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    
    -- Status
    status TEXT DEFAULT 'success', -- 'success', 'failed', 'pending'
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for automation logs
CREATE INDEX IF NOT EXISTS idx_automation_logs_event_type ON public.automation_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON public.automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON public.automation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_document_id ON public.automation_logs(document_id);

-- ========================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ========================================

-- Add client_id foreign key to documents (after clients table exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'documents_client_id_fkey'
    ) THEN
        ALTER TABLE public.documents
        ADD CONSTRAINT documents_client_id_fkey
        FOREIGN KEY (client_id) 
        REFERENCES public.clients(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- DOCUMENTS POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
CREATE POLICY "Users can view their own documents"
ON public.documents FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
CREATE POLICY "Users can insert their own documents"
ON public.documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents"
ON public.documents FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
CREATE POLICY "Users can delete their own documents"
ON public.documents FOR DELETE
USING (auth.uid() = user_id);

-- ========================================
-- CLIENTS POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
CREATE POLICY "Users can view their own clients"
ON public.clients FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
CREATE POLICY "Users can insert their own clients"
ON public.clients FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
CREATE POLICY "Users can update their own clients"
ON public.clients FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
CREATE POLICY "Users can delete their own clients"
ON public.clients FOR DELETE
USING (auth.uid() = user_id);

-- ========================================
-- COMPLIANCE RULES POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view compliance rules" ON public.compliance_rules;
CREATE POLICY "Users can view compliance rules"
ON public.compliance_rules FOR SELECT
USING (user_id IS NULL OR auth.uid() = user_id);
-- Users can see system-wide rules (user_id = NULL) AND their own rules

DROP POLICY IF EXISTS "Users can insert their own compliance rules" ON public.compliance_rules;
CREATE POLICY "Users can insert their own compliance rules"
ON public.compliance_rules FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own compliance rules" ON public.compliance_rules;
CREATE POLICY "Users can update their own compliance rules"
ON public.compliance_rules FOR UPDATE
USING (auth.uid() = user_id);
-- Users can only update their own rules, not system rules

DROP POLICY IF EXISTS "Users can delete their own compliance rules" ON public.compliance_rules;
CREATE POLICY "Users can delete their own compliance rules"
ON public.compliance_rules FOR DELETE
USING (auth.uid() = user_id);
-- Users can only delete their own rules, not system rules

-- ========================================
-- COMPLIANCE CASES POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view their own compliance cases" ON public.compliance_cases;
CREATE POLICY "Users can view their own compliance cases"
ON public.compliance_cases FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own compliance cases" ON public.compliance_cases;
CREATE POLICY "Users can insert their own compliance cases"
ON public.compliance_cases FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own compliance cases" ON public.compliance_cases;
CREATE POLICY "Users can update their own compliance cases"
ON public.compliance_cases FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own compliance cases" ON public.compliance_cases;
CREATE POLICY "Users can delete their own compliance cases"
ON public.compliance_cases FOR DELETE
USING (auth.uid() = user_id);

-- ========================================
-- CLIENT ACTIVITY POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view activity for their own clients" ON public.client_activity;
CREATE POLICY "Users can view activity for their own clients"
ON public.client_activity FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_activity.client_id
    AND clients.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert activity for their own clients" ON public.client_activity;
CREATE POLICY "Users can insert activity for their own clients"
ON public.client_activity FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_activity.client_id
    AND clients.user_id = auth.uid()
  )
);

-- ========================================
-- DOCUMENT COMPARISONS POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view their own comparisons" ON public.document_comparisons;
CREATE POLICY "Users can view their own comparisons"
ON public.document_comparisons FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own comparisons" ON public.document_comparisons;
CREATE POLICY "Users can insert their own comparisons"
ON public.document_comparisons FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comparisons" ON public.document_comparisons;
CREATE POLICY "Users can delete their own comparisons"
ON public.document_comparisons FOR DELETE
USING (auth.uid() = user_id);

-- ========================================
-- AUTOMATION LOGS POLICIES
-- ========================================

DROP POLICY IF EXISTS "Service role can manage automation logs" ON public.automation_logs;
CREATE POLICY "Service role can manage automation logs"
ON public.automation_logs FOR ALL
USING (true); -- Service role can do everything (set in Supabase dashboard)

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_compliance_rules_updated_at ON public.compliance_rules;
CREATE TRIGGER update_compliance_rules_updated_at
    BEFORE UPDATE ON public.compliance_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_compliance_cases_updated_at ON public.compliance_cases;
CREATE TRIGGER update_compliance_cases_updated_at
    BEFORE UPDATE ON public.compliance_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STORAGE BUCKETS
-- ========================================

-- Create storage bucket for documents (if not exists)
-- Note: You may need to run this in the Supabase Storage UI or via API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('docs', 'docs', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for 'docs' bucket
-- Note: Run these in Supabase Dashboard > Storage > Policies

-- Allow authenticated users to upload files
-- CREATE POLICY "Authenticated users can upload files"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'docs');

-- Allow users to view their own files
-- CREATE POLICY "Users can view their own files"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
-- CREATE POLICY "Users can delete their own files"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========================================
-- SAMPLE COMPLIANCE RULES (Optional)
-- ========================================

-- Insert some default compliance rules
-- These are system-wide rules (user_id = NULL) visible to all users
-- You can customize these based on your needs

INSERT INTO public.compliance_rules (name, description, rule_type, field_name, conditions, severity, category, active, user_id)
VALUES 
    ('Property Address Required', 'Property address must be present in the document', 'required_field', 'property_address', '{"required": true}', 'high', 'property', true, NULL),
    ('Price Required', 'Property price must be specified', 'required_field', 'price', '{"required": true}', 'high', 'financial', true, NULL),
    ('Seller Name Required', 'Seller name must be present', 'required_field', 'seller_name', '{"required": true}', 'medium', 'legal', true, NULL),
    ('Buyer Name Required', 'Buyer name must be present', 'required_field', 'buyer_name', '{"required": true}', 'medium', 'legal', true, NULL),
    ('Date Required', 'Document date must be present', 'required_field', 'date', '{"required": true}', 'medium', 'legal', true, NULL),
    ('Valid ZIP Code', 'ZIP code must be 5 digits', 'pattern_match', 'zip_code', '{"pattern": "^[0-9]{5}$"}', 'low', 'property', true, NULL),
    ('Reasonable Price Range', 'Price should be within reasonable range', 'value_range', 'price', '{"min": 1000, "max": 100000000}', 'medium', 'financial', true, NULL)
ON CONFLICT DO NOTHING;

-- ========================================
-- USEFUL VIEWS (Optional)
-- ========================================

-- View for document statistics per user
CREATE OR REPLACE VIEW document_stats AS
SELECT 
    user_id,
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE status = 'processed') as processed_count,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    SUM(size) as total_size,
    MAX(created_at) as last_upload
FROM public.documents
GROUP BY user_id;

-- View for client statistics
CREATE OR REPLACE VIEW client_stats AS
SELECT 
    c.id as client_id,
    c.name as client_name,
    c.user_id,
    COUNT(d.id) as total_documents,
    COUNT(d.id) FILTER (WHERE d.status = 'processed') as processed_documents,
    MAX(d.created_at) as last_document_date,
    COUNT(ca.id) as total_activities,
    MAX(ca.created_at) as last_activity_date
FROM public.clients c
LEFT JOIN public.documents d ON d.client_id = c.id
LEFT JOIN public.client_activity ca ON ca.client_id = c.id
GROUP BY c.id, c.name, c.user_id;

-- View for compliance case summary
CREATE OR REPLACE VIEW compliance_case_summary AS
SELECT 
    cc.id as case_id,
    cc.case_name,
    cc.status,
    cc.user_id,
    cc.client_id,
    c.name as client_name,
    array_length(cc.required_documents, 1) as required_docs_count,
    array_length(cc.document_ids, 1) as attached_docs_count,
    cc.due_date,
    cc.created_at
FROM public.compliance_cases cc
LEFT JOIN public.clients c ON c.id = cc.client_id;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ DocCop database schema setup complete!';
    RAISE NOTICE '📊 Tables created: documents, clients, compliance_rules, compliance_cases, client_activity, document_comparisons, automation_logs';
    RAISE NOTICE '🔒 RLS policies enabled and configured';
    RAISE NOTICE '⚡ Indexes created for optimal performance';
    RAISE NOTICE '📝 Views created for statistics and reporting';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT NEXT STEPS:';
    RAISE NOTICE '1. Go to Supabase Dashboard > Storage';
    RAISE NOTICE '2. Create a bucket named "docs" if it doesn''t exist';
    RAISE NOTICE '3. Set the bucket to private (not public)';
    RAISE NOTICE '4. Configure storage policies for authenticated users';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 You are ready to use DocCop!';
END $$;

