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
        {/* track — light */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e2e8f0"
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
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
        <text x={100} y={82} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a" className="text-tabular">
          {value.toFixed(1)}
        </text>
        <text x={100} y={100} textAnchor="middle" fontSize={10} letterSpacing={2.2} fill={cat.color} fontWeight={800}>
          {cat.label}
        </text>
      </svg>
      <p className="mt-2 max-w-[240px] text-center text-xs leading-snug text-[#64748b]">{cat.description}</p>
      <div className="mt-4 flex w-full items-center gap-1">
        {["#10b981", "#f59e0b", "#f97316", "#ef4444", "#a855f7", "#991b1b"].map((c) => (
          <div key={c} className="h-1.5 flex-1 rounded-full first:rounded-l-full last:rounded-r-full" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="mt-1.5 flex w-full justify-between text-[9px] font-bold tracking-wide text-[#94a3b8]">
        <span>GOOD</span>
        <span>MOD</span>
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
    <div className="flex h-full flex-col bg-white">
      <div className="flex-1 px-5 py-6">
        {aqi == null ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9]">
              <StatusDot color="#94a3b8" size={8} />
            </div>
            <p className="text-sm font-medium text-[#64748b]">No AQI data</p>
            <p className="text-xs text-[#94a3b8]">Waiting for sensor readings</p>
          </div>
        ) : (
          <Gauge value={aqi} cat={cat!} />
        )}
      </div>

      <div className="border-t border-[#f1f5f9] bg-[#f8fafc] px-5 py-4">
        <p className="section-kicker mb-3">Per-node AQI</p>
        {nodes.length === 0 ? (
          <p className="text-xs text-[#94a3b8]">No nodes reporting</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {nodes.map((node) => {
              const nodeCat = node.aqi != null ? aqiCategory(node.aqi) : null;
              return (
                <div key={node.nodeId} className="flex items-center justify-between rounded-lg border border-[#f1f5f9] bg-white px-3 py-2">
                  <span className="flex items-center gap-2 text-xs font-medium text-[#334155]">
                    <StatusDot color={nodeCat?.color ?? "#cbd5e1"} size={6} />
                    {node.name}
                  </span>
                  <span className="text-tabular text-sm font-bold" style={{ color: nodeCat?.color ?? "#64748b" }}>
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
