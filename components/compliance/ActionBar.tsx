"use client";
import { useEffect, useRef } from "react";
import { Share2, Copy, Image as ImageIcon, Printer } from "lucide-react";

export default function ActionBar({ caseUrl }: { caseUrl: string }) {
const cardRef = useRef<HTMLElement | null>(null);

useEffect(() => {
cardRef.current = document.getElementById("compliance-card") as HTMLElement | null;
}, []);

async function share() {
if (navigator.share) {
try {
await navigator.share({ title: "Compliance Card", url: caseUrl });
} catch {}
} else {
await navigator.clipboard.writeText(caseUrl);
alert("Link copied.");
}
}

async function copyLink() {
await navigator.clipboard.writeText(caseUrl);
alert("Link copied.");
}

async function downloadPng() {
const node = cardRef.current;
if (!node) return;
const { toPng } = await import("html-to-image");
const dataUrl = await toPng(node as HTMLElement, { cacheBust: true, pixelRatio: 2 });
const a = document.createElement("a");
a.href = dataUrl;
a.download = "compliance-card.png";
a.click();
}

function printCard() {
window.print();
}

return (
<div className="flex items-center gap-2 justify-end">
<button onClick={share} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1">
<Share2 className="h-4 w-4" /> Share
</button>
<button onClick={copyLink} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1">
<Copy className="h-4 w-4" /> Copy
</button>
<button onClick={downloadPng} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1">
<ImageIcon className="h-4 w-4" /> PNG
</button>
<button onClick={printCard} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1">
<Printer className="h-4 w-4" /> Print
</button>
</div>
);
}