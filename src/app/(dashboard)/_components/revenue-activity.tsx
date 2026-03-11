"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { CircleAlert, ChevronDown } from "lucide-react";
// import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import TableSkeletonWrapper from "@/components/shared/TableSkeletonWrapper/TableSkeletonWrapper";
import ErrorContainer from "@/components/shared/ErrorContainer/ErrorContainer";
import NotFound from "@/components/shared/NotFound/NotFound";
import type { MonthlyRevenueChartApiResponse } from "./revenue-activity-data-type";

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

const dummyRevenueData: RevenueItem[] = [
  { month: "Feb", revenue: 12000 },
  { month: "Mar", revenue: 14500 },
  { month: "Apr", revenue: 11800 },
  { month: "May", revenue: 18200 },
  { month: "Jun", revenue: 16800 },
  { month: "Jul", revenue: 20500 },
  { month: "Aug", revenue: 19100 },
  { month: "Sep", revenue: 17600 },
  { month: "Oct", revenue: 24800 },
  { month: "Nov", revenue: 23600 },
  { month: "Dec", revenue: 26500 },
  { month: "Jan", revenue: 28600 },
];

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => currentYear - index);
};

export function RevenueActivity() {
  // const { data: session } = useSession();
  // const token = (session?.user as { accessToken?: string })?.accessToken;

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const yearOptions = generateYearOptions();

  const {
    data: apiData,
    isLoading,
    isError,
    error,
  } = useQuery<MonthlyRevenueChartApiResponse>({
    queryKey: ["revenue-activity", selectedYear],
    queryFn: async () => {
      // =========================
      // API integration for later
      // =========================
      // const res = await fetch(
      //   `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard/monthly-revenue-chart?year=${selectedYear}`,
      //   {
      //     method: "GET",
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   }
      // );
      //
      // if (!res.ok) {
      //   throw new Error("Failed to fetch revenue activity data");
      // }
      //
      // return res.json();

      // Using dummy data for now
      return {
        success: true,
        message: "Dummy revenue data fetched successfully",
        data: dummyRevenueData,
      } as MonthlyRevenueChartApiResponse;
    },
    enabled: true, // later you can change it to: !!token
  });

  const chartData = useMemo(() => {
    if (apiData?.data?.length) return apiData.data;
    return [];
  }, [apiData]);

  let content;

  if (isLoading) {
    content = (
      <div className="pt-4">
        <TableSkeletonWrapper count={3} />
      </div>
    );
  } else if (isError) {
    content = (
      <ErrorContainer
        message={(error as Error)?.message || "Something went wrong"}
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
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-[#343A40]">
                Revenue Overview
                <CircleAlert className="h-4 w-4 text-[#6C757D]" />
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
                    {year}-{String(year + 1).slice(-2)}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#616161]" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <ChartContainer config={chartConfig} className="h-[320px] w-full sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#09B5FF" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#09B5FF" stopOpacity={0.05} />
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
                  tickFormatter={(value) => `$${Number(value) / 1000}k`}
                />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
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





// "use client";

// import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   ChartConfig,
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/chart";
// import { CircleAlert, Calendar } from "lucide-react";

// import { useSession } from "next-auth/react";
// import { useQuery } from "@tanstack/react-query";
// import { useState } from "react";
// import { MonthlyRevenueChartApiResponse } from "./revenue-activity-data-type";
// import TableSkeletonWrapper from "@/components/shared/TableSkeletonWrapper/TableSkeletonWrapper";
// import ErrorContainer from "@/components/shared/ErrorContainer/ErrorContainer";
// import NotFound from "@/components/shared/NotFound/NotFound";

// export const description = "A simple area chart";


// // #10e607 old color 
// const chartConfig = {
//   desktop: {
//     label: "Desktop",
//     color: "#10e607", // stroke color
//   },
// } satisfies ChartConfig;

//   const generateYearOptions = () => {
//   const currentYear = new Date().getFullYear()
//   const years = []
//   for (let i = 0; i < 5; i++) {
//     years.push(currentYear - i)
//   }
//   return years
// }

// export function RevenueActivity() {

//     const session = useSession();
//   const token = (session?.data?.user as { accessToken: string })?.accessToken;

//     const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
//   const yearOptions = generateYearOptions()



//   const {data, isLoading, isError, error} = useQuery<MonthlyRevenueChartApiResponse>({
//     queryKey: ["revenue-activity", selectedYear],
//     queryFn: async () =>{
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard/monthly-revenue-chart?year=${selectedYear}`,{
//         method: "GET",
//         headers: {
//           Authorization : `Bearer ${token}`
//         }
//       });
//       return res.json();
//     },
//     enabled: !!token
//   })

//     let content;

//   if (isLoading) {
//     content = (
//       <div className="pt-4">
//         <TableSkeletonWrapper count={3} />
//       </div>
//     );
//   } else if (isError) {
//     content = (
//       <div>
//         <ErrorContainer message={error?.message || "Something went wrong"} />
//       </div>
//     );
//   } else if (
//     data &&
//     data?.data &&
//     data?.data?.length === 0
//   ) {
//     content = (
//       <div>
//         <NotFound message="Oops! No data available. Modify your filters or check your internet connection." />
//       </div>
//     );
//   } else if (
//     data &&
//     data?.data &&
//     data?.data?.length > 0
//   ) {
//     content = (
//       <div>
//             <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between">
//           <CardTitle className="flex items-center gap-2 text-xl font-semibold leading-[150%] text-[#343A40] font-hexco">
//             Revenue Activity <CircleAlert />
//           </CardTitle>
//           {/* Year Filter Dropdown */}
//              <div className="relative">
//                <select
//                  value={selectedYear}
//                  onChange={e => setSelectedYear(Number(e.target.value))}
//                  className="appearance-none bg-white border border-[#E6E6E8] rounded-lg px-4 py-2 pr-10 text-sm font-medium text-[#343A40] cursor-pointer hover:border-[#DF1020] focus:outline-none focus:ring-2 focus:ring-[#DF1020] focus:ring-opacity-20 transition-all"
//                >
//                  {yearOptions.map(year => (
//                    <option key={year} value={year}>
//                      {year}
//                   </option>
//                  ))}
//                </select>
//                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#616161] pointer-events-none" />
//              </div>
//              </div>
//         </CardHeader>

//         <CardContent>
//           <ChartContainer config={chartConfig} className="w-full max-h-[373px]">
//             <AreaChart accessibilityLayer data={data?.data} className="w-full">
              
//               {/* --- Gradient Definition --- */}
//               <defs>
//                 <linearGradient
//                   id="desktopGradient"
//                   x1="0"
//                   y1="0"
//                   x2="0"
//                   y2="1"
//                 >
//                   <stop offset="0%" stopColor="rgba(7,146,1,0.20)" />
//                   <stop offset="141%" stopColor="rgba(255,255,255,0)" />
//                 </linearGradient>
//               </defs>

//               <CartesianGrid vertical={false} />

//               <XAxis
//                 dataKey="month"
//                 tickLine={false}
//                 axisLine={false}
//                 tickMargin={8}
//                 tickFormatter={(value) => value.slice(0, 3)}
//               />

//               <YAxis stroke="#999" />

//               <ChartTooltip
//                 cursor={false}
//                 content={<ChartTooltipContent indicator="line" />}
//               />

//               <Area
//                 dataKey="revenue"
//                 type="monotone"
//                 stroke="#10e607"
//                 strokeWidth={2}
//                 fill="url(#desktopGradient)" // Gradient applied here
//               />
//             </AreaChart>
//           </ChartContainer>
//         </CardContent>
//       </Card>
//       </div>
//     );
//   }
//   return (
//     <div className="px-6 pb-6">
//      {content}
//     </div>
//   );
// }


