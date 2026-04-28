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

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType: string;
  relatedEntityId: string;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationsPageSortMeta {
  empty: boolean;
  unsorted: boolean;
  sorted: boolean;
}

export interface NotificationsPageableMeta {
  offset: number;
  sort: NotificationsPageSortMeta;
  unpaged: boolean;
  paged: boolean;
  pageSize: number;
  pageNumber: number;
}

/** Spring Data page — ответ GET /notifications и GET /notifications/unread */
export interface NotificationsPageResponse {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: AppNotification[];
  number: number;
  numberOfElements?: number;
  empty: boolean;
  sort?: NotificationsPageSortMeta;
  pageable?: NotificationsPageableMeta;
}

export interface UnreadCountResponse {
  count: number;
}

export interface ReadAllResponse {
  message: string;
}

/** GET/PATCH /api/v1/notifications/settings — каналы и категории уведомлений */
export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  bookingUpdates: boolean;
  chatMessages: boolean;
  promotions: boolean;
  eventReminders: boolean;
  newBookings: boolean;
}

/** PATCH: передавать только изменяемые поля */
export type NotificationSettingsPatch = Partial<NotificationSettings>;

export class NotificationsApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  /** GET /api/v1/notifications */
  async getNotifications(params?: { page?: number; size?: number }): Promise<NotificationsPageResponse> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.size != null) search.set("size", String(params.size));
    const q = search.toString();
    const url = `${this.baseUrl}/api/v1/notifications${q ? `?${q}` : ""}`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить уведомления"));
    }
    return response.json();
  }

  /** GET /api/v1/notifications/unread */
  async getUnreadNotifications(params?: { page?: number; size?: number }): Promise<NotificationsPageResponse> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.size != null) search.set("size", String(params.size));
    const q = search.toString();
    const url = `${this.baseUrl}/api/v1/notifications/unread${q ? `?${q}` : ""}`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить непрочитанные уведомления"));
    }
    return response.json();
  }

  /** GET /api/v1/notifications/unread/count */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const url = `${this.baseUrl}/api/v1/notifications/unread/count`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось получить число уведомлений"));
    }
    return response.json();
  }

  /** PATCH /api/v1/notifications/{notificationId}/read */
  async markAsRead(notificationId: string): Promise<AppNotification> {
    const url = `${this.baseUrl}/api/v1/notifications/${encodeURIComponent(notificationId)}/read`;
    const response = await authorizedFetch(url, { method: "PATCH", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось пометить уведомление прочитанным"));
    }
    return response.json();
  }

  /** PATCH /api/v1/notifications/read-all */
  async markAllAsRead(): Promise<ReadAllResponse> {
    const url = `${this.baseUrl}/api/v1/notifications/read-all`;
    const response = await authorizedFetch(url, { method: "PATCH", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось пометить все прочитанными"));
    }
    return response.json();
  }

  /** GET /api/v1/notifications/settings */
  async getNotificationSettings(): Promise<NotificationSettings> {
    const url = `${this.baseUrl}/api/v1/notifications/settings`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить настройки уведомлений"));
    }
    return response.json();
  }

  /** PATCH /api/v1/notifications/settings — только изменённые поля */
  async updateNotificationSettings(patch: NotificationSettingsPatch): Promise<NotificationSettings> {
    const url = `${this.baseUrl}/api/v1/notifications/settings`;
    const response = await authorizedFetch(url, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      throw new Error(await parseError(response, "Не удалось сохранить настройки"));
    }
    return response.json();
  }
}
