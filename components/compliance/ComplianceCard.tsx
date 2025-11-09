"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { VaultDoc } from "@/types";
import { FileText } from "lucide-react";

type Entity = { key: string; value: string; confidence: number; doc_id: string };

export default function ComplianceCard({
caseId,
caseUrl,
title,
docs,
}: {
caseId: string;
caseUrl: string;
title: string;
docs: VaultDoc[]; // pass local docs (2)
}) {
const [entities, setEntities] = useState<Record<string, Entity[]>>({});

const remoteIds = docs.map((d) => d.remoteId).filter(Boolean) as string[];

useEffect(() => {
(async () => {
if (remoteIds.length === 0) return;
const { data } = await supabaseClient
.from("extracted_entities")
.select("doc_id,key,value,confidence")
.in("doc_id", remoteIds);
const grouped: Record<string, Entity[]> = {};
data?.forEach((r) => {
(grouped[r.doc_id] ||= []).push(r as Entity);
});
setEntities(grouped);
})();
}, [remoteIds.join(",")]);

return (
<section id="compliance-card" className="rounded-xl border border-white/10 bg-[#0c1220] p-5 print:bg-white print:text-black">
<div className="flex items-center justify-between gap-4 mb-4">
<div>
<div className="text-xs text-white/60">COMPLIANCE CARD</div>
<div className="text-lg font-semibold">{title}</div>
</div>
<div className="text-xs text-white/60">Case: {caseId}</div>
</div>

<div className="grid gap-4 md:grid-cols-3">
{/* Status summary (very simple) */}
<div className="rounded-md border border-white/10 bg-black/30 p-4">
<div className="text-sm font-medium mb-2">Status</div>
<div className="grid grid-cols-3 gap-2 text-center">
{["OK", "Missing", "Suspect"].map((k) => (
<div key={k} className="rounded-md border border-white/10 bg-black/20 py-3">
<div className="text-xs text-white/60">{k}</div>
<div className="text-xl font-semibold">
{
  docs.filter((d) =>
    k === "Missing" ? d.status === "Missing" : d.status === k
  ).length
}
</div>
</div>
))}
</div>
</div>

{/* Documents list */}
<div className="rounded-md border border-white/10 bg-black/30 p-4 md:col-span-2">
<div className="text-sm font-medium mb-2">Documents</div>
<div className="space-y-2">
{docs.map((d) => (
<div key={d.id} className="rounded-md border border-white/10 bg-black/20 p-3 flex items-center justify-between">
<div className="flex items-center gap-2 min-w-0">
<FileText className="h-4 w-4 text-blue-400" />
<div className="truncate">{d.name}</div>
</div>
<div className="text-xs px-2 py-0.5 rounded-full border border-white/10">
{d.status}
</div>
</div>
))}
</div>
</div>
</div>

{/* Entities */}
<div className="mt-4 rounded-md border border-white/10 bg-black/30 p-4">
<div className="text-sm font-medium mb-2">Key Entities (auto-extracted)</div>
{remoteIds.length === 0 ? (
<div className="text-xs text-white/60">Waiting for upload…</div>
) : Object.keys(entities).length === 0 ? (
<div className="text-xs text-white/60">No entities detected yet.</div>
) : (
<div className="grid gap-3 md:grid-cols-2">
{remoteIds.map((rid) => (
<div key={rid} className="rounded-md border border-white/10 bg-black/20 p-3">
<div className="text-xs text-white/60 mb-2">Doc: {rid.slice(0, 8)}…</div>
<div className="grid sm:grid-cols-2 gap-2">
{(entities[rid] || []).map((e, i) => (
<div key={i} className="rounded border border-white/10 bg-black/10 p-2">
<div className="text-[11px] text-white/60">{e.key}</div>
<div className="text-sm">{e.value || "-"}</div>
<div className="text-[11px] text-blue-300 mt-0.5">
{(e.confidence * 100).toFixed(0)}%
</div>
</div>
))}
</div>
</div>
))}
</div>
)}
</div>
</section>
);
}