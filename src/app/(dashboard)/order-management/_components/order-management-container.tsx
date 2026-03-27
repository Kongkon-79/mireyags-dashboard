"use client";

import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import MireyagsPagination from "@/components/ui/mireyags-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Eye } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import noUser from "../../../../../public/assets/images/no-user.jpeg";
import { Order, OrdersApiResponse } from "./order-management-data-type";
import OrderManagementView from "./order-management-view";
import OrderManagementTableSkeleton from "./order-management-table-skeleton";
import ManagementTableErrorContainer from "@/components/shared/ManagementTableErrorContainer/ManagementTableErrorContainer";

const ORDER_STATUS_OPTIONS = [
  "placed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrderManagementContainer() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectViewOrder, setSelectViewOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const { data, isLoading, isError, error, refetch } = useQuery<OrdersApiResponse>({
    queryKey: ["all-orders", debouncedSearch, selectedStatus, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "6",
      });

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      if (selectedStatus !== "all") {
        params.append("orderStatus", selectedStatus);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/order?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("We couldn't load the orders right now. Please try again.");
      }

      return res.json();
    },
    enabled: !!token,
  });

  const orders = data?.data?.data;



  // order status

  const { mutate: updateOrderStatus } = useMutation({
    mutationKey: ["update-order-status"],
    mutationFn: async ({
      id,
      orderStatus,
    }: {
      id: string;
      orderStatus: string;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/order/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderStatus }),
        },
      );

      return res.json();
    },
    onMutate: async ({
      id,
      orderStatus,
    }: {
      id: string;
      orderStatus: string;
    }) => {
      await queryClient.cancelQueries({ queryKey: ["all-orders"] });

      const previousOrders = queryClient.getQueriesData<OrdersApiResponse>({
        queryKey: ["all-orders"],
      });

      queryClient.setQueriesData<OrdersApiResponse>(
        { queryKey: ["all-orders"] },
        (oldData) => {
          if (!oldData?.data?.data) return oldData;

          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: oldData.data.data.map((order) =>
                order._id === id ? { ...order, orderStatus } : order,
              ),
            },
          };
        },
      );

      if (selectedOrder?._id === id) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, orderStatus } : prev,
        );
      }

      return { previousOrders };
    },
    onSuccess: (
      data,
      variables,
      context?: {
        previousOrders?: [readonly unknown[], OrdersApiResponse | undefined][];
      },
    ) => {
      if (!data?.status) {
        context?.previousOrders?.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });

        const previousOrder = context?.previousOrders
          ?.flatMap(([, previousData]) => previousData?.data?.data ?? [])
          ?.find((order) => order._id === variables.id);

        if (previousOrder) {
          setSelectedOrder(previousOrder);
        }

        toast.error(data?.message || "Failed to update order status");
        return;
      }

      toast.success(data?.message || "Order status updated");
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
    },
    onError: (
      _error,
      _variables,
      context?: {
        previousOrders?: [readonly unknown[], OrdersApiResponse | undefined][];
      },
    ) => {
      context?.previousOrders?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });

      toast.error("Failed to update order status");
    },
    onSettled: () => {
      setUpdatingOrderId(null);
    },
  });

  console.log(data?.data);
  console.log(isLoading, isError, error);

  let tableContent;

  if (isLoading) {
    tableContent = <OrderManagementTableSkeleton />;
  } else if (isError) {
    tableContent = (
      <ManagementTableErrorContainer
        title="Unable to load orders"
        message={(error as Error)?.message || "Something went wrong"}
        onRetry={() => refetch()}
      />
    );
  } else {
    tableContent = (
      <>
        <table className="min-w-full">
          <thead className="border-b bg-[#F8F9FA]">
            <tr>
              <th className="px-4 py-4 text-left text-base font-semibold text-[#3B3B3B] leading-normal">
                Products
              </th>
              <th className="px-4 py-4 text-left text-base font-semibold text-[#3B3B3B] leading-normal">
                Customers
              </th>
              <th className="px-4 py-4 text-center text-base font-semibold text-[#3B3B3B] leading-normal">
                Payment
              </th>
              <th className="px-4 py-4 text-center text-base font-semibold text-[#3B3B3B] leading-normal">
                Amount
              </th>
              <th className="px-4 py-4 text-center text-base font-semibold text-[#3B3B3B] leading-normal">
                Status
              </th>
              <th className="px-4 py-4 text-right text-base font-semibold text-[#3B3B3B] leading-normal">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {orders?.map((order) => (
              <tr
                key={order._id}
                className="border-b last:border-b-0 hover:bg-[#FCFCFD]"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {order?.items?.map((info) => {
                      return (
                        <div
                          key={info?.productId}
                          className="flex items-center gap-3"
                        >
                          <div className="relative h-12 w-12">
                            <Image
                              src={info?.image}
                              alt={info?.name}
                              fill
                              className="object-cover rounded-[8px]"
                            />
                          </div>

                          <h4 className="text-sm font-medium text-[#242424] leading-normal capitalize">
                            {info?.name}
                          </h4>
                        </div>
                      );
                    })}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={order?.userId?.profileImage || noUser}
                      alt={order?.userId?.name}
                      width={200}
                      height={200}
                      className="w-12 h-12 object-cover rounded-[8px]"
                    />
                    <div>
                      <h4 className="text-sm text-left font-medium text-[#242424] leading-normal capitalize">
                        {order?.userId?.name}
                      </h4>
                      <p className="text-sm text-left font-normal text-[#525252] leading-normal">
                        {order?.userId?.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 text-sm text-center font-medium text-[#242424] leading-normal capitalize">
                  {order?.payment?.method}
                </td>

                <td className="px-4 py-4 text-sm text-center font-medium text-[#242424] leading-normal capitalize">
                  $ {order?.totalAmount}
                </td>
                <td className="px-4 py-4 text-center">
                  <Select
                    value={order?.orderStatus}
                    onValueChange={(value) => {
                      if (value === order?.orderStatus) return;

                      setUpdatingOrderId(order._id);
                      updateOrderStatus({
                        id: order._id,
                        orderStatus: value,
                      });
                    }}
                    disabled={updatingOrderId === order._id}
                  >
                    <SelectTrigger className="mx-auto h-9 w-[120px] border border-[#D0D5DD] bg-white rounded-[12px] text-sm font-medium capitalize">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {ORDER_STATUS_OPTIONS?.map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                          className="capitalize"
                        >
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-4">
                    <button
                      className="text-[#12B5D3]"
                      onClick={() => {
                        setSelectViewOrder(true);
                        setSelectedOrder(order);
                      }}
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!orders?.length && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-[#6C757D]"
                >
                  No Customer found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {data &&
          data?.data &&
          data?.data?.pagination &&
          data?.data?.pagination?.totalPages > 1 && (
            <div className="w-full flex items-center justify-between py-2">
              <p className="text-base font-normal text-[#68706A] leading-[150%]">
                Showing {currentPage} to 6 of{" "}
                {data?.data?.pagination?.totalData} results
              </p>
              <div>
                <MireyagsPagination
                  currentPage={currentPage}
                  totalPages={data?.data?.pagination?.totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            </div>
          )}
      </>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-[8px] border border-[#E4E4E4] p-6">
        <div className="flex items-center justify-between pb-5">
          <h4 className="text-lg md:text-xl lg:text-2xl font-semibold text-[#252471] leading-normal">
            Orders
          </h4>
          <div className="flex items-center gap-3">
            {/* search  */}
            <div>
              <Input
                type="search"
                className="w-full  md:w-[297px] h-[44px] px-3 rounded-[8px] bg-transparent placeholder:text-[#929292] border border-[#969B9C]"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search"
              />
            </div>
            <div>
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-[44px] w-[120px] rounded-[8px] border border-[#969B9C] bg-white text-sm text-[#525252]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All</SelectItem>
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="capitalize"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {tableContent}

          {/* Product view modal  */}
          <div>
            {selectViewOrder && (
              <OrderManagementView
                open={selectViewOrder}
                onOpenChange={(open: boolean) => setSelectViewOrder(open)}
                orderData={selectedOrder}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
