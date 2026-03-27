"use client";

import { Skeleton } from "@/components/ui/skeleton";

const rows = Array.from({ length: 6 });

export default function OrderManagementTableSkeleton() {
  return (
    <table className="min-w-full">
      <thead className="border-b bg-[#F8F9FA]">
        <tr>
          <th className="px-4 py-4 text-left">
            <Skeleton className="h-5 w-24" />
          </th>
          <th className="px-4 py-4 text-left">
            <Skeleton className="h-5 w-24" />
          </th>
          <th className="px-4 py-4 text-center">
            <Skeleton className="mx-auto h-5 w-20" />
          </th>
          <th className="px-4 py-4 text-center">
            <Skeleton className="mx-auto h-5 w-20" />
          </th>
          <th className="px-4 py-4 text-center">
            <Skeleton className="mx-auto h-5 w-20" />
          </th>
          <th className="px-4 py-4 text-right">
            <Skeleton className="ml-auto h-5 w-16" />
          </th>
        </tr>
      </thead>

      <tbody>
        {rows.map((_, index) => (
          <tr key={index} className="border-b last:border-b-0">
            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-md" />
                <Skeleton className="h-4 w-28" />
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </td>
            <td className="px-4 py-4">
              <Skeleton className="mx-auto h-4 w-16" />
            </td>
            <td className="px-4 py-4">
              <Skeleton className="mx-auto h-4 w-16" />
            </td>
            <td className="px-4 py-4">
              <Skeleton className="mx-auto h-9 w-[120px] rounded-[12px]" />
            </td>
            <td className="px-4 py-4">
              <div className="flex justify-end">
                <Skeleton className="h-5 w-5 rounded-sm" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
