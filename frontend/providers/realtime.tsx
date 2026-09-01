"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  Alert,
  ConnectionState,
  NodeHealth,
  NodeStatus,
  RealtimeState,
  SensorReading,
  WebSocketMessage,
} from "@/types/scems";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const RECONNECT_BASE = 1500;
const RECONNECT_MAX = 10000;
const POLL_FALLBACK_MS = 10000;
const WS_HEARTBEAT_MS = 25000;
export const TREND_KEYS = [
  "temperature",
  "humidity",
  "pressure",
  "aqi",
  "tvoc",
  "eco2",
  "light",
  "sound",
  "uv",
] as const;
export type TrendMetric = (typeof TREND_KEYS)[number];

interface TrendPoint {
  time: number;
  value: number;
}

export type TrendBuffer = Record<
  string,
  Partial<Record<TrendMetric, TrendPoint[]>>
>;

const MAX_TREND_PER_NODE = 160;
const MIN_TREND_GAP_MS = 2000;

interface RealtimeContextValue extends RealtimeState {
  trend: TrendBuffer;
  setReading: (reading: SensorReading) => void;
  upsertActiveAlerts: (alerts: Alert[]) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

function normalizeAlert(raw: Partial<Alert>): Alert {
  return {
    id: raw.id,
    node_id: raw.node_id ?? "unknown",
    sensor: raw.sensor ?? "unknown",
    alert_type: raw.alert_type ?? "threshold",
    threshold: raw.threshold ?? 0,
    actual_value: raw.actual_value ?? 0,
    severity: (raw.severity as Alert["severity"]) ?? "warning",
    status: raw.status ?? "active",
    message: raw.message ?? "",
    created_at: raw.created_at ?? new Date().toISOString(),
    acknowledged_at: raw.acknowledged_at ?? null,
  };
}

function appendTrendPoint(
  current: TrendBuffer,
  reading: SensorReading,
): TrendBuffer {
  const data = reading.data;
  if (!data) return current;

  const time = Date.now();
  const nodeId = reading.node_id;
  const nextNode = { ...current[nodeId] };
  let changed = false;

  for (const key of TREND_KEYS) {
    const value = data[key];
    if (typeof value !== "number") continue;
    const prev = nextNode[key];
    const last = prev?.[prev.length - 1];
    if (last && time - last.time < MIN_TREND_GAP_MS) continue;
    const next: TrendPoint[] = [...(prev ?? []), { time, value }];
    if (next.length > MAX_TREND_PER_NODE) {
      next.splice(0, next.length - MAX_TREND_PER_NODE);
    }
    nextNode[key] = next;
    changed = true;
  }

  if (!changed) return current;
  return {
    ...current,
    [nodeId]: nextNode,
  };
}

type RealtimeStore = RealtimeState & {
  trend: TrendBuffer;
};

export function RealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<RealtimeStore>({
    readings: {},
    alerts: [],
    health: {},
    status: {},
    trend: {},
    connection: "connecting",
    connectedAt: null,
    updatedAt: null,
  });

  const socketRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectRef = useRef<() => void>(() => {});

