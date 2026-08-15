"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { JSX } from "react";
import {
  IconAnalytics,
  IconAlert,
  IconHealth,
  IconHistory,
  IconLive,
  IconLogo,
  IconNodes,
  IconOverview,
  IconSettings,
} from "@/components/icons";
import { cn } from "@/lib/format";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: IconOverview, match: (p: string) => p === "/" },
  { href: "/nodes", label: "Nodes", icon: IconNodes, match: (p: string) => p === "/nodes" || p.startsWith("/nodes/") },
  { href: "/live", label: "Live Monitor", icon: IconLive, match: (p: string) => p === "/live" },
  { href: "/history", label: "History", icon: IconHistory, match: (p: string) => p === "/history" },
  { href: "/analytics", label: "Analytics", icon: IconAnalytics, match: (p: string) => p === "/analytics" },
  { href: "/alerts", label: "Alerts", icon: IconAlert, match: (p: string) => p === "/alerts" },
  { href: "/system", label: "System Health", icon: IconHealth, match: (p: string) => p === "/system" },
];

function RailButton({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: (p: { size?: number }) => JSX.Element;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={label}
      aria-label={label}
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-white/[0.07] text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]"
          : "text-muted hover:bg-white/[0.04] hover:text-secondary",
      )}
    >
      {active && (
        <span className="absolute -left-[9px] h-5 w-[2px] rounded-full bg-ok" />
      )}
      <Icon size={17} />
      {/* tooltip */}
      <span className="pointer-events-none absolute left-[calc(100%+10px)] z-50 whitespace-nowrap rounded-md border border-line2 bg-elev px-2.5 py-1 text-[11px] font-medium text-ink opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = (
    <>
      <div className="flex h-14 items-center justify-center border-b border-line">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line2 bg-card2 text-ok" title="SCEMS Home">
          <IconLogo size={20} />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <RailButton
              key={item.href}
              href={item.href}
              label={item.label}
              icon={(p) => <Icon {...p} />}
              active={item.match(pathname)}
              onNavigate={() => setOpen(false)}
            />
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-1 border-t border-line py-3">
        <Link
          href="/system"
          title="System Settings"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/[0.04] hover:text-secondary"
        >
          <IconSettings size={17} />
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-16 shrink-0 flex-col border-r border-line bg-app2 md:flex">
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            aria-label="Close menu"
            className="flex-1 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="flex w-16 flex-col border-r border-line bg-app2">
            <button className="flex h-14 items-center justify-center border-b border-line text-muted" onClick={() => setOpen(false)}>
              <IconSettings size={16} />
            </button>
            {content}
          </aside>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-secondary shadow-lg md:hidden"
        aria-label="Open menu"
      >
        <IconLogo size={18} />
      </button>
    </>
  );
}