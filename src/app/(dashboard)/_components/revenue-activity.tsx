
"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import NotFound from "@/components/shared/NotFound/NotFound";
import { GrowthApiResponse } from "./revenue-activity-data-type";
import DashboardChartSkeleton from "./dashboard-chart-skeleton";
import ManagementTableErrorContainer from "@/components/shared/ManagementTableErrorContainer/ManagementTableErrorContainer";

export const description = "Revenue activity area chart";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#09B5FF",
  },
} satisfies ChartConfig;

type RevenueItem = {
  month: string;
  revenue: number;
};


const monthLabelMap: Record<string, string> = {
  jan: "Jan",
  feb: "Feb",
  mar: "Mar",
  apr: "Apr",
  may: "May",
  jun: "Jun",
  jul: "Jul",
  aug: "Aug",
  sep: "Sep",
  oct: "Oct",
  nov: "Nov",
  dec: "Dec",
};

const monthKeys = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => currentYear - index);
};

export function RevenueActivity() {
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;

  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const yearOptions = generateYearOptions();

  const {
    data: apiData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<GrowthApiResponse>({
    queryKey: ["revenue-activity", selectedYear],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard/growth?year=${selectedYear}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("We couldn't load the revenue overview right now. Please try again.");
      }

      return res.json();
    },
    enabled: !!token,
  });

  const chartData = useMemo<RevenueItem[]>(() => {
    const revenueByMonth = apiData?.data?.revenueByMonth;

    if (!revenueByMonth) return [];

    return monthKeys.map((key) => ({
      month: monthLabelMap[key],
      revenue: revenueByMonth[key] ?? 0,
    }));
  }, [apiData]);

  let content;

  if (isLoading) {
    content = <DashboardChartSkeleton />;
  } else if (isError) {
    content = (
      <ManagementTableErrorContainer
        title="Unable to load revenue overview"
        message={(error as Error)?.message || "Something went wrong"}
        onRetry={() => refetch()}
      />
    );
  } else if (!chartData.length) {
    content = (
      <NotFound message="Oops! No data available. Modify your filters or check your internet connection." />
    );
  } else {
    content = (
      <Card className="rounded-2xl border border-[#E9ECEF] shadow-none">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-[#343A40] sm:text-xl">
                Revenue Overview
              </CardTitle>
              <p className="mt-1 text-sm text-[#6C757D]">
                Track total revenue, platform commission, and payouts over time.
              </p>
            </div>

            <div className="relative w-full sm:w-[140px]">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-11 w-full appearance-none rounded-xl border border-[#E6E6E8] bg-white pl-4 pr-10 text-sm font-medium text-[#343A40] outline-none transition focus:border-[#09B5FF]"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#616161]" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <ChartContainer
            config={chartConfig}
            className="h-[320px] w-full sm:h-[360px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#09B5FF"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="100%"
                      stopColor="#09B5FF"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} stroke="#E9ECEF" />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  className="text-xs"
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  className="text-xs"
                  tickFormatter={(value) =>
                    value >= 1000 ? `$${Number(value) / 1000}k` : `$${value}`
                  }
                />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value) => [
                        `$${Number(value).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                  }
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#09B5FF"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#16C60C",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  return <div className="px-4 pb-6 sm:px-6">{content}</div>;
}
