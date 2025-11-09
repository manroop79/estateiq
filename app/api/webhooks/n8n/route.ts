import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * N8N Webhook Endpoint
 * Triggers workflows based on document events
 * 
 * Events:
 * - document.uploaded
 * - document.processed
 * - document.failed
 * - compliance.checked
 * - compliance.failed
 * - client.created
 */

export async function POST(req: NextRequest) {
  try {
    const { event, data, webhookUrl } = await req.json();

    if (!event || !data) {
      return NextResponse.json({
        error: "event and data are required",
      }, { status: 400 });
    }

    // Optional: Verify webhook secret for security
    const webhookSecret = req.headers.get("x-webhook-secret");
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json({
        error: "Invalid webhook secret",
      }, { status: 401 });
    }

    // Log webhook event
    const sb = supabaseServer();
    await sb.from("webhook_logs").insert({
      event,
      data,
      webhook_url: webhookUrl,
      received_at: new Date().toISOString(),
    });

    // Forward to N8N if webhook URL provided
    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error("N8N webhook failed:", await response.text());
      }
    }

    return NextResponse.json({
      ok: true,
      event,
      message: "Webhook received and processed",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({
      error: "Webhook processing failed: " + (error as Error).message,
    }, { status: 500 });
  }
}

/**
 * GET endpoint to list webhook configurations
 */
export async function GET() {
  try {
    const sb = supabaseServer();
    
    const { data: webhooks } = await sb
      .from("webhook_configs")
      .select("*")
      .eq("is_active", true);

    return NextResponse.json({
      webhooks: webhooks || [],
      availableEvents: [
        "document.uploaded",
        "document.processed",
        "document.failed",
        "compliance.checked",
        "compliance.failed",
        "client.created",
        "client.updated",
      ],
    });
  } catch (error) {
    console.error("Webhook config fetch error:", error);
    return NextResponse.json({
      error: "Failed to fetch webhook configs",
    }, { status: 500 });
  }
}

