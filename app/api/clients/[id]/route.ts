import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET a single client
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sb = supabaseServer();

    const { data: client, error } = await sb
      .from("clients")
      .select(`
        *,
        documents (*),
        compliance_cases (*),
        client_contacts (*),
        client_activity (*)
      `)
      .eq("id", id)
      .single();

    if (error || !client) {
      return NextResponse.json({ 
        error: "Client not found" 
      }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Client fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH update a client
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();

    const sb = supabaseServer();

    const { data: updatedClient, error } = await sb
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ 
        error: "Failed to update client: " + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      client: updatedClient,
    });
  } catch (error) {
    console.error("Client update error:", error);
    return NextResponse.json(
      { error: "Client update failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE a client
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sb = supabaseServer();

    const { error } = await sb
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ 
        error: "Failed to delete client: " + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    console.error("Client deletion error:", error);
    return NextResponse.json(
      { error: "Client deletion failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}

