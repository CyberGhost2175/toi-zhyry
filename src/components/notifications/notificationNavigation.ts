import type { NavigateFunction } from "react-router-dom";
import type { AppNotification } from "../../data/api/NotificationsApi";

/** Переход по ссылке из уведомления (типы с бэкенда могут отличаться — сравниваем по подстроке). */
export function navigateFromNotification(
  n: AppNotification,
  navigate: NavigateFunction
): void {
  const type = (n.relatedEntityType || "").toUpperCase();
  const id = (n.relatedEntityId || "").trim();
  if (!id) return;

  if (type.includes("BOOKING")) {
    navigate(`/profile/bookings/${encodeURIComponent(id)}`);
    return;
  }
  if (type.includes("SERVICE")) {
    navigate(`/services/${encodeURIComponent(id)}`);
    return;
  }
}
