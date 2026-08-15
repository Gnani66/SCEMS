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
        "panel flex min-w-0 flex-col",
        hover && "panel-hover",
        className,
      )}
    >
      {(title || kicker || right) && (
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-b border-line px-4",
            dense ? "py-2.5" : "py-3",
          )}
        >
          <div className="min-w-0">
            {kicker && <p className="section-kicker mb-1">{kicker}</p>}
            <div className="truncate text-[13px] font-medium leading-tight text-ink">
              {title}
            </div>
          </div>
          {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </div>
      )}
      <div className={cn("flex-1 min-w-0", !title && !kicker && "p-4")}>{children}</div>
      {footer && <div className="border-t border-line px-4 py-2.5">{footer}</div>}
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
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div className="min-w-0">
        {kicker && <p className="section-kicker mb-1">{kicker}</p>}
        <div className="truncate text-[13px] font-medium text-ink">{title}</div>
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
    <div className="flex min-h-[120px] flex-col items-center justify-center gap-1 px-4 text-center">
      <p className="text-[13px] text-secondary">{message}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
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
    <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-[13px] text-crit">{message}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md border border-line2 px-3 py-1 text-xs text-secondary transition-colors hover:text-ink"
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
        className="relative rounded-full"
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
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        className,
      )}
      style={{
        color,
        borderColor: `${color}44`,
        backgroundColor: `${color}14`,
      }}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const color =
    severity === "critical"
      ? "#EF4444"
      : severity === "warning"
        ? "#F5B942"
        : severity === "acknowledged"
          ? "#666C6C"
          : "#929797";
  return <Pill color={color}>{severity.toUpperCase()}</Pill>;
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
    <div className="flex flex-col gap-1 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-tabular text-lg font-semibold leading-none text-ink">
          {value}
        </span>
        {unit && <span className="text-xs text-secondary">{unit}</span>}
      </div>
      {color && (
        <div className="mt-1 h-0.5 w-full rounded-full bg-line2">
          <div className="h-full rounded-full" style={{ width: `${color}` }} />
        </div>
      )}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="section-kicker">{children}</div>;
}