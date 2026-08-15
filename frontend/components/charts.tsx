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
    <div className="rounded-lg border border-line2 bg-elev px-3 py-2 shadow-lg">
      <p className="mb-1.5 text-[10px] text-muted">{labelText}</p>
      {payload.map((item) => {
        const key = String(item.dataKey);
        const meta = series.find((s) => s.key === key);
        const value = typeof item.value === "number" ? item.value.toLocaleString() : "—";
        return (
          <div key={key} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-secondary">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: meta?.color ?? item.color ?? "#929797" }}
              />
              {meta?.label ?? key}
            </span>
            <span className="font-medium text-ink text-tabular">
              {value} {meta?.unit ?? ""}
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
        tick={{ fontSize: 10 }}
        axisLine={false}
        tickLine={false}
      />
    ),
    y: (
      <YAxis
        width={42}
        tick={{ fontSize: 10 }}
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
    <div className="mb-2 flex flex-wrap items-center gap-3">
      {series.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-secondary">
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
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
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {x}
            {y}
            <Tooltip
              content={<ChartTooltip series={series} />}
              cursor={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            {refLine && (
              <ReferenceLine
                y={refLine.y}
                stroke={refLine.color ?? "#F5B942"}
                strokeDasharray="4 4"
                label={{ value: refLine.label, position: "right", fill: refLine.color ?? "#F5B942", fontSize: 9 }}
              />
            )}
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={1.8}
                fill={`${s.color}1f`}
                dot={false}
                isAnimationActive
                animationDuration={300}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {x}
            {y}
            <Tooltip
              content={<ChartTooltip series={series} />}
              cursor={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            {refLine && (
              <ReferenceLine
                y={refLine.y}
                stroke={refLine.color ?? "#F5B942"}
                strokeDasharray="4 4"
                label={{ value: refLine.label, position: "right", fill: refLine.color ?? "#F5B942", fontSize: 9 }}
              />
            )}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={1.8}
                dot={false}
                connectNulls
                activeDot={{ r: 3 }}
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
  radius = 3,
  xKey,
  children,
}: BaseProps & { radius?: number; xKey?: string; children?: ReactNode }) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey ?? "time"}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis width={42} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip series={series} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={s.color}
              radius={radius}
              maxBarSize={56}
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
    <div className="flex w-full items-center justify-center text-secondary">
      <span className="text-xs">{label ?? "No data available"}</span>
    </div>
  );
}