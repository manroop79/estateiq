import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, storage_path } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const sb = supabaseServer(); // Uses service role key - bypasses RLS

    // Update DB row with storage_path
    const { error: updErr } = await sb
      .from("documents")
      .update({ storage_path })
      .eq("id", id);

    if (updErr) {
      return NextResponse.json(
        { error: "db update failed", detail: updErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "update error" },
      { status: 500 }
    );
  }
}
