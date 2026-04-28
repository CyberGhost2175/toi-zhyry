import { handleSessionExpired } from '../../utils/sessionExpired';
import { authorizedFetch } from '../../utils/authorizedFetch';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? ''
    : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

export type PartnerApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INACTIVE';

export interface PartnerApplicationItem {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  bin: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  approvedByEmail?: string;
}

export interface PartnerDirectoryItem {
  id: string;
  userId: string;
  bin: string;
  companyName: string;
  description: string;
  address: string;
  city: string;
  region: string;
  phone: string;
  email: string;
  whatsapp: string;
  telegram: string;
  instagram: string;
  website: string;
  logoUrl: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  approvedByEmail?: string;
  averageRating: number;
  totalReviews: number;
  totalServices: number;
  activeServices: number;
  businessCategories: string[];
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
}

export interface PartnerDirectoryResponse {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: PartnerDirectoryItem[];
  number: number;
  sort: { empty: boolean; unsorted: boolean; sorted: boolean };
  pageable: {
    offset: number;
    sort: { empty: boolean; unsorted: boolean; sorted: boolean };
    unpaged: boolean;
    paged: boolean;
    pageNumber: number;
    pageSize: number;
  };
  numberOfElements: number;
  empty: boolean;
}

export interface ApproveRequest {
  approved: boolean;
  rejectionReason?: string;
}

/** POST /api/v1/admin/notifications/test */
export interface AdminTestNotificationRequest {
  title: string;
  message: string;
  recipientEmail: string;
  push: boolean;
  email: boolean;
  sms: boolean;
}

export interface AdminTestNotificationResponse {
  message: string;
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

function checkAdminResponse(response: Response, defaultMessage: string): void {
  if (response.ok) return;
  if (response.status === 403) {
    handleSessionExpired();
    throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
  }
  throw new Error(defaultMessage);
}

export class AdminApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getPendingApplications(): Promise<PartnerApplicationItem[]> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/admin/partners/pending`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    checkAdminResponse(response, 'Не удалось загрузить заявки');
    return response.json();
  }

  async getApplicationsByStatus(status: PartnerApplicationStatus): Promise<PartnerApplicationItem[]> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/partners/status/${encodeURIComponent(status)}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    checkAdminResponse(response, 'Не удалось загрузить заявки');
    return response.json();
  }

  async approveOrRejectApplication(
    partnerId: string,
    body: ApproveRequest
  ): Promise<PartnerApplicationItem> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/partners/${partnerId}/approve`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      if (response.status === 403) {
        handleSessionExpired();
        throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось выполнить действие');
    }
    return response.json();
  }

  async getPartnerDirectory(params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
    city?: string;
    status?: PartnerApplicationStatus;
    search?: string;
  }): Promise<PartnerDirectoryResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page != null) searchParams.set('page', String(params.page));
    if (params?.size != null) searchParams.set('size', String(params.size));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortDirection) searchParams.set('sortDirection', params.sortDirection);
    if (params?.city) searchParams.set('city', params.city);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    const url = `${this.baseUrl}/api/v1/admin/partner-directory${query ? `?${query}` : ''}`;
    const response = await authorizedFetch(url, { method: 'GET', headers: getAuthHeaders() });
    checkAdminResponse(response, 'Не удалось загрузить справочник партнёров');
    return response.json();
  }

  async getPartnerById(partnerId: string): Promise<PartnerDirectoryItem> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/partner-directory/${encodeURIComponent(partnerId)}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    checkAdminResponse(response, 'Не удалось загрузить профиль партнёра');
    return response.json();
  }

  /** POST /api/v1/admin/notifications/test — проверка push / email / sms для текущего администратора */
  async sendTestNotification(body: AdminTestNotificationRequest): Promise<AdminTestNotificationResponse> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/admin/notifications/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
      }
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Не удалось отправить тестовое уведомление');
    }
    return response.json();
  }
}
