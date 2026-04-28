import { handleSessionExpired } from "../../utils/sessionExpired";
import { authorizedFetch } from "../../utils/authorizedFetch";

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8080";

export type StoryMediaType = "IMAGE" | "VIDEO";
export type StoryStatus = "ACTIVE" | "EXPIRED" | "REMOVED_BY_PARTNER" | "REMOVED_BY_ADMIN";
export type StoryPaymentMethod = "KASPI" | "BANK_CARD" | "GOOGLE_PAY" | "APPLE_PAY";

export interface StoryResponse {
  id: string;
  serviceId: string;
  serviceName: string;
  partnerId: string;
  partnerCompanyName: string;
  categoryId: string;
  categoryName: string;
  mediaUrl: string;
  mediaType: StoryMediaType;
  caption: string | null;
  status: StoryStatus;
  paidAmount: number;
  paymentMethod: StoryPaymentMethod | null;
  paymentId: string | null;
  viewsCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface StoryAnalyticsResponse {
  storyId: string;
  viewsCount: number;
  status: StoryStatus;
  createdAt: string;
  expiresAt: string;
}

export interface StoriesPageResponse {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: StoryResponse[];
  number: number;
  numberOfElements?: number;
  empty: boolean;
}

async function parseError(response: Response, fallback: string): Promise<string> {
  const err = await response.json().catch(() => ({}));
  return (err as { message?: string }).message || fallback;
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

export class StoriesApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  async getFeed(categoryId?: string): Promise<StoryResponse[]> {
    const search = new URLSearchParams();
    if (categoryId) search.set("categoryId", categoryId);
    const query = search.toString();
    const url = `${this.baseUrl}/api/v1/stories/feed${query ? `?${query}` : ""}`;
    const response = await authorizedFetch(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(await parseError(response, "Не удалось загрузить сторис"));
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async getStory(storyId: string): Promise<StoryResponse> {
    const url = `${this.baseUrl}/api/v1/stories/${encodeURIComponent(storyId)}`;
    const response = await authorizedFetch(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(await parseError(response, "Не удалось загрузить сторис"));
    }
    return response.json();
  }

  async registerView(storyId: string): Promise<{ message: string }> {
    const url = `${this.baseUrl}/api/v1/stories/${encodeURIComponent(storyId)}/view`;
    const response = await authorizedFetch(url, { method: "POST", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось зарегистрировать просмотр"));
    }
    return response.json();
  }
}
