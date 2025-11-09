import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!path) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    const sb = supabaseServer(); // Uses service role key - bypasses RLS

    // Upload to Storage bucket 'docs'
    const { error: upErr } = await sb.storage
      .from("docs")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || undefined,
      });

    if (upErr) {
      return NextResponse.json(
        { error: "upload failed", detail: upErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, path });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "upload error" },
      { status: 500 }
    );
  }
}
