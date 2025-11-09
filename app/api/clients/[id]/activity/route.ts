import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

// POST log a client activity
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const { activity_type, description, metadata } = await req.json();
    
    if (!activity_type) {
      return NextResponse.json({ 
        error: "activity_type is required" 
      }, { status: 400 });
    }

    const sb = supabaseServer();

    const { data: activity, error } = await sb
      .from("client_activity")
      .insert({
        client_id: clientId,
        activity_type,
        description,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ 
        error: "Failed to log activity: " + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      activity,
    });
  } catch (error) {
    console.error("Activity logging error:", error);
    return NextResponse.json(
      { error: "Activity logging failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}

