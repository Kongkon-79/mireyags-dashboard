"use client";

import * as React from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ImagePlus,
  Loader2,
  Trash2,
  UploadCloud,
  X,
  RefreshCcw,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

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
import { Card, CardContent } from "@/components/ui/card";
import { SingleProductApiResponse } from "./single-product-data-type";
import Link from "next/link";

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

type UpdateProductResponse = {
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
    updatedAt?: string;
  };
};

type PreviewFile = {
  file: File;
  preview: string;
};

type ExistingImage = {
  url: string;
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

function getIdValue(
  value: string | { _id: string; name?: string } | undefined,
) {
  if (!value) return "";
  return typeof value === "string" ? value : value._id;
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

export default function EditProductForm({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;

  const [mainImage, setMainImage] = React.useState<PreviewFile | null>(null);
  const [existingMainImage, setExistingMainImage] = React.useState<string>("");

  const [newSubImages, setNewSubImages] = React.useState<PreviewFile[]>([]);
  const [existingSubImages, setExistingSubImages] = React.useState<
    ExistingImage[]
  >([]);

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

  // get product

  const {
    data: productData,
    isLoading,
    isError,
    refetch,
  } = useQuery<SingleProductApiResponse>({
    queryKey: ["single-product", id],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/product/${id}`,
      );

      return res.json();
    },
    enabled: !!id,
  });

  console.log(productData);

  React.useEffect(() => {
    if (!productData?.data?.product) return;

    const product = productData?.data?.product;

    form.reset({
      name: product.name || "",
      weight: product.weight || "",
      price: String(product.price ?? ""),
      offerPrice: String(product.offerPrice ?? ""),
      stock: String(product.stock ?? ""),
      category: getIdValue(product.category),
      brand: getIdValue(product.brand),
      description: product.description || "",
      sizesInput: Array.isArray(product.size) ? product.size.join(", ") : "",
    });

    setExistingMainImage(product.image || "");
    setExistingSubImages(
      Array.isArray(product.subImages)
        ? product.subImages.map((url) => ({ url }))
        : [],
    );
  }, [productData, form]);

  const { mutate, isPending } = useMutation<
    UpdateProductResponse,
    Error,
    ProductFormValues
  >({
    mutationKey: ["update-product", id],
    mutationFn: async (values) => {
      if (!token) {
        throw new Error("Unauthorized. Please login again.");
      }

      const sizes = parseSizes(values.sizesInput);

      if (sizes.length === 0) {
        throw new Error("Please enter at least one size");
      }

      const totalSubImages = existingSubImages.length + newSubImages.length;
      if (totalSubImages > MAX_SUB_IMAGES) {
        throw new Error(`Maximum ${MAX_SUB_IMAGES} sub images are allowed`);
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

      if (mainImage) {
        formData.append("image", mainImage.file);
      }

      newSubImages.forEach((item) => {
        formData.append("subImages", item.file);
      });

      formData.append(
        "subImages",
        JSON.stringify(existingSubImages.map((item) => item.url)),
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/product/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data: UpdateProductResponse = await res.json();

      if (!res.ok || !data.status) {
        throw new Error(data.message || "Failed to update product");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Product updated successfully");

      if (mainImage) {
        URL.revokeObjectURL(mainImage.preview);
      }

      newSubImages.forEach((img) => URL.revokeObjectURL(img.preview));

      setMainImage(null);
      setNewSubImages([]);

      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({
        queryKey: ["product-details", id],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Update failed");
    },
  });

  React.useEffect(() => {
    return () => {
      if (mainImage) {
        URL.revokeObjectURL(mainImage.preview);
      }

      newSubImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [mainImage, newSubImages]);

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

    const currentTotal = existingSubImages.length + newSubImages.length;
    if (currentTotal + selectedFiles.length > MAX_SUB_IMAGES) {
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

    setNewSubImages((prev) => [...prev, ...nextImages]);
  };

  const removeMainImageSelection = () => {
    if (!mainImage) return;
    URL.revokeObjectURL(mainImage.preview);
    setMainImage(null);
  };

  const removeExistingSubImage = (index: number) => {
    setExistingSubImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewSubImage = (index: number) => {
    setNewSubImages((prev) => {
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

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading product...</span>
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
            <p className="text-sm text-red-500">Failed to load product data.</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSelectedSubImages = existingSubImages.length + newSubImages.length;

  return (
    <div className="bg-white p-6 rounded-[8px] border border-[#E4E4E4]">
      <Link href="/product-management">
        <button className="bg-primary flex items-center gap-2 text-lg font-normal text-white h-[40px] rounded-[8px] leading-normal  px-5">
          <ArrowLeft /> Back
        </button>
      </Link>
      <h4 className="text-lg md:text-xl lg:text-2xl text-[#4C4C4C] leading-normal font-semibold py-5">
        Edit Product
      </h4>
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
                    className="w-full h-[120px] text-base text-[#1E1E1E] leading-normal font-medium border border-[#CECECE] rounded-[8px] placeholder:text-[#CECECE]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[#1E1E1E] leading-normal pb-3">Main Image</h3>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border bg-white p-3">
                  <p className="text-lg font-medium text-[#1E1E1E] leading-normal mb-3">
                    Current Image
                  </p>

                  {existingMainImage ? (
                    <div className="relative h-[240px] w-full overflow-hidden rounded-xl bg-slate-100">
                      <Image
                        src={existingMainImage}
                        alt="Current main image"
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
                  {!mainImage ? (
                    <UploadBox
                      title="Replace main product image"
                      description="JPG, PNG, WEBP up to 5MB"
                      onChange={handleMainImageChange}
                    />
                  ) : (
                    <div className="rounded-2xl border bg-white p-3">
                      <p className="mb-3 text-sm font-medium text-slate-700">
                        New Selected Image
                      </p>

                      <div className="relative h-[240px] w-full overflow-hidden rounded-xl bg-slate-100">
                        <Image
                          src={mainImage.preview}
                          alt="New main preview"
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <ImagePlus className="h-4 w-4" />
                          <span className="truncate">
                            {mainImage.file.name}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeMainImageSelection}
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

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-medium text-[#1E1E1E] leading-normal">Sub Images</h3>
                <p className="text-sm text-slate-500">
                  {totalSelectedSubImages}/{MAX_SUB_IMAGES} selected
                </p>
              </div>

              {totalSelectedSubImages < MAX_SUB_IMAGES && (
                <div className="mb-4">
                  <UploadBox
                    title="Upload more sub images"
                    description={`You can keep up to ${MAX_SUB_IMAGES} total images`}
                    onChange={handleSubImagesChange}
                    multiple
                  />
                </div>
              )}

              {existingSubImages.length > 0 && (
                <div className="mb-6">
                  <p className="text-lg font-medium text-[#1E1E1E] leading-normal mb-3">
                    Current Sub Images
                  </p>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {existingSubImages.map((img, index) => (
                      <div
                        key={`${img.url}-${index}`}
                        className="overflow-hidden rounded-2xl border bg-white p-2"
                      >
                        <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-100">
                          <Image
                            src={img.url}
                            alt={`Existing sub image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingSubImage(index)}
                            className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white transition hover:bg-black"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newSubImages.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-medium text-slate-700">
                    New Sub Images
                  </p>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {newSubImages.map((img, index) => (
                      <div
                        key={`${img.file.name}-${index}`}
                        className="overflow-hidden rounded-2xl border bg-white p-2"
                      >
                        <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-100">
                          <Image
                            src={img.preview}
                            alt={`New sub image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewSubImage(index)}
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
                </div>
              )}
            </div>
          </div>

         <div className="flex justify-center items-center pb-20">
            <Button
              type="submit"
              disabled={isPending}
              className="text-lg font-normal text-white h-[44px] rounded-[8px] leading-normal  px-14"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Product"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
