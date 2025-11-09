import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { notifyComplianceFailed } from "@/lib/n8n/client";

export const runtime = "nodejs";

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: string;
  rule_config: {
    field?: string;
    document_types?: string[];
    message?: string;
    check_type?: string;
    min_value?: number;
  };
  severity: string;
}

interface ExtractedEntity {
  key: string;
  value: string | null;
  confidence: number;
  category: string;
}

export async function POST(req: NextRequest) {
  try {
    const { caseId } = await req.json();
    
    if (!caseId) {
      return NextResponse.json({ error: "caseId required" }, { status: 400 });
    }

    const sb = supabaseServer();

    // Get all documents in the case
    const { data: caseData, error: caseError } = await sb
      .from("compliance_cases")
      .select(`
        *,
        compliance_case_documents (
          document_id,
          documents (*)
        )
      `)
      .eq("id", caseId)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Get active compliance rules
    const { data: rules, error: rulesError } = await sb
      .from("compliance_rules")
      .select("*")
      .eq("is_active", true);

    if (rulesError) {
      return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const documents = caseData.compliance_case_documents?.map((cd: any) => cd.documents) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = [];

    // Run compliance checks
    for (const rule of (rules as ComplianceRule[])) {
      for (const doc of documents) {
        const checkResult = await runComplianceCheck(rule, doc, documents);
        
        if (checkResult) {
          // Save check result
          await sb.from("compliance_check_results").insert({
            case_id: caseId,
            document_id: doc.id,
            rule_id: rule.id,
            status: checkResult.status,
            message: checkResult.message,
            details: checkResult.details,
          });

          results.push({
            rule_name: rule.name,
            document_name: doc.filename,
            ...checkResult,
          });
        }
      }
    }

    // Update case status based on results
    const hasErrors = results.some((r) => r.status === "failed");
    const caseStatus = hasErrors ? "failed" : "passed";

    await sb
      .from("compliance_cases")
      .update({ status: caseStatus })
      .eq("id", caseId);

    // If compliance failed, trigger N8N workflow
    if (hasErrors) {
      const failedResults = results.filter((r) => r.status === "failed");
      const failedChecks = failedResults
        .map((r) => `• ${r.rule_name}: ${r.message}`)
        .join('\n');
      
      // Determine severity based on number and type of failures
      const criticalFailures = failedResults.filter((r) => 
        r.message.toLowerCase().includes('critical') || 
        r.message.toLowerCase().includes('required')
      );
      const severity: 'low' | 'medium' | 'high' = 
        criticalFailures.length >= 2 ? 'high' :
        failedResults.length >= 3 ? 'medium' : 'low';

      // Get the first document for notification (or could notify for each)
      if (documents.length > 0) {
        const firstDoc = documents[0];
        notifyComplianceFailed({
          documentId: firstDoc.id,
          filename: firstDoc.filename || 'unknown',
          caseId,
          failedChecks,
          severity,
        }).catch((err) => console.error('N8N compliance notification failed:', err));
      }
    }

    return NextResponse.json({
      ok: true,
      caseStatus,
      results,
      summary: {
        total: results.length,
        passed: results.filter((r) => r.status === "passed").length,
        failed: results.filter((r) => r.status === "failed").length,
        warnings: results.filter((r) => r.status === "warning").length,
      },
    });
  } catch (error) {
    console.error("Compliance check error:", error);
    return NextResponse.json(
      { error: "Compliance check failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}

async function runComplianceCheck(
  rule: ComplianceRule,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allDocs: any[]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ status: string; message: string; details: any } | null> {
  const entities: ExtractedEntity[] = doc.extracted?.entities || [];
  const config = rule.rule_config;

  // Required field checks
  if (rule.category === "required_field") {
    const fieldKey = config.field;
    const entity = entities.find((e) => e.key === fieldKey);

    // Check if rule applies to this document type
    if (config.document_types && config.document_types.length > 0) {
      const docType = doc.extracted?.documentType;
      if (!config.document_types.includes(docType)) {
        return null; // Rule doesn't apply to this document
      }
    }

    if (!entity || !entity.value) {
      return {
        status: rule.severity === "error" ? "failed" : "warning",
        message: config.message || `Missing required field: ${fieldKey}`,
        details: { field: fieldKey },
      };
    }

    return {
      status: "passed",
      message: `Field ${fieldKey} is present`,
      details: { field: fieldKey, value: entity.value },
    };
  }

  // Value range / confidence checks
  if (rule.category === "value_range") {
    if (config.check_type === "confidence") {
      const lowConfidence = entities.filter(
        (e) => e.value && e.confidence < (config.min_value || 0.6)
      );

      if (lowConfidence.length > 0) {
        return {
          status: "warning",
          message: config.message || "Some fields have low confidence",
          details: {
            fields: lowConfidence.map((e) => ({
              key: e.key,
              confidence: e.confidence,
            })),
          },
        };
      }

      return {
        status: "passed",
        message: "All fields have acceptable confidence",
        details: {},
      };
    }
  }

  // Cross-document consistency checks
  if (rule.category === "cross_document") {
    const fieldKey = config.field;
    const values = allDocs
      .map((d) => {
        const ents: ExtractedEntity[] = d.extracted?.entities || [];
        const entity = ents.find((e) => e.key === fieldKey);
        return entity?.value;
      })
      .filter(Boolean);

    // Check if all values match
    const uniqueValues = new Set(values.map((v) => v?.trim().toLowerCase()));
    
    if (uniqueValues.size > 1) {
      return {
        status: "failed",
        message: config.message || `Inconsistent ${fieldKey} across documents`,
        details: {
          field: fieldKey,
          values: Array.from(uniqueValues),
        },
      };
    }

    if (uniqueValues.size === 0) {
      return {
        status: "warning",
        message: `${fieldKey} not found in any document`,
        details: { field: fieldKey },
      };
    }

    return {
      status: "passed",
      message: `${fieldKey} is consistent across documents`,
      details: { field: fieldKey, value: values[0] },
    };
  }

  return null;
}

