import { authorizedFetch } from "../../utils/authorizedFetch";
import { handleSessionExpired } from "../../utils/sessionExpired";
import type { Review, ReviewsPageResponse, ReviewsSort, ServiceReviewsSummary } from "./ReviewsApi";

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8080";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Требуется авторизация");
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseError(response: Response, fallback: string): Promise<string> {
  const err = await response.json().catch(() => ({}));
  return (err as { message?: string }).message || fallback;
}

export interface PartnerReviewsPageResponse extends Omit<ReviewsPageResponse, "content"> {
  content: Review[];
}

export class PartnerReviewsApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  /**
   * GET /api/v1/partner/reviews/service/{serviceId}
   * Возвращает видимые отзывы по услуге партнера.
   */
  async getMyServiceReviews(
    serviceId: string,
    params?: { sort?: ReviewsSort; page?: number; size?: number }
  ): Promise<PartnerReviewsPageResponse> {
    const search = new URLSearchParams();
    if (params?.sort) search.set("sort", params.sort);
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.size != null) search.set("size", String(params.size));
    const q = search.toString();
    const url = `${this.baseUrl}/api/v1/partner/reviews/service/${encodeURIComponent(serviceId)}${
      q ? `?${q}` : ""
    }`;

    const response = await authorizedFetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить отзывы по услуге"));
    }
    return response.json();
  }

  /** GET /api/v1/partner/reviews/service/{serviceId}/summary */
  async getMyServiceReviewsSummary(serviceId: string): Promise<ServiceReviewsSummary> {
    const url = `${this.baseUrl}/api/v1/partner/reviews/service/${encodeURIComponent(serviceId)}/summary`;
    const response = await authorizedFetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить сводку отзывов"));
    }
    return response.json();
  }
}
