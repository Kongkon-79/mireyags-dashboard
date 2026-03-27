"use client";

import { useState } from "react";
import moment from "moment";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import MireyagsPagination from "@/components/ui/mireyags-pagination";
import DeleteModal from "@/components/modals/delete-modal";
import { useDebounce } from "@/hooks/useDebounce";
import { Contact, ContactsApiResponse } from "./contact-data-type";
import ContactManagementView from "./contact-management-view";
import ContactManagementTableSkeleton from "./contact-management-table-skeleton";
import ManagementTableErrorContainer from "@/components/shared/ManagementTableErrorContainer/ManagementTableErrorContainer";

export default function ContactUsContainer() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const [selectViewContact, setSelectViewContact] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  const debouncedSearch = useDebounce(search, 500);
  const queryClient = useQueryClient();

  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;

  const { data, isLoading, isError, error, refetch } = useQuery<ContactsApiResponse>({
    queryKey: ["contacts", debouncedSearch, currentPage],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/contact?page=${currentPage}&limit=10&search=${debouncedSearch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("We couldn't load the contact messages right now. Please try again.");
      }

      return res.json();
    },
    enabled: !!token,
  });

  console.log(isLoading, isError);

  const contacts = data?.data?.items ?? [];

  /* delete contact */
  const { mutate } = useMutation({
    mutationKey: ["delete-contact"],
    mutationFn: async (id: string) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/contact/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return res.json();
    },
    onSuccess: (data) => {
      if (!data?.status) {
        toast.error(data?.message || "Something went wrong");
        return;
      }

      toast.success(data?.message || "Contact deleted successfully");

      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const handleDelete = () => {
    if (selectedId) {
      mutate(selectedId);
    }

    setDeleteModalOpen(false);
  };

  let tableContent;

  if (isLoading) {
    tableContent = <ContactManagementTableSkeleton />;
  } else if (isError) {
    tableContent = (
      <ManagementTableErrorContainer
        title="Unable to load contact messages"
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
              <th className="px-4 py-4 text-left text-base font-semibold text-[#3B3B3B]">
                Name
              </th>
              <th className="px-4 py-4 text-left text-base font-semibold text-[#3B3B3B]">
                Email
              </th>
              <th className="px-4 py-4 text-left text-base font-semibold text-[#3B3B3B]">
                Phone
              </th>
              <th className="px-4 py-4 text-left text-base font-semibold text-[#3B3B3B]">
                Message
              </th>
              <th className="px-4 py-4 text-center text-base font-semibold text-[#3B3B3B]">
                Created Date
              </th>
              <th className="px-4 py-4 text-right text-base font-semibold text-[#3B3B3B]">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {contacts?.map((contact) => (
              <tr key={contact._id} className="border-b hover:bg-[#FCFCFD]">
                <td className="px-4 py-4 text-sm font-medium">
                  {contact.name}
                </td>

                <td className="px-4 py-4 text-sm">{contact.email}</td>

                <td className="px-4 py-4 text-sm">{contact.phone}</td>

                <td className="px-4 py-4 text-sm max-w-[300px] truncate">
                  {contact.message}
                </td>

                <td className="px-4 py-4 text-sm text-center">
                  {moment(contact.createdAt).format("DD/MM/YYYY")}
                </td>

                <td className="px-4 py-4">
                  <div className="flex justify-end gap-4">
                    <button
                      className="text-[#12B5D3]"
                      onClick={() => {
                        setSelectViewContact(true);
                        setSelectedContact(contact);
                      }}
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => {
                        setDeleteModalOpen(true);
                        setSelectedId(contact._id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!contacts?.length && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[#6C757D]">
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {data &&
          data?.data &&
          data?.data?.paginationInfo &&
          data?.data?.paginationInfo?.totalPages > 1 && (
            <div className="flex justify-between items-center py-4">
              <p className="text-[#68706A]">
                Showing {currentPage} of{" "}
                {data?.data?.paginationInfo?.totalPages}
              </p>

              <MireyagsPagination
                currentPage={currentPage}
                totalPages={data?.data?.paginationInfo?.totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
      </>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-[8px] border border-[#E4E4E4] p-6">
        <div className="flex items-center justify-between pb-5">
          <h4 className="text-lg md:text-xl lg:text-2xl font-semibold text-[#252471]">
            Contact Messages
          </h4>

          <Input
            type="search"
            className="w-[297px] h-[44px] px-3 rounded-[8px] border border-[#969B9C]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
          />
        </div>

        <div className="overflow-x-auto">
          {tableContent}

          {/* delete modal */}

          {deleteModalOpen && (
            <DeleteModal
              isOpen={deleteModalOpen}
              onClose={() => setDeleteModalOpen(false)}
              onConfirm={handleDelete}
              title="Are You Sure?"
              desc="Are you sure you want to delete this Contact?"
            />
          )}

          {/* contact view modal  */}
          <div>
            {selectViewContact && (
              <ContactManagementView
                open={selectViewContact}
                onOpenChange={(open: boolean) => setSelectViewContact(open)}
                contactData={selectedContact}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
