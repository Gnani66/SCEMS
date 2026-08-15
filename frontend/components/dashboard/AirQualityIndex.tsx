"use client";

import { StatusDot } from "@/components/ui";
import { aqiCategory } from "@/lib/metrics";

export interface AqiNode {
  nodeId: string;
  name: string;
  aqi: number | null;
}

function Gauge({ value, cat }: { value: number; cat: { label: string; color: string; description: string } }) {
  const pct = Math.min(Math.max(value / 300, 0), 1);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 112" className="w-full max-w-[220px]">
        {/* track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={12}
          strokeLinecap="round"
          pathLength={100}
        />
        {/* value arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={cat.color}
          strokeWidth={12}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 - pct * 100}
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
        <text x={100} y={82} textAnchor="middle" fontSize={40} fontWeight={700} fill="#f5f5f5" className="text-tabular">
          {value.toFixed(1)}
        </text>
        <text x={100} y={100} textAnchor="middle" fontSize={10} letterSpacing={2.5} fill={cat.color} fontWeight={700}>
          {cat.label}
        </text>
      </svg>
      <p className="mt-1 max-w-[240px] text-center text-[11px] leading-snug text-muted">{cat.description}</p>
      <div className="mt-3 flex w-full items-center gap-1">
        {["#4ADE80", "#F5B942", "#FB923C", "#EF4444", "#C026D3", "#7F1D1D"].map((c) => (
          <div key={c} className="h-1 flex-1 rounded-full first:rounded-l-full last:rounded-r-full" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="mt-1 flex w-full justify-between text-[9px] text-muted">
        <span>GOOD</span>
        <span>MODERATE</span>
        <span>SENS</span>
        <span>UNH</span>
        <span>V.UNH</span>
        <span>HAZ</span>
      </div>
    </div>
  );
}

export default function AirQualityIndex({
  aqi,
  nodes,
}: {
  aqi: number | null;
  nodes: AqiNode[];
}) {
  const cat = aqi != null ? aqiCategory(aqi) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 px-4 py-4">
        {aqi == null ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2">
            <StatusDot color="#666C6C" size={8} />
            <p className="text-xs text-muted">No data available</p>
          </div>
        ) : (
          <Gauge value={aqi} cat={cat!} />
        )}
      </div>

      <div className="border-t border-line px-4 py-3">
        <p className="section-kicker mb-2">Per-node AQI</p>
        {nodes.length === 0 ? (
          <p className="text-[11px] text-muted">No data available</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {nodes.map((node) => {
              const nodeCat = node.aqi != null ? aqiCategory(node.aqi) : null;
              return (
                <div key={node.nodeId} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2 text-secondary">
                    <StatusDot color={nodeCat?.color ?? "#666C6C"} size={6} />
                    {node.name}
                  </span>
                  <span className="text-tabular font-medium" style={{ color: nodeCat?.color ?? "#666C6C" }}>
                    {node.aqi != null ? node.aqi.toFixed(1) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}