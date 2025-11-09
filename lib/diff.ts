import type { ExtractedEntities } from "@/types";

export type FieldKey = keyof ExtractedEntities;

export function diffEntities(a: ExtractedEntities, b: ExtractedEntities) {
const keys = Object.keys(a) as FieldKey[];
return keys.map((k) => ({
key: k,
left: (a[k] ?? "") as string,
right: (b[k] ?? "") as string,
equal: norm(a[k]) === norm(b[k]),
}));
}

function norm(v: unknown) {
return String(v ?? "").trim().toLowerCase();
}