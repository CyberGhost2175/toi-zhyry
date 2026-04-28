import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { decodeJwtPayload } from '../utils/jwt';
import { getSessionExpiredEventName } from '../utils/sessionExpired';
import { AUTH_TOKENS_UPDATED_EVENT, authorizedFetch } from '../utils/authorizedFetch';

const SESSION_EXPIRED_MESSAGE = 'Вы вышли из аккаунта. Необходимо авторизоваться заново.';

interface User {
    id?: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    role?: string;
    authProvider?: 'LOCAL' | 'GOOGLE';
    profileCompleted?: boolean;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    login: (token: string, user: User, profileCompleted?: boolean) => void;
    logout: () => Promise<void>;
    checkAuth: () => boolean;
    /** Сообщение при истечении сессии (403/401) — показать и перейти на логин */
    sessionExpiredMessage: string | null;
    clearSessionExpiredMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

    const logout = useCallback(async () => {
        const currentToken = token ?? localStorage.getItem('authToken');
        const apiBase = process.env.NODE_ENV === 'development' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:8080');
        if (currentToken) {
            try {
                await fetch(`${apiBase}/api/v1/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${currentToken}` },
                });
            } catch (_) {}
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('profileCompleted');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    }, [token]);

    const clearSessionExpiredMessage = useCallback(() => setSessionExpiredMessage(null), []);

    useEffect(() => {
        const onSessionExpired = () => {
            setSessionExpiredMessage(SESSION_EXPIRED_MESSAGE);
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('profileCompleted');
        };
        window.addEventListener(getSessionExpiredEventName(), onSessionExpired);
        return () => window.removeEventListener(getSessionExpiredEventName(), onSessionExpired);
    }, []);

    const checkAuth = useCallback((): boolean => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (!storedToken) return false;

        // Есть токен: восстанавливаем user из localStorage или из payload JWT (бэкенд отдаёт только token)
        try {
            let parsedUser: User | null = null;
            if (storedUser) {
                parsedUser = JSON.parse(storedUser);
            }
            const payload = decodeJwtPayload(storedToken);
            const roleFromToken = payload?.role;
            const emailFromToken = payload?.email;
            const idFromToken = payload?.sub;
            if (!parsedUser || parsedUser.role === undefined) {
                parsedUser = {
                    email: parsedUser?.email ?? emailFromToken ?? '',
                    firstName: parsedUser?.firstName ?? '',
                    lastName: parsedUser?.lastName ?? '',
                    role: parsedUser?.role ?? roleFromToken,
                    id: parsedUser?.id ?? idFromToken,
                    phone: parsedUser?.phone,
                    city: parsedUser?.city,
                    authProvider: parsedUser?.authProvider,
                    profileCompleted: parsedUser?.profileCompleted,
                };
                try {
                    localStorage.setItem('user', JSON.stringify(parsedUser));
                } catch (_) {}
            }
            setToken(storedToken);
            setUser(parsedUser);
            setIsAuthenticated(true);
            return true;
        } catch (error) {
            console.error('Error parsing user data:', error);
            logout();
            return false;
        }
    }, [logout]);

    useEffect(() => {
        const onTokensUpdated = () => {
            const t = localStorage.getItem('authToken');
            if (t) setToken(t);
        };
        window.addEventListener(AUTH_TOKENS_UPDATED_EVENT, onTokensUpdated);
        return () => window.removeEventListener(AUTH_TOKENS_UPDATED_EVENT, onTokensUpdated);
    }, []);

    // При загрузке восстанавливаем сессию из localStorage
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // При каждой загрузке с активной сессией запрашиваем актуальные данные пользователя с бэкенда
    // (роль могла измениться в админ-панели — тогда UI обновится после перезагрузки страницы)
    useEffect(() => {
        if (!isAuthenticated || !token || !user) return;

        const apiBase = process.env.NODE_ENV === 'development' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:8080');
        authorizedFetch(`${apiBase}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) return null;
                return res.json();
            })
            .then((data: { user?: User & { role?: string; authProvider?: 'LOCAL' | 'GOOGLE'; profileCompleted?: boolean }; role?: string; email?: string; firstName?: string; lastName?: string; authProvider?: 'LOCAL' | 'GOOGLE'; profileCompleted?: boolean } | null) => {
                if (!data) return;
                const role = data.user?.role ?? data.role;
                const updatedUser: User = {
                    ...user,
                    role: role ?? user.role,
                    email: data.user?.email ?? data.email ?? user.email,
                    firstName: data.user?.firstName ?? data.firstName ?? user.firstName,
                    lastName: data.user?.lastName ?? data.lastName ?? user.lastName,
                    authProvider: data.user?.authProvider ?? data.authProvider ?? user.authProvider,
                    profileCompleted: data.user?.profileCompleted ?? data.profileCompleted ?? user.profileCompleted,
                };
                setUser(updatedUser);
                try {
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (_) {}
            })
            .catch(() => {});
    }, [isAuthenticated, token]);

    const login = (newToken: string, newUser: User, profileCompleted?: boolean) => {
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        if (typeof profileCompleted === 'boolean') {
            localStorage.setItem('profileCompleted', String(profileCompleted));
        }
        setToken(newToken);
        setUser(newUser);
        setIsAuthenticated(true);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, checkAuth, sessionExpiredMessage, clearSessionExpiredMessage }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export {};