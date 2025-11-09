/** DB enum (matches Postgres type exactly) */
export type DbDocStatus = "pending" | "ok" | "missing" | "suspect";

/** UI statuses for pills / labels */
export type UiDocStatus = "Pending" | "OK" | "Missing" | "Suspect";

export type DocKind = "Title" | "NOC" | "Allotment" | "Agreement" | "Other";

export type ExtractedEntities = {
buyer?: string;
seller?: string;
plotNo?: string;
issueDate?: string;
expiryDate?: string;
registrationDate?: string;
// ...extend freely; it’s jsonb in DB
};

export type VaultDoc = {
/** Local UI id (not DB uuid) */
id: string;
/** UI filename, mirrors documents.filename */
name: string;
kind: DocKind | string;
mime: string;
size: number; // bytes in UI; we'll show (MB) from this
file: File;
previewUrl: string;
/** UI-facing status (Title/Upper case) */
status: UiDocStatus;
/** DB row id */
remoteId?: string;
/** Optional extracted payload in UI (shape is flexible) */
extracted?: Record<string, unknown>;
};

export type CaseRecord = {
id: string; // local case id (UI)
title: string;
docIds: string[]; // local UI doc ids
createdAt: number;
};

/** Mappers between DB enum and UI status labels */
export const dbToUiStatus = (s: DbDocStatus): UiDocStatus => {
switch (s) {
case "ok":
return "OK";
case "missing":
return "Missing";
case "suspect":
return "Suspect";
default:
return "Pending"; // "pending"
}
};

export const uiToDbStatus = (s: UiDocStatus): DbDocStatus => {
switch (s) {
case "OK":
return "ok";
case "Missing":
return "missing";
case "Suspect":
return "suspect";
default:
return "pending";
}
};