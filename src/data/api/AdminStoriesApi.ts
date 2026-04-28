import { handleSessionExpired } from "../../utils/sessionExpired";
import { authorizedFetch } from "../../utils/authorizedFetch";
import type { StoriesPageResponse, StoryResponse, StoryStatus } from "./StoriesApi";

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

export class AdminStoriesApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  async getStories(params?: {
    status?: StoryStatus;
    page?: number;
    size?: number;
  }): Promise<StoriesPageResponse> {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.size != null) search.set("size", String(params.size));
    const query = search.toString();
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/stories${query ? `?${query}` : ""}`,
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

  async removeStory(storyId: string): Promise<StoryResponse> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/stories/${encodeURIComponent(storyId)}`,
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
      throw new Error(await parseError(response, "Не удалось снять сторис"));
    }
    return response.json();
  }
}
