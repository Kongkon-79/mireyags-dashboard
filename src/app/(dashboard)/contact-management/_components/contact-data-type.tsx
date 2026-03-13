export interface Contact {
  _id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: "unread" | "read" | string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalData: number;
}

export interface ContactsData {
  items: Contact[];
  paginationInfo: PaginationInfo;
}

export interface ContactsApiResponse {
  status: boolean;
  message: string;
  data: ContactsData;
}