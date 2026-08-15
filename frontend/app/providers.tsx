"use client";

import { RealtimeProvider } from "@/providers/realtime";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RealtimeProvider>{children}</RealtimeProvider>;
}