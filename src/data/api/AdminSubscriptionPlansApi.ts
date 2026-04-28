import { handleSessionExpired } from "../../utils/sessionExpired";
import { authorizedFetch } from "../../utils/authorizedFetch";

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

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  durationDays: number;
  isFree: boolean;
  status: string;
  displayOrder: number;
}

/** POST /api/v1/admin/subscription-plans */
export interface CreateSubscriptionPlanRequest {
  name: string;
  slug: string;
  description: string;
  price: number;
  durationDays: number;
  isFree: boolean;
  displayOrder: number;
}

/** PUT /api/v1/admin/subscription-plans/{planId} */
export interface UpdateSubscriptionPlanRequest {
  name: string;
  description: string;
  price: number;
  durationDays: number;
  isFree: boolean;
  displayOrder: number;
}

export interface SubscriptionPlanMessageResponse {
  message: string;
}

export class AdminSubscriptionPlansApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  /** GET /api/v1/admin/subscription-plans — список всех тарифов */
  async listPlans(): Promise<SubscriptionPlan[]> {
    const url = `${this.baseUrl}/api/v1/admin/subscription-plans`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
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

  /** GET /api/v1/admin/subscription-plans/{planId} */
  async getPlan(planId: string): Promise<SubscriptionPlan> {
    const url = `${this.baseUrl}/api/v1/admin/subscription-plans/${encodeURIComponent(planId)}`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить тариф"));
    }
    return response.json();
  }

  /** POST /api/v1/admin/subscription-plans */
  async createPlan(body: CreateSubscriptionPlanRequest): Promise<SubscriptionPlan> {
    const url = `${this.baseUrl}/api/v1/admin/subscription-plans`;
    const response = await authorizedFetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось создать тариф"));
    }
    return response.json();
  }

  /** PUT /api/v1/admin/subscription-plans/{planId} */
  async updatePlan(planId: string, body: UpdateSubscriptionPlanRequest): Promise<SubscriptionPlan> {
    const url = `${this.baseUrl}/api/v1/admin/subscription-plans/${encodeURIComponent(planId)}`;
    const response = await authorizedFetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось обновить тариф"));
    }
    return response.json();
  }

  /** PATCH /api/v1/admin/subscription-plans/{planId}/activate */
  async activatePlan(planId: string): Promise<SubscriptionPlanMessageResponse> {
    const url = `${this.baseUrl}/api/v1/admin/subscription-plans/${encodeURIComponent(planId)}/activate`;
    const response = await authorizedFetch(url, { method: "PATCH", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось активировать тариф"));
    }
    const text = await response.text();
    if (!text.trim()) return { message: "OK" };
    return JSON.parse(text) as SubscriptionPlanMessageResponse;
  }

  /** PATCH /api/v1/admin/subscription-plans/{planId}/deactivate */
  async deactivatePlan(planId: string): Promise<SubscriptionPlanMessageResponse> {
    const url = `${this.baseUrl}/api/v1/admin/subscription-plans/${encodeURIComponent(planId)}/deactivate`;
    const response = await authorizedFetch(url, { method: "PATCH", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось деактивировать тариф"));
    }
    const text = await response.text();
    if (!text.trim()) return { message: "OK" };
    return JSON.parse(text) as SubscriptionPlanMessageResponse;
  }
}
