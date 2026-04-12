import { handleSessionExpired } from '../../utils/sessionExpired';
import { authorizedFetch } from '../../utils/authorizedFetch';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? ''
    : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

/** Услуга внутри элемента корзины (поля как у CatalogService) */
export interface CartService {
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
  isFavorite: boolean;
  inCart: boolean;
}

/** Элемент корзины — GET /api/v1/cart */
export interface CartItem {
  cartItemId: string;
  service: CartService;
  quantity: number;
  eventDate: string;
  notes: string;
  itemTotal: number;
}

/** Ответ GET /api/v1/cart */
export interface CartResponse {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

/** Тело POST /api/v1/cart */
export interface AddToCartRequest {
  serviceId: string;
  quantity: number;
  eventDate?: string;
  notes?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Требуется авторизация');
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function checkResponse(response: Response, defaultMessage: string): void {
  if (response.status === 401 || response.status === 403) {
    handleSessionExpired();
    throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
  }
  if (!response.ok) {
    throw new Error(defaultMessage);
  }
}

export class CartApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /** GET /api/v1/cart — содержимое корзины с итоговой суммой */
  async getCart(): Promise<CartResponse> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/cart`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    checkResponse(response, 'Не удалось загрузить корзину');
    const data = await response.json();
    return {
      items: data.items ?? [],
      totalItems: data.totalItems ?? 0,
      totalPrice: data.totalPrice ?? 0,
    };
  }

  /** POST /api/v1/cart — добавить услугу в корзину или обновить */
  async addToCart(body: AddToCartRequest): Promise<{ message: string }> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/cart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    checkResponse(response, 'Не удалось добавить в корзину');
    return response.json().catch(() => ({ message: 'OK' }));
  }

  /** DELETE /api/v1/cart — очистить корзину */
  async clearCart(): Promise<{ message: string }> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/cart`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    checkResponse(response, 'Не удалось очистить корзину');
    return response.json().catch(() => ({ message: 'OK' }));
  }

  /** DELETE /api/v1/cart/{serviceId} — удалить услугу из корзины */
  async removeFromCart(serviceId: string): Promise<{ message: string }> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/cart/${encodeURIComponent(serviceId)}`,
      { method: 'DELETE', headers: getAuthHeaders() }
    );
    checkResponse(response, 'Не удалось удалить из корзины');
    return response.json().catch(() => ({ message: 'OK' }));
  }
}
