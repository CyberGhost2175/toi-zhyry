export function bookingStatusLabel(status: string): string {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "PENDING_CONFIRMATION":
      return "Ожидает подтверждения";
    case "CONFIRMED":
      return "Подтверждено";
    case "REJECTED":
      return "Отклонено";
    case "COMPLETED":
      return "Завершено";
    case "CANCELLED":
      return "Отменено";
    case "EXPIRED":
      return "Истекло";
    default:
      return status || "—";
  }
}

export function canCancelBooking(status: string): boolean {
  const s = (status || "").toUpperCase();
  return s === "PENDING_CONFIRMATION" || s === "CONFIRMED";
}
