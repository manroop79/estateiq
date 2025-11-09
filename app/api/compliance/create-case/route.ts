import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { title, description, documentIds, clientId } = await req.json();
    
    if (!title || !documentIds || documentIds.length === 0) {
      return NextResponse.json({ 
        error: "Title and at least one document are required" 
      }, { status: 400 });
    }

    const sb = supabaseServer();

    // Create the compliance case
    const { data: newCase, error: caseError } = await sb
      .from("compliance_cases")
      .insert({
        title,
        description,
        client_id: clientId || null,
        status: "pending",
      })
      .select()
      .single();

    if (caseError || !newCase) {
      console.error("Case creation error:", caseError);
      return NextResponse.json({ 
        error: "Failed to create case: " + caseError?.message 
      }, { status: 500 });
    }

    // Add documents to the case
    const caseDocuments = documentIds.map((docId: string) => ({
      case_id: newCase.id,
      document_id: docId,
    }));

    const { error: docsError } = await sb
      .from("compliance_case_documents")
      .insert(caseDocuments);

    if (docsError) {
      console.error("Documents addition error:", docsError);
      // Rollback: delete the case
      await sb.from("compliance_cases").delete().eq("id", newCase.id);
      return NextResponse.json({ 
        error: "Failed to add documents to case" 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      case: newCase,
    });
  } catch (error) {
    console.error("Case creation error:", error);
    return NextResponse.json(
      { error: "Case creation failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}

