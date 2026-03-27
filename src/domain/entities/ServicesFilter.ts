/** Filter object for GET /api/v1/services/filter */
export interface ServicesFilterDto {
  categoryId?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  city?: string;
  cities?: string[];
  serviceType?: string;
  availableDate?: string;
  availableDates?: string[];
  searchQuery?: string;
  hasImages?: boolean;
  minReviews?: number;
  /** Swagger: POPULARITY, PRICE_ASC, PRICE_DESC, RATING */
  sortType?: string;
}
