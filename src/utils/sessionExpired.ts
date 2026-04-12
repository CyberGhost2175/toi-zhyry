const SESSION_EXPIRED_EVENT = 'session-expired';

/** Очищает данные авторизации и уведомляет приложение о истёкшей сессии (401/403) */
export function handleSessionExpired(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

export function getSessionExpiredEventName(): string {
  return SESSION_EXPIRED_EVENT;
}
