"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/store/useVaultStore";
import { FileText, Trash2, Scan, CheckCircle2, Eye } from "lucide-react";
import type { VaultDoc } from "@/types";

const PdfThumb = dynamic(
() => import("@/components/pdf/PdfThumb.client").then((m) => m.PdfThumb),
{ ssr: false }
);

function looksLikeImage(name: string, mime?: string) {
return (mime || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|tiff)$/i.test(name);
}
function looksLikePdf(name: string, mime?: string) {
return (mime || "").includes("pdf") || /\.pdf$/i.test(name);
}

export default function VaultCard({ doc }: { doc: VaultDoc }) {
const router = useRouter();
const removeDoc = useVaultStore((s) => s.removeDoc);
const toggleSelect = useVaultStore((s) => s.toggleSelect);
const selectedIds = useVaultStore((s) => s.selectedIds);
const isSelected = selectedIds.includes(doc.id);

const handleViewDetails = () => {
  router.push(`/document/${doc.id}`);
};

return (
<div className={`overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg bg-slate-800/40 rounded-xl ${isSelected ? "ring-2 ring-[var(--primary)]" : ""}`}>
<div 
  className="relative h-48 bg-slate-900/30 flex items-center justify-center p-2 cursor-pointer group border-b border-slate-700/30"
  onClick={handleViewDetails}
>
<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-t-xl">
  <div className="flex items-center gap-2 text-white">
    <Eye className="w-5 h-5" />
    <span className="text-sm font-medium">View Details</span>
  </div>
</div>
{looksLikeImage(doc.name, doc.mime) ? (
<Image src={doc.previewUrl} alt={doc.name} width={340} height={220} className="object-contain max-h-full" />
) : looksLikePdf(doc.name, doc.mime) ? (
<PdfThumb file={doc.file} width={280} height={180} className="w-full h-full" />
) : (
<div className="flex items-center gap-2 text-sm text-[var(--muted)]">
<FileText className="w-5 h-5 text-[var(--primary)]" /> No preview
</div>
)}
</div>

<div className="p-4 flex flex-col gap-2 bg-slate-800/40">
<div className="truncate font-medium text-white">{doc.name}</div>
<div className="text-xs text-gray-300">{(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.kind}</div>

<div className="flex items-center justify-between text-xs">
<span className={`px-2 py-0.5 rounded-full border ${
doc.status === "Suspect" ? "border-[var(--warn)]/60 text-[var(--warn)] bg-[var(--warn)]/10" :
doc.status === "OK" ? "border-[var(--ok)]/60 text-[var(--ok)] bg-[var(--ok)]/10" :
doc.status === "Missing" ? "border-yellow-600/60 text-yellow-700 bg-yellow-50" :
"border-gray-600/40 text-gray-300 bg-slate-700/40"
}`}>
{doc.status}
</span>
{isSelected && (
  <span className="ml-2 flex items-center gap-1 text-[var(--primary)]">
    <CheckCircle2 className="h-4 w-4" aria-label="Selected" />
  </span>
)}
</div>

<div className="mt-3 flex flex-col gap-2">
<div className="flex items-center gap-2">
<button
onClick={handleViewDetails}
className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-md border border-slate-600/40 bg-slate-700/40 hover:bg-slate-600/50 text-white transition-colors"
>
<Eye className="h-3.5 w-3.5" />
View
</button>

<button
onClick={() => toggleSelect(doc.id)}
className={`flex-1 flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-md border transition-colors ${
isSelected ? "bg-[var(--primary)]/20 border-[var(--primary)]/60 text-[var(--primary)]" : "border-slate-600/40 bg-slate-700/40 hover:bg-slate-600/50 text-white"
}`}
>
                    <Scan className="h-3.5 w-3.5" />
                    {isSelected ? "Selected" : "Select"}
</button>
</div>

<button
onClick={() => removeDoc(doc.id)}
className="w-full flex items-center justify-center gap-2 text-xs px-3 py-1.5 rounded-md border border-[var(--danger)]/40 text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
>
<Trash2 className="h-3.5 w-3.5" />
<span>Remove</span>
</button>
</div>
</div>
</div>
);
}