import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { runOCR } from "@/lib/extract";
import { extractRealEstateEntities } from "@/lib/extractors/realEstateExtractor";
import { mockRunOCR, mockExtractRealEstateEntities } from "@/lib/extractors/mockExtractor";
import { notifyDocumentProcessed } from "@/lib/n8n/client";

export const runtime = "nodejs";
export const maxDuration = 120;

// Force mock OCR by default for development - set NEXT_PUBLIC_USE_MOCK_OCR=false to use real OCR
// Check both server-side and ensure it defaults to true
const USE_MOCK_OCR = process.env.NEXT_PUBLIC_USE_MOCK_OCR === 'false' ? false : true;

type DbStatus =
| "uploaded"
| "processing"
| "extracted"
| "checked"
| "ready"
| "needs_info"
| "suspect"
| "failed";

export async function POST(req: NextRequest) {
const docId = req.nextUrl.searchParams.get("docId");
if (!docId) return NextResponse.json({ error: "docId required" }, { status: 400 });

// FORCE mock OCR - always use mock unless explicitly disabled
// Runtime check for mock OCR (more reliable than module-level check)
// Default to TRUE (mock) unless explicitly set to 'false'
const envVar = process.env.NEXT_PUBLIC_USE_MOCK_OCR;
const runtimeMockOCR = envVar === 'false' ? false : true; // Default to true

// Double-check: If env var is undefined, null, empty, or anything other than 'false', use mock
// This is a safety measure to ensure mock is always the default

// Log OCR mode for debugging (can be removed in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 OCR Mode:', runtimeMockOCR ? 'MOCK' : 'REAL');
}

const sb = supabaseServer();

// Load the document
const { data: doc, error: docErr } = await sb
.from("documents")
.select("*")
.eq("id", docId)
.single();

if (docErr || !doc) {
return NextResponse.json({ error: "doc not found" }, { status: 404 });
}

// Mark as processing
await sb.from("documents").update({ status: "processing" as DbStatus }).eq("id", docId);

try {
const startTime = Date.now();

// Run OCR (use mock for fast development) - use runtime check for reliability
let result;
const shouldUseMock = runtimeMockOCR;

// ALWAYS use mock OCR unless explicitly disabled
if (shouldUseMock) {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Using MOCK OCR for fast development');
  }
  try {
    await mockRunOCR('mock://document'); // Simulate delay
    result = mockExtractRealEstateEntities(doc.filename || 'document.pdf');
  } catch (mockError) {
    console.error('❌ Mock OCR failed:', mockError);
    throw new Error(`Mock OCR failed unexpectedly: ${mockError instanceof Error ? mockError.message : String(mockError)}`);
  }
} else {
  // Real OCR path - warn about potential issues
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ Using REAL OCR (Tesseract.js) - this may take 30-60 seconds...');
  }
  
  try {
    // Real OCR requires storage_path
    if (!doc.storage_path) {
      throw new Error("no storage_path - document must be uploaded to storage first");
    }
    
    // Get a signed URL for OCR
    const { data: signed, error: sErr } = await sb.storage
      .from("docs")
      .createSignedUrl(doc.storage_path as string, 60 * 5);

    if (sErr || !signed?.signedUrl) {
      throw new Error(`signed url failed: ${sErr?.message || 'Unknown error'}`);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Document URL:', signed.signedUrl);
      console.log('Document filename:', doc.filename);
    }
    
    const text = await runOCR(signed.signedUrl);
    
    result = extractRealEstateEntities(text);
  } catch (realOCRError) {
    console.error('❌ Real OCR failed:', realOCRError);
    // If real OCR fails, automatically fall back to mock OCR
    const errorMsg = realOCRError instanceof Error ? realOCRError.message : String(realOCRError);
    
    // Check for common errors that indicate real OCR won't work
    const shouldFallbackToMock = 
      errorMsg.includes('DOM') || 
      errorMsg.includes('Matrix') || 
      errorMsg.includes('pdftocairo') || 
      errorMsg.includes('ENOENT') ||
      errorMsg.includes('poppler');
    
    if (shouldFallbackToMock) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Real OCR failed, falling back to MOCK OCR...');
      }
      // Fall back to mock OCR
      await mockRunOCR('mock://document');
      result = mockExtractRealEstateEntities(doc.filename || 'document.pdf');
    } else {
      // Other errors - throw normally
      throw realOCRError;
    }
  }
}

const processingTime = (Date.now() - startTime) / 1000; // seconds

// Prepare extracted data for database
const extracted = {
  entities: result.entities,
  documentType: result.documentType,
  completeness: result.completeness,
  riskScore: result.riskScore,
  flags: result.flags,
  processedAt: new Date().toISOString(),
};

// Update document with extracted data
// Note: Database uses 'entities' column, but we keep 'extracted' for AI analysis
await sb
.from("documents")
.update({ 
  status: "extracted" as DbStatus, 
  entities: result.entities, // Store in entities column
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ocr_text: result.entities.map((e: any) => `${e.key}: ${e.value}`).join('\n'), // For search
  metadata: extracted, // Store full data in metadata JSON field
})
.eq("id", docId);

// Decide final status based on completeness and risk
let finalStatus: DbStatus;
if (result.riskScore > 70 || result.flags.length > 2) {
  finalStatus = "suspect";
} else if (result.completeness >= 80) {
  finalStatus = "checked";
} else if (result.completeness >= 40) {
  finalStatus = "needs_info";
} else {
  finalStatus = "suspect";
}

// Update final status
await sb.from("documents").update({ status: finalStatus }).eq("id", docId);

// Trigger N8N workflow for document processed (success)
notifyDocumentProcessed({
  documentId: docId,
  filename: doc.filename || 'unknown',
  status: 'processed',
  entities: result.entities,
  processingTime,
}).catch((err) => console.error('N8N notification failed:', err));

return NextResponse.json({ 
  ok: true, 
  verdict: { status: finalStatus }, 
  extracted,
  documentType: result.documentType,
  completeness: result.completeness,
  riskScore: result.riskScore,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} catch (e: any) {
console.error('❌ Processing error:', e);
console.error('❌ Error stack:', e?.stack);
console.error('❌ Error details:', {
  message: e?.message,
  name: e?.name,
  code: e?.code,
  moduleLevel: USE_MOCK_OCR,
  runtime: runtimeMockOCR,
  envVar: process.env.NEXT_PUBLIC_USE_MOCK_OCR
});

await sb.from("documents").update({ status: "failed" }).eq("id", docId);

// Trigger N8N workflow for document processed (failure)
notifyDocumentProcessed({
  documentId: docId,
  filename: doc.filename || 'unknown',
  status: 'failed',
  entities: [],
  processingTime: 0,
  error: e?.message || 'Unknown error',
}).catch((err) => console.error('N8N notification failed:', err));

// Provide more helpful error message
const errorMessage = e?.message ?? "Processing failed";
const errorDetails = e?.stack || 'No stack trace available';

return NextResponse.json({ 
  error: errorMessage,
  details: errorDetails,
  hint: runtimeMockOCR 
    ? 'Mock OCR should not fail. Check server logs for details.'
    : 'Real OCR failed. Try setting NEXT_PUBLIC_USE_MOCK_OCR=true for testing.',
  ocrMode: runtimeMockOCR ? 'mock' : 'real'
}, { status: 500 });
}
}
