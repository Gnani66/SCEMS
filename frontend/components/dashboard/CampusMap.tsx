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
        rx={10}
        fill="#ffffff"
        stroke="#e2e8f0"
        strokeWidth={1.2}
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={5}
        rx={4}
        fill={zone === "center" ? "#2563eb" : "#f1f5f9"}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 - 4}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill="#0f172a"
      >
        {label}
      </text>
      <text
        x={x + w / 2}
        y={y + h / 2 + 14}
        textAnchor="middle"
        fontSize={9}
        fill="#64748b"
        letterSpacing={0.8}
        fontWeight={600}
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
        <pattern id="mapgrid-light" width={40} height={40} patternUnits="userSpaceOnUse">
          <path d={`M ${40} 0 L 0 0 0 ${40}`} fill="none" stroke="#f1f5f9" strokeWidth={1} />
        </pattern>
        <radialGradient id="campusGlowLight" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill="url(#campusGlowLight)" />
      <rect width={W} height={H} fill="url(#mapgrid-light)" />

      {/* perimeter roads — light */}
      <path d="M0 90 H800" stroke="#e2e8f0" strokeWidth={16} />
      <path d="M0 90 H800" stroke="#ffffff" strokeWidth={1} strokeDasharray="16 12" opacity={0.9} />
      <path d="M0 460 H800" stroke="#e2e8f0" strokeWidth={16} />
      <path d="M0 460 H800" stroke="#ffffff" strokeWidth={1} strokeDasharray="16 12" opacity={0.9} />
      <path d="M90 0 V520" stroke="#e2e8f0" strokeWidth={16} />
      <path d="M90 0 V520" stroke="#ffffff" strokeWidth={1} strokeDasharray="16 12" opacity={0.9} />
      <path d="M700 0 V520" stroke="#e2e8f0" strokeWidth={14} />
      {/* inner roads */}
      <path d="M120 260 H700" stroke="#e2e8f0" strokeWidth={10} />
      <path d="M120 260 H700" stroke="#ffffff" strokeWidth={1} strokeDasharray="10 8" opacity={0.9} />

      {/* green areas — very soft */}
      <ellipse cx={150} cy={330} rx={80} ry={52} fill="#ecfdf5" opacity={0.9} />
      <ellipse cx={560} cy={150} rx={90} ry={56} fill="#ecfdf5" opacity={0.6} />
      <ellipse cx={400} cy={330} rx={60} ry={40} fill="#f0fdf4" opacity={0.7} />

      {/* buildings — light cards */}
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
    <div className="relative h-full w-full overflow-hidden rounded-b-[14px] bg-[#f8fafc]">
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 shadow-sm">
          <IconMap size={14} className="text-[#2563eb]" />
          <span className="text-[11px] font-bold tracking-wide text-[#0f172a]">CAMPUS MAP</span>
        </div>
        <div className="hidden items-center gap-3 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium shadow-sm sm:flex">
          <span className="flex items-center gap-1.5 text-[#334155]"><StatusDot color="#059669" size={6} /> Live</span>
          <span className="flex items-center gap-1.5 text-[#334155]"><StatusDot color="#d97706" size={6} /> Warning</span>
          <span className="flex items-center gap-1.5 text-[#334155]"><StatusDot color="#dc2626" size={6} /> Offline</span>
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-xs font-medium text-[#64748b] shadow-sm">
        {liveCount} / {nodes.length} online
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
                <circle r={18} fill="none" stroke={node.color} strokeOpacity={0.18} strokeWidth={2}>
                  <animate attributeName="r" values="12;26;12" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.25;0;0.25" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={12} fill={node.color} opacity={0.12} />
              <circle r={6.5} fill={node.color} stroke="white" strokeWidth={2.5} />
              {(isHover || isActive) && (
                <circle r={18} fill="none" stroke="#2563eb" strokeWidth={1.2} opacity={0.4} />
              )}

              {/* AQI chip — white pill */}
              <g transform="translate(0, -24)">
                <rect x={-28} y={-12} width={56} height={20} rx={10} fill="white" stroke="#e2e8f0" strokeWidth={1} />
                <text textAnchor="middle" y={4} fontSize={10} fontWeight={800} fill={aqi != null ? cat?.color ?? node.color : "#334155"}>
                  {aqi != null ? `AQI ${aqi.toFixed(0)}` : node.label}
                </text>
              </g>

              <text textAnchor="middle" y={32} fontSize={10} fontWeight={700} fill="#475569">
                {node.nodeId.replace("SCEMS_", "")}
              </text>
            </g>
          );
        })}
      </CampusMapVisual>

      {/* Popup — Zoho white card */}
      {selectedNode && (
        <div
          className="absolute z-20 w-64 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xl"
          style={{
            left: `${Math.min(Math.max((selectedNode.x / W) * 100, 4), 68)}%`,
            top: `${Math.min(Math.max((selectedNode.y / H) * 100, 6), 58)}%`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-[#0f172a]">{selectedNode.nodeId}</p>
            <span className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold" style={{ color: selectedNode.color, borderColor: `${selectedNode.color}30`, backgroundColor: `${selectedNode.color}12` }}>
              <StatusDot color={selectedNode.color} pulse={selectedNode.live} size={6} />
              {selectedNode.label}
            </span>
          </div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#64748b]">{selectedNode.location}</p>

          <div className="space-y-2 rounded-lg bg-[#f8fafc] p-3">
            <PopupRow label="Temperature" value={fmt(selectedNode.reading?.data?.temperature, "°C")} />
            <PopupRow label="Humidity" value={fmt(selectedNode.reading?.data?.humidity, "%")} />
            <PopupRow label="AQI" value={selectedNode.reading?.data?.aqi != null ? selectedNode.reading.data.aqi.toFixed(2) : "—"} />
            <PopupRow label="UV" value={fmt(selectedNode.reading?.data?.uv)} />
            <PopupRow
              label="Last reading"
              value={selectedNode.reading?.timestamp ? new Date(selectedNode.reading.timestamp).toLocaleTimeString() : "—"}
            />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#f1f5f9] pt-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#64748b]">
              <StatusDot color={selectedNode.color} size={6} />
              Telemetry
            </span>
            <Link
              href={`/nodes/${selectedNode.nodeId}`}
              className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8]"
            >
              Open node →
            </Link>
          </div>
        </div>
      )}

      {!selectedNode && nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-full bg-white px-4 py-2 text-xs font-medium text-[#64748b] shadow-sm border border-[#e2e8f0]">No nodes deployed</p>
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
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="font-medium text-[#64748b]">{label}</span>
      <span className="text-tabular font-semibold text-[#0f172a]">{value}</span>
    </div>
  );
}
