/**
 * Декодирует payload JWT без проверки подписи (для чтения role/email на клиенте).
 * Сервер уже проверил токен при выдаче.
 */
export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Извлекает роль из токена. Бэкенд может отдавать "ADMIN" в верхнем регистре. */
export function getRoleFromToken(token: string): string | undefined {
  const payload = decodeJwtPayload(token);
  const role = payload?.role;
  return typeof role === 'string' ? role : undefined;
}
