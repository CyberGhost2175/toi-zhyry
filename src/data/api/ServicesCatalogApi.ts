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

export class ServicesCatalogApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /** GET /api/v1/services/categories — список категорий для левой панели */
  async getCategories(): Promise<ServiceCategory[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/services/categories`, {
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
    const response = await fetch(url, {
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
    const response = await fetch(
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
    pagination: { page?: number; size?: number; sortBy?: string; sortDirection?: SortDirection } = {}
  ): Promise<PagedResponse<CatalogService>> {
    const { page = 0, size = 20, sortBy = 'createdAt', sortDirection = 'DESC' } = pagination;

    const search = new URLSearchParams();
    search.set('filter', JSON.stringify(filter));
    search.set('page', String(page));
    search.set('size', String(size));
    search.set('sortBy', sortBy);
    search.set('sortDirection', sortDirection);

    const url = `${this.baseUrl}/api/v1/services/filter?${search.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getCatalogHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Ошибка загрузки услуг' }));
      throw new Error(err.message || 'Не удалось загрузить услуги');
    }

    return response.json();
  }
}
