export interface SensorData {
  temperature: number;
  humidity: number;
  pressure: number;
  aqi: number;
  tvoc: number;
  eco2: number;
  light: number;
  rain: boolean;
  sound: number;
  uv: number;
}

export interface SensorReading {
  node_id: string;
  node_name: string;
  location: string;
  timestamp: string;
  data: SensorData;
}

export interface NodeHealth {
  node_id: string;
  timestamp: string;
  wifi_rssi: number;
  uptime: number;
  free_heap: number;
  firmware_version: string;
}

export interface NodeStatus {
  node_id: string;
  status: string;
}

export interface NodeInfo {
  node_id: string;
  status: string;
  latest_reading: SensorReading | null;
  health: NodeHealth | null;
}

export type Severity = "normal" | "warning" | "critical";

export interface Alert {
  id?: number;
  node_id: string;
  sensor: string;
  alert_type: string;
  threshold: number;
  actual_value: number;
  severity: Severity;
  status: string;
  message: string;
  created_at: string;
  acknowledged_at: string | null;
}

/** Flat database row returned by /api/readings/* */
export interface FlatReading {
  node_id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  pressure: number;
  aqi: number;
  tvoc: number;
  eco2: number;
  light: number;
  rain: boolean;
  sound: number;
  uv: number;
}

export interface WebSocketMessage {
  type: "sensor_data" | "node_health" | "node_status" | "alert";
  data: SensorReading | NodeHealth | NodeStatus | Partial<Alert>;
}

export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface RealtimeState {
  readings: Record<string, SensorReading>;
  alerts: Alert[];
  health: Record<string, NodeHealth>;
  status: Record<string, NodeStatus>;
  connection: ConnectionState;
  connectedAt: number | null;
  updatedAt: number | null;
}

export interface SystemHealth {
  service: string;
  status: string;
  database: string;
  mqtt: string;
}

export interface SystemInfo {
  system: string;
  status: string;
  version: string;
}

export interface NodesResponse {
  count: number;
  nodes: NodeInfo[];
}

export interface AlertsResponse {
  count: number;
  alerts: Alert[];
}

export interface HistoryResponse {
  count: number;
  hours: number;
  readings: FlatReading[];
}

export interface AnalyticsSummary {
  reading_count: number;
  avg_temperature: number;
  min_temperature: number;
  max_temperature: number;
  avg_humidity: number;
  min_humidity: number;
  max_humidity: number;
  avg_aqi: number;
  min_aqi: number;
  max_aqi: number;
  avg_light: number;
  avg_sound: number;
  avg_uv: number;
}

export interface AnalyticsComparisonRow {
  node_id: string;
  avg_temperature: number;
  avg_humidity: number;
  avg_aqi: number;
  avg_light: number;
  avg_sound: number;
  avg_uv: number;
}