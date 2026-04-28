import { authorizedFetch } from "../../utils/authorizedFetch";

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8080";

export type AttributeType = "INTEGER" | "STRING" | "BOOLEAN" | "STRING_ARRAY";
export type MatchStrategy =
  | "SINGLE_EQ"
  | "SINGLE_GTE"
  | "SINGLE_LTE"
  | "RANGE_CONTAINS"
  | "BOOLEAN_MATCH"
  | "ARRAY_CONTAINS"
  | "ARRAY_INTERSECTS";

export interface AttributeStorageKeys {
  min?: string;
  max?: string;
  value?: string;
}

export interface AttributeValidationRules {
  min?: number;
  max?: number;
  maxLength?: number;
  options?: string[];
  pattern?: string;
}

export interface AttributeDefinition {
  attributeId: string;
  key: string;
  type: AttributeType;
  matchStrategy: MatchStrategy;
  storageKeys: AttributeStorageKeys;
  labelRu: string;
  labelKk?: string | null;
  unit?: string | null;
  validationRules?: AttributeValidationRules | null;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
}

export interface ServiceVariant {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  price: number;
  attributes?: Record<string, unknown>;
  imageUrls?: string[];
  sortOrder?: number;
  isActive?: boolean;
}

function getHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  return headers;
}

async function parseError(response: Response, fallback: string): Promise<string> {
  const err = await response.json().catch(() => ({}));
  return (err as { message?: string }).message || fallback;
}

export class ServiceVariantsApi {
  constructor(private baseUrl: string = API_BASE_URL) {}

  async getServiceVariants(serviceId: string): Promise<ServiceVariant[]> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/services/${encodeURIComponent(serviceId)}/variants`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );
    if (!response.ok) throw new Error(await parseError(response, "Не удалось загрузить варианты услуги"));
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async searchServiceVariants(serviceId: string, filters?: Record<string, unknown>): Promise<ServiceVariant[]> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/services/${encodeURIComponent(serviceId)}/variants/search`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ filters: filters && Object.keys(filters).length > 0 ? filters : {} }),
      }
    );
    if (!response.ok) throw new Error(await parseError(response, "Не удалось подобрать варианты"));
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async getClientAttributeSchema(categorySlug: string): Promise<AttributeDefinition[]> {
    const response = await authorizedFetch(
      `${this.baseUrl}/api/v1/categories/${encodeURIComponent(categorySlug)}/client-attribute-schema`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );
    if (!response.ok) throw new Error(await parseError(response, "Не удалось загрузить схему фильтров"));
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
}
