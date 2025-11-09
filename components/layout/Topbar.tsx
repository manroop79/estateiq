"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileNav from "./MobileNav";
import TopbarSearch from "./TopbarSearch";
import Notifications from "./TopbarNotifications";
import { nanoid } from "nanoid";
import { useVaultStore } from "@/store/useVaultStore";
import { Menu, Share2 } from "lucide-react";

export default function Topbar() {
const [drawerOpen, setDrawerOpen] = useState(false);
const [scrolled, setScrolled] = useState(false);
const [searchOpen, setSearchOpen] = useState(false);

const router = useRouter();
const createCaseFromSelection = useVaultStore(s => s.createCaseFromSelection);

// subtle shadow when page scrolls
useEffect(() => {
const onScroll = () => setScrolled(window.scrollY > 4);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });
return () => window.removeEventListener("scroll", onScroll);
}, []);

useEffect(() => {
const h = (e: KeyboardEvent) => {
const cmdk = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
if (cmdk) { e.preventDefault(); setSearchOpen(true); }
};
window.addEventListener("keydown", h);
return () => window.removeEventListener("keydown", h);
}, []);

const handleShare = useCallback(() => {
const id = createCaseFromSelection("Client Compliance") || nanoid(8);
router.push(`/compliance-card/${id}`);
}, [createCaseFromSelection, router]);

return (
<header
className={[
"sticky top-0 z-0 app-shell",
"bg-[var(--bg)]/70 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg)]/40",
"border-b border-white/10",
scrolled ? "shadow-[0_6px_16px_rgba(0,0,0,0.35)]" : "",
].join(" ")}
>
{/* subtle gradient line */}
<div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

<div className="flex items-center justify-between px-3 py-3 sm:px-4 lg:px-6">
{/* Left: Hamburger + Brand */}
<div className="flex items-center gap-2 min-w-0">
      <button
        className="lg:hidden p-2 rounded-md hover:bg-white/5"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDrawerOpen(true);
        }}
        aria-label="Open menu"
        type="button"
      >
        <Menu />
      </button>

<Link href="/" className="truncate select-none">
<div className="text-[12px] sm:text-xs text-[var(--muted)] leading-tight">
EstateIQ
</div>
<div className="text-sm sm:text-base font-semibold leading-tight truncate max-w-[56vw] sm:max-w-[44vw] lg:max-w-[28vw]">
Real-Estate KYC &amp; Legal Copilot
</div>
</Link>
</div>

{/* Center: Search (hidden on tiny screens; full-screen overlay toggles there) */}
<div className="hidden md:flex flex-1 justify-center px-4">
<TopbarSearch compact onOpenMobile={() => setSearchOpen(true)} />
</div>

{/* Right: actions */}
<div className="flex items-center gap-1 sm:gap-2">
{/* Search button for mobile */}
<button
className="md:hidden px-3 py-2 rounded-md border border-white/10 hover:bg-white/5 text-xs"
onClick={() => setSearchOpen(true)}
aria-label="Search"
>
Search
</button>

<Notifications />

<button
className="brand-btn text-xs sm:text-sm px-3 py-2 xs:inline-flex items-center"
onClick={handleShare}
type="button"
>
    <div className="flex flex-row items-center">
        <Share2 className="mr-1" size={16} />
        Share
    </div>

</button>

{/* <ProfileMenu /> */}
</div>
</div>

{/* Mobile drawer */}
<MobileNav open={drawerOpen} onClose={() => setDrawerOpen(false)} />

{/* Mobile/full-screen search overlay */}
<TopbarSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
</header>
);
}