"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  RefreshCcw,
  Trash2,
  UploadCloud,
} from "lucide-react";
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

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const acceptedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

type SingleCategoryApiResponse = {
  status: boolean;
  message: string;
  data: {
    _id: string;
    name: string;
    image: string;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
  };
};

type UpdateCategoryResponse = {
  status: boolean;
  message: string;
  data?: {
    _id: string;
    name: string;
    image: string;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
  };
};

type PreviewFile = {
  file: File;
  preview: string;
};

function validateImageFile(file: File) {
  if (!acceptedImageTypes.includes(file.type)) {
    return "Only JPG, JPEG, PNG, and WEBP files are allowed";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Image must be under 5MB";
  }

  return null;
}

function UploadBox({
  title,
  description,
  onChange,
}: {
  title: string;
  description: string;
  onChange: (files: FileList | null) => void;
}) {
  const inputId = React.useId();

  return (
    <label
      htmlFor={inputId}
      className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:bg-slate-100"
    >
      <UploadCloud className="mb-3 h-9 w-9 text-slate-500" />
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files)}
      />

      <div className="mt-4 rounded-md border bg-white px-4 py-2 text-sm text-sky-600 shadow-sm">
        Choose file
      </div>
    </label>
  );
}

export default function EditCategoryForm({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;

  const [newImage, setNewImage] = React.useState<PreviewFile | null>(null);
  const [existingImage, setExistingImage] = React.useState<string>("");

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
    },
  });

  const {
    data: categoryData,
    isLoading,
    isError,
    refetch,
  } = useQuery<SingleCategoryApiResponse>({
    queryKey: ["single-category", id],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/${id}`,
        {
          method: "GET",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
          cache: "no-store",
        }
      );

      const data: SingleCategoryApiResponse = await res.json();

      if (!res.ok || !data.status) {
        throw new Error(data.message || "Failed to fetch category");
      }

      return data;
    },
    enabled: !!id,
  });

  React.useEffect(() => {
    if (!categoryData?.data) return;

    const category = categoryData.data;

    form.reset({
      name: category.name || "",
    });

    setExistingImage(category.image || "");
  }, [categoryData, form]);

  const { mutate, isPending } = useMutation<
    UpdateCategoryResponse,
    Error,
    CategoryFormValues
  >({
    mutationKey: ["update-category", id],
    mutationFn: async (values) => {
      if (!token) {
        throw new Error("Unauthorized. Please login again.");
      }

      const formData = new FormData();
      formData.append("name", values.name);

      if (newImage) {
        formData.append("image", newImage.file);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data: UpdateCategoryResponse = await res.json();

      if (!res.ok || !data.status) {
        throw new Error(data.message || "Failed to update category");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Category updated successfully");

      if (newImage) {
        URL.revokeObjectURL(newImage.preview);
      }

      setNewImage(null);

      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      await queryClient.invalidateQueries({ queryKey: ["single-category", id] });
    },
    onError: (error) => {
      toast.error(error.message || "Update category failed");
    },
  });

  React.useEffect(() => {
    return () => {
      if (newImage) {
        URL.revokeObjectURL(newImage.preview);
      }
    };
  }, [newImage]);

  const handleImageChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const error = validateImageFile(file);

    if (error) {
      toast.error(error);
      return;
    }

    if (newImage) {
      URL.revokeObjectURL(newImage.preview);
    }

    setNewImage({
      file,
      preview: URL.createObjectURL(file),
    });
  };

  const removeNewImage = () => {
    if (!newImage) return;

    URL.revokeObjectURL(newImage.preview);
    setNewImage(null);
  };

  const onSubmit = (values: CategoryFormValues) => {
    mutate(values);
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading category...</span>
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
            <p className="text-sm text-red-500">Failed to load category data.</p>
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
      <Link href="/category-management">
        <button className="bg-primary flex h-[40px] items-center gap-2 rounded-[8px] px-5 text-lg font-normal leading-normal text-white">
          <ArrowLeft /> Back
        </button>
      </Link>

      <h4 className="py-5 text-lg font-semibold leading-normal text-[#4C4C4C] md:text-xl lg:text-2xl">
        Edit Category
      </h4>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium text-[#1E1E1E] leading-normal">
                  Category Name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter category name"
                    className="h-[48px] w-full rounded-[8px] border border-[#CECECE] text-base font-medium leading-normal text-[#1E1E1E] placeholder:text-[#CECECE]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-6">
            <div>
              <h3 className="pb-3 text-lg font-medium text-[#1E1E1E] leading-normal">
                Category Image
              </h3>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border bg-white p-3">
                  <p className="mb-3 text-lg font-medium text-[#1E1E1E] leading-normal">
                    Current Image
                  </p>

                  {existingImage ? (
                    <div className="relative h-[240px] w-full overflow-hidden rounded-xl bg-slate-100">
                      <Image
                        src={existingImage}
                        alt="Current category image"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-[240px] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
                      No image found
                    </div>
                  )}
                </div>

                <div>
                  {!newImage ? (
                    <UploadBox
                      title="Replace category image"
                      description="JPG, PNG, WEBP up to 5MB"
                      onChange={handleImageChange}
                    />
                  ) : (
                    <div className="rounded-2xl border bg-white p-3">
                      <p className="mb-3 text-sm font-medium text-slate-700">
                        New Selected Image
                      </p>

                      <div className="relative h-[240px] w-full overflow-hidden rounded-xl bg-slate-100">
                        <Image
                          src={newImage.preview}
                          alt="New category preview"
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <ImagePlus className="h-4 w-4" />
                          <span className="truncate">{newImage.file.name}</span>
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeNewImage}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                "Update Category"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}