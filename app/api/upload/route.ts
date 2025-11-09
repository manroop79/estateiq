import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

type DbStatus =
| "uploaded"
| "processing"
| "extracted"
| "checked"
| "ready"
| "needs_info"
| "suspect"
| "failed";

function isPdf(file: File) {
return (
(file.type || "").toLowerCase() === "application/pdf" ||
file.name?.toLowerCase().endsWith(".pdf")
);
}

export async function POST(req: NextRequest) {
try {
const form = await req.formData();
const file = form.get("file");
const kind = (form.get("kind") as string) || "Other";

if (!(file instanceof File)) {
return NextResponse.json({ error: "file missing" }, { status: 400 });
}
if (!isPdf(file)) {
return NextResponse.json({ error: "Only PDF allowed" }, { status: 400 });
}

const sb = supabaseServer(); // ✅ get client instance (service role)

// Choose a stable storage key
const id = randomUUID();
const clean = file.name.replace(/[^\w.\-]+/g, "_").slice(-128);
const storage_path = `raw/${id}-${clean}`;

// Upload to Storage bucket 'docs'
const { error: upErr } = await sb.storage
.from("docs")
.upload(storage_path, file, {
contentType: file.type || "application/pdf",
upsert: false,
});

if (upErr) {
return NextResponse.json(
{ error: "upload failed", detail: upErr.message },
{ status: 500 }
);
}

// Insert DB row with status 'uploaded'
const { data: inserted, error: dbErr } = await sb
.from("documents")
.insert({
filename: file.name,
mime: file.type || "application/pdf",
size: file.size,
kind,
status: "uploaded" as DbStatus,
storage_path,
extracted: {},
})
.select("*")
.single();

if (dbErr) {
return NextResponse.json(
{ error: "db insert failed", detail: dbErr.message },
{ status: 500 }
);
}

return NextResponse.json({ ok: true, document: inserted });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} catch (e: any) {
return NextResponse.json(
{ error: e?.message ?? "upload error" },
{ status: 500 }
);
}
}