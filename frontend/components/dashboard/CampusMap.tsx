"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconMap } from "@/components/icons";
import { StatusDot } from "@/components/ui";
import { aqiCategory } from "@/lib/metrics";
import type { NodeHealth, SensorReading } from "@/types/scems";

export interface CampusMapNode {
  nodeId: string;
  name: string;
  location: string;
  reading: SensorReading | null;
  health: NodeHealth | null;
  color: string;
  label: string;
  live: boolean;
}

const W = 800;
const H = 520;

/** Campus coordinates by known location label. */
const LOCATIONS: Record<string, [number, number]> = {
  "Main Block": [250, 190],
  "Mainblock": [250, 190],
  "Library": [620, 300],
  "Admin": [180, 400],
  "Cafeteria": [470, 430],
};

function posFor(location: string, index: number): [number, number] {
  const found = LOCATIONS[location] ?? LOCATIONS[location?.toLowerCase?.()];
  if (found) return found;
  // Scatter unknown nodes near campus centre.
  return [400 + (index % 2) * 90 - 45, 300 + Math.floor(index / 2) * 70];
}

function Building({
  x,
  y,
  w,
  h,
  label,
  zone,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  zone: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill="#1a1e1e"
        stroke="rgba(255,255,255,0.12)"
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill="none"
        stroke={zone === "center" ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.05)"}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 - 4}
        textAnchor="middle"
        fontSize={13}
        fontWeight={600}
        fill="#f5f5f5"
        opacity={0.9}
      >
        {label}
      </text>
      <text
        x={x + w / 2}
        y={y + h / 2 + 14}
        textAnchor="middle"
        fontSize={9}
        fill="#666c6c"
        letterSpacing={1}
      >
        {zone}
      </text>
    </g>
  );
}

function CampusMapVisual({ children }: { children?: React.ReactNode }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="mapgrid" width={40} height={40} patternUnits="userSpaceOnUse">
          <path d={`M ${40} 0 L 0 0 0 ${40}`} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        </pattern>
        <radialGradient id="campusGlow" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#161a1a" />
          <stop offset="100%" stopColor="#0d0f0f" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill="url(#campusGlow)" />
      <rect width={W} height={H} fill="url(#mapgrid)" />

      {/* perimeter roads */}
      <path d="M0 90 H800" stroke="rgba(255,255,255,0.14)" strokeWidth={14} />
      <path d="M0 90 H800" stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="14 10" />
      <path d="M0 460 H800" stroke="rgba(255,255,255,0.14)" strokeWidth={14} />
      <path d="M0 460 H800" stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="14 10" />
      <path d="M90 0 V520" stroke="rgba(255,255,255,0.14)" strokeWidth={14} />
      <path d="M90 0 V520" stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="14 10" />
      <path d="M700 0 V520" stroke="rgba(255,255,255,0.14)" strokeWidth={12} />
      {/* inner roads */}
      <path d="M120 260 H700" stroke="rgba(255,255,255,0.10)" strokeWidth={8} />
      <path d="M120 260 H700" stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="10 8" />

      {/* green areas */}
      <ellipse cx={150} cy={330} rx={80} ry={52} fill="rgba(74,222,128,0.05)" />
      <ellipse cx={560} cy={150} rx={90} ry={56} fill="rgba(74,222,128,0.05)" />
      <ellipse cx={400} cy={330} rx={60} ry={40} fill="rgba(74,222,128,0.035)" />

      {/* buildings */}
      <Building x={150} y={130} w={210} h={104} label="Main Block" zone="SCEMS_NODE_01" />
      <Building x={520} y={200} w={150} h={96} label="Library" zone="SCEMS_NODE_02" />
      <Building x={120} y={350} w={110} h={72} label="Admin" zone="Administration" />
      <Building x={300} y={350} w={130} h={72} label="Cafeteria" zone="Student Services" />
      <Building x={470} y={380} w={120} h={60} label="Auditorium" zone="Events" />
      <Building x={600} y={120} w={76} h={54} label="Lab" zone="Research" />

      {children}
    </svg>
  );
}

