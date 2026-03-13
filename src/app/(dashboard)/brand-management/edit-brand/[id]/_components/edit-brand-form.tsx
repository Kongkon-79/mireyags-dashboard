"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const brandSchema = z.object({
  name: z.string().min(2, "Brand name is required"),
});

type BrandFormValues = z.infer<typeof brandSchema>;

type SingleBrandApiResponse = {
  status: boolean;
  message: string;
  data: {
    _id: string;
    name: string;
    slug?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
  };
};

type UpdateBrandResponse = {
  status: boolean;
  message: string;
  data?: {
    _id: string;
    name: string;
    slug?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
  };
};

export default function EditBrandForm({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;

  const router = useRouter();

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
    },
  });

  const {
    data: brandData,
    isLoading,
    isError,
    refetch,
  } = useQuery<SingleBrandApiResponse>({
    queryKey: ["single-brand", id],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/brands/${id}`, {
        method: "GET",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
        cache: "no-store",
      });

      const data: SingleBrandApiResponse = await res.json();

      if (!res.ok || !data.status) {
        throw new Error(data.message || "Failed to fetch brand");
      }

      return data;
    },
    enabled: !!id,
  });

  React.useEffect(() => {
    if (!brandData?.data) return;

    const brand = brandData.data;

    form.reset({
      name: brand.name || "",
    });
  }, [brandData, form]);

  const { mutate, isPending } = useMutation<
    UpdateBrandResponse,
    Error,
    BrandFormValues
  >({
    mutationKey: ["update-brand", id],
    mutationFn: async (values) => {
      if (!token) {
        throw new Error("Unauthorized. Please login again.");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/brands/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: values.name,
        }),
      });

      const data: UpdateBrandResponse = await res.json();

      if (!res.ok || !data.status) {
        throw new Error(data.message || "Failed to update brand");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Brand updated successfully");

      await queryClient.invalidateQueries({ queryKey: ["all-brands"] });
      await queryClient.invalidateQueries({ queryKey: ["single-brand", id] });

      router.push("/brand-management")
    },
    onError: (error) => {
      toast.error(error.message || "Update brand failed");
    },
  });

  const onSubmit = (values: BrandFormValues) => {
    mutate(values);
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading brand...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-4">
            <p className="text-sm text-red-500">Failed to load brand data.</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="rounded-[8px] border border-[#E4E4E4] bg-white p-6">
      <Link href="/brand-management">
        <button
          type="button"
          className="bg-primary flex h-[40px] items-center gap-2 rounded-[8px] px-5 text-lg font-normal leading-normal text-white"
        >
          <ArrowLeft /> Back
        </button>
      </Link>

      <h4 className="py-5 text-lg font-semibold leading-normal text-[#4C4C4C] md:text-xl lg:text-2xl">
        Edit Brand
      </h4>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium text-[#1E1E1E] leading-normal">
                  Brand Name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter brand name"
                    className="h-[48px] w-full rounded-[8px] border border-[#CECECE] text-base font-medium leading-normal text-[#1E1E1E] placeholder:text-[#CECECE]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-center pb-20">
            <Button
              type="submit"
              disabled={isPending}
              className="h-[44px] rounded-[8px] px-14 text-lg font-normal leading-normal text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Brand"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}