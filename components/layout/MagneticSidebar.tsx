"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Files, Sparkles, Users, X, Menu } from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number }> };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/vault", label: "Vault", icon: Files },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/clients", label: "Clients", icon: Users },
];

// Both paths use the same command sequence: M L C L Z to avoid weird morphs.
function closedCurvedPath(height: number) {
  const x = 120; // narrow panel width at start
  const cx = 360; // bulge reach to the right
  const cyTop = height * 0.5 - 1; // control points around the center
  const cyBot = height * 0.5 + 1;
  // Top edge: M0 0 L x 0
  // Right edge as cubic: C cx cyTop, cx cyBot, x height
  // Bottom edge: L 0 height Z
  return `M0 0 L${x} 0 C${cx} ${cyTop} ${cx} ${cyBot} ${x} ${height} L0 ${height} Z`;
}
function openRectPath(width: number, height: number) {
  // Same sequence; straight right edge approximated by cubic with control points on the right edge
  return `M0 0 L${width} 0 C${width} 0 ${width} ${height} ${width} ${height} L0 ${height} Z`;
}

export default function MagneticSidebar() {
  const [open, setOpen] = useState(false);
  const height = typeof window !== "undefined" ? window.innerHeight : 900;
  const PANEL_W = 520;
  const CURVED = useMemo(() => closedCurvedPath(height), [height]);
  const RECT = useMemo(() => openRectPath(PANEL_W, height), [height]);

  const pathname = usePathname();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = useCallback(() => setOpen(v => !v), []);

  return (
    <>
      {/* Floating trigger */}
      <button
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={toggle}
        className="fixed top-6 left-6 z-[60] h-14 w-14 rounded-full bg-black text-white shadow-xl flex items-center justify-center hover:text-[color:var(--primary-2)] transition-colors"
      >
        {open ? <X size={24}/> : <Menu size={24}/>} 
      </button>

      {/* Magnetic reveal panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .28, ease: "easeOut" }}
            onClick={() => setOpen(false)}
          >
            {/* Dim backdrop */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Panel with animated curved mask (no slide; only curve reveal) */}
            <motion.div
              className="absolute left-0 top-0 h-full"
              initial={{ x: 0 }}
              animate={{ x: 0 }}
              exit={{ x: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
            >
              <svg className="absolute top-0 left-0 h-full" width={PANEL_W} height={height}>
                <defs>
                  <clipPath id="curve-mask" clipPathUnits="userSpaceOnUse">
                    <motion.path
                      initial={{ d: CURVED }}
                      animate={{ d: RECT }}
                      exit={{ d: CURVED, transition: { type: "spring", stiffness: 80, damping: 28 } }}
                      transition={{ type: "spring", stiffness: 100, damping: 24 }}
                    />
                  </clipPath>
                </defs>
                <foreignObject clipPath="url(#curve-mask)" x="0" y="0" width={PANEL_W} height={height}>
                  <div className="h-full w-[520px]">
                    <div
                      className="h-full w-[520px] bg-black text-white backdrop-blur
                                 border-r border-white/10 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <nav className="px-12 pt-28 pb-10 h-full flex flex-col">
                        <div className="text-xs tracking-widest text-white/60 mb-4">NAVIGATION</div>
                        <div className="h-px bg-white/10 mb-6" />
                        <ul className="space-y-4 overflow-hidden pr-6">
                          {NAV_ITEMS.map((it) => {
                            const active = pathname === it.href;
                            return (
                              <li key={it.href}>
                                <Link href={it.href} onClick={() => setOpen(false)} className="group block">
                                  <div>
                                    <span className="text-5xl md:text-6xl font-semibold leading-none">
                                      <span className={active?"text-[color:var(--primary-2)]":"text-white"}>{it.label}</span>
                                    </span>
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="mt-3 text-xs text-white/60">© EstateIQ</div>
                      </nav>
                    </div>
                  </div>
                </foreignObject>
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}