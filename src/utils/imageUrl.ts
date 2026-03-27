/**
 * Возвращает URL изображения для отображения в <img src="...">.
 * Если бэкенд вернул относительный путь (например /uploads/xxx), в development
 * он идёт через proxy на бэкенд; в production подставляется базовый URL API.
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const raw = url.trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

  // Для относительных путей изображений всегда предпочитаем API-хост,
  // иначе в dev/prod фронт может искать /uploads на домене фронта.
  if (apiBase) return `${apiBase}${normalized}`;

  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:8080${normalized}`;
  }

  return normalized;
}
