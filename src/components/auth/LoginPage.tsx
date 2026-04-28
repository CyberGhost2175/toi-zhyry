import { useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { diContainer } from '../../di/DIContainer';
import { useAuth } from '../../contexts/AuthContext';
import { decodeJwtPayload } from '../../utils/jwt';
import { AuthApi } from '../../data/api/AuthApi';

interface LoginPageProps {
    onNavigate: (page: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendMessage, setResendMessage] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });

    const loginUseCase = diContainer.getLoginUseCase();
    const { login } = useAuth();
    const authApi = useMemo(() => new AuthApi(), []);
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    const buildUserFromAuthResponse = (
        response: {
            token?: string;
            user?: {
                id?: string;
                email?: string;
                firstName?: string;
                lastName?: string;
                role?: string;
                phone?: string;
                city?: string;
                authProvider?: 'LOCAL' | 'GOOGLE';
                profileCompleted?: boolean;
            };
            role?: string;
            authProvider?: 'LOCAL' | 'GOOGLE';
            profileCompleted?: boolean;
        },
        fallbackEmail: string
    ) => {
        const payload = response.user ? null : decodeJwtPayload(response.token ?? '');
        const role = response.user?.role ?? response.role ?? payload?.role;
        const email = response.user?.email ?? payload?.email ?? fallbackEmail;
        const id = response.user?.id ?? payload?.sub;

        return response.user
            ? {
                  email: response.user.email ?? email,
                  firstName: response.user.firstName ?? '',
                  lastName: response.user.lastName ?? '',
                  role,
                  id: response.user.id ?? id,
                  phone: response.user.phone,
                  city: response.user.city,
                  authProvider: response.user.authProvider ?? response.authProvider,
                  profileCompleted: response.user.profileCompleted ?? response.profileCompleted,
              }
            : {
                  email,
                  firstName: '',
                  lastName: '',
                  role,
                  id: id as string | undefined,
                  authProvider: response.authProvider,
                  profileCompleted: response.profileCompleted,
              };
    };

    const isEmailNotVerifiedError = (message: string | null): boolean => {
        if (!message) return false;
        const normalized = message.toLowerCase();
        return (
            normalized.includes('email') &&
            (normalized.includes('подтверж') ||
                normalized.includes('верифиц') ||
                normalized.includes('verify') ||
                normalized.includes('verification'))
        );
    };

    const handleResendVerification = async () => {
        const email = formData.email.trim();
        if (!email) {
            setError('Укажите email, чтобы отправить письмо повторно');
            return;
        }

        setIsResending(true);
        setResendMessage(null);
        try {
            const response = await authApi.resendVerification(email);
            setResendMessage(response.message || 'Письмо отправлено повторно. Проверьте почту.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось отправить письмо повторно');
        } finally {
            setIsResending(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResendMessage(null);
        setIsLoading(true);

        try {
            const response = await loginUseCase.execute({
                email: formData.email,
                password: formData.password,
            });

            // Сохраняем данные авторизации: бэкенд возвращает только token, роль берём из JWT
            if (response.token) {
                const user = buildUserFromAuthResponse(response, formData.email);
                login(response.token, user, response.profileCompleted);
            }

            if (response.profileCompleted === false) {
                sessionStorage.setItem('pendingCompleteProfilePassword', formData.password);
                onNavigate('complete-profile');
            } else {
                sessionStorage.removeItem('pendingCompleteProfilePassword');
                onNavigate('home');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка при входе');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        const idToken = credentialResponse.credential;
        if (!idToken) {
            setError('Не удалось получить токен Google');
            return;
        }

        setError(null);
        setResendMessage(null);
        setIsLoading(true);
        try {
            const response = await authApi.loginWithGoogle(idToken);
            if (!response.token) {
                throw new Error('Токен авторизации не получен');
            }

            const user = buildUserFromAuthResponse(response, '');
            login(response.token, user, response.profileCompleted);

            if (response.profileCompleted === false) {
                sessionStorage.removeItem('pendingCompleteProfilePassword');
                onNavigate('complete-profile');
            } else {
                sessionStorage.removeItem('pendingCompleteProfilePassword');
                onNavigate('home');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка входа через Google');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Не удалось выполнить вход через Google');
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#F9F9F9' }}>
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <button onClick={() => onNavigate('home')} className="inline-block">
                        <h1 className="text-3xl mb-2" style={{ color: '#00AFAE' }}>
                            Toi Zhyry
                        </h1>
                    </button>
                    <p className="text-gray-600">Добро пожаловать! Войдите в свой аккаунт</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}
                    {resendMessage && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                            {resendMessage}
                        </div>
                    )}

                    {isEmailNotVerifiedError(error) && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800 mb-3">
                                Email не подтвержден. Отправить письмо для подтверждения повторно?
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-10 border-amber-300 hover:bg-amber-100 text-amber-900"
                                disabled={isResending || isLoading}
                                onClick={handleResendVerification}
                            >
                                {isResending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Отправка...
                                    </>
                                ) : (
                                    'Отправить письмо повторно'
                                )}
                            </Button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="example@mail.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={isLoading}
                                className="h-12"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Пароль</Label>
                                <button
                                    type="button"
                                    className="text-sm hover:underline"
                                    style={{ color: '#00AFAE' }}
                                    onClick={() => {/* TODO: Implement forgot password */}}
                                    disabled={isLoading}
                                >
                                    Забыли пароль?
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Введите пароль"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    className="h-12 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={formData.rememberMe}
                                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                                disabled={isLoading}
                                className="w-4 h-4 rounded border-gray-300"
                                style={{ accentColor: '#00AFAE' }}
                            />
                            <label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                                Запомнить меня
                            </label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 text-white hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#00AFAE' }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Вход...
                                </>
                            ) : (
                                'Войти'
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-gray-500">
              или
            </span>
                    </div>

                    {/* Social Login */}
                    <div className="space-y-3">
                        {googleClientId ? (
                            <div className={isLoading ? 'pointer-events-none opacity-70' : ''}>
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    text="continue_with"
                                    theme="outline"
                                    shape="rectangular"
                                    size="large"
                                />
                            </div>
                        ) : (
                            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                Добавьте `REACT_APP_GOOGLE_CLIENT_ID` в `.env.local`, чтобы включить вход через Google.
                            </div>
                        )}
                    </div>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Нет аккаунта?{' '}
                            <button
                                type="button"
                                onClick={() => onNavigate('register')}
                                className="hover:underline"
                                style={{ color: '#00AFAE' }}
                                disabled={isLoading}
                            >
                                Зарегистрироваться
                            </button>
                        </p>
                    </div>
                </div>

                {/* Decorative Pattern */}
                <div className="mt-8 text-center opacity-20">
                    <svg width="100" height="20" viewBox="0 0 100 20" fill="none" className="inline-block">
                        <pattern id="kazakh-pattern-login" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M10 0L12 8L10 10L8 8L10 0Z" fill="#00AFAE" />
                            <circle cx="10" cy="10" r="2" fill="#FFD700" />
                        </pattern>
                        <rect width="100" height="20" fill="url(#kazakh-pattern-login)" />
                    </svg>
                </div>
            </div>
        </div>
    );
}