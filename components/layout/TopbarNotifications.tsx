"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Track mount state for portal
  useEffect(() => { setMounted(true); }, []);

  // Click outside & ESC = close
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        !popoverRef.current?.contains(e.target as Node) &&
        !bellRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Position dropdown under bell
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (open && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setPopoverStyle({
        position: 'absolute',
        top: rect.bottom + window.scrollY + 8, // 8px below bell icon
        left: rect.right - 320,                // right-align, width 320px
        width: 320,
        maxWidth: '90vw',
        zIndex: 12000,
      });
    }
  }, [open]);

  return (
    <>
      <button
        ref={bellRef}
        className="p-2 rounded-md hover:bg-white/5"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell />
      </button>
      {mounted && open && createPortal(
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="rounded-lg border border-white/10 bg-[var(--bg-soft)] shadow-2xl"
        >
          <div className="px-3 py-2 border-b border-white/10 text-sm font-semibold">
            Notifications
          </div>
          <div className="max-h-72 overflow-auto">
            <div className="px-3 py-2 text-sm hover:bg-white/5 cursor-pointer">
              Case <span className="font-mono text-blue-300">A1B2C3D4</span> ready to share
            </div>
            <div className="px-3 py-2 text-sm hover:bg-white/5 cursor-pointer">
              1 doc flagged as <span className="text-amber-300">Suspect</span>
            </div>
            <div className="px-3 py-2 text-sm hover:bg-white/5 cursor-pointer">
              Reminder: KYC meeting today 4:00 PM
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}