import type {
  Alert,
  AlertsResponse,
  AnalyticsComparisonRow,
  AnalyticsSummary,
  FlatReading,
  HistoryResponse,
  NodeHealth,
  NodesResponse,
  SystemHealth,
  SystemInfo,
} from "@/types/scems";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEFAULT_TIMEOUT = 12000;

async function http<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    DEFAULT_TIMEOUT,
  );

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

/* ------------------------------------------------------------------ */
/* System                                                              */
/* ------------------------------------------------------------------ */

export function getSystemInfo(): Promise<SystemInfo> {
  return http<SystemInfo>("/");
}

export function getHealth(): Promise<SystemHealth> {
  return http<SystemHealth>("/health");
}

/* ------------------------------------------------------------------ */
/* Nodes                                                               */
/* ------------------------------------------------------------------ */

export function getNodes(): Promise<NodesResponse> {
  return http<NodesResponse>("/api/nodes");
}

export function getNodeHealth(): Promise<{
  count: number;
  nodes: NodeHealth;
}> {
  return http<{ count: number; nodes: NodeHealth }>("/api/health");
}

/* ------------------------------------------------------------------ */
/* Readings                                                            */
/* ------------------------------------------------------------------ */

export function getLatestReadings(): Promise<{
  count: number;
  readings: FlatReading[];
}> {
  return http<{ count: number; readings: FlatReading[] }>(
    "/api/readings/latest",
  );
}

export function getReadingsHistory(params: {
  nodeId?: string;
  hours?: number;
  limit?: number;
} = {}): Promise<HistoryResponse> {
  const search = new URLSearchParams();
  if (params.nodeId) search.set("node_id", params.nodeId);
  if (params.hours) search.set("hours", String(params.hours));
  if (params.limit) search.set("limit", String(params.limit));

  const query = search.toString();
  return http<HistoryResponse>(
    `/api/readings/history${query ? `?${query}` : ""}`,
  );
}

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

export function getAlerts(params: {
  status?: string;
  limit?: number;
} = {}): Promise<AlertsResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.limit) search.set("limit", String(params.limit));

  const query = search.toString();
  return http<AlertsResponse>(
    `/api/alerts${query ? `?${query}` : ""}`,
  );
}

export function acknowledgeAlert(alertId: number): Promise<Alert> {
  return http<Alert>(`/api/alerts/${alertId}/acknowledge`, {
    method: "PATCH",
  });
}

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

export function getAnalyticsSummary(params: {
  nodeId: string;
  hours?: number;
}): Promise<AnalyticsSummary> {
  const search = new URLSearchParams({
    node_id: params.nodeId,
    hours: String(params.hours ?? 24),
  });
  return http<AnalyticsSummary>(`/api/analytics/summary?${search}`);
}

export function getAnalyticsComparison(params: {
  hours?: number;
} = {}): Promise<{
  hours: number;
  nodes: AnalyticsComparisonRow[];
}> {
  const search = new URLSearchParams({
    hours: String(params.hours ?? 24),
  });
  return http<{ hours: number; nodes: AnalyticsComparisonRow[] }>(
    `/api/analytics/comparison?${search}`,
  );
}

export { API_URL };

export type {
  AlertsResponse,
  HistoryResponse,
  NodesResponse,
};