import { handleSessionExpired } from '../../utils/sessionExpired';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? ''
    : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface UploadResponse {
  url?: string;
  urls?: string[];
  message?: string;
}

/** Извлекает массив URL из ответа бэкенда (разные форматы: urls, url, data.urls, files[].url и т.д.) */
export function parseUploadResponse(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.urls)) {
    return o.urls.filter((u): u is string => typeof u === 'string' && u.length > 0);
  }
  if (typeof o.url === 'string' && o.url.length > 0) {
    return [o.url];
  }
  const dataObj = o.data as Record<string, unknown> | undefined;
  if (dataObj && typeof dataObj === 'object') {
    if (Array.isArray(dataObj.urls)) {
      return dataObj.urls.filter((u): u is string => typeof u === 'string' && u.length > 0);
    }
    if (typeof dataObj.url === 'string' && dataObj.url.length > 0) {
      return [dataObj.url];
    }
  }
  const files = o.files ?? o.uploadedFiles;
  if (Array.isArray(files)) {
    return files
      .map((f) => (typeof f === 'string' ? f : (f && typeof f === 'object' && 'url' in f ? (f as { url: string }).url : (f as { path?: string })?.path)))
      .filter((u): u is string => typeof u === 'string' && u.length > 0);
  }
  return [];
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Требуется авторизация');
  return { Authorization: `Bearer ${token}` };
}

function checkResponse(response: Response): void {
  if (response.status === 401 || response.status === 403) {
    handleSessionExpired();
    throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
  }
  if (!response.ok) {
    throw new Error('Ошибка загрузки файла');
  }
}

/** Проверка файла: формат JPG, PNG, WEBP, GIF и размер до 5 МБ */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `Формат не поддерживается. Разрешены: JPG, PNG, WEBP, GIF.`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `Размер файла не более ${MAX_SIZE_MB} МБ.`;
  }
  return null;
}

export class FilesApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * POST /api/v1/files/upload — загрузить одно изображение.
   * Макс. 5 МБ, форматы: JPG, PNG, WEBP, GIF.
   */
  async upload(file: File): Promise<UploadResponse> {
    const err = validateImageFile(file);
    if (err) throw new Error(err);

    const form = new FormData();
    form.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/v1/files/upload`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: form,
    });
    checkResponse(response);
    const json = await response.json();
    return json;
  }

  /**
   * POST /api/v1/files/upload-multiple — загрузить несколько изображений.
   * Возвращает массив URL (поддерживаются разные форматы ответа бэкенда).
   */
  async uploadMultiple(files: File[]): Promise<string[]> {
    for (const file of files) {
      const err = validateImageFile(file);
      if (err) throw new Error(`${file.name}: ${err}`);
    }

    const form = new FormData();
    files.forEach((f) => form.append('files', f));

    const response = await fetch(`${this.baseUrl}/api/v1/files/upload-multiple`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: form,
    });
    checkResponse(response);
    const json = await response.json();
    return parseUploadResponse(json);
  }
}