  const scheduleReconnect = useCallback(() => {
    if (timerRef.current) return;
    const delay = Math.min(
      RECONNECT_BASE * 2 ** retryRef.current,
      RECONNECT_MAX,
    );
    retryRef.current += 1;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setState((prev) => ({ ...prev, connection: "connecting" }));
      connectRef.current();
    }, delay);
  }, []);

  const connect = useCallback(() => {
    // Clean up stale socket
    if (socketRef.current) {
      try { socketRef.current.close(); } catch {}
      socketRef.current = null;
    }

    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      retryRef.current = 0;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setState((prev) => ({
        ...prev,
        connection: "connected",
        connectedAt: Date.now(),
      }));
      // Start heartbeat ping
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          try { socket.send("ping"); } catch {}
        }
      }, WS_HEARTBEAT_MS);
    };

    socket.onmessage = (event) => {
      let message: WebSocketMessage;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      const now = Date.now();

      switch (message.type) {
        case "sensor_data": {
          const reading = message.data as SensorReading;
          if (!reading?.node_id) return;
          setState((prev) => {
            const trend = appendTrendPoint(prev.trend, reading);
            return {
              ...prev,
              updatedAt: now,
              trend,
              readings: {
                ...prev.readings,
                [reading.node_id]: reading,
              },
            };
          });
          break;
        }
        case "node_health": {
          const health = message.data as NodeHealth;
          if (!health?.node_id) return;
          setState((prev) => ({
            ...prev,
            updatedAt: now,
            health: { ...prev.health, [health.node_id]: health },
          }));
          break;
        }
        case "node_status": {
          const status = message.data as NodeStatus;
          if (!status?.node_id) return;
          setState((prev) => ({
            ...prev,
            updatedAt: now,
            status: { ...prev.status, [status.node_id]: status },
          }));
          break;
        }
        case "alert": {
          const alert = normalizeAlert(message.data as Partial<Alert>);
          setState((prev) => ({
            ...prev,
            updatedAt: now,
            alerts: [alert, ...prev.alerts].slice(0, 100),
          }));
          break;
        }
      }
    };

    socket.onclose = () => {
      if (socketRef.current !== socket) return;
      socketRef.current = null;
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      setState((prev) => ({
        ...prev,
        connection:
          retryRef.current < 4 ? "reconnecting" : "disconnected",
      }));
      scheduleReconnect();
    };

    socket.onerror = () => {
      try { socket.close(); } catch {}
    };
  }, [scheduleReconnect]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Fallback polling: if WS is down or stale, fetch latest readings via REST
  const pollLatest = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/readings/latest`, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json() as { readings: Array<Record<string, unknown>> };
      const rows = json.readings ?? [];
      if (rows.length === 0) return;
      const now = Date.now();
      setState((prev) => {
        let nextTrend = prev.trend;
        const nextReadings = { ...prev.readings };
        for (const row of rows) {
          const nodeId = row.node_id as string;
          if (!nodeId) continue;
          // Skip stale readings older than 5 minutes — prevents resurrecting offline nodes
          const ts = row.timestamp as string;
          if (ts) {
            const ageMs = Date.now() - new Date(ts).getTime();
            if (!Number.isNaN(ageMs) && ageMs > 300000) continue;
          }
          const reading: SensorReading = {
            node_id: nodeId,
            node_name: (row.node_id as string) ?? nodeId,
            location: ("" as string),
            timestamp: row.timestamp as string,
            data: {
              temperature: row.temperature as number,
              humidity: row.humidity as number,
              pressure: row.pressure as number,
              aqi: row.aqi as number,
              tvoc: row.tvoc as number,
              eco2: row.eco2 as number,
              light: row.light as number,
              rain: row.rain as boolean,
              sound: row.sound as number,
              uv: row.uv as number,
            },
          };
          // Only update if newer or not present
          const existing = nextReadings[nodeId];
          if (existing) {
            const eTime = new Date(existing.timestamp).getTime();
            const nTime = new Date(reading.timestamp).getTime();
            if (!Number.isNaN(nTime) && !Number.isNaN(eTime) && nTime <= eTime) continue;
          }
          nextTrend = appendTrendPoint(nextTrend, reading);
          nextReadings[nodeId] = reading;
        }
        return { ...prev, readings: nextReadings, trend: nextTrend, updatedAt: now };
      });
    } catch {}
  }, []);

  useEffect(() => {
    connect();
    // Poll fallback every 10s regardless — ensures data never disappears
    pollRef.current = setInterval(pollLatest, POLL_FALLBACK_MS);
    // Initial poll after 2s to hydrate quickly if WS slow
    const t = setTimeout(pollLatest, 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      clearTimeout(t);
      try { socketRef.current?.close(); } catch {}
      socketRef.current = null;
    };
  }, [connect, pollLatest]);

  const setReading = useCallback((reading: SensorReading) => {
    setState((prev) => {
      const trend = appendTrendPoint(prev.trend, reading);
      return {
        ...prev,
        updatedAt: Date.now(),
        trend,
        readings: { ...prev.readings, [reading.node_id]: reading },
      };
    });
  }, []);

  const upsertActiveAlerts = useCallback((alerts: Alert[]) => {
    if (!alerts || alerts.length === 0) return;
    setState((prev) => {
      const existing = new Map<number | string, Alert>();
      // Only keep alerts with real ids — ignore fake / id-less unless they are from backend WS
      for (const a of prev.alerts) {
        if (a.id != null) existing.set(a.id, a);
        else if (a.created_at) existing.set(`${a.node_id}-${a.sensor}-${a.created_at}`, a);
      }
      for (const alert of alerts) {
        if (alert.status === "acknowledged") {
          if (alert.id != null) existing.delete(alert.id);
          continue;
        }
        if (alert.status !== "active" && alert.status !== "warning" && alert.status !== "critical" && alert.status !== undefined) continue;
        const key = alert.id != null ? alert.id : `${alert.node_id}-${alert.sensor}-${alert.created_at}`;
        if (alert.id == null && !alert.created_at) continue;
        existing.set(key, alert);
      }
      // Keep only active, newest first, deduped
      const sorted = Array.from(existing.values())
        .filter((a) => a.status !== "acknowledged")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 100);
      return {
        ...prev,
        alerts: sorted,
      };
    });
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        ...state,
        setReading,
        upsertActiveAlerts,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return context;
}

/** Convenience selector for a single node's latest reading. */
export function useNodeReading(nodeId: string): SensorReading | undefined {
  const { readings } = useRealtime();
  return readings[nodeId];
}

export type { ConnectionState };