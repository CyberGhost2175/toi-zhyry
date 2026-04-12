import type { CatalogService, PagedResponse } from '../../domain/entities/Service';
import { handleSessionExpired } from '../../utils/sessionExpired';
import { authorizedFetch } from '../../utils/authorizedFetch';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? ''
    : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Требуется авторизация');
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export interface GetFavoritesParams {
  page?: number;
  size?: number;
}

export class FavoritesApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /** GET /api/v1/favorites — список избранных услуг */
  async getFavorites(params: GetFavoritesParams = {}): Promise<PagedResponse<CatalogService>> {
    const { page = 0, size = 20 } = params;
    const search = new URLSearchParams();
    search.set('page', String(page));
    search.set('size', String(size));
    const url = `${this.baseUrl}/api/v1/favorites?${search.toString()}`;
    const response = await authorizedFetch(url, { method: 'GET', headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
      }
      const err = await response.json().catch(() => ({ message: 'Ошибка загрузки избранного' }));
      throw new Error(err.message || 'Не удалось загрузить избранное');
    }
    return response.json();
  }

  /** POST /api/v1/favorites/{serviceId} — добавить в избранное */
  async addToFavorites(serviceId: string): Promise<{ message: string }> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/favorites/${encodeURIComponent(serviceId)}`,
      { method: 'POST', headers: getAuthHeaders() }
    );
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
      }
      const err = await response.json().catch(() => ({ message: 'Ошибка добавления в избранное' }));
      throw new Error(err.message || 'Не удалось добавить в избранное');
    }
    return response.json();
  }

  /** DELETE /api/v1/favorites/{serviceId} — удалить из избранного */
  async removeFromFavorites(serviceId: string): Promise<{ message: string }> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/favorites/${encodeURIComponent(serviceId)}`,
      { method: 'DELETE', headers: getAuthHeaders() }
    );
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
      }
      const err = await response.json().catch(() => ({ message: 'Ошибка удаления из избранного' }));
      throw new Error(err.message || 'Не удалось удалить из избранного');
    }
    return response.json();
  }
}
