import { handleSessionExpired } from '../../utils/sessionExpired';
import { authorizedFetch } from '../../utils/authorizedFetch';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? ''
    : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

/** Категория — ответ GET all, GET by id, создание и редактирование */
export interface AdminCategory {
  id: string;
  nameRu: string;
  nameKz: string;
  slug: string;
  description: string;
  icon: string;
}

export interface CreateCategoryRequest {
  nameRu: string;
  nameKz: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
}

export interface UpdateCategoryRequest {
  nameRu: string;
  nameKz: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface DeleteCategoryResponse {
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

export class AdminCategoriesApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /** GET /api/v1/admin/categories — все категории (включая неактивные) */
  async getCategories(): Promise<AdminCategory[]> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/admin/categories`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    checkAdminResponse(response, 'Не удалось загрузить категории');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  /** GET /api/v1/admin/categories/{categoryId} */
  async getCategoryById(categoryId: string): Promise<AdminCategory> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/categories/${encodeURIComponent(categoryId)}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    checkAdminResponse(response, 'Не удалось загрузить категорию');
    return response.json();
  }

  /** POST /api/v1/admin/categories — создать категорию. Ответ: AdminCategory */
  async createCategory(body: CreateCategoryRequest): Promise<AdminCategory> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/admin/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось создать категорию');
    }
    return response.json();
  }

  /** PUT /api/v1/admin/categories/{categoryId} — редактировать. Ответ: AdminCategory */
  async updateCategory(categoryId: string, body: UpdateCategoryRequest): Promise<AdminCategory> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/categories/${encodeURIComponent(categoryId)}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось обновить категорию');
    }
    return response.json();
  }

  /** DELETE /api/v1/admin/categories/{categoryId}. Ответ: { message: string } */
  async deleteCategory(categoryId: string): Promise<DeleteCategoryResponse> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/categories/${encodeURIComponent(categoryId)}`,
      { method: 'DELETE', headers: getAuthHeaders() }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Не удалось удалить категорию');
    }
    return response.json();
  }
}
