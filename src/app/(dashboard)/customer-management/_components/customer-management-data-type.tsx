
export interface CustomerData {
  userId: string;
  name: string;
  email: string;
  totalOrders: number;
  totalQuantity: number;
  totalSpent: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CustomerAnalyticsData {
  data: CustomerData[];
  pagination: Pagination;
}

export interface CustomerApiResponse {
  status: boolean;
  message: string;
  data: CustomerAnalyticsData;
}