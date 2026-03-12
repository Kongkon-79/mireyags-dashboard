

export interface SingleProductApiResponse {
  status: boolean;
  message: string;
  data: ProductData;
}

export interface ProductData {
  product: Product;
  relatedProducts: Product[];
}

export interface Product {
  _id: string;
  name: string;
  weight: string;
  size: string[];
  price: number;
  offerPrice: number;
  stock: number;
  category: Category;
  brand: Brand;
  description: string;
  image: string;
  subImages: string[];
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Brand {
  _id: string;
  name: string;
}

export interface Category {
  _id: string;
  name: string;
}

