"use client";

import { Trash2, ZoomIn, CheckCircle2, FileWarning } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import { useVaultStore } from "@/store/useVaultStore";
import { looksLikeImage, looksLikePdf, cn } from "@/lib/utils";
import type { VaultDoc, UiDocStatus } from "@/types";

export function FileCard({ doc }: { doc: VaultDoc }) {
const toggleSelect = useVaultStore((s) => s.toggleSelect);
const removeDoc = useVaultStore((s) => s.removeDoc);
const setStatus = useVaultStore((s) => s.setStatus);

const isPdf = looksLikePdf(doc.name, doc.mime);
const isImage = looksLikeImage(doc.name, doc.mime);

function cycleStatus(s: UiDocStatus): UiDocStatus {
if (s === "Suspect") return "OK";
if (s === "OK") return "Missing";
return "Suspect"; // Missing -> Suspect, Pending -> Suspect as a manual action
}

return (
<div className="card hover-glow rounded-2xl p-4 shadow-lg flex flex-col">
{/* Preview */}
<div className="preview-wrap mb-4">
<div className="preview-box">
{isPdf ? (
<iframe
className="pdf-embed"
src={`${doc.previewUrl}#page=1&zoom=page-width`}
title={doc.name}
/>
) : isImage ? (
<img src={doc.previewUrl} alt={doc.name} className="max-h-full max-w-full object-contain" />
) : (
<div className="preview-fallback flex items-center justify-center h-full text-neutral-500">
<FileWarning className="h-4 w-4 mr-1" />
No preview
</div>
)}
</div>
</div>

{/* Meta + actions */}
<div className="flex items-start justify-between gap-2">
<div className="min-w-0">
<div className="truncate font-medium">{doc.name}</div>
<div className="text-xs text-[var(--muted)]">
{doc.kind} • {(doc.size / 1024 / 1024).toFixed(2)} MB
</div>
</div>
<StatusPill status={doc.status} />
</div>

<div className="mt-3 flex items-center gap-2">
<button onClick={() => toggleSelect(doc.id)} className={cn("btn-ghost")}>
<ZoomIn className="inline mr-1 h-3 w-3" /> Compare
</button>
<button
onClick={() => setStatus(doc.id, cycleStatus(doc.status))}
className="btn-ghost"
title="Cycle status: Suspect → OK → Missing → Suspect"
>
<CheckCircle2 className="inline mr-1 h-3 w-3" /> Mark
</button>
<button onClick={() => removeDoc(doc.id)} className="btn-danger-ghost">
<Trash2 className="inline mr-1 h-3 w-3" /> Remove
</button>
</div>
</div>
);
}