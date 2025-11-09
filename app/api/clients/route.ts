import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET all clients
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const sb = supabaseServer();
    let query = sb
      .from("clients")
      .select(`
        *,
        documents (count),
        compliance_cases (count)
      `)
      .order("created_at", { ascending: false });

    // Filter by status
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Search by name
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: clients, error } = await query;

    if (error) {
      return NextResponse.json({ 
        error: "Failed to fetch clients" 
      }, { status: 500 });
    }

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Clients fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST create a new client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received client data:", body);
    
    const { name, email, phone, company, address, city, state, pincode, zip_code, notes, tags } = body;
    
    // Validate required fields
    if (!name || name.trim() === "") {
      return NextResponse.json({ 
        error: "Client name is required" 
      }, { status: 400 });
    }

    // Validate email is present (required in schema)
    const emailValue = email && email.trim() !== "" ? email.trim() : null;
    if (!emailValue) {
      return NextResponse.json({ 
        error: "Email is required" 
      }, { status: 400 });
    }

    // Convert empty strings to null for optional fields
    // Note: Schema uses user_id (not created_by), tags is TEXT[] (not JSONB)
    // Note: client_type column doesn't exist in the database schema
    const clientData: Record<string, unknown> = {
      name: name.trim(),
      email: emailValue,
      phone: phone && phone.trim() !== "" ? phone.trim() : null,
      company: company && company.trim() !== "" ? company.trim() : null,
      address: address && address.trim() !== "" ? address.trim() : null,
      city: city && city.trim() !== "" ? city.trim() : null,
      state: state && state.trim() !== "" ? state.trim() : null,
      zip_code: (zip_code || pincode) && (zip_code || pincode).trim() !== "" ? (zip_code || pincode).trim() : null,
      notes: notes && notes.trim() !== "" ? notes.trim() : null,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []), // Convert to TEXT[] array
      status: "active",
      user_id: null, // Schema uses user_id, not created_by
    };

    console.log("Processed client data:", clientData);

    const sb = supabaseServer();

    const { data: newClient, error } = await sb
      .from("clients")
      .insert(clientData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ 
        error: "Failed to create client: " + error.message,
        details: error.details || error.hint || undefined
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      client: newClient,
    });
  } catch (error) {
    console.error("Client creation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Client creation failed: " + errorMessage },
      { status: 500 }
    );
  }
}

