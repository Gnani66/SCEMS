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

const RECONNECT_BASE = 2000;
const RECONNECT_MAX = 15000;
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
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      retryRef.current = 0;
      setState((prev) => ({
        ...prev,
        connection: "connected",
        connectedAt: Date.now(),
      }));
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
      setState((prev) => ({
        ...prev,
        connection:
          retryRef.current < 3 ? "reconnecting" : "disconnected",
      }));
      scheduleReconnect();
    };

    socket.onerror = () => {
      socket.close();
    };
  }, [scheduleReconnect]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);

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
    setState((prev) => {
      const existing = new Map(prev.alerts.map((a) => [a.id, a]));
      for (const alert of alerts) {
        if (alert.id != null) existing.set(alert.id, alert);
      }
      return {
        ...prev,
        alerts: Array.from(existing.values()).slice(0, 100),
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