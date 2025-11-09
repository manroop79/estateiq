import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { callAndParseAI } from "@/lib/ai/client";
import { buildPrompt } from "@/lib/ai/prompts";
import { isAIConfigured } from "@/lib/ai/config";

export const runtime = "nodejs";
export const maxDuration = 60; // AI calls can take time

interface AnalysisRequest {
  documentId: string;
  analysisType: 'summarize' | 'legal_issues' | 'validate_fields' | 'extract_insights';
}

export async function POST(req: NextRequest) {
  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return NextResponse.json({
        error: "AI is not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in environment variables.",
      }, { status: 503 });
    }

    const { documentId, analysisType }: AnalysisRequest = await req.json();

    if (!documentId || !analysisType) {
      return NextResponse.json({
        error: "documentId and analysisType are required",
      }, { status: 400 });
    }

    const sb = supabaseServer();

    // Fetch document with extracted data
    const { data: document, error: docError } = await sb
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({
        error: "Document not found",
      }, { status: 404 });
    }

    // Support both old 'extracted' field and new 'metadata' field
    const extractedData = document.extracted || document.metadata;
    const hasEntities = document.entities && Array.isArray(document.entities) && document.entities.length > 0;
    
    if (!extractedData && !hasEntities) {
      return NextResponse.json({
        error: "Document must be processed with OCR first",
      }, { status: 400 });
    }

    // Get data from either source
    const entities = document.entities || extractedData?.entities || [];
    const documentType = extractedData?.documentType || 'Unknown';
    const rawText = document.ocr_text || extractedData?.rawText || "";

    // Build prompt based on analysis type
    let prompt: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;

    switch (analysisType) {
      case 'summarize':
        prompt = buildPrompt('summarize', documentType, rawText);
        result = await callAndParseAI(prompt);
        break;

      case 'legal_issues':
        prompt = buildPrompt('analyzeLegalIssues', documentType, entities, rawText);
        result = await callAndParseAI(prompt);
        break;

      case 'validate_fields':
        prompt = buildPrompt('validateFields', entities, documentType);
        result = await callAndParseAI(prompt);
        break;

      case 'extract_insights':
        // Check if using mock data and warn
        const isMockData = rawText.includes('Mock extracted text') || 
                          (rawText.includes('Manroop Singh') && rawText.includes('Rajesh Kumar')) ||
                          entities.some((e: any) => e.value === 'Manroop Singh' || e.value === 'Rajesh Kumar Sharma');
        
        if (isMockData) {
          console.warn('⚠️ AI Analysis: Detected mock/test data. Results may not be accurate for real documents.');
          console.warn('💡 To fix: Set NEXT_PUBLIC_USE_MOCK_OCR=false in .env.local to use real OCR extraction');
        }
        
        prompt = buildPrompt('extractInsights', documentType, entities, rawText);
        result = await callAndParseAI(prompt);
        break;

      default:
        return NextResponse.json({
          error: "Invalid analysis type",
        }, { status: 400 });
    }

    // Store AI analysis in document
    const aiAnalysis = document.ai_analysis || {};
    aiAnalysis[analysisType] = {
      ...result,
      analyzedAt: new Date().toISOString(),
    };

    await sb
      .from("documents")
      .update({ ai_analysis: aiAnalysis })
      .eq("id", documentId);

    return NextResponse.json({
      ok: true,
      analysisType,
      result,
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json({
      error: "AI analysis failed: " + (error as Error).message,
    }, { status: 500 });
  }
}

