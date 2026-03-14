import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerData } from "./customer-management-data-type";

const CustomerManagementView = ({
  open,
  onOpenChange,
  customerData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerData: CustomerData | null;
}) => {
  if (!customerData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 bg-white !rounded-[12px]">
        
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#343A40]">
            Customer Details
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          
          {/* Name */}
          <div>
            <p className="text-sm font-semibold text-gray-800">Name</p>
            <p className="text-sm text-gray-600">{customerData.name}</p>
          </div>

          {/* Email */}
          <div>
            <p className="text-sm font-semibold text-gray-800">Email</p>
            <p className="text-sm text-gray-600">{customerData.email}</p>
          </div>

          {/* Phone */}
          <div>
            <p className="text-sm font-semibold text-gray-800">Amount</p>
            <p className="text-sm text-gray-600">{customerData.totalSpent}</p>
          </div>

          {/* Date */}
          <div>
            <p className="text-sm font-semibold text-gray-800">Purchase</p>
            <p className="text-sm text-gray-600">
              {customerData?.totalOrders}
            </p>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
};

export default CustomerManagementView;