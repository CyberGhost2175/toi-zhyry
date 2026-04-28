import { handleSessionExpired } from "../../utils/sessionExpired";
import { authorizedFetch } from "../../utils/authorizedFetch";
import type {
  StoriesPageResponse,
  StoryAnalyticsResponse,
  StoryMediaType,
  StoryPaymentMethod,
  StoryResponse,
} from "./StoriesApi";

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8080";

export interface CreateStoryRequest {
  serviceId: string;
  mediaUrl: string;
  mediaType: StoryMediaType;
  caption?: string;
  paymentMethod: StoryPaymentMethod;
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

async function parseError(response: Response, fallback: string): Promise<string> {
  const err = await response.json().catch(() => ({}));
  return (err as { message?: string }).message || fallback;
}

export class PartnerStoriesApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  async createStory(body: CreateStoryRequest): Promise<StoryResponse> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/partner/stories`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось опубликовать сторис"));
    }
    return response.json();
  }

  async getMyStories(params?: { page?: number; size?: number }): Promise<StoriesPageResponse> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.size != null) search.set("size", String(params.size));
    const query = search.toString();
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/partner/stories${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить сторис"));
    }
    return response.json();
  }

  async getStoryAnalytics(storyId: string): Promise<StoryAnalyticsResponse> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/partner/stories/${encodeURIComponent(storyId)}/analytics`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить аналитику"));
    }
    return response.json();
  }

  async deleteStory(storyId: string): Promise<void> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/partner/stories/${encodeURIComponent(storyId)}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось удалить сторис"));
    }
  }
}
