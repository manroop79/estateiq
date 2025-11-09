
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";


const items = [
  { href: "/", label: "Dashboard" },
  { href: "/vault", label: "Vault" },
{ href: "/insights", label: "Insights" },
{ href: "/clients", label: "Clients" },
];

export default function Sidebar(){
const path = usePathname();
return (
<aside className="hidden lg:flex w-64 flex-col gap-2 p-4 app-shell">
<div className="text-lg font-semibold mb-2">EstateIQ</div>
{items.map(it => {
const active = path === it.href;
return (
<Link key={it.href} href={it.href}
className={cn(
"flex items-center gap-3 px-3 py-2 rounded-md",
active ? "bg-white/10" : "hover:bg-white/5"
)}>
</Link>
);
})}
</aside>
);
}