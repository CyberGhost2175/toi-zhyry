import { RegisterUserData, LoginUserData, AuthResponse } from '../../domain/entities/User';
import { handleSessionExpired } from '../../utils/sessionExpired';

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
        const response = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
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
        localStorage.removeItem('user');
    }

    async getCurrentUser(): Promise<AuthResponse | null> {
        const token = localStorage.getItem('authToken');

        if (!token) return null;

        const response = await fetch(`${this.baseUrl}/api/v1/auth/me`, {
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

        const response = await fetch(`${this.baseUrl}/api/v1/users/me`, {
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