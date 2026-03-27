import { handleSessionExpired } from "../../utils/sessionExpired";
import type { Booking, BookingStatus, BookingsPageResponse } from "./BookingsApi";

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8080";

interface RejectBody {
  rejectionReason?: string;
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

export class PartnerBookingsApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

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
    const url = `${this.baseUrl}/api/v1/partner/bookings${q ? `?${q}` : ""}`;
    const response = await fetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      if (response.status === 403) {
        throw new Error("Нет доступа к бронированиям партнёра.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить бронирования"));
    }
    return response.json();
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/partner/bookings/${encodeURIComponent(bookingId)}`,
      { method: "GET", headers: getAuthHeaders() }
    );
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      if (response.status === 403) {
        throw new Error("Нет доступа к бронированиям партнёра.");
      }
      throw new Error(await parseError(response, "Не удалось загрузить детали брони"));
    }
    return response.json();
  }

  async confirmBooking(bookingId: string): Promise<Booking> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/partner/bookings/${encodeURIComponent(bookingId)}/confirm`,
      { method: "PATCH", headers: getAuthHeaders() }
    );
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      if (response.status === 403) {
        throw new Error("Нет доступа к подтверждению этой брони.");
      }
      throw new Error(await parseError(response, "Не удалось подтвердить бронирование"));
    }
    return response.json();
  }

  async rejectBooking(bookingId: string, body?: RejectBody): Promise<Booking> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/partner/bookings/${encodeURIComponent(bookingId)}/reject`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(body || {}),
      }
    );
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      if (response.status === 403) {
        throw new Error("Нет доступа к отклонению этой брони.");
      }
      throw new Error(await parseError(response, "Не удалось отклонить бронирование"));
    }
    return response.json();
  }

  async completeBooking(bookingId: string): Promise<Booking> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/partner/bookings/${encodeURIComponent(bookingId)}/complete`,
      { method: "PATCH", headers: getAuthHeaders() }
    );
    if (!response.ok) {
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
      }
      if (response.status === 403) {
        throw new Error("Нет доступа к завершению этой брони.");
      }
      throw new Error(await parseError(response, "Не удалось завершить бронирование"));
    }
    return response.json();
  }
}

