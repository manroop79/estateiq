"use client";

import type { VaultDoc } from "@/types";
import { FileText } from "lucide-react";

export default function DocList({ docs }: { docs: VaultDoc[] }) {
    return (
        <ul className="divide-y divide-white/10 rounded-lg overflow-hidden border border-white/10">
            {docs.map(d => (
                <li key={d.id} className="flex items-center gap-3 p-3 bg-white/3">
                    <div className="h-8 w-8 rounded-md bg-white/10 flex items-center justify-center">
                        <FileText size={16}/>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{d.name}</div>
                        <div className="text-[11px] text-white/60">{d.kind} • {(d.size/1024/1024).toFixed(2)} MB</div>
                    </div>
                    <span className={`pill ${pillCls(d.status)}`}>{d.status}</span>
                </li>
            ))}
        </ul>
    );
}
function pillCls(s: string){
    if (s==="ok") return "pill-ok";
    if (s==="missing") return "pill-warn";
    return "pill-danger";
}