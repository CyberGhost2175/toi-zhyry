import { authorizedFetch } from '../../utils/authorizedFetch';
import type {
  CatalogService,
  PagedResponse,
} from '../../domain/entities/Service';
import type { ServiceCategory } from '../../domain/entities/Category';
import type { ServicesFilterDto } from '../../domain/entities/ServicesFilter';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? ''
    : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

export type SortDirection = 'ASC' | 'DESC';
export type ServicesSortType = 'POPULARITY' | 'PRICE_ASC' | 'PRICE_DESC' | 'RATING';

function getCatalogHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = { Accept: 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return headers;
}

export interface GetServicesParams {
  categoryId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}

type NewPagedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  appliedSortType?: string;
};

function normalizePagedResponse<T>(raw: unknown): PagedResponse<T> {
  const data = (raw || {}) as Partial<PagedResponse<T>> & Partial<NewPagedResponse<T>>;
  const pageNumber = data.number ?? data.page ?? 0;
  const pageSize = data.size ?? 0;
  const totalPages = data.totalPages ?? 0;
  const totalElements = data.totalElements ?? 0;
  const content = Array.isArray(data.content) ? data.content : [];
  const last = data.last ?? pageNumber >= Math.max(0, totalPages - 1);
  const first = data.first ?? pageNumber === 0;
  const empty = data.empty ?? content.length === 0;
  const numberOfElements = data.numberOfElements ?? content.length;
  const sort = data.sort ?? { empty: true, unsorted: true, sorted: false };
  const pageable =
    data.pageable ??
    {
      offset: pageNumber * pageSize,
      sort,
      paged: true,
      unpaged: false,
      pageNumber,
      pageSize,
    };

  return {
    totalElements,
    totalPages,
    first,
    last,
    size: pageSize,
    content: content as T[],
    number: pageNumber,
    sort,
    pageable,
    numberOfElements,
    empty,
  };
}

export class ServicesCatalogApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /** GET /api/v1/services/categories — список категорий для левой панели */
  async getCategories(): Promise<ServiceCategory[]> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/services/categories`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Ошибка загрузки категорий' }));
      throw new Error(err.message || 'Не удалось загрузить категории');
    }

    return response.json();
  }

  /** GET /api/v1/services — базовая фильтрация (categoryId, page, size, sort) */
  async getServices(params: GetServicesParams = {}): Promise<PagedResponse<CatalogService>> {
    const {
      categoryId,
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDirection = 'DESC',
    } = params;

    const search = new URLSearchParams();
    if (categoryId) search.set('categoryId', categoryId);
    search.set('page', String(page));
    search.set('size', String(size));
    search.set('sortBy', sortBy);
    search.set('sortDirection', sortDirection);

    const url = `${this.baseUrl}/api/v1/services?${search.toString()}`;
    const response = await authorizedFetch(url, {
      method: 'GET',
      headers: getCatalogHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Ошибка загрузки услуг' }));
      throw new Error(err.message || 'Не удалось загрузить услуги');
    }

    return response.json();
  }

  /** GET /api/v1/services/{serviceId} — детали услуги */
  async getServiceById(serviceId: string): Promise<CatalogService> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/services/${encodeURIComponent(serviceId)}`,
      { method: 'GET', headers: getCatalogHeaders() }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Ошибка загрузки услуги' }));
      throw new Error(err.message || 'Не удалось загрузить услугу');
    }
    return response.json();
  }

  /** GET /api/v1/services/filter — список услуг с расширенными фильтрами (поиск с главной, категория, цена, город и т.д.) */
  async getServicesFilter(
    filter: ServicesFilterDto,
    pagination: { page?: number; size?: number } = {}
  ): Promise<PagedResponse<CatalogService>> {
    const { page = 0, size = 20 } = pagination;

    const search = new URLSearchParams();
    const appendIfDefined = (key: string, value: unknown) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'string' && value.trim() === '') return;
      search.append(key, String(value));
    };

    // Backend expects query object fields (not JSON-stringified filter object).
    appendIfDefined('categoryId', filter.categoryId);
    appendIfDefined('priceMin', filter.priceMin);
    appendIfDefined('priceMax', filter.priceMax);
    appendIfDefined('ratingMin', filter.ratingMin);
    appendIfDefined('city', filter.city);
    appendIfDefined('serviceType', filter.serviceType);
    appendIfDefined('availableDate', filter.availableDate);
    appendIfDefined('searchQuery', filter.searchQuery);
    appendIfDefined('hasImages', filter.hasImages);
    appendIfDefined('minReviews', filter.minReviews);
    appendIfDefined('sortType', filter.sortType);

    if (Array.isArray(filter.cities)) {
      filter.cities.forEach((value) => appendIfDefined('cities', value));
    }
    if (Array.isArray(filter.availableDates)) {
      filter.availableDates.forEach((value) => appendIfDefined('availableDates', value));
    }

    search.set('page', String(page));
    search.set('size', String(size));

    const url = `${this.baseUrl}/api/v1/services/filter?${search.toString()}`;
    const response = await authorizedFetch(url, {
      method: 'GET',
      headers: getCatalogHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Ошибка загрузки услуг' }));
      throw new Error(err.message || 'Не удалось загрузить услуги');
    }

    const raw = await response.json();
    return normalizePagedResponse<CatalogService>(raw);
  }
}
