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

export type SubscriptionPaymentMethod = "KASPI" | "BANK_CARD" | "GOOGLE_PAY" | "APPLE_PAY";

export interface ProcessSubscriptionPaymentRequest {
  subscriptionId: string;
  paymentMethod: SubscriptionPaymentMethod;
}

export interface ProcessSubscriptionPaymentResponse {
  paymentId: string;
  subscriptionId: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  message: string;
  processedAt: string;
}

export class PaymentsApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  /** POST /api/v1/payments — оплата подписки (заглушка на бэкенде может всегда успешно проходить) */
  async processSubscriptionPayment(body: ProcessSubscriptionPaymentRequest): Promise<ProcessSubscriptionPaymentResponse> {
    const url = `${this.baseUrl}/api/v1/payments`;
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
      throw new Error(await parseError(response, "Оплата не прошла"));
    }
    return response.json();
  }
}