export default function CampusMap({
  nodes,
}: {
  nodes: CampusMapNode[];
  height?: number;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const positioned = useMemo(
    () =>
      nodes.map((node, index) => {
        const [x, y] = posFor(node.location, index);
        return { ...node, x, y };
      }),
    [nodes],
  );

  const selectedNode = positioned.find((n) => n.nodeId === selected);

  const liveCount = nodes.filter((n) => n.live).length;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-app2/85 px-2.5 py-1.5 backdrop-blur-sm">
          <IconMap size={13} className="text-secondary" />
          <span className="text-[11px] font-semibold text-ink">CAMPUS ENVIRONMENTAL MAP</span>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-line bg-app2/85 px-2.5 py-1.5 text-[10px] text-secondary backdrop-blur-sm sm:flex">
          <span className="flex items-center gap-1"><StatusDot color="#4ADE80" size={6} /> Live</span>
          <span className="flex items-center gap-1"><StatusDot color="#F5B942" size={6} /> Warning</span>
          <span className="flex items-center gap-1"><StatusDot color="#EF4444" size={6} /> Offline</span>
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-10 text-[10px] text-muted">
        {liveCount} / {nodes.length} nodes online
      </div>

      <CampusMapVisual>
        {positioned.map((node) => {
          const isActive = selected === node.nodeId;
          const isHover = hover === node.nodeId;
          const aqi =
            typeof node.reading?.data?.aqi === "number" ? node.reading.data.aqi : null;
          const cat = aqi != null ? aqiCategory(aqi) : null;

          return (
            <g
              key={node.nodeId}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(isActive ? null : node.nodeId);
              }}
              onMouseEnter={() => setHover(node.nodeId)}
              onMouseLeave={() => setHover(null)}
            >
              {node.live && (
                <circle r={16} fill="none" stroke={node.color} strokeOpacity={0.5} strokeWidth={2}>
                  <animate attributeName="r" values="12;26;12" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={11} fill={node.color} opacity={isActive ? 0.25 : 0.18} />
              <circle r={5.5} fill={node.color} stroke="#0d0f0f" strokeWidth={2} />
              {(isHover || isActive) && (
                <circle r={16} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
              )}

              {/* AQI chip */}
              <g transform="translate(0, -22)">
                <rect x={-24} y={-11} width={48} height={18} rx={9} fill="#101212" stroke={`${node.color}55`} />
                <text textAnchor="middle" y={2} fontSize={9.5} fontWeight={700} fill={aqi != null ? cat?.color ?? node.color : node.color}>
                  {aqi != null ? `AQI ${aqi.toFixed(0)}` : node.label}
                </text>
              </g>

              <text textAnchor="middle" y={30} fontSize={10} fontWeight={600} fill="#929797">
                {node.nodeId.replace("SCEMS_", "")}
              </text>
            </g>
          );
        })}
      </CampusMapVisual>

      {/* Popup */}
      {selectedNode && (
        <div
          className="absolute z-20 w-56 rounded-xl border border-line2 bg-elev p-3 shadow-2xl"
          style={{
            left: `${Math.min(Math.max((selectedNode.x / W) * 100, 4), 70)}%`,
            top: `${Math.min(Math.max((selectedNode.y / H) * 100, 6), 58)}%`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink">{selectedNode.nodeId}</p>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: selectedNode.color }}>
              <StatusDot color={selectedNode.color} pulse={selectedNode.live} size={6} />
              {selectedNode.label}
            </span>
          </div>
          <p className="mb-2 text-[10px] uppercase tracking-wider text-muted">{selectedNode.location}</p>

          <div className="space-y-1.5 text-[12px]">
            <PopupRow label="Temperature" value={fmt(selectedNode.reading?.data?.temperature, "°C")} />
            <PopupRow label="Humidity" value={fmt(selectedNode.reading?.data?.humidity, "%")} />
            <PopupRow label="AQI" value={selectedNode.reading?.data?.aqi != null ? selectedNode.reading.data.aqi.toFixed(2) : "—"} />
            <PopupRow label="UV" value={fmt(selectedNode.reading?.data?.uv)} />
            <PopupRow
              label="Last reading"
              value={selectedNode.reading?.timestamp ? new Date(selectedNode.reading.timestamp).toLocaleTimeString() : "—"}
            />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-2">
            <span className="flex items-center gap-1.5 text-[11px] text-secondary">
              <StatusDot color={selectedNode.color} size={6} />
              {selectedNode.health ? "Telemetry available" : "No telemetry"}
            </span>
            <Link
              href={`/nodes/${selectedNode.nodeId}`}
              className="rounded-md border border-line2 bg-card2 px-2.5 py-1 text-[11px] font-medium text-ink transition-colors hover:bg-elev"
            >
              Open node →
            </Link>
          </div>
        </div>
      )}

      {!selectedNode && nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-muted">No data available</p>
        </div>
      )}
    </div>
  );
}

function fmt(value: unknown, unit = ""): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}${unit}`;
}

function PopupRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-secondary">{label}</span>
      <span className="text-tabular font-medium text-ink">{value}</span>
    </div>
  );
}