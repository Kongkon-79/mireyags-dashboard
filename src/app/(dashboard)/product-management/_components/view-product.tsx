
import React from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Product } from "../edit-product/[id]/_components/single-product-data-type";

const SingleProductView = ({
  open,
  onOpenChange,
  productData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productData: Product | null;
}) => {
  if (!productData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto !rounded-[12px] bg-white p-6 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#343A40]">
            Product Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <InfoRow label="Product Name" value={productData.name} />
              <InfoRow label="Weight" value={productData.weight} />
              <InfoRow label="Price" value={`$${productData.price}`} />
              <InfoRow label="Offer Price" value={`$${productData.offerPrice}`} />
              <InfoRow label="Stock" value={String(productData.stock)} />
              <InfoRow label="Category" value={productData.category?.name || "N/A"} />
              <InfoRow label="Brand" value={productData.brand?.name || "N/A"} />
              <InfoRow label="Average Rating" value={String(productData.averageRating ?? 0)} />
              <InfoRow label="Review Count" value={String(productData.reviewCount ?? 0)} />
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-[#343A40]">Main Image :</p>
                <div className="relative h-56 w-full overflow-hidden rounded-xl border bg-slate-100">
                  <Image
                    src={productData.image}
                    alt={productData.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[#343A40]">Sizes :</p>
                <div className="flex flex-wrap gap-2">
                  {productData.size?.length > 0 ? (
                    productData.size.map((item, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No sizes available</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-[#343A40]">Description :</p>
            <p className="rounded-xl border bg-slate-50 p-4 text-sm leading-6 text-[#6C757D]">
              {productData.description || "No description available"}
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#343A40]">Sub Images :</p>

            {productData.subImages?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {productData.subImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative h-32 w-full overflow-hidden rounded-xl border bg-slate-100"
                  >
                    <Image
                      src={img}
                      alt={`Sub image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No sub images available</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SingleProductView;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm leading-6 text-[#6C757D]">
      <strong className="font-semibold text-[#343A40]">{label} :</strong> {value}
    </p>
  );
}



















// import React from "react";
// import { Dialog, DialogContent } from "@/components/ui/dialog";
// // import moment from "moment";
// import { Product } from "../edit-product/[id]/_components/single-product-data-type";

// const SingleProductView = ({
//   open,
//   onOpenChange,
//   productData,
// }: {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   productData: Product | null;
// }) => {
//   if (!productData) return null;

//   console.log(productData)

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="p-6 space-y-4 bg-white !rounded-[12px]">

//         <div className="space-y-4">
//           <p className="text-base font-normal text-[#6C757D)] leading-[150%]">
//             <strong className="text-base font-semibold text-[#343A40] leading-[150%]">Product Name :</strong> {productData?.name}
//           </p>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default SingleProductView;

