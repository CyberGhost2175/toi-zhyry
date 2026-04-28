import { RegisterUserData, LoginUserData, AuthResponse } from '../../domain/entities/User';
import { handleSessionExpired } from '../../utils/sessionExpired';
import { authorizedFetch } from '../../utils/authorizedFetch';
import { normalizeKzPhone } from '../../utils/kzData';

// In development, use relative URLs so the CRA dev server proxies to the backend (avoids CORS).
const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? ''
    : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

export class AuthApi {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async register(data: RegisterUserData): Promise<AuthResponse> {
        const payload: RegisterUserData = {
            ...data,
            phone: normalizeKzPhone(data.phone || ''),
        };
        const response = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Ошибка регистрации' }));
            throw new Error(error.message || 'Не удалось зарегистрироваться');
        }

        return response.json();
    }

    async login(data: LoginUserData): Promise<AuthResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Ошибка входа' }));
            throw new Error(error.message || 'Неверный email или пароль');
        }

        return response.json();
    }

    async loginWithGoogle(idToken: string): Promise<AuthResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Ошибка входа через Google' }));
            throw new Error(error.message || 'Не удалось войти через Google');
        }

        return response.json();
    }

    async completeProfile(data: { phone: string; city: string; password?: string }): Promise<AuthResponse> {
        const normalizedPassword = (data.password || '').trim();
        const response = await authorizedFetch(`${this.baseUrl}/api/v1/users/complete-profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: normalizeKzPhone(data.phone),
                city: data.city.trim(),
                /**
                 * Совместимость с разными бэкенд-контрактами:
                 * часть реализаций ожидает password, часть current/new/rawPassword.
                 */
                password: normalizedPassword,
                currentPassword: normalizedPassword,
                newPassword: normalizedPassword,
                rawPassword: normalizedPassword,
            }),
        });

        if (!response.ok) {
            const errorJson = await response.json().catch(() => null) as { message?: string; error?: string } | null;
            if (errorJson?.message || errorJson?.error) {
                throw new Error(errorJson.message || errorJson.error || 'Не удалось завершить регистрацию');
            }
            const errorText = await response.text().catch(() => '');
            throw new Error(errorText || 'Не удалось завершить регистрацию');
        }

        return response.json();
    }

    async verifyEmail(token: string): Promise<{ message: string }> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Ошибка подтверждения email' }));
            throw new Error(error.message || 'Не удалось подтвердить email');
        }

        return response.json();
    }

    async resendVerification(email: string): Promise<{ message: string }> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Ошибка повторной отправки письма' }));
            throw new Error(error.message || 'Не удалось отправить письмо повторно');
        }

        return response.json();
    }

    async logout(): Promise<void> {
        const token = localStorage.getItem('authToken');

        if (!token) return;

        await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('profileCompleted');
    }

    async getCurrentUser(): Promise<AuthResponse | null> {
        const token = localStorage.getItem('authToken');

        if (!token) return null;

        const response = await authorizedFetch(`${this.baseUrl}/api/v1/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleSessionExpired();
            } else {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
            return null;
        }

        return response.json();
    }

    async getProfile(): Promise<AuthResponse> {
        const token = localStorage.getItem('authToken');

        if (!token) {
            throw new Error('Токен не найден');
        }

        const response = await authorizedFetch(`${this.baseUrl}/api/v1/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleSessionExpired();
                throw new Error('Вы вышли из аккаунта. Необходимо авторизоваться заново.');
            }
            throw new Error('Не удалось загрузить профиль');
        }

        return response.json();
    }
}