import type { NavigateFunction } from "react-router-dom";
import type { AppNotification } from "../../data/api/NotificationsApi";

function isPartnerOrAdminRole(role: string | null | undefined): boolean {
  const r = (role || "").toUpperCase();
  return r === "PARTNER" || r === "ADMIN";
}

/** Переход по ссылке из уведомления (типы с бэкенда могут отличаться — сравниваем по подстроке). */
export function navigateFromNotification(
  n: AppNotification,
  navigate: NavigateFunction,
  userRole?: string | null
): void {
  const type = (n.relatedEntityType || "").toUpperCase();
  const id = (n.relatedEntityId || "").trim();
  if (!id) return;

  if (type.includes("BOOKING")) {
    if (isPartnerOrAdminRole(userRole)) {
      navigate(
        `/partner/dashboard?tab=bookings&bookingId=${encodeURIComponent(id)}`
      );
    } else {
      navigate(`/profile/bookings/${encodeURIComponent(id)}`);
    }
    return;
  }
  if (type.includes("SERVICE")) {
    navigate(`/services/${encodeURIComponent(id)}`);
    return;
  }
}
