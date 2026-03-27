import { handleSessionExpired } from "../../utils/sessionExpired";

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8080";

export type AvailabilityStatus = "AVAILABLE" | "BLOCKED";

export interface ServiceAvailabilityItem {
  id: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  status: AvailabilityStatus;
  note?: string;
}

// Бэкенд ожидает SetAvailabilityRequest:
// {
//   dates: ["YYYY-MM-DD", ...],
//   status: "AVAILABLE" | "BLOCKED",
//   note?: "..."
// }
export interface SetAvailabilityRequest {
  dates: string[]; // YYYY-MM-DD[]
  status: AvailabilityStatus;
  note?: string;
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

export class ServicesAvailabilityApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  async getAvailability(
    serviceId: string,
    params: { from: string; to: string }
  ): Promise<ServiceAvailabilityItem[]> {
    const url = `${this.baseUrl}/api/v1/services/${encodeURIComponent(
      serviceId
    )}/availability?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(params.to)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getOptionalAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error(
          "Вы вышли из аккаунта. Необходимо авторизоваться заново."
        );
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Не удалось загрузить доступность");
    }

    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? (data as ServiceAvailabilityItem[]) : [];
  }

  /**
   * PUT /api/v1/services/{serviceId}/availability
   * В бэкенд уходит набор дат со статусом и (опционально) заметкой.
   */
  async setAvailability(
    serviceId: string,
    body: SetAvailabilityRequest
  ): Promise<ServiceAvailabilityItem[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/services/${encodeURIComponent(
        serviceId
      )}/availability`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error(
          "Вы вышли из аккаунта. Необходимо авторизоваться заново."
        );
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Не удалось сохранить доступность");
    }

    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? (data as ServiceAvailabilityItem[]) : [];
  }

  /**
   * DELETE /api/v1/services/{serviceId}/availability/{date}
   */
  async deleteAvailability(serviceId: string, date: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/services/${encodeURIComponent(
        serviceId
      )}/availability/${encodeURIComponent(date)}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error(
          "Вы вышли из аккаунта. Необходимо авторизоваться заново."
        );
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Не удалось удалить доступность");
    }
  }
}

