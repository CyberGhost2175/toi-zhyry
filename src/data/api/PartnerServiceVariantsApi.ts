import { authorizedFetch } from "../../utils/authorizedFetch";
import { handleSessionExpired } from "../../utils/sessionExpired";
import type { AttributeDefinition, ServiceVariant } from "./ServiceVariantsApi";

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8080";

export interface CreatePartnerVariantRequest {
  name: string;
  description?: string;
  price: number;
  attributes: Record<string, unknown>;
  imageUrls?: string[];
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdatePartnerVariantRequest extends Partial<CreatePartnerVariantRequest> {}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Требуется авторизация");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function ensureAuth(response: Response): void {
  if (response.status === 401 || response.status === 403) {
    handleSessionExpired();
    throw new Error("Вы вышли из аккаунта. Необходимо авторизоваться заново.");
  }
}

async function parseError(response: Response, fallback: string): Promise<string> {
  const err = await response.json().catch(() => ({}));
  return (err as { message?: string }).message || fallback;
}

export class PartnerServiceVariantsApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  async getAttributeSchema(categorySlug: string): Promise<AttributeDefinition[]> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/categories/${encodeURIComponent(categorySlug)}/attribute-schema`,
      { method: "GET", headers: getAuthHeaders() }
    );
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось загрузить схему атрибутов"));
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async getServiceVariants(serviceId: string): Promise<ServiceVariant[]> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/partner/services/${encodeURIComponent(serviceId)}/variants`,
      { method: "GET", headers: getAuthHeaders() }
    );
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось загрузить варианты"));
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async createVariant(serviceId: string, body: CreatePartnerVariantRequest): Promise<ServiceVariant> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/partner/services/${encodeURIComponent(serviceId)}/variants`,
      { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(body) }
    );
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось создать вариант"));
    return response.json();
  }

  async updateVariant(serviceId: string, variantId: string, body: UpdatePartnerVariantRequest): Promise<ServiceVariant> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/partner/services/${encodeURIComponent(serviceId)}/variants/${encodeURIComponent(variantId)}`,
      { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(body) }
    );
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось обновить вариант"));
    return response.json();
  }

  async deleteVariant(serviceId: string, variantId: string): Promise<void> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/partner/services/${encodeURIComponent(serviceId)}/variants/${encodeURIComponent(variantId)}`,
      { method: "DELETE", headers: getAuthHeaders() }
    );
    ensureAuth(response);
    if (!response.ok) throw new Error(await parseError(response, "Не удалось удалить вариант"));
  }
}
