"use client";

import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="app-scroll" className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1680px] px-4 py-4 sm:px-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}