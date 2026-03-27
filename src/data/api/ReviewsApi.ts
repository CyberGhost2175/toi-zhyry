import { handleSessionExpired } from "../../utils/sessionExpired";

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8080";

export interface Review {
  id: string;
  bookingId: string;
  userId: string;
  userFullName: string;
  serviceId: string;
  serviceName: string;
  partnerId: string;
  partnerCompanyName: string;
  rating: number;
  comment: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsPageResponse {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: Review[];
  number: number;
  numberOfElements?: number;
  empty: boolean;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment: string;
  imageUrls?: string[];
}

export interface UpdateReviewRequest {
  rating: number;
  comment: string;
  imageUrls?: string[];
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Требуется авторизация");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function getOptionalAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  if (!token) return { Accept: "application/json" };
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseError(response: Response, fallback: string): Promise<string> {
  const err = await response.json().catch(() => ({}));
  return (err as { message?: string }).message || fallback;
}

export class ReviewsApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  async createReview(body: CreateReviewRequest): Promise<Review> {
    const response = await fetch(`${this.baseUrl}/api/v1/reviews`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось оставить отзыв"));
    }
    return response.json();
  }

  async updateReview(reviewId: string, body: UpdateReviewRequest): Promise<Review> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/reviews/${encodeURIComponent(reviewId)}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось обновить отзыв"));
    }
    return response.json();
  }

  async getServiceReviews(
    serviceId: string,
    params?: { page?: number; size?: number }
  ): Promise<ReviewsPageResponse> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.size != null) search.set("size", String(params.size));
    const q = search.toString();
    const url = `${this.baseUrl}/api/v1/reviews/service/${encodeURIComponent(serviceId)}${q ? `?${q}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: getOptionalAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(await parseError(response, "Не удалось загрузить отзывы"));
    }
    return response.json();
  }

  async getMyReviews(params?: { page?: number; size?: number }): Promise<ReviewsPageResponse> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.size != null) search.set("size", String(params.size));
    const q = search.toString();
    const url = `${this.baseUrl}/api/v1/reviews/my${q ? `?${q}` : ""}`;
    const response = await fetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить мои отзывы"));
    }
    return response.json();
  }
}

