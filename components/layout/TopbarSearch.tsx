"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Search, X, Clock } from "lucide-react";

export default function TopbarSearch({
compact,
open,
onClose,
onOpenMobile,
}: {
compact?: boolean;
open?: boolean;
onClose?: () => void;
onOpenMobile?: () => void;
}) {
const router = useRouter();
const inputRef = useRef<HTMLInputElement>(null);

// focus input when overlay opens
useEffect(() => {
if (!open) return;
const t = setTimeout(() => inputRef.current?.focus(), 60);
return () => clearTimeout(t);
}, [open]);

// inline compact version for desktop center
if (compact) {
return (
<button
type="button"
onClick={onOpenMobile}
className="w-full max-w-xl group flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 transition"
aria-label="Open search"
>
<Search size={16} className="opacity-70" />
<span className="truncate">Search cases, clients, documents…</span>
<span className="ml-auto text-[11px] text-white/40 border border-white/10 rounded px-1.5 py-0.5">⌘/Ctrl K</span>
</button>
);
}

// full-screen overlay (mobile + also accessible on desktop via hotkey)
if (!open) return null;

return createPortal(
<div className="fixed inset-0 z-[12000] search-overlay">
<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
<div className="relative mx-auto mt-8 w-[92%] max-w-2xl rounded-xl border border-white/10 bg-[var(--bg-soft)] shadow-2xl">
<div className="flex items-center gap-2 p-3 border-b border-white/10">
<Search size={18} className="opacity-70" />
<input
ref={inputRef}
placeholder="Search cases, clients, documents…"
className="flex-1 bg-transparent outline-none text-sm"
onKeyDown={(e) => {
if (e.key === "Enter") {
e.preventDefault();
// Example: route to a generic search results page (you can implement later)
router.push("/vault");
onClose?.();
}
if (e.key === "Escape") onClose?.();
}}
/>
<button onClick={onClose} className="p-2 rounded-md hover:bg-white/5" aria-label="Close search">
<X size={18} />
</button>
</div>

<div className="p-3">
<div className="text-xs uppercase tracking-widest text-white/50 mb-2">Recent</div>
<ul className="divide-y divide-white/10">
{["KYC – Sharma Residency", "Checklist – Sunrise Plot 21", "Buyer Aadhar.pdf"].map((t) => (
<li key={t}>
<button
className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/5 text-sm text-white/80"
onClick={() => { router.push("/vault"); onClose?.(); }}
>
<Clock size={14} className="opacity-70" />
<span className="truncate">{t}</span>
</button>
</li>
))}
</ul>
</div>
</div>
</div>,
document.body
);
}