"use client";

import { VaultDoc } from "@/types";

export default function StatusGrid({ docs }: { docs: VaultDoc[] }) {

    const counts = docs.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const total = docs.length;

    const items = [
        { label: "ok", value: counts.OK || 0, cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
        { label: "missing", value: counts.Missing || 0, cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
        { label: "suspect", value: counts.Suspect || 0, cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
    ];

    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {items.map(i => (
                <div key={i.label} className={`rounded-lg border p-3 text-center ${i.cls}`}>
                    <div className="text-xs opacity-80">{i.label}</div>
                    <div className="text-xl font-semibold">{i.value}</div>
                </div>
            ))}

            <div className="rounded-lg border p-3 text-center bg-white/5 border-white/10">
                <div className="text-xs opacity-80">Total</div>
                <div className="text-xl font-semibold">{total}</div>
            </div>
        </div>
    );
}