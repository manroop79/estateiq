import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { notifyDocumentUploaded } from "@/lib/n8n/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, size, kind } = body;

    const sb = supabaseServer(); // Uses service role key - bypasses RLS

    // Insert DB row with status 'uploaded'
    const { data: inserted, error: dbErr } = await sb
      .from("documents")
      .insert({
        filename,
        size: size ?? null,
        kind: kind || "Other",
        status: "uploaded",
        entities: [], // Using 'entities' instead of 'extracted'
        storage_path: '', // Will be updated after upload
      })
      .select("*")
      .single();

    if (dbErr) {
      return NextResponse.json(
        { error: "db insert failed", detail: dbErr.message },
        { status: 500 }
      );
    }

    // Trigger N8N workflow for document uploaded
    // This runs async and won't block the response
    notifyDocumentUploaded({
      documentId: inserted.id,
      filename: inserted.filename || 'unknown',
      clientId: null, // TODO: Add client_id field if needed
      uploadedBy: 'user', // TODO: Add user tracking if needed
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error('N8N notification failed:', err));

    return NextResponse.json({ ok: true, document: inserted });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "create error" },
      { status: 500 }
    );
  }
}
