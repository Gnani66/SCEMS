"use client";

import { useCallback, useEffect, useState } from "react";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Generic fetch hook with explicit reload. Fetches run in an effect so
 * nothing network-dependent happens during server prerendering.
 *
 * `loading` is true until the first response resolves; refreshes after
 * that reuse existing data to avoid unnecessary skeleton flashes.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  enabled = true,
): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  const loading = enabled && !ready && data === null;

  const stableDeps = deps.join("|");

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    fetcher()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Request failed");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableDeps, enabled, tick]);

  const reload = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  return { data, loading, error, reload };
}