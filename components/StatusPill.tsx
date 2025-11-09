import type { UiDocStatus } from "@/types";

export function StatusPill({ status }: { status: UiDocStatus }) {
const cls: Record<UiDocStatus, string> = {
Pending: "pill pill-pending",
OK: "pill pill-ok",
Missing: "pill pill-danger",
Suspect: "pill pill-warn",
};
return <span className={cls[status]}>{status}</span>;
}