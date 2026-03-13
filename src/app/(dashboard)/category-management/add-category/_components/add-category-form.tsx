"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
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
import { useRouter } from "next/navigation";

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

type CreateCategoryResponse = {
  status: boolean;
  message: string;
  data?: {
    _id: string;
    name: string;
    image: string;
    createdAt: string;
    updatedAt: string;
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
      className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-[#CECECE] bg-[#FAFAFA] p-6 text-center transition hover:bg-slate-50"
    >
      <UploadCloud className="mb-3 h-10 w-10 text-slate-500" />
      <p className="text-base font-medium text-[#1E1E1E]">{title}</p>
      <p className="mt-1 text-sm text-[#6B7280]">{description}</p>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files)}
      />

      <div className="mt-4 rounded-[8px] border border-[#CECECE] bg-white px-5 py-2 text-sm font-medium text-sky-600 shadow-sm">
        Choose file
      </div>
    </label>
  );
}

export default function AddCategoryForm() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;
  const router = useRouter();

  const [image, setImage] = React.useState<PreviewFile | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
    },
  });

  const { mutate, isPending } = useMutation<
    CreateCategoryResponse,
    Error,
    CategoryFormValues
  >({
    mutationKey: ["create-category"],
    mutationFn: async (values) => {
      if (!token) {
        throw new Error("Unauthorized. Please login again.");
      }

      if (!image) {
        throw new Error("Category image is required");
      }

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("image", image.file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/category`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data: CreateCategoryResponse = await res.json();

      if (!res.ok || !data.status) {
        throw new Error(data.message || "Failed to create category");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Category created successfully");

      form.reset();
      router.push("/category-management")

      if (image) {
        URL.revokeObjectURL(image.preview);
      }

      setImage(null);

      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      toast.error(error.message || "Create category failed");
    },
  });

  React.useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
    };
  }, [image]);

  const handleImageChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const error = validateImageFile(file);

    if (error) {
      toast.error(error);
      return;
    }

    if (image) {
      URL.revokeObjectURL(image.preview);
    }

    setImage({
      file,
      preview: URL.createObjectURL(file),
    });
  };

  const removeImage = () => {
    if (!image) return;

    URL.revokeObjectURL(image.preview);
    setImage(null);
  };

  const onSubmit = (values: CategoryFormValues) => {
    mutate(values);
  };

  return (
    <div className="rounded-[8px] border border-[#E4E4E4] bg-white p-6">
      <Link href="/category-management">
        <button className="bg-primary flex h-[40px] items-center gap-2 rounded-[8px] px-5 text-lg font-normal leading-normal text-white">
          <ArrowLeft />
          Back
        </button>
      </Link>

      <h4 className="py-5 text-lg font-semibold leading-normal text-[#4C4C4C] md:text-xl lg:text-2xl">
        Add New Category
      </h4>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium leading-normal text-[#1E1E1E]">
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

          <div>
            <h3 className="pb-4 text-lg font-medium leading-normal text-[#1E1E1E]">
              Category Image
            </h3>

            {!image ? (
              <UploadBox
                title="Upload category image"
                description="JPG, PNG, WEBP up to 5MB"
                onChange={handleImageChange}
              />
            ) : (
              <div className="relative overflow-hidden rounded-2xl border bg-white p-3">
                <div className="relative h-[280px] w-full overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src={image.preview}
                    alt="Category preview"
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <ImagePlus className="h-4 w-4" />
                    <span className="truncate">{image.file.name}</span>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
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
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}