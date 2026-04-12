import { handleSessionExpired } from '../../utils/sessionExpired';
import { authorizedFetch } from '../../utils/authorizedFetch';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? ''
    : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

export interface ServiceCategory {
  id: string;
  nameRu: string;
  nameKz?: string;
  slug?: string;
  description?: string;
  icon?: string;
}

export interface PartnerServiceItem {
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
  thumbnail: string;
  images: string[];
  isFavorite?: boolean;
  inCart?: boolean;
}

export interface PartnerServicesResponse {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: PartnerServiceItem[];
  number: number;
  sort: { empty: boolean; unsorted: boolean; sorted: boolean };
  numberOfElements: number;
  pageable: {
    offset: number;
    sort: { empty: boolean; unsorted: boolean; sorted: boolean };
    unpaged: boolean;
    paged: boolean;
    pageNumber: number;
    pageSize: number;
  };
  empty: boolean;
}

export interface CreateServiceRequest {
  categoryId: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  priceFrom: number;
  priceTo: number;
  priceType: string;
  city: string;
  address: string;
  thumbnail?: string;
  imageUrls?: string[];
  images?: string[];
}

export interface UpdateServiceRequest {
  name: string;
  shortDescription: string;
  fullDescription: string;
  priceFrom: number;
  priceTo: number;
  priceType: string;
  city: string;
  address: string;
  thumbnail?: string;
  imageUrls?: string[];
  images?: string[];
  isActive?: boolean;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Требуется авторизация');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export class PartnerServicesApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /** Список активных категорий услуг (для выбора при создании услуги) */
  async getCategories(): Promise<ServiceCategory[]> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/services/categories`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Не удалось загрузить категории');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async getMyServices(params?: { page?: number; size?: number }): Promise<PartnerServicesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page != null) searchParams.set('page', String(params.page));
    if (params?.size != null) searchParams.set('size', String(params.size));
    const query = searchParams.toString();
    const url = `${this.baseUrl}/api/v1/partner/services${query ? `?${query}` : ''}`;
    const response = await authorizedFetch(url, { method: 'GET', headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось загрузить услуги');
    }
    return response.json();
  }

  async createService(data: CreateServiceRequest): Promise<PartnerServiceItem> {
    const normalizedImages = data.imageUrls ?? data.images ?? [];
    const payload: CreateServiceRequest = {
      ...data,
      imageUrls: normalizedImages,
      images: normalizedImages,
    };
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/partner/services`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
      }
      const err = await response.json().catch(() => ({}));
      const msg = err.message || (Array.isArray(err.errors) ? err.errors.map((e: { message?: string }) => e.message).join(', ') : null) || 'Не удалось создать услугу';
      throw new Error(msg);
    }
    return response.json();
  }

  async updateService(serviceId: string, data: UpdateServiceRequest): Promise<PartnerServiceItem> {
    const normalizedImages = data.imageUrls ?? data.images ?? [];
    const payload: UpdateServiceRequest = {
      ...data,
      imageUrls: normalizedImages,
      images: normalizedImages,
    };
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/partner/services/${encodeURIComponent(serviceId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось обновить услугу');
    }
    return response.json();
  }

  async deleteService(serviceId: string): Promise<{ message: string }> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/partner/services/${encodeURIComponent(serviceId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось удалить услугу');
    }
    return response.json();
  }
}
