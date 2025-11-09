# 🏢 EstateIQ - Real Estate KYC & Legal Copilot

A comprehensive document management system with AI-powered OCR extraction, compliance checking, and intelligent insights for real estate professionals.

![EstateIQ Dashboard](./public/Screenshot%202025-11-09%20190703.png)

## ✨ Features

### 📄 Document Management
- **Smart OCR Processing** - Extract text and entities from PDFs and images using Tesseract.js
- **AI-Powered Analysis** - Get intelligent insights, summaries, and legal issue detection
- **Document Comparison** - Side-by-side comparison of documents with diff highlighting
- **Secure Storage** - Private document storage with Supabase

### 👥 Client Management
- **Complete CRM** - Manage clients with contact info, documents, and activity logs
- **Document Linking** - Associate documents with clients
- **Search & Filter** - Quick search across all client data

### ✅ Compliance Dashboard
- **Automated Compliance Checks** - Configurable rules engine for document validation
- **Case Management** - Group documents for compliance review
- **Risk Assessment** - Automatic risk scoring and flagging

### 🤖 AI Insights
- **Document Summarization** - Get quick summaries of complex documents
- **Legal Issue Detection** - Identify potential legal problems
- **Cross-Document Analysis** - Compare and analyze multiple documents together

### 🔄 Automation
- **N8N Integration** - Webhook support for workflow automation
- **Real-time Updates** - Live document processing status
- **Notifications** - Automated alerts for important events

## 🖼️ Screenshots

### Dashboard Overview
![Dashboard](./public/Screenshot%202025-11-09%20190703.png)

### Document Vault
![Vault](./public/Screenshot%202025-11-09%20190748.png)

### Document Processing
![Processing](./public/Screenshot%202025-11-09%20190815.png)

### AI Insights
![AI Insights](./public/Screenshot%202025-11-09%20190909.png)

### Client Management
![Clients](./public/Screenshot%202025-11-09%20190950.png)

### Compliance Dashboard
![Compliance](./public/Screenshot%202025-11-09%20191048.png)

### Document Comparison
![Comparison](./public/Screenshot%202025-11-09%20191208.png)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- (Optional) OpenAI or Anthropic API key for AI features

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd doccop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file:
   ```bash
   # Required - Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Optional - OCR (for development, use mock mode)
   NEXT_PUBLIC_USE_MOCK_OCR=true

   # Optional - AI Features
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   # OR
   # AI_PROVIDER=anthropic
   # ANTHROPIC_API_KEY=sk-ant-...
   ```

4. **Set up database**
   
   - Go to your Supabase project
   - Open SQL Editor
   - Run the contents of `docs/COMPLETE_SCHEMA.sql`
   - Create a storage bucket named `docs` (private)

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Detailed setup instructions
- **[Database Setup](docs/DATABASE_SETUP.md)** - Database configuration guide

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **OCR:** Tesseract.js
- **AI:** OpenAI / Anthropic
- **UI:** React, Tailwind CSS, Framer Motion
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod

## 🎯 Key Features Explained

### OCR Processing

**Development Mode (Fast):**
```bash
NEXT_PUBLIC_USE_MOCK_OCR=true
```
- Returns mock data in ~2 seconds
- Perfect for UI development and testing

**Production Mode (Real OCR):**
```bash
NEXT_PUBLIC_USE_MOCK_OCR=false
```
- Uses Tesseract.js for real OCR
- Processes PDFs and images
- Takes 15-30 seconds per document

### Document Comparison

1. Upload and process 2+ documents
2. Select 2 documents in the vault
3. Navigate to `/compare`
4. Toggle between:
   - **Split View** - Side-by-side PDF comparison
   - **Compare Entities** - Extracted data comparison with diff highlighting

### Compliance Checking

1. Create a compliance case via API or UI
2. Add documents to the case
3. System automatically checks against configured rules
4. View results in the compliance dashboard

### AI Analysis

1. Process a document (OCR extraction)
2. Click "Analyze with AI" on the document page
3. Choose analysis type:
   - Summary
   - Legal Issues
   - Risk Assessment
   - Key Takeaways
4. Results are cached in the database

## 📁 Project Structure

```
doccop/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── clients/           # Client management page
│   ├── compare/           # Document comparison
│   ├── compliance-card/   # Compliance dashboard
│   ├── document/          # Document viewer
│   ├── insights/          # AI insights page
│   ├── vault/             # Document vault
│   └── settings/          # Settings page
├── components/            # React components
│   ├── compliance/        # Compliance components
│   ├── document/          # Document components
│   ├── layout/            # Layout components
│   └── ui/                # UI primitives
├── lib/                   # Utilities and libraries
│   ├── ai/                # AI client configuration
│   ├── extractors/        # OCR extractors
│   ├── n8n/               # N8N integration
│   └── supabase/          # Supabase clients
├── docs/                  # Documentation
│   ├── COMPLETE_SCHEMA.sql
│   └── DATABASE_SETUP.md
└── public/                # Static assets
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start            # Start production server

# Utilities
npm run lint         # Run ESLint
npm run copy:pdf-worker  # Copy PDF worker (auto-runs on install)
```

## 🌐 API Endpoints

### Documents
- `POST /api/documents/create` - Create document record
- `POST /api/documents/update` - Update document
- `POST /api/process?docId=...` - Process document (OCR)
- `GET /api/storage/signed-url` - Get signed URL for document

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/[id]` - Get client details
- `POST /api/clients/[id]/activity` - Log client activity

### Compliance
- `POST /api/compliance/create-case` - Create compliance case
- `POST /api/compliance/check` - Run compliance check
- `GET /api/compliance/rules` - List compliance rules

### AI
- `POST /api/ai/analyze` - Analyze document with AI
- `POST /api/ai/compare` - Compare documents with AI

## 🔒 Security

- **Row Level Security (RLS)** - Enabled on all tables
- **Private Storage** - Documents require signed URLs
- **Authentication** - All API routes require authentication
- **Environment Variables** - Sensitive keys never exposed to client

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Railway
- Render
- AWS Amplify
- DigitalOcean App Platform

**Note:** Ensure your Supabase project allows connections from your deployment domain.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is private and proprietary.

## 🆘 Support

For issues and questions:
1. Check the [Setup Guide](SETUP_GUIDE.md)
2. Review [Database Setup](docs/DATABASE_SETUP.md)
3. Open an issue on GitHub

## 🎉 Acknowledgments

Built with:
- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Tesseract.js](https://tesseract.projectnaptha.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)

---

**Made with ❤️ for Real Estate Professionals**
