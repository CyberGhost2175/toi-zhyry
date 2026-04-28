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
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseError(response: Response, fallback: string): Promise<string> {
  const err = await response.json().catch(() => ({}));
  return (err as { message?: string }).message || fallback;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ChatResponse {
  id: string;
  userId: string;
  userFullName: string;
  partnerId: string;
  partnerCompanyName: string;
  partnerLogoUrl: string | null;
  lastMessageContent: string | null;
  lastMessageSenderId: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface ChatMessageResponse {
  id: string;
  chatId: string;
  senderId: string;
  senderFullName: string;
  content: string | null;
  attachmentUrls: string[] | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export class ChatsApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  async createOrGetChat(partnerId: string): Promise<ChatResponse> {
    const url = `${this.baseUrl}/api/v1/chats`;
    const response = await authorizedFetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ partnerId }),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось открыть чат с партнером"));
    }
    return response.json();
  }

  async getMyChats(asPartner: boolean, params?: { page?: number; size?: number }): Promise<PageResponse<ChatResponse>> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.size != null) search.set("size", String(params.size));
    const q = search.toString();
    const side = asPartner ? "partner" : "client";
    const url = `${this.baseUrl}/api/v1/chats/my/${side}${q ? `?${q}` : ""}`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить чаты"));
    }
    return response.json();
  }

  async getMessages(chatId: string, params?: { page?: number; size?: number }): Promise<PageResponse<ChatMessageResponse>> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.size != null) search.set("size", String(params.size));
    const q = search.toString();
    const url = `${this.baseUrl}/api/v1/chats/${encodeURIComponent(chatId)}/messages${q ? `?${q}` : ""}`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить сообщения"));
    }
    return response.json();
  }

  async sendMessage(chatId: string, payload: { content?: string | null; attachmentUrls?: string[] | null }): Promise<ChatMessageResponse> {
    const url = `${this.baseUrl}/api/v1/chats/${encodeURIComponent(chatId)}/messages`;
    const response = await authorizedFetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось отправить сообщение"));
    }
    return response.json();
  }

  async markAsRead(chatId: string): Promise<{ markedAsRead: number }> {
    const url = `${this.baseUrl}/api/v1/chats/${encodeURIComponent(chatId)}/read`;
    const response = await authorizedFetch(url, { method: "POST", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось обновить статус прочтения"));
    }
    return response.json();
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const url = `${this.baseUrl}/api/v1/chats/unread-count`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось получить счетчик чатов"));
    }
    return response.json();
  }
}
