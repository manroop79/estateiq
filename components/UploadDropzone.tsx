"use client";

import { useRef, useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { useVaultStore } from "@/store/useVaultStore";
import { inferKind } from "@/lib/utils";

type ProgressMap = Record<string, number>;
type PendingItem = { id: string; filename: string };

function slugify(name: string) {
return name
.trim()
.replace(/\s+/g, "-")
.replace(/[^\w.\-]/g, "")
.toLowerCase();
}

export function UploadDropzone() {
const inputRef = useRef<HTMLInputElement>(null);
const [isDragging, setIsDragging] = useState(false);
const [busy, setBusy] = useState(false);
const [error, setError] = useState<string | null>(null);
const [progress, setProgress] = useState<ProgressMap>({});
const [queue, setQueue] = useState<PendingItem[]>([]);

const addDocs = useVaultStore((s) => s.addDocs);

const handleUploadOne = useCallback(
async (file: File) => {
setError(null);
setBusy(true);

// 1) Create DB placeholder row via API (bypasses RLS)
const createResponse = await fetch("/api/documents/create", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
filename: file.name,
mime: file.type || null,
size: file.size ?? null,
kind: inferKind(file.name) || "Other",
}),
});

const createResult = await createResponse.json();

if (!createResponse.ok || !createResult.document) {
setError(createResult.error || "Failed to create document record.");
setBusy(false);
return;
}

const row = createResult.document;

const docId = row.id as string;
setQueue((q) => [...q, { id: docId, filename: file.name }]);
setProgress((p) => ({ ...p, [docId]: 0 }));

// 2) Upload file to Storage via API (bypasses RLS)
const path = `${docId}/${slugify(file.name)}`;

// Create FormData for file upload
const formData = new FormData();
formData.append("file", file);
formData.append("path", path);

// Upload to storage via API
const uploadResponse = await fetch("/api/storage/upload", {
method: "POST",
body: formData,
});

const uploadResult = await uploadResponse.json();

if (!uploadResponse.ok) {
setError(`Upload failed: ${uploadResult.error}`);
setProgress((p) => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { [docId]: _unused, ...rest } = p;
return rest;
});
setQueue((q) => q.filter((x) => x.id !== docId));
setBusy(false);
return;
}

// Update progress to 100% on successful upload
setProgress((p) => ({ ...p, [docId]: 100 }));

// 3) Patch DB row with storage_path via API
const updateResponse = await fetch("/api/documents/update", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
id: docId,
storage_path: path,
}),
});

if (!updateResponse.ok) {
const updateResult = await updateResponse.json();
setError(`Saved file, but failed to link record: ${updateResult.error}`);
}

// 4) Add to local store so it appears in the Vault immediately
const previewUrl = URL.createObjectURL(file);
addDocs([
{
id: docId, // use server id so future actions can reference DB row
name: file.name,
kind: inferKind(file.name),
status: "suspect", // UI badge; or use "pending" if your StatusPill expects that
file,
previewUrl,
mime: file.type,
size: file.size,
extracted: {},
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any, // cast if your local DocStatus type still expects old casing
]);

// 5) Cleanup progress/queue state
setProgress((p) => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { [docId]: _unused, ...rest } = p;
return rest;
});
setQueue((q) => q.filter((x) => x.id !== docId));
setBusy(false);
},
[addDocs]
);

const handleFiles = useCallback(
async (files: FileList | null) => {
if (!files || files.length === 0) return;
for (const f of Array.from(files)) {
await handleUploadOne(f);
}
},
[handleUploadOne]
);

return (
<div className="upload-outer relative overflow-hidden">
{/* Animated background */}
<div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 via-slate-900/25 to-gray-900/30"></div>
<div className="absolute inset-0 vault-bg-radial-1 animate-pulse-slow"></div>
<div className="absolute inset-0 vault-bg-radial-2 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

<div
className={[
"upload-inner relative z-10 bg-slate-800/40 rounded-xl",
"transition-all duration-300",
isDragging ? "ring-2 ring-[var(--primary)]/60 bg-slate-700/50 scale-[1.02]" : "",
].join(" ")}
onDragOver={(e) => {
e.preventDefault();
if (!isDragging) setIsDragging(true);
}}
onDragLeave={() => setIsDragging(false)}
onDrop={(e) => {
e.preventDefault();
setIsDragging(false);
void handleFiles(e.dataTransfer.files);
}}
>
<div className="upload-box select-none cursor-pointer relative z-10 group" onClick={() => inputRef.current?.click()}>
<div className="mx-auto h-12 w-12 rounded-xl bg-slate-700/50 backdrop-blur-sm border border-slate-600/40 flex items-center justify-center text-white group-hover:bg-slate-600/60 group-hover:scale-110 transition-all duration-300">
<Upload className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
</div>

<div className="mt-3 text-lg md:text-xl font-semibold text-white">
Upload or drop your documents
</div>
<div className="text-sm text-gray-300 mt-1">
PDFs, images. We&apos;ll auto-sort &amp; verify.
</div>

<div className="mt-4 flex items-center justify-center gap-3">
<button
type="button"
className="px-6 py-3 bg-black text-white hover:bg-[var(--primary)] transition-all duration-300 rounded-md shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed font-medium"
disabled={busy}
>
Browse files
</button>
<span className="text-xs text-gray-300 font-medium">or drag here</span>
</div>

<input
ref={inputRef}
type="file"
multiple
className="hidden"
onChange={(e) => void handleFiles(e.target.files)}
/>

{/* Upload feedback */}
{(Object.keys(progress).length > 0 || queue.length > 0 || busy) && (
<div className="mt-6 space-y-2 text-left">
{queue.map((q) => (
<div key={q.id} className="rounded-md bg-slate-700/40 p-2 border border-slate-600/30">
<div className="flex items-center justify-between text-xs mb-1">
<span className="truncate text-white">{q.filename}</span>
<span className="text-gray-300">
{progress[q.id] ?? 0}%
</span>
</div>
<div className="w-full h-2 rounded-full bg-slate-600/40 overflow-hidden">
<div
className="h-2 bg-[var(--primary)] rounded-full transition-all"
style={{ width: `${progress[q.id] ?? 0}%` }}
/>
</div>
</div>
))}
{busy && queue.length === 0 && (
<div className="text-xs text-gray-300">Processing…</div>
)}
</div>
)}

{error && (
<div className="mt-4 text-sm text-[var(--danger)] text-center">
{error}
</div>
)}
</div>
</div>
</div>
);
}