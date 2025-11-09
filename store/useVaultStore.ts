import { create } from "zustand";
import type { VaultDoc, CaseRecord, UiDocStatus } from "@/types";

type Store = {
docs: VaultDoc[];
selectedIds: string[];
cases: Record<string, CaseRecord>;

// docs
addDocs: (docs: VaultDoc[]) => void;
removeDoc: (id: string) => void;
attachRemoteId: (localId: string, remoteId: string) => void;
setStatusByRemoteId: (remoteId: string, status: UiDocStatus) => void;
setStatus: (localId: string, status: UiDocStatus) => void;

// selection
toggleSelect: (id: string) => void;
clearSelection: () => void;

// cases
createCaseFromSelection: (caseId: string, title?: string) => CaseRecord | null;
getCase: (caseId: string) => CaseRecord | null;
};

export const useVaultStore = create<Store>((set, get) => ({
docs: [],
selectedIds: [],
cases: {},

addDocs: (docs) => set((s) => ({ docs: [...s.docs, ...docs] })),

removeDoc: (id) =>
set((s) => ({
docs: s.docs.filter((d) => d.id !== id),
selectedIds: s.selectedIds.filter((x) => x !== id),
})),

attachRemoteId: (localId, remoteId) =>
set((s) => ({
docs: s.docs.map((d) => (d.id === localId ? { ...d, remoteId } : d)),
})),

setStatusByRemoteId: (remoteId, status) =>
set((s) => ({
docs: s.docs.map((d) => (d.remoteId === remoteId ? { ...d, status } : d)),
})),

setStatus: (localId, status) =>
set((s) => ({
docs: s.docs.map((d) => (d.id === localId ? { ...d, status } : d)),
})),

toggleSelect: (id) =>
set((s) => {
const exists = s.selectedIds.includes(id);
const next = exists ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id];
return { selectedIds: next.slice(-2) };
}),

clearSelection: () => set({ selectedIds: [] }),

createCaseFromSelection: (caseId, title) => {
const sel = get().selectedIds;
const docs = get().docs;
if (sel.length < 1 && docs.length < 1) return null;

const chosen = sel.length >= 2 ? sel.slice(0, 2) : docs.slice(0, 2).map((d) => d.id);
const record: CaseRecord = {
id: caseId,
title: title || "Client Compliance",
docIds: chosen,
createdAt: Date.now(),
};
set((s) => ({ cases: { ...s.cases, [caseId]: record } }));
return record;
},

getCase: (caseId) => get().cases[caseId] ?? null,
}));