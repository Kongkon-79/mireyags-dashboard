"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NotFound from "@/components/shared/NotFound/NotFound";
import { GrowthApiResponse } from "./revenue-activity-data-type";
import DashboardChartSkeleton from "./dashboard-chart-skeleton";
import ManagementTableErrorContainer from "@/components/shared/ManagementTableErrorContainer/ManagementTableErrorContainer";

type CustomerChartItem = {
  month: string;
  customers: number;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: CustomerChartItem;
  }>;
  label?: string;
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

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const value = payload[0]?.value ?? 0;

  return (
    <div className="rounded-xl border border-[#E9ECEF] bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-[#6C757D]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#343A40]">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default function TotalCustomersChart() {
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const yearOptions = generateYearOptions();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<GrowthApiResponse>({
    queryKey: ["total-customers", selectedYear],
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
        throw new Error("We couldn't load the customer overview right now. Please try again.");
      }

      return res.json();
    },
    enabled: !!token,
  });

  const chartData = useMemo<CustomerChartItem[]>(() => {
    const customersByMonth = data?.data?.customersByMonth;

    if (!customersByMonth) return [];

    return monthKeys.map((key) => ({
      month: monthLabelMap[key],
      customers: customersByMonth[key] ?? 0,
    }));
  }, [data]);

  let content;

  if (isLoading) {
    content = <DashboardChartSkeleton />;
  } else if (isError) {
    content = (
      <ManagementTableErrorContainer
        title="Unable to load customer overview"
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
                Total Customers
              </CardTitle>
              <p className="mt-1 text-sm text-[#6C757D]">
                See your customer per year.
              </p>
            </div>

            <div className="relative w-full sm:w-[140px]">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-11 w-full appearance-none rounded-xl border border-[#E6E6E8] bg-white px-4 pr-10 text-sm font-medium text-[#343A40] outline-none transition focus:border-[#16B5D8]"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6C757D]" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="h-[320px] w-full sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                barCategoryGap="22%"
              >
                <CartesianGrid vertical={false} stroke="#F1F3F5" />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  className="text-xs"
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  className="text-xs"
                  allowDecimals={false}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${value / 1000}k` : `${value}`
                  }
                />

                <Tooltip
                  cursor={{ fill: "rgba(22, 181, 216, 0.08)" }}
                  content={<CustomTooltip />}
                />

                <Bar
                  dataKey="customers"
                  fill="#16B5D8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={46}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <div className="px-4 pb-6 sm:px-6">{content}</div>;
}
