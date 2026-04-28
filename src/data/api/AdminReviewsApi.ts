import { handleSessionExpired } from "../../utils/sessionExpired";
import { authorizedFetch } from "../../utils/authorizedFetch";
import type { Review, ReviewsPageResponse } from "./ReviewsApi";

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

export interface AdminReviewMessageResponse {
  message: string;
}

/** Отзыв в админ-списке (бэкенд может отдавать признак видимости) */
export type AdminReviewRow = Review & { visible?: boolean; isVisible?: boolean };

export interface AdminReviewsPageResponse extends Omit<ReviewsPageResponse, "content"> {
  content: AdminReviewRow[];
}

export class AdminReviewsApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  /** GET /api/v1/admin/reviews — список для модерации (Spring page) */
  async getAdminReviews(params?: { page?: number; size?: number }): Promise<AdminReviewsPageResponse> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.size != null) search.set("size", String(params.size));
    const q = search.toString();
    const url = `${this.baseUrl}/api/v1/admin/reviews${q ? `?${q}` : ""}`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить отзывы"));
    }
    return response.json();
  }

  /** PATCH /api/v1/admin/reviews/{reviewId}/hide */
  async hideReview(reviewId: string): Promise<AdminReviewMessageResponse> {
    const url = `${this.baseUrl}/api/v1/admin/reviews/${encodeURIComponent(reviewId)}/hide`;
    const response = await authorizedFetch(url, { method: "PATCH", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось скрыть отзыв"));
    }
    const text = await response.text();
    if (!text.trim()) return { message: "OK" };
    return JSON.parse(text) as AdminReviewMessageResponse;
  }

  /** PATCH /api/v1/admin/reviews/{reviewId}/show */
  async showReview(reviewId: string): Promise<AdminReviewMessageResponse> {
    const url = `${this.baseUrl}/api/v1/admin/reviews/${encodeURIComponent(reviewId)}/show`;
    const response = await authorizedFetch(url, { method: "PATCH", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось восстановить отзыв"));
    }
    const text = await response.text();
    if (!text.trim()) return { message: "OK" };
    return JSON.parse(text) as AdminReviewMessageResponse;
  }

  /** DELETE /api/v1/admin/reviews/{reviewId} — необратимо */
  async deleteReview(reviewId: string): Promise<AdminReviewMessageResponse> {
    const url = `${this.baseUrl}/api/v1/admin/reviews/${encodeURIComponent(reviewId)}`;
    const response = await authorizedFetch(url, { method: "DELETE", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось удалить отзыв"));
    }
    const text = await response.text();
    if (!text.trim()) return { message: "OK" };
    return JSON.parse(text) as AdminReviewMessageResponse;
  }
}
