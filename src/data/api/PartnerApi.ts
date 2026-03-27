import { handleSessionExpired } from '../../utils/sessionExpired';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? ''
    : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

export interface PartnerRegisterRequest {
  bin: string;
  companyName: string;
  city: string;
  phone: string;
  email: string;
  description: string;
  address: string;
  region: string;
  whatsapp: string;
  telegram: string;
  instagram: string;
  website: string;
  logoUrl: string;
}

export interface PartnerApplication {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  bin: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  approvedByEmail?: string;
}

export class PartnerApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async submitApplication(data: PartnerRegisterRequest): Promise<PartnerApplication> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Войдите в аккаунт, чтобы подать заявку');

    // Опциональные поля отправляем только если заполнены (бэкенд может не принимать пустые строки)
    const payload = {
      bin: data.bin,
      companyName: data.companyName,
      city: data.city,
      phone: data.phone,
      email: data.email,
      description: data.description,
      address: data.address,
      ...(data.region && { region: data.region }),
      ...(data.whatsapp && { whatsapp: data.whatsapp }),
      ...(data.telegram && { telegram: data.telegram }),
      ...(data.instagram && { instagram: data.instagram }),
      ...(data.website && { website: data.website }),
      ...(data.logoUrl && { logoUrl: data.logoUrl }),
    };

    const response = await fetch(`${this.baseUrl}/api/v1/partner/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
      }
      const errorBody = await response.json().catch(() => null);
      const message =
        (errorBody?.message ?? errorBody?.error) ||
        (Array.isArray(errorBody?.errors)
          ? errorBody.errors.map((e: { field?: string; message?: string }) => e.message || e).join(', ')
          : null) ||
        (typeof errorBody === 'object' && errorBody !== null
          ? Object.entries(errorBody)
              .filter(([k]) => !['timestamp', 'path', 'status'].includes(k))
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ')
          : null) ||
        'Не удалось отправить заявку';
      throw new Error(message);
    }

    return response.json();
  }

  async getMyApplication(): Promise<PartnerApplication | null> {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    const response = await fetch(`${this.baseUrl}/api/v1/partner/my-application`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
      }
      throw new Error('Не удалось загрузить заявку');
    }

    return response.json();
  }
}
