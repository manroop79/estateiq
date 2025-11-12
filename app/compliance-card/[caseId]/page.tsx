"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useVaultStore } from "@/store/useVaultStore";
import ComplianceCard from "@/components/compliance/ComplianceCard";
import ActionBar from "@/components/compliance/ActionBar";

export default function ComplianceCasePage() {
const router = useRouter();
const params = useParams<{ caseId: string }>();
const caseId = params.caseId;

const getCase = useVaultStore((s) => s.getCase);
const createCaseFromSelection = useVaultStore((s) => s.createCaseFromSelection);
const docs = useVaultStore((s) => s.docs);

const [readyId, setReadyId] = useState<string | null>(null);

// ensure a case exists locally; if not, create using selection/first two docs
useEffect(() => {
let rec = getCase(caseId);
if (!rec) rec = createCaseFromSelection(caseId) || null;
if (rec) setReadyId(rec.id);
}, [caseId, getCase, createCaseFromSelection]);

const record = useMemo(() => (readyId ? getCase(readyId) : null), [readyId, getCase]);

const caseDocs = useMemo(() => {
if (!record) return [];
const map = new Map(docs.map((d) => [d.id, d]));
return record.docIds.map((id) => map.get(id)).filter(Boolean) as typeof docs;
}, [record, docs]);

const caseUrl =
typeof window !== "undefined"
? `${window.location.origin}/compliance-card/${caseId}`
: `/compliance-card/${caseId}`;

if (!record) {
return (
<div className="p-6">
<div className="rounded-xl border border-white/10 bg-[#0c1220] p-6 text-white/80">
Need at least two documents to generate a Compliance Card.
<div className="mt-3">
<button
onClick={() => router.push("/vault")}
className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10"
>
Go to Vault
</button>
</div>
</div>
</div>
);
}

return (
<div className="p-4 md:p-6 space-y-4">
<ActionBar caseUrl={caseUrl} />
<ComplianceCard
caseId={record.id}
title={record.title || "Compliance Summary"}
docs={caseDocs}
/>
<div className="flex gap-2">
<button
onClick={() => router.push("/vault")}
className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10"
>
← Back to Vault
</button>
</div>
</div>
);
}