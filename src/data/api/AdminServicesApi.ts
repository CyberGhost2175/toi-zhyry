import { handleSessionExpired } from '../../utils/sessionExpired';
import { authorizedFetch } from '../../utils/authorizedFetch';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? ''
    : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

export interface AdminServiceItem {
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
  isActive?: boolean;
}

export interface AdminServicesListResponse {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: AdminServiceItem[];
  number: number;
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
    sort: { empty: boolean; unsorted: boolean; sorted: boolean };
  };
  empty: boolean;
}

export interface SetApprovalRequest {
  isApproved: boolean;
  rejectionReason?: string;
}

export interface SetActiveRequest {
  isActive: boolean;
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

function checkResponse(response: Response, msg: string): void {
  if (response.ok) return;
  if (response.status === 403) {
    handleSessionExpired();
    throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
  }
  throw new Error(msg);
}

export class AdminServicesApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getPendingServices(): Promise<AdminServiceItem[]> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/admin/services/pending`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    checkResponse(response, 'Не удалось загрузить услуги на модерации');
    return response.json();
  }

  async getAllServices(params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
  }): Promise<AdminServicesListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page != null) searchParams.set('page', String(params.page));
    if (params?.size != null) searchParams.set('size', String(params.size));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortDirection) searchParams.set('sortDirection', params.sortDirection);
    const query = searchParams.toString();
    const url = `${this.baseUrl}/api/v1/admin/services${query ? `?${query}` : ''}`;
    const response = await authorizedFetch(url, { method: 'GET', headers: getAuthHeaders() });
    checkResponse(response, 'Не удалось загрузить список услуг');
    const data = await response.json();
    if (Array.isArray(data)) {
      return {
        content: data,
        totalElements: data.length,
        totalPages: 1,
        first: true,
        last: true,
        size: data.length,
        number: 0,
        numberOfElements: data.length,
        pageable: {
          offset: 0,
          pageNumber: 0,
          pageSize: data.length,
          paged: true,
          unpaged: false,
          sort: { empty: true, unsorted: true, sorted: false },
        },
        empty: data.length === 0,
      };
    }
    return data;
  }

  async getServiceById(serviceId: string): Promise<AdminServiceItem> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/services/${encodeURIComponent(serviceId)}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    checkResponse(response, 'Не удалось загрузить услугу');
    return response.json();
  }

  async setApprovalStatus(serviceId: string, body: SetApprovalRequest): Promise<void> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/services/${encodeURIComponent(serviceId)}/approval-status`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    checkResponse(response, 'Не удалось изменить статус одобрения');
  }

  async setActiveStatus(serviceId: string, body: SetActiveRequest): Promise<void> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/services/${encodeURIComponent(serviceId)}/active-status`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    checkResponse(response, 'Не удалось изменить статус активности');
  }
}
