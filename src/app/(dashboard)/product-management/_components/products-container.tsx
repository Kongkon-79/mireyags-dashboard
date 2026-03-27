"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Plus, SquarePen, Trash2 } from "lucide-react";

// import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductsListApiResponse } from "./products-data-type";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import MireyagsPagination from "@/components/ui/mireyags-pagination";
import DeleteModal from "@/components/modals/delete-modal";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Product } from "../edit-product/[id]/_components/single-product-data-type";
import SingleProductView from "./view-product";
import ProductsTableSkeleton from "./products-table-skeleton";
import ProductsErrorContainer from "./products-error-container";

export default function ProductContainer() {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
   const [selectViewProduct, setSelectViewProduct] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

    const { data: session } = useSession();
    const token = (session?.user as { accessToken?: string })?.accessToken;

  const [search, setSearch] = useState("");
   const debouncedSearch = useDebounce(search, 500);
  const { data, isLoading, isError, error, refetch } = useQuery<ProductsListApiResponse>(
    {
      queryKey: ["all-products", debouncedSearch, currentPage],
      queryFn: async () => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/product/get-all-products?page=${currentPage}&limit=6&search=${debouncedSearch}`,
        );

        if (!res.ok) {
          throw new Error("We couldn't load the products right now. Please try again.");
        }

        return res.json();
      },
    },
  );

  const products = data?.data?.data;
  // const totalPages = data?.meta
  //   ? Math.ceil(data.meta.total / data.meta.limit)
  //   : 0;



    // delete Product api
  const { mutate } = useMutation({
    mutationKey: ["delete-product"],
    mutationFn: async (id: string) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/product/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.json();
    },
    onSuccess: (data) => {
      if (!data?.success) {
        toast.error(data?.message || "Something went wrong");
        return;
      }
      toast.success(data?.message || "Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["all-products"] });
    },
  });

   const handleDelete = () => {
    if (selectedProductId) {
      mutate(selectedProductId);
    }
    setDeleteModalOpen(false);
  };

  console.log(data?.data);

  let tableContent;

  if (isLoading) {
    tableContent = <ProductsTableSkeleton />;
  } else if (isError) {
    tableContent = (
      <ProductsErrorContainer
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
              <th className="px-4 py-4 text-center text-base font-semibold text-[#3B3B3B] leading-normal">
                Categories
              </th>
              <th className="px-4 py-4 text-center text-base font-semibold text-[#3B3B3B] leading-normal">
                Price
              </th>
              <th className="px-4 py-4 text-center text-base font-semibold text-[#3B3B3B] leading-normal">
                Stock
              </th>
              <th className="px-4 py-4 text-right text-base font-semibold text-[#3B3B3B] leading-normal">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {products?.map((product) => (
              <tr
                key={product._id}
                className="border-b last:border-b-0 hover:bg-[#FCFCFD]"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-white">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover rounded-[4px]"
                      />
                    </div>
                    <p className="text-sm font-medium text-[#242424] leading-normal">
                      {product.name}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-4 text-sm text-center font-medium text-[#242424] leading-normal capitalize">
                  {product.category.name}
                </td>

                <td className="px-4 py-4 text-sm text-center font-medium text-[#242424] leading-normal">
                  ${product.price}
                </td>

                <td className="px-4 py-4 text-sm font-medium text-[#242424] leading-normal text-center">
                  {product.stock}
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/product-management/edit-product/${product._id}`}
                      className="text-[#1E1E1E] transition hover:text-[#12B5D3]"
                    >
                      <SquarePen className="h-6 w-6 text-primary" />
                    </Link>

                    <button
                      onClick={() => {
                        setSelectViewProduct(true);
                        setSelectedProduct(product);
                      }}
                      type="button"
                      className="text-[#1E1E1E] transition hover:text-[#12B5D3]"
                    >
                      <Eye className="h-6 w-6 text-primary" />
                    </button>

                    <button
                      onClick={() => {
                        setDeleteModalOpen(true);
                        setSelectedProductId(product?._id);
                      }}
                      type="button"
                      className="text-[#CE0000] transition hover:text-red-600"
                    >
                      <Trash2 className="h-6 w-6" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!products?.length && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-[#6C757D]"
                >
                  No products found.
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
                Showing {currentPage} to 6 of {data?.data?.pagination?.totalData} results
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
          <h4 className="text-lg md:text-xl lg:text-2xl font-semibold text-[#252471] leading-normal">Products</h4>
          <div className="flex items-center gap-5">
             {/* search  */}
        <div>
          <Input
            type="search"
            className="w-full  md:w-[297px] h-[44px] px-3 rounded-[8px] bg-transparent placeholder:text-[#929292] border border-[#969B9C]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}

            placeholder="Search"
          />
        </div>
          <Link href="/product-management/add-product">
            <button className="flex items-center gap-2 bg-primary rounded-[8px] h-[44px] text-base font-medium text-white px-6">
            <Plus />  Add New
            </button>
          </Link>
        </div>
          </div>

        <div className="overflow-x-auto">
          {tableContent}

        {/* delete modal  */}
        <div>
             {/* delete modal  */}
        {deleteModalOpen && (
          <DeleteModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={handleDelete}
            title="Are You Sure?"
            desc="Are you sure you want to delete this Product?"
          />
        )}
        </div>

         {/* Product view modal  */}
        <div>
          {selectViewProduct && (
            <SingleProductView
              open={selectViewProduct}
              onOpenChange={(open: boolean) => setSelectViewProduct(open)}
              productData={selectedProduct}
            />
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
