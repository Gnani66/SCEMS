"use client";

import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-[#f4f6fc]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="app-scroll" className="flex-1 overflow-y-auto bg-[#f4f6fc]">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
