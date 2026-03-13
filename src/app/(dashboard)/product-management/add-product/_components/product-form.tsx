"use client";

import * as React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Loader2, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MAX_SUB_IMAGES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const acceptedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  weight: z.string().min(1, "Weight is required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, {
      message: "Price must be a valid number",
    }),
  offerPrice: z
    .string()
    .min(1, "Offer price is required")
    .refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, {
      message: "Offer price must be a valid number",
    }),
  stock: z
    .string()
    .min(1, "Stock is required")
    .refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, {
      message: "Stock must be a valid number",
    }),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  description: z.string().min(5, "Description is required"),
  sizesInput: z.string().min(1, "At least one size is required"),
});

type ProductFormValues = z.infer<typeof productSchema>;

type CreateProductResponse = {
  status: boolean;
  message: string;
  data?: {
    _id: string;
    name: string;
    weight: string;
    size: string[];
    price: number;
    offerPrice: number;
    stock: number;
    category: string;
    brand: string;
    description: string;
    image: string;
    subImages: string[];
    averageRating: number;
    reviewCount: number;
    createdAt: string;
    updatedAt: string;
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
    return "Each image must be under 5MB";
  }

  return null;
}

function parseSizes(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function UploadBox({
  title,
  description,
  onChange,
  multiple = false,
}: {
  title: string;
  description: string;
  onChange: (files: FileList | null) => void;
  multiple?: boolean;
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
        multiple={multiple}
        className="hidden"
        onChange={(e) => onChange(e.target.files)}
      />

      <div className="mt-4 rounded-md border bg-white px-4 py-2 text-sm text-sky-600 shadow-sm">
        Choose file
      </div>
    </label>
  );
}

export default function ProductForm() {
  const queryClient = useQueryClient();
const router = useRouter();
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;

  const [mainImage, setMainImage] = React.useState<PreviewFile | null>(null);
  const [subImages, setSubImages] = React.useState<PreviewFile[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      weight: "",
      price: "",
      offerPrice: "",
      stock: "",
      category: "",
      brand: "",
      description: "",
      sizesInput: "",
    },
  });

  const { mutate, isPending } = useMutation<
    CreateProductResponse,
    Error,
    ProductFormValues
  >({
    mutationKey: ["create-product"],
    mutationFn: async (values) => {
      if (!token) {
        throw new Error("Unauthorized. Please login again.");
      }

      if (!mainImage) {
        throw new Error("Main image is required");
      }

      const sizes = parseSizes(values.sizesInput);

      if (sizes.length === 0) {
        throw new Error("Please enter at least one size");
      }

      const formData = new FormData();

      formData.append("name", values.name);
      formData.append("weight", values.weight);
      formData.append("price", values.price);
      formData.append("offerPrice", values.offerPrice);
      formData.append("stock", values.stock);
      formData.append("category", values.category);
      formData.append("brand", values.brand);
      formData.append("description", values.description);
      formData.append("size", JSON.stringify(sizes));
      formData.append("image", mainImage.file);

      subImages.forEach((item) => {
        formData.append("subImages", item.file);
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/product`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data: CreateProductResponse = await res.json();

      if (!res.ok || !data.status) {
        throw new Error(data.message || "Failed to create product");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Product created successfully");

      form.reset();
      router.push("/product-management")

      if (mainImage) {
        URL.revokeObjectURL(mainImage.preview);
      }

      subImages.forEach((img) => URL.revokeObjectURL(img.preview));

      setMainImage(null);
      setSubImages([]);

      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast.error(error.message || "Create product failed");
    },
  });

  React.useEffect(() => {
    return () => {
      if (mainImage) {
        URL.revokeObjectURL(mainImage.preview);
      }

      subImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [mainImage, subImages]);

  const handleMainImageChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const error = validateImageFile(file);

    if (error) {
      toast.error(error);
      return;
    }

    if (mainImage) {
      URL.revokeObjectURL(mainImage.preview);
    }

    setMainImage({
      file,
      preview: URL.createObjectURL(file),
    });
  };

  const handleSubImagesChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    if (subImages.length + selectedFiles.length > MAX_SUB_IMAGES) {
      toast.error(`You can upload maximum ${MAX_SUB_IMAGES} sub images`);
      return;
    }

    const nextImages: PreviewFile[] = [];

    for (const file of selectedFiles) {
      const error = validateImageFile(file);

      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }

      nextImages.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setSubImages((prev) => [...prev, ...nextImages]);
  };

  const removeMainImage = () => {
    if (!mainImage) return;

    URL.revokeObjectURL(mainImage.preview);
    setMainImage(null);
  };

  const removeSubImage = (index: number) => {
    setSubImages((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = (values: ProductFormValues) => {
    mutate(values);
  };

  return (
    <div className="bg-white p-6 rounded-[8px] border border-[#E4E4E4]">
      <Link href="/product-management">
        <button className="bg-primary flex items-center gap-2 text-lg font-normal text-white h-[40px] rounded-[8px] leading-normal  px-5"><ArrowLeft /> Back</button>
      </Link>
      <h4 className="text-lg md:text-xl lg:text-2xl text-[#4C4C4C] leading-normal font-semibold py-5">Add New Product</h4>
       <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-[#1E1E1E] leading-normal">Product Name</FormLabel>
                      <FormControl>
                        <Input className="w-full h-[48px] text-base text-[#1E1E1E] leading-normal font-medium border border-[#CECECE] rounded-[8px] placeholder:text-[#CECECE]" placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-[#1E1E1E] leading-normal">Weight</FormLabel>
                      <FormControl>
                        <Input className="w-full h-[48px] text-base text-[#1E1E1E] leading-normal font-medium border border-[#CECECE] rounded-[8px] placeholder:text-[#CECECE]" placeholder="e.g. 1kg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-[#1E1E1E] leading-normal">Price</FormLabel>
                      <FormControl>
                        <Input className="w-full h-[48px] text-base text-[#1E1E1E] leading-normal font-medium border border-[#CECECE] rounded-[8px] placeholder:text-[#CECECE]" type="number" placeholder="e.g. 120" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="offerPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-[#1E1E1E] leading-normal">Offer Price</FormLabel>
                      <FormControl>
                        <Input className="w-full h-[48px] text-base text-[#1E1E1E] leading-normal font-medium border border-[#CECECE] rounded-[8px] placeholder:text-[#CECECE]" type="number" placeholder="e.g. 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-[#1E1E1E] leading-normal">Stock</FormLabel>
                      <FormControl>
                        <Input className="w-full h-[48px] text-base text-[#1E1E1E] leading-normal font-medium border border-[#CECECE] rounded-[8px] placeholder:text-[#CECECE]" type="number" placeholder="e.g. 50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sizesInput"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-[#1E1E1E] leading-normal">Sizes</FormLabel>
                      <FormControl>
                        <Input className="w-full h-[48px] text-base text-[#1E1E1E] leading-normal font-medium border border-[#CECECE] rounded-[8px] placeholder:text-[#CECECE]" placeholder="e.g. S, M, L" {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma separated sizes. Example: S, M, L
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-[#1E1E1E] leading-normal">Category ID</FormLabel>
                      <FormControl>
                        <Input className="w-full h-[48px] text-base text-[#1E1E1E] leading-normal font-medium border border-[#CECECE] rounded-[8px] placeholder:text-[#CECECE]" placeholder="Enter category id" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-[#1E1E1E] leading-normal">Brand ID</FormLabel>
                      <FormControl>
                        <Input className="w-full h-[48px] text-base text-[#1E1E1E] leading-normal font-medium border border-[#CECECE] rounded-[8px] placeholder:text-[#CECECE]" placeholder="Enter brand id" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium text-[#1E1E1E] leading-normal">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write product description"
                        className="w-full h-[148px] text-base text-[#1E1E1E] leading-normal font-medium border border-[#CECECE] rounded-[8px] placeholder:text-[#CECECE]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#1E1E1E] leading-normal pb-4">Main Image</h3>

                  {!mainImage ? (
                    <UploadBox
                      title="Upload main product image"
                      description="JPG, PNG, WEBP up to 5MB"
                      onChange={handleMainImageChange}
                    />
                  ) : (
                    <div className="relative overflow-hidden rounded-2xl border bg-white p-3">
                      <div className="relative h-[240px] w-full overflow-hidden rounded-xl bg-slate-100">
                        <Image
                          src={mainImage.preview}
                          alt="Main preview"
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <ImagePlus className="h-4 w-4" />
                          <span className="truncate">{mainImage.file.name}</span>
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeMainImage}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-medium text-[#1E1E1E] leading-normal">Sub Images</h3>
                    <p className="text-sm text-slate-500">
                      {subImages.length}/{MAX_SUB_IMAGES} selected
                    </p>
                  </div>

                  {subImages.length < MAX_SUB_IMAGES && (
                    <div className="mb-4">
                      <UploadBox
                        title="Upload sub images"
                        description={`You can add up to ${MAX_SUB_IMAGES} images`}
                        onChange={handleSubImagesChange}
                        multiple
                      />
                    </div>
                  )}

                  {subImages.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {subImages.map((img, index) => (
                        <div
                          key={`${img.file.name}-${index}`}
                          className="overflow-hidden rounded-2xl border bg-white p-2"
                        >
                          <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-100">
                            <Image
                              src={img.preview}
                              alt={`Sub preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeSubImage(index)}
                              className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white transition hover:bg-black"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <p className="mt-2 truncate text-sm text-slate-600">
                            {img.file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center items-center pb-20">
                <Button type="submit" disabled={isPending} className="text-lg font-normal text-white h-[44px] rounded-[8px] leading-normal  px-14">
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