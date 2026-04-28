import { handleSessionExpired } from "../../utils/sessionExpired";
import { authorizedFetch } from "../../utils/authorizedFetch";

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8080";

export type BookingStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export interface Booking {
  id: string;
  userId: string;
  userFullName: string;
  userPhone: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  serviceThumbnail: string;
  partnerId: string;
  partnerCompanyName: string;
  partnerPhone: string;
  eventDate: string;
  eventTime: string;
  status: BookingStatus | string;
  notes: string;
  guestsCount: number;
  totalPrice: number;
  rejectionReason?: string;
  extraParams?: Record<string, string>;
  clientConfirmed?: boolean;
  partnerConfirmed?: boolean;
  serviceUrl?: string;
  chatUrl?: string;
  expiresAt?: string;
  confirmedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  clientConfirmedAt?: string;
  partnerConfirmedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingRequest {
  serviceId: string;
  variantId?: string;
  eventDate: string;
  eventTime: string;
  guestsCount: number;
  customerNotes?: string;
  notes?: string;
  extraParams?: Record<string, string>;
}

export interface BookingsPageResponse {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: Booking[];
  number: number;
  empty: boolean;
  numberOfElements?: number;
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

export class BookingsApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  async createBooking(body: CreateBookingRequest): Promise<Booking> {
    const payload: CreateBookingRequest = {
      ...body,
      customerNotes: body.customerNotes ?? body.notes,
    };
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/bookings`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      if (response.status === 403) {
        throw new Error("Нет доступа к бронированиям для вашей роли.");
      }
      throw new Error(await parseError(response, "Не удалось создать бронирование"));
    }
    return response.json();
  }

  async getBookings(params?: {
    status?: BookingStatus;
    page?: number;
    size?: number;
  }): Promise<BookingsPageResponse> {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.size != null) search.set("size", String(params.size));
    const q = search.toString();
    const url = `${this.baseUrl}/api/v1/bookings${q ? `?${q}` : ""}`;
    const response = await authorizedFetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      if (response.status === 403) {
        throw new Error("Нет доступа к бронированиям для вашей роли.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить бронирования"));
    }
    return response.json();
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/bookings/${encodeURIComponent(bookingId)}`,
      { method: "GET", headers: getAuthHeaders() }
    );
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      if (response.status === 403) {
        throw new Error("Нет доступа к бронированиям для вашей роли.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить бронирование"));
    }
    return response.json();
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/bookings/${encodeURIComponent(bookingId)}/cancel`,
      { method: "PATCH", headers: getAuthHeaders() }
    );
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      if (response.status === 403) {
        throw new Error("Нет доступа к бронированиям для вашей роли.");
      }
      throw new Error(await parseError(response, "Не удалось отменить бронирование"));
    }
    return response.json();
  }

  async completeBooking(bookingId: string): Promise<Booking> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/bookings/${encodeURIComponent(bookingId)}/complete`,
      { method: "PATCH", headers: getAuthHeaders() }
    );
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      if (response.status === 403) {
        throw new Error("Нет доступа к подтверждению завершения этой брони.");
      }
      throw new Error(await parseError(response, "Не удалось подтвердить завершение"));
    }
    return response.json();
  }
}
