"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export interface SeriesConfig {
  key: string;
  label: string;
  color: string;
  unit: string;
}

export interface ChartPoint {
  time: number;
  [key: string]: number | string | null;
}

interface BaseProps {
  data: ChartPoint[];
  series: SeriesConfig[];
  height?: number;
  yDomain?: [number | "auto", number | "auto"];
  xTicks?: number;
  showLegend?: boolean;
  tooltip?: boolean;
  className?: string;
  refLine?: { y: number; color?: string; label?: string };
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string | number; value: number | string; color?: string }>;
  label?: number | string;
  series: SeriesConfig[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const labelText =
    typeof label === "number"
      ? new Date(label).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : String(label ?? "");

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 shadow-lg">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#64748b]">{labelText}</p>
      {payload.map((item) => {
        const key = String(item.dataKey);
        const meta = series.find((s) => s.key === key);
        const value = typeof item.value === "number" ? item.value.toLocaleString() : "—";
        return (
          <div key={key} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 font-medium text-[#334155]">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: meta?.color ?? item.color ?? "#64748b" }}
              />
              {meta?.label ?? key}
            </span>
            <span className="font-bold text-[#0f172a] text-tabular">
              {value} <span className="font-medium text-[#64748b]">{meta?.unit ?? ""}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function sharedAxis() {
  return {
    x: (
      <XAxis
        dataKey="time"
        type="number"
        domain={["dataMin", "dataMax"]}
        scale="time"
        tickFormatter={(v: number) =>
          new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
        minTickGap={40}
        tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
        axisLine={false}
        tickLine={false}
      />
    ),
    y: (
      <YAxis
        width={42}
        tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
        axisLine={false}
        tickLine={false}
        domain={["auto", "auto"]}
      />
    ),
  };
}

export function TrendChartView({
  data,
  series,
  height = 220,
  area = false,
  refLine,
  className,
  showLegend = true,
}: BaseProps & { area?: boolean }) {
  const { x, y } = sharedAxis();

  const legend = showLegend ? (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {series.map((s) => (
        <span key={s.key} className="flex items-center gap-2 rounded-full border border-[#f1f5f9] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-[#334155]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  ) : null;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      {legend}
      <ResponsiveContainer width="100%" height="100%">
        {area ? (
          <AreaChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
            {x}
            {y}
            <Tooltip
              content={<ChartTooltip series={series} />}
              cursor={{ stroke: "#e2e8f0", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            {refLine && (
              <ReferenceLine
                y={refLine.y}
                stroke={refLine.color ?? "#d97706"}
                strokeDasharray="4 4"
                label={{ value: refLine.label, position: "right", fill: refLine.color ?? "#d97706", fontSize: 10, fontWeight: 700 }}
              />
            )}
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill={`${s.color}14`}
                dot={false}
                isAnimationActive
                animationDuration={300}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
            {x}
            {y}
            <Tooltip
              content={<ChartTooltip series={series} />}
              cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
            />
            {refLine && (
              <ReferenceLine
                y={refLine.y}
                stroke={refLine.color ?? "#d97706"}
                strokeDasharray="4 4"
                label={{ value: refLine.label, position: "right", fill: refLine.color ?? "#d97706", fontSize: 10, fontWeight: 700 }}
              />
            )}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{ r: 4, strokeWidth: 2, fill: s.color, stroke: "white" }}
                isAnimationActive
                animationDuration={300}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartView({
  data,
  series,
  height = 230,
  className,
  radius = 6,
  xKey,
  children,
}: BaseProps & { radius?: number; xKey?: string; children?: ReactNode }) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey ?? "time"}
            tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis width={42} tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip series={series} />} cursor={{ fill: "#f8fafc" }} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={s.color}
              radius={[radius, radius, 0, 0]}
              maxBarSize={44}
              animationDuration={350}
            />
          ))}
          {children}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EmptyChart({ label }: { label?: string }) {
  return (
    <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] py-12">
      <span className="text-sm font-medium text-[#64748b]">{label ?? "No data available"}</span>
    </div>
  );
}
