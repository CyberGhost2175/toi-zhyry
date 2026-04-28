import { authorizedFetch } from "../../utils/authorizedFetch";
import { handleSessionExpired } from "../../utils/sessionExpired";
import type { AttributeDefinition, MatchStrategy } from "./ServiceVariantsApi";

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8080";

export interface AdminAttributeListResponse {
  content: AttributeDefinition[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateAdminAttributeRequest {
  key: string;
  type: AttributeDefinition["type"];
  matchStrategy: MatchStrategy;
  storageKeys: { min?: string; max?: string; value?: string };
  labelRu: string;
  labelKk?: string;
  unit?: string | null;
  validationRules?: Record<string, unknown> | null;
}

export interface UpdateAdminAttributeRequest {
  labelRu?: string;
  labelKk?: string;
  unit?: string | null;
  validationRules?: Record<string, unknown> | null;
}

export interface CategoryAttributeBinding {
  attributeId: string;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
  attribute?: AttributeDefinition;
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

function ensureAuth(response: Response): void {
  if (response.status === 401 || response.status === 403) {
    handleSessionExpired();
    throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
  }
}

export class AttributesApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  async getAdminAttributes(params: { search?: string; page?: number; size?: number } = {}): Promise<AdminAttributeListResponse> {
    const search = new URLSearchParams();
    if (params.search) search.set("search", params.search);
    search.set("page", String(params.page ?? 0));
    search.set("size", String(params.size ?? 20));
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/admin/attributes?${search.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось загрузить атрибуты"));
    return response.json();
  }

  async createAdminAttribute(body: CreateAdminAttributeRequest): Promise<AttributeDefinition> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/admin/attributes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось создать атрибут"));
    return response.json();
  }

  async updateAdminAttribute(attributeId: string, body: UpdateAdminAttributeRequest): Promise<AttributeDefinition> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/admin/attributes/${encodeURIComponent(attributeId)}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось обновить атрибут"));
    return response.json();
  }

  async deleteAdminAttribute(attributeId: string): Promise<void> {
    const response = await authorizedFetch(`${this.baseUrl}/api/v1/admin/attributes/${encodeURIComponent(attributeId)}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось удалить атрибут"));
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttributeBinding[]> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/categories/${encodeURIComponent(categoryId)}/attributes`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось загрузить привязки атрибутов"));
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async bindAttributeToCategory(
    categoryId: string,
    body: { attributeId: string; isRequired: boolean; isFilterable: boolean; sortOrder: number }
  ): Promise<CategoryAttributeBinding> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/categories/${encodeURIComponent(categoryId)}/attributes`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось привязать атрибут"));
    return response.json();
  }

  async updateCategoryAttributeBinding(
    categoryId: string,
    attributeId: string,
    body: { isRequired: boolean; isFilterable: boolean; sortOrder: number }
  ): Promise<CategoryAttributeBinding> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/categories/${encodeURIComponent(categoryId)}/attributes/${encodeURIComponent(attributeId)}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось обновить привязку"));
    return response.json();
  }

  async unbindAttributeFromCategory(categoryId: string, attributeId: string): Promise<void> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/admin/categories/${encodeURIComponent(categoryId)}/attributes/${encodeURIComponent(attributeId)}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось отвязать атрибут"));
  }
}
