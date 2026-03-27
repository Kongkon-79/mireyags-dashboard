"use client";

import { Skeleton } from "@/components/ui/skeleton";

const rows = Array.from({ length: 6 });

export default function ContactManagementTableSkeleton() {
  return (
    <table className="min-w-full">
      <thead className="border-b bg-[#F8F9FA]">
        <tr>
          <th className="px-4 py-4 text-left">
            <Skeleton className="h-5 w-16" />
          </th>
          <th className="px-4 py-4 text-left">
            <Skeleton className="h-5 w-20" />
          </th>
          <th className="px-4 py-4 text-left">
            <Skeleton className="h-5 w-20" />
          </th>
          <th className="px-4 py-4 text-left">
            <Skeleton className="h-5 w-24" />
          </th>
          <th className="px-4 py-4 text-center">
            <Skeleton className="mx-auto h-5 w-24" />
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
              <Skeleton className="h-4 w-24" />
            </td>
            <td className="px-4 py-4">
              <Skeleton className="h-4 w-36" />
            </td>
            <td className="px-4 py-4">
              <Skeleton className="h-4 w-28" />
            </td>
            <td className="px-4 py-4">
              <Skeleton className="h-4 w-full max-w-[280px]" />
            </td>
            <td className="px-4 py-4">
              <Skeleton className="mx-auto h-4 w-20" />
            </td>
            <td className="px-4 py-4">
              <div className="flex justify-end gap-4">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-5 w-5 rounded-sm" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
