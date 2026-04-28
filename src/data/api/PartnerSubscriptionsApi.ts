import { handleSessionExpired } from "../../utils/sessionExpired";
import { authorizedFetch } from "../../utils/authorizedFetch";
import type { SubscriptionPlan } from "./AdminSubscriptionPlansApi";

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8080";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Требуется авторизация");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseError(response: Response, fallback: string): Promise<string> {
  const err = await response.json().catch(() => ({}));
  return (err as { message?: string }).message || fallback;
}

/** Подписка услуги на тариф (ответ POST subscribe, GET active, history, cancel) */
export interface PartnerSubscription {
  id: string;
  partnerId: string;
  partnerCompanyName: string;
  serviceId: string;
  serviceName: string;
  plan: SubscriptionPlan;
  status: string;
  startsAt: string | null;
  expiresAt: string | null;
  paidAmount: number;
  paymentMethod: string | null;
  paymentId: string | null;
  createdAt: string;
}

export interface PartnerSubscriptionsHistoryPage {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: PartnerSubscription[];
  number: number;
  numberOfElements?: number;
  empty: boolean;
}

export class PartnerSubscriptionsApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  /**
   * GET /api/v1/subscription-plans — активные тарифные планы для партнёров (публичный каталог в Swagger).
   */
  async listAvailablePlans(): Promise<SubscriptionPlan[]> {
    const url = `${this.baseUrl}/api/v1/subscription-plans`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (response.status === 404) return [];
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить тарифы"));
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  /** POST /api/v1/partner/subscriptions/services/{serviceId}/plans/{planId} */
  async subscribeServiceToPlan(serviceId: string, planId: string): Promise<PartnerSubscription> {
    const url = `${this.baseUrl}/api/v1/partner/subscriptions/services/${encodeURIComponent(serviceId)}/plans/${encodeURIComponent(planId)}`;
    const response = await authorizedFetch(url, { method: "POST", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось оформить подписку"));
    }
    return response.json();
  }

  /** GET /api/v1/partner/subscriptions/services/{serviceId}/active — нет активной: 404 → null */
  async getActiveSubscription(serviceId: string): Promise<PartnerSubscription | null> {
    const url = `${this.baseUrl}/api/v1/partner/subscriptions/services/${encodeURIComponent(serviceId)}/active`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (response.status === 404) return null;
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить подписку"));
    }
    return response.json();
  }

  /** GET /api/v1/partner/subscriptions/history */
  async getSubscriptionsHistory(params?: { page?: number; size?: number }): Promise<PartnerSubscriptionsHistoryPage> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.size != null) search.set("size", String(params.size));
    const q = search.toString();
    const url = `${this.baseUrl}/api/v1/partner/subscriptions/history${q ? `?${q}` : ""}`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить историю"));
    }
    return response.json();
  }

  /** POST /api/v1/partner/subscriptions/{subscriptionId}/cancel */
  async cancelSubscription(subscriptionId: string): Promise<PartnerSubscription> {
    const url = `${this.baseUrl}/api/v1/partner/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`;
    const response = await authorizedFetch(url, { method: "POST", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось отменить подписку"));
    }
    return response.json();
  }
}
