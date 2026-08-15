"use client";

import { Fragment, useMemo } from "react";
import { Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { getReadingsHistory } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { METRICS, type MetricKey } from "@/lib/metrics";
import type { FlatReading } from "@/types/scems";

const HEAT_ROWS: Array<{ key: MetricKey; max: number }> = [
  { key: "temperature", max: 45 },
  { key: "humidity", max: 100 },
  { key: "aqi", max: 200 },
  { key: "light", max: 1000 },
  { key: "sound", max: 90 },
  { key: "uv", max: 11 },
];

interface Bucket {
  start: number;
  cells: Record<string, number | null>;
}

export default function MetricsHeatmap({
  hours = 24,
}: {
  hours?: number;
  height?: number;
}) {
  const { data, loading, error, reload } = useApi(
    () => getReadingsHistory({ hours, limit: 1200 }),
    [hours],
  );

  const { buckets, count } = useMemo(() => {
    if (!data?.readings.length) return { buckets: [] as Bucket[], count: 0 };

    const readings = data.readings as FlatReading[];
    const times = readings.map((r) => new Date(r.timestamp).getTime()).filter((t) => !Number.isNaN(t));
    if (times.length === 0) return { buckets: [] as Bucket[], count: 0 };

    const min = Math.min(...times);
    const max = Math.max(...times);
    const COLUMNS = Math.min(24, Math.max(...times) - min > 0 ? 24 : 1);
    const span = Math.max(1, (max - min) / COLUMNS);

    const acc: Bucket[] = Array.from({ length: COLUMNS }, (_, i) => ({
      start: min + span * i,
      cells: Object.fromEntries(HEAT_ROWS.map((r) => [r.key, null])) as Record<string, number | null>,
    }));

    const sums: Record<number, Record<string, { total: number; n: number }>> = {};

    for (const r of readings) {
      const t = new Date(r.timestamp).getTime();
      if (Number.isNaN(t)) continue;
      const idx = Math.min(COLUMNS - 1, Math.floor((t - min) / span));
      const bucket = (sums[idx] ??= {});
      for (const row of HEAT_ROWS) {
        const value = r[row.key] as number;
        if (typeof value !== "number" || Number.isNaN(value)) continue;
        (bucket[row.key] ??= { total: 0, n: 0 }).total += value;
        (bucket[row.key] as { total: number; n: number }).n += 1;
      }
    }

    for (let i = 0; i < COLUMNS; i++) {
      const bucket = sums[i];
      if (!bucket) continue;
      for (const row of HEAT_ROWS) {
        const agg = bucket[row.key];
        if (agg && agg.n > 0) acc[i].cells[row.key] = agg.total / agg.n;
      }
    }

    return { buckets: acc, count: readings.length };
  }, [data]);

  return (
    <Card
      className="h-full"
      kicker="Last 24 hours"
      title="Environmental History"
      right={
        <span className="text-[11px] text-muted">
          {count > 0 ? `${count} readings` : ""}
        </span>
      }
    >
      {error ? (
        <ErrorState message="Unable to load history" onRetry={reload} />
      ) : loading ? (
        <div className="p-3"><Skeleton className="h-[140px] w-full" /></div>
      ) : buckets.length === 0 ? (
        <EmptyState message="No data available" />
      ) : (
        <div className="flex h-full flex-col justify-between px-3 py-2">
          <div
            className="grid w-full gap-px"
            style={{
              gridTemplateColumns: `${HEAT_ROWS.length > 0 ? "74px" : ""} repeat(${buckets.length}, minmax(0, 1fr))`,
            }}
          >
            <div />
            {buckets.map((b) => (
              <div
                key={b.start}
                className="text-right text-[8px] leading-relaxed text-faint"
                title={new Date(b.start).toLocaleTimeString()}
              >
                {new Date(b.start).getHours().toString().padStart(2, "0")}
              </div>
            ))}
          </div>

          <div
            className="grid flex-1 gap-px"
            style={{ gridTemplateColumns: `74px repeat(${buckets.length}, minmax(0,1fr))` }}
          >
            {HEAT_ROWS.map((row) => {
              const meta = METRICS.find((m) => m.key === row.key)!;
              return (
                <Fragment key={row.key}>
                  <div className="flex items-center gap-1.5 pr-2 text-[9px] uppercase tracking-wider text-muted">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.accent }} />
                    {meta.short}
                  </div>
                  {buckets.map((b) => {
                    const value = b.cells[row.key];
                    if (value == null) {
                      return <div key={`${row.key}-${b.start}`} className="h-full min-h-4 rounded-[3px] bg-line/40" />;
                    }
                    const pct = Math.min(value / row.max, 1);
                    return (
                      <div
                        key={`${row.key}-${b.start}`}
                        className="h-full min-h-4 rounded-[3px] transition-colors"
                        style={{ backgroundColor: `${meta.accent}${Math.round(18 + pct * 110).toString(16).padStart(2, "0")}` }}
                        title={`${meta.label}: ${value.toFixed(1)}`}
                      />
                    );
                  })}
                </Fragment>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between text-[9px] text-muted">
            <span>LOW</span>
            <span className="flex items-center gap-1">
              {HEAT_ROWS.map((r) => (
                <span key={r.key} className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: METRICS.find((m) => m.key === r.key)!.accent }} />
              ))}
            </span>
            <span>HIGH</span>
          </div>
        </div>
      )}
    </Card>
  );
}