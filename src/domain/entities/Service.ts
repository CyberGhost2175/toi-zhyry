/** Catalog service item from GET /api/v1/services or GET /api/v1/services/filter */
export interface CatalogService {
  id: string;
  partnerId: string;
  partnerName: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  priceFrom: number;
  priceTo: number;
  priceType: string;
  city: string;
  address: string;
  rating: number;
  reviewsCount: number;
  viewsCount: number;
  bookingsCount?: number;
  thumbnail: string;
  images: string[];
  isFavorite: boolean;
  inCart: boolean;
}

export interface PageSort {
  empty: boolean;
  unsorted: boolean;
  sorted: boolean;
}

export interface Pageable {
  offset: number;
  sort: PageSort;
  paged: boolean;
  unpaged: boolean;
  pageNumber: number;
  pageSize: number;
}

export interface PagedResponse<T> {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: T[];
  number: number;
  sort: PageSort;
  pageable: Pageable;
  numberOfElements: number;
  empty: boolean;
}
