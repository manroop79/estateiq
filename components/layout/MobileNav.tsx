"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import {
X,
Home,
FileText,
Sparkles,
Users,
Settings,
} from "lucide-react";

const sections = [
    {
        label: "Main",
        items: [
            { href: "/", label: "Dashboard", icon: Home },
            { href: "/vault", label: "Vault", icon: FileText },
            { href: "/insights", label: "Insights", icon: Sparkles },
        ],
    },
    {
        label: "Management",
        items: [
            { href: "/clients", label: "Clients", icon: Users },
            { href: "/settings", label: "Settings", icon: Settings },
        ],
    },
];

export default function MobileNav({
    open,
    onClose,
    }: {
        open: boolean;
        onClose: () => void;
    }) {

    const path = usePathname();
    // Initialize as true for client components - this ensures immediate rendering
    const [mounted, setMounted] = useState(typeof window !== 'undefined');

    // Ensure component is mounted on client before rendering portal
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setMounted(true);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (typeof document === 'undefined') return;
        const prev = document.body.style.overflow;
        if (open) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = prev || "";
        };
    }, [open, mounted]);

    if (!open || !mounted) {
        return null;
    }

    // Ensure document.body exists before creating portal
    if (typeof document === 'undefined' || !document.body) {
        return null;
    }

    const drawer = (
        <div className="fixed inset-0 z-[11000]">
        {/* dark backdrop */}
            <div
                 className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[11000]"
                 onClick={onClose}
            ></div>

    {/* drawer */}
    <aside
        className="fixed top-0 left-0 bottom-0 w-[86%] max-w-[360px] rounded-r-2xl
        bg-gradient-to-b from-[#0a1123] via-[#0a0f1c] to-[#0b0b0d]
      text-white shadow-2xl border-r border-white/10
        animate-slideIn z-[11000]"
        role="dialog" aria-modal="true"
    >
    {/* header */}
    <div className="flex items-center justify-between p-5 border-b border-white/10">
        <div>
            <div className="text-sm font-semibold tracking-wide text-blue-300">
                Menu
            </div>
            <div className="text-[11px] text-white/60">
            EstateIQ Real Estate
            </div>
        </div>
        <button
            className="p-2 rounded-md hover:bg-white/10 transition"
            onClick={onClose}
        >
            <X size={20} />
        </button>
    </div>

    {/* nav sections */}
    <nav className="flex-1 overflow-y-auto p-3">
        {sections.map((section, idx) => (
            <div key={idx} className="mb-4">
                <div className="text-xs uppercase text-white/50 px-3 mb-2 tracking-wider">
                    {section.label}
                </div>
            <ul className="space-y-1">
{section.items.map(({ href, label, icon: Icon }) => {
const active = path === href;
return (
<li key={href}>
<Link
href={href}
onClick={onClose}
className={`flex items-center gap-3 px-3 py-3 rounded-lg text-[15px] font-medium transition
${
active
? "bg-blue-600/80 shadow-[0_0_10px_rgba(30,64,175,0.5)]"
: "hover:bg-blue-500/20"
}`}
>
<Icon size={18} className="opacity-80" />
<span className="truncate">{label}</span>
</Link>
</li>
);
})}
            </ul>
            {idx < sections.length - 1 && (
                <div className="my-4 border-t border-white/10" />
            )}
            </div>
        ))}
    </nav>

    {/* footer */}
        <div className="border-t border-white/10 p-4 text-[12px] text-white/40 text-center">
            EstateIQ © {new Date().getFullYear()}
        </div>
    </aside>
</div>
);

return createPortal(drawer, document.body);
}