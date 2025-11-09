import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET all active compliance rules
export async function GET() {
  try {
    const sb = supabaseServer();

    const { data: rules, error } = await sb
      .from("compliance_rules")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true });

    if (error) {
      return NextResponse.json({ 
        error: "Failed to fetch rules" 
      }, { status: 500 });
    }

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Rules fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST create a new compliance rule
export async function POST(req: NextRequest) {
  try {
    const { name, description, category, rule_config, severity } = await req.json();
    
    if (!name || !category || !rule_config) {
      return NextResponse.json({ 
        error: "Name, category, and rule_config are required" 
      }, { status: 400 });
    }

    const sb = supabaseServer();

    const { data: newRule, error } = await sb
      .from("compliance_rules")
      .insert({
        name,
        description,
        category,
        rule_config,
        severity: severity || "error",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ 
        error: "Failed to create rule: " + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      rule: newRule,
    });
  } catch (error) {
    console.error("Rule creation error:", error);
    return NextResponse.json(
      { error: "Rule creation failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}

