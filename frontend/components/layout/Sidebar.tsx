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
      aria-label={label}
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150",
        active
          ? "bg-[#eff6ff] text-[#2563eb] shadow-[inset_0_0_0_1px_#dbeafe]"
          : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]",
      )}
    >
      {active && (
        <span className="absolute -left-[10px] h-6 w-[3px] rounded-full bg-[#2563eb]" />
      )}
      <Icon size={18} />
      {/* Zoho-style tooltip — white card */}
      <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 whitespace-nowrap rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-[#0f172a] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
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
      {/* Brand */}
      <div className="flex h-[64px] items-center justify-center border-b border-[#e2e8f0] bg-white">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-sm"
          title="SCEMS Home"
        >
          <IconLogo size={20} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto py-5">
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

      {/* Footer actions */}
      <div className="flex flex-col items-center gap-2 border-t border-[#e2e8f0] bg-[#f8fafc] py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dcfce7] text-[10px] font-bold text-[#15803d] ring-1 ring-[#bbf7d0]">
          A
        </div>
        <span className="text-[10px] font-medium text-[#64748b]">Admin</span>
        <Link
          href="/system"
          title="System Settings"
          className={cn(
            "mt-1 flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
            pathname === "/system"
              ? "bg-[#eff6ff] text-[#2563eb]"
              : "text-[#94a3b8] hover:bg-white hover:text-[#64748b] hover:shadow-sm hover:border hover:border-[#e2e8f0]",
          )}
        >
          <IconSettings size={18} />
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop rail — Zoho light */}
      <aside className="hidden w-[72px] shrink-0 flex-col border-r border-[#e2e8f0] bg-white md:flex shadow-[1px_0_3px_rgba(15,23,42,0.04)]">
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            aria-label="Close menu"
            className="flex-1 bg-[#0f172a]/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="flex w-[72px] flex-col border-r border-[#e2e8f0] bg-white shadow-xl">
            <button
              className="flex h-[64px] items-center justify-center border-b border-[#e2e8f0] text-[#64748b]"
              onClick={() => setOpen(false)}
            >
              <IconLogo size={20} />
            </button>
            {content}
          </aside>
        </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/20 md:hidden"
        aria-label="Open menu"
      >
        <IconLogo size={20} />
      </button>
    </>
  );
}
