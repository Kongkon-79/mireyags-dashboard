"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardChartSkeleton() {
  return (
    <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>

        <Skeleton className="h-11 w-[140px] rounded-xl" />
      </div>

      <div className="mt-6 h-[320px] w-full sm:h-[360px]">
        <div className="flex h-full items-end gap-4 rounded-xl bg-[#FBFCFD] px-4 py-6">
          <Skeleton className="h-[45%] flex-1 rounded-t-xl" />
          <Skeleton className="h-[62%] flex-1 rounded-t-xl" />
          <Skeleton className="h-[35%] flex-1 rounded-t-xl" />
          <Skeleton className="h-[74%] flex-1 rounded-t-xl" />
          <Skeleton className="h-[58%] flex-1 rounded-t-xl" />
          <Skeleton className="h-[82%] flex-1 rounded-t-xl" />
          <Skeleton className="h-[50%] flex-1 rounded-t-xl" />
          <Skeleton className="h-[35%] flex-1 rounded-t-xl" />
          <Skeleton className="h-[74%] flex-1 rounded-t-xl" />
          <Skeleton className="h-[58%] flex-1 rounded-t-xl" />
          <Skeleton className="h-[82%] flex-1 rounded-t-xl" />
          <Skeleton className="h-[50%] flex-1 rounded-t-xl" />
        </div>
      </div>
    </div>
  );
}
