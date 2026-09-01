import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function Card({
  children,
  className,
  hover = false,
  title,
  kicker,
  right,
  footer,
  dense = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  title?: ReactNode;
  kicker?: string;
  right?: ReactNode;
  footer?: ReactNode;
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "panel flex min-w-0 flex-col bg-white",
        hover && "panel-hover",
        className,
      )}
    >
      {(title || kicker || right) && (
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-b border-[#f1f5f9] bg-white px-5",
            dense ? "py-3" : "py-4",
          )}
        >
          <div className="min-w-0">
            {kicker && <p className="section-kicker mb-1.5">{kicker}</p>}
            <div className="truncate text-[13px] font-semibold leading-tight text-[#0f172a] tracking-tight">
              {title}
            </div>
          </div>
          {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </div>
      )}
      <div className={cn("flex-1 min-w-0 bg-white", !title && !kicker && "p-4")}>{children}</div>
      {footer && <div className="border-t border-[#f1f5f9] bg-[#f8fafc] px-5 py-3">{footer}</div>}
    </div>
  );
}

export function CardHeader({
  title,
  kicker,
  right,
}: {
  title: ReactNode;
  kicker?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#f1f5f9] bg-white px-5 py-4">
      <div className="min-w-0">
        {kicker && <p className="section-kicker mb-1.5">{kicker}</p>}
        <div className="truncate text-[13px] font-semibold text-[#0f172a] tracking-tight">{title}</div>
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}

export function Skeleton({
  className,
  lines = 1,
}: {
  className?: string;
  lines?: number;
}) {
  if (lines === 1) {
    return <div className={cn("skeleton h-3.5 w-full", className)} />;
  }
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn("skeleton h-3.5", i % 2 === 1 ? "w-4/5" : "w-full")}
        />
      ))}
    </div>
  );
}

export function EmptyState({
  message = "No data available",
  sub,
}: {
  message?: string;
  sub?: string;
}) {
  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center gap-1.5 px-6 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9] text-[#94a3b8]">
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx={12} cy={12} r={9} />
          <path d="M9 9h.01M15 9h.01M8 14h8" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[#334155]">{message}</p>
      {sub && <p className="text-xs text-[#64748b]">{sub}</p>}
    </div>
  );
}

export function ErrorState({
  message = "Unable to load data",
  sub,
  onRetry,
}: {
  message?: string;
  sub?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M10.3 3.5 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[#dc2626]">{message}</p>
      {sub && <p className="text-xs text-[#64748b]">{sub}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-1.5 text-xs font-medium text-[#334155] shadow-sm transition-colors hover:border-[#cbd5e1] hover:text-[#0f172a]"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function StatusDot({
  color,
  pulse = false,
  size = 7,
}: {
  color: string;
  pulse?: boolean;
  size?: number;
}) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {pulse && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: color,
            animation: "pulse-ring 1.8s ease-out infinite",
          }}
        />
      )}
      <span
        className="relative rounded-full ring-2 ring-white shadow-sm"
        style={{ width: size, height: size, backgroundColor: color }}
      />
    </span>
  );
}

export function Pill({
  children,
  color,
  className,
}: {
  children: ReactNode;
  color: string;
  className?: string;
}) {
  // Map critical colors to light soft backgrounds automatically
  const bg =
    color === "#EF4444" || color === "#dc2626" ? "#fef2f2" :
    color === "#F5B942" || color === "#d97706" ? "#fffbeb" :
    color === "#4ADE80" || color === "#059669" ? "#ecfdf5" :
    color === "#60a5fa" || color === "#2563eb" ? "#eff6ff" : `${color}14`;

  const border =
    color === "#EF4444" || color === "#dc2626" ? "#fecaca" :
    color === "#F5B942" || color === "#d97706" ? "#fde68a" :
    color === "#4ADE80" || color === "#059669" ? "#a7f3d0" :
    color === "#60a5fa" || color === "#2563eb" ? "#bfdbfe" : `${color}30`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide",
        className,
      )}
      style={{
        color,
        borderColor: border,
        backgroundColor: bg,
      }}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const s = severity?.toLowerCase();
  if (s === "critical") return <Pill color="#dc2626">CRITICAL</Pill>;
  if (s === "warning") return <Pill color="#d97706">WARNING</Pill>;
  if (s === "acknowledged") return <Pill color="#64748b">ACKNOWLEDGED</Pill>;
  if (s === "normal") return <Pill color="#059669">NORMAL</Pill>;
  return <Pill color="#64748b">{severity?.toUpperCase() ?? "UNKNOWN"}</Pill>;
}

export function MetricChip({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: ReactNode;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-tabular text-lg font-bold leading-none text-[#0f172a]">
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-[#64748b]">{unit}</span>}
      </div>
      {color && (
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
          <div className="h-full rounded-full" style={{ width: `${color}`, backgroundColor: "#2563eb" }} />
        </div>
      )}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="section-kicker">{children}</div>;
}
