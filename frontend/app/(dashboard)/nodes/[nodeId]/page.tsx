"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import NodeDetail from "@/components/nodes/NodeDetail";

export default function NodeDetailPage() {
  const params = useParams<{ nodeId: string }>();
  const nodeId = params?.nodeId;

  if (!nodeId) {
    return <Link href="/nodes" className="text-xs text-info">Back to nodes</Link>;
  }

  return <NodeDetail nodeId={nodeId} />;
}

export const dynamic = "force-dynamic";