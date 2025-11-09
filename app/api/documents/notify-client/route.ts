import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { notifyClientDocumentUpdate } from "@/lib/n8n/client";

export async function POST(req: NextRequest) {
  try {
    const { documentId, newStatus } = await req.json();

    if (!documentId || !newStatus) {
      return NextResponse.json(
        { error: "documentId and newStatus required" },
        { status: 400 }
      );
    }

    const sb = supabaseServer();

    // Get document with client info
    const { data: doc, error: docErr } = await sb
      .from("documents")
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          type
        )
      `)
      .eq("id", documentId)
      .single();

    if (docErr || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Only notify if document is linked to a client
    if (!doc.client_id || !doc.clients) {
      return NextResponse.json({
        ok: true,
        message: "Document not linked to client, no notification sent",
      });
    }

    const client = doc.clients;

    // Only notify clients for certain statuses
    const notifiableStatuses = ["ready", "checked", "needs_info", "suspect"];
    if (!notifiableStatuses.includes(newStatus)) {
      return NextResponse.json({
        ok: true,
        message: "Status not notifiable to clients",
      });
    }

    // Update document status
    await sb
      .from("documents")
      .update({ status: newStatus })
      .eq("id", documentId);

    // Trigger N8N workflow
    await notifyClientDocumentUpdate({
      clientId: client.id,
      clientName: client.name || "Client",
      clientEmail: client.email,
      documentId: doc.id,
      filename: doc.filename || "document",
      status: newStatus,
    });

    return NextResponse.json({
      ok: true,
      message: "Client notified successfully",
    });
  } catch (error) {
    console.error("Client notification error:", error);
    return NextResponse.json(
      { error: "Failed to notify client: " + (error as Error).message },
      { status: 500 }
    );
  }
}

