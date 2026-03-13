import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import moment from "moment";
import { Contact } from "./contact-data-type";

const ContactManagementView = ({
  open,
  onOpenChange,
  contactData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactData: Contact | null;
}) => {
  if (!contactData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 bg-white !rounded-[12px]">
        
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#343A40]">
            Contact Details
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          
          {/* Name */}
          <div>
            <p className="text-sm font-semibold text-gray-800">Name</p>
            <p className="text-sm text-gray-600">{contactData.name}</p>
          </div>

          {/* Email */}
          <div>
            <p className="text-sm font-semibold text-gray-800">Email</p>
            <p className="text-sm text-gray-600">{contactData.email}</p>
          </div>

          {/* Phone */}
          <div>
            <p className="text-sm font-semibold text-gray-800">Phone Number</p>
            <p className="text-sm text-gray-600">{contactData.phone}</p>
          </div>

          {/* Date */}
          <div>
            <p className="text-sm font-semibold text-gray-800">Date</p>
            <p className="text-sm text-gray-600">
              {moment(contactData.createdAt).format("MMM DD, YYYY")}
            </p>
          </div>

          {/* Message */}
          <div>
            <p className="text-sm font-semibold text-gray-800 ">Message</p>
             <p className="text-sm text-gray-600"> {contactData.message}</p>
            
          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
};

export default ContactManagementView;