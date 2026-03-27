import { handleSessionExpired } from '../../utils/sessionExpired';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? ''
    : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

/** User as returned by admin API (GET list, GET by id, create, update, active-status, etc.) */
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface PagedUsersResponse {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: AdminUser[];
  number: number;
  sort: PageSort;
  pageable: Pageable;
  numberOfElements: number;
  empty: boolean;
}

export interface CreateAdminUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  role: 'USER' | 'PARTNER' | 'ADMIN';
  emailVerified?: boolean;
}

export interface UpdateAdminUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
}

export interface SetRoleRequest {
  role: 'USER' | 'PARTNER' | 'ADMIN';
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface SetEmailVerificationRequest {
  emailVerified: boolean;
}

export interface SetActiveStatusRequest {
  isActive: boolean;
}

export interface DeleteUserResponse {
  message: string;
}

/** GET /api/v1/admin/users/statistics */
export interface UserStatistics {
  totalUsers: number;
  userRoleCount: number;
  partnerRoleCount: number;
  adminRoleCount: number;
  verifiedEmailCount: number;
  unverifiedEmailCount: number;
  activeUsersCount: number;
  inactiveUsersCount: number;
}

/** Элемент истории входов — GET /api/v1/admin/login-history/user/{userId} */
export interface LoginHistoryItem {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  loginType: string;
  success: boolean;
  failureReason?: string;
  createdAt: string;
}

export interface PagedLoginHistoryResponse {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: LoginHistoryItem[];
  number: number;
  sort: { empty: boolean; sorted: boolean; unsorted: boolean };
  pageable: {
    offset: number;
    sort: { empty: boolean; sorted: boolean; unsorted: boolean };
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}

/** GET /api/v1/admin/login-history/user/{userId}/stats */
export interface UserLoginStats {
  userId: string;
  totalSuccessfulLogins: number;
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

export interface GetUsersParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  role?: string;
  search?: string;
  emailVerified?: boolean;
}

export class AdminUsersApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /** GET /api/v1/admin/users — список пользователей с пагинацией и фильтрами */
  async getUsers(params: GetUsersParams = {}): Promise<PagedUsersResponse> {
    const search = new URLSearchParams();
    if (params.page != null) search.set('page', String(params.page));
    if (params.size != null) search.set('size', String(params.size));
    if (params.sortBy) search.set('sortBy', params.sortBy);
    if (params.sortDirection) search.set('sortDirection', params.sortDirection);
    if (params.role) search.set('role', params.role);
    if (params.search) search.set('search', params.search);
    if (params.emailVerified !== undefined) search.set('emailVerified', String(params.emailVerified));
    const query = search.toString();
    const url = `${this.baseUrl}/api/v1/admin/users${query ? `?${query}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    checkAdminResponse(response, 'Не удалось загрузить список пользователей');
    return response.json();
  }

  /** POST /api/v1/admin/users — создать пользователя */
  async createUser(body: CreateAdminUserRequest): Promise<AdminUser> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось создать пользователя');
    }
    return response.json();
  }

  /** GET /api/v1/admin/users/{userId} — получить пользователя по ID */
  async getUserById(userId: string): Promise<AdminUser> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/admin/users/${encodeURIComponent(userId)}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    checkAdminResponse(response, 'Не удалось загрузить пользователя');
    return response.json();
  }

  /** PUT /api/v1/admin/users/{userId} — обновить пользователя */
  async updateUser(userId: string, body: UpdateAdminUserRequest): Promise<AdminUser> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/admin/users/${encodeURIComponent(userId)}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось обновить пользователя');
    }
    return response.json();
  }

  /** DELETE /api/v1/admin/users/{userId} — удалить пользователя (hard delete) */
  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/admin/users/${encodeURIComponent(userId)}`,
      { method: 'DELETE', headers: getAuthHeaders() }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось удалить пользователя');
    }
    return response.json();
  }

  /** PATCH /api/v1/admin/users/{userId}/role — изменить роль */
  async setUserRole(userId: string, body: SetRoleRequest): Promise<AdminUser> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/admin/users/${encodeURIComponent(userId)}/role`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось изменить роль');
    }
    return response.json();
  }

  /** PATCH /api/v1/admin/users/{userId}/reset-password — сбросить пароль */
  async resetPassword(userId: string, body: ResetPasswordRequest): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/admin/users/${encodeURIComponent(userId)}/reset-password`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось сбросить пароль');
    }
  }

  /** PATCH /api/v1/admin/users/{userId}/email-verification — статус верификации email */
  async setEmailVerification(userId: string, body: SetEmailVerificationRequest): Promise<AdminUser> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/admin/users/${encodeURIComponent(userId)}/email-verification`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось изменить статус верификации');
    }
    return response.json();
  }

  /** PATCH /api/v1/admin/users/{userId}/active-status — блокировка/разблокировка (soft delete) */
  async setActiveStatus(userId: string, body: SetActiveStatusRequest): Promise<AdminUser> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/admin/users/${encodeURIComponent(userId)}/active-status`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось изменить статус активности');
    }
    return response.json();
  }

  /** GET /api/v1/admin/users/statistics — общая статистика пользователей */
  async getUsersStatistics(): Promise<UserStatistics> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/users/statistics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    checkAdminResponse(response, 'Не удалось загрузить статистику пользователей');
    return response.json();
  }

  /** GET /api/v1/admin/login-history/user/{userId} — история входов пользователя */
  async getLoginHistory(userId: string, params?: { page?: number; size?: number }): Promise<PagedLoginHistoryResponse> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.size != null) search.set('size', String(params.size));
    const query = search.toString();
    const url = `${this.baseUrl}/api/v1/admin/login-history/user/${encodeURIComponent(userId)}${query ? `?${query}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    checkAdminResponse(response, 'Не удалось загрузить историю входов');
    return response.json();
  }

  /** GET /api/v1/admin/login-history/user/{userId}/stats — статистика входов пользователя */
  async getLoginHistoryStats(userId: string): Promise<UserLoginStats> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/admin/login-history/user/${encodeURIComponent(userId)}/stats`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    checkAdminResponse(response, 'Не удалось загрузить статистику входов');
    return response.json();
  }
}
