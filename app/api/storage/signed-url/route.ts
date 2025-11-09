import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    const sb = supabaseServer();

    // Create signed URL (valid for 1 hour)
    const { data, error } = await sb.storage
      .from("docs")
      .createSignedUrl(path, 3600);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to create signed URL", detail: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.signedUrl });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "signed url error" },
      { status: 500 }
    );
  }
}
