/** Ключи совпадают с текущим использованием в приложении */
export const AUTH_TOKEN_STORAGE_KEY = 'authToken';
export const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';

/** После silent refresh — обновить React-состояние токена в AuthContext */
export const AUTH_TOKENS_UPDATED_EVENT = 'auth-tokens-updated';

export function getApiBaseUrl(): string {
  return process.env.NODE_ENV === 'development'
    ? ''
    : process.env.REACT_APP_API_URL || 'http://localhost:8080';
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Один запрос refresh на все параллельные 401; обновляет access (и refresh при ротации) в localStorage.
 */
export function tryRefreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
        if (!refreshToken) return false;

        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) return false;

        const data = (await res.json()) as { token?: string; refreshToken?: string; profileCompleted?: boolean };
        if (!data?.token) return false;

        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.token);
        if (data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
        }
        if (typeof data.profileCompleted === 'boolean') {
          localStorage.setItem('profileCompleted', String(data.profileCompleted));
        }

        window.dispatchEvent(new CustomEvent(AUTH_TOKENS_UPDATED_EVENT));
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function resolveUrlString(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/** Не пытаемся refresh на публичных auth-эндпоинтах и на logout */
function shouldSkipAuthRefreshForUrl(url: string): boolean {
  let path: string;
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      path = new URL(url).pathname;
    } else {
      path = url.split('?')[0];
    }
  } catch {
    path = url;
  }
  return (
    /\/api\/v1\/auth\/(?:login|register|google|refresh)(?:\/|$)/.test(path) ||
    /\/api\/v1\/auth\/logout(?:\/|$)/.test(path)
  );
}

/**
 * fetch с Bearer из localStorage; при 401 один раз обновляет пару токенов и повторяет запрос.
 */
export async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const urlStr = resolveUrlString(input);
  const skipRefresh = shouldSkipAuthRefreshForUrl(urlStr);

  const buildHeaders = (): Headers => {
    const h = new Headers(init.headers);
    if (!h.has('Authorization')) {
      const t = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (t) h.set('Authorization', `Bearer ${t}`);
    }
    return h;
  };

  let headers = buildHeaders();
  let res = await fetch(input, { ...init, headers });

  if (res.status === 401 && !skipRefresh && headers.has('Authorization')) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      headers = buildHeaders();
      res = await fetch(input, { ...init, headers });
    }
  }

  return res;
}
