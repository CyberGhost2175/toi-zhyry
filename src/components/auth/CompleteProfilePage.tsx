import { FormEvent, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthApi } from '../../data/api/AuthApi';
import { useAuth } from '../../contexts/AuthContext';

interface CompleteProfilePageProps {
    onNavigate: (page: string) => void;
}

export function CompleteProfilePage({ onNavigate }: CompleteProfilePageProps) {
    const [phone, setPhone] = useState('77');
    const [city, setCity] = useState('');
    const [password, setPassword] = useState(() => sessionStorage.getItem('pendingCompleteProfilePassword') || '');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const authApi = useMemo(() => new AuthApi(), []);
    const { user, login, token } = useAuth();

    const normalizePhone = (value: string): string => {
        const digits = value.replace(/\D/g, '');
        let next = digits.startsWith('77') ? digits : `77${digits.replace(/^77/, '')}`;
        if (next.length > 11) {
            next = next.slice(0, 11);
        }
        return next;
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);

        const normalizedPhone = normalizePhone(phone);
        if (!/^77\d{9}$/.test(normalizedPhone)) {
            setError('Телефон должен быть в формате 77XXXXXXXXX');
            return;
        }
        if (!city.trim()) {
            setError('Укажите город');
            return;
        }
        if (!password.trim()) {
            setError('Укажите пароль');
            return;
        }
        if (!token || !user) {
            setError('Сессия недействительна. Войдите заново.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.completeProfile({
                phone: normalizedPhone,
                city,
                password: password.trim(),
            });
            const updatedUser = {
                ...user,
                phone: response.phone ?? normalizedPhone,
                city: response.city ?? city.trim(),
                authProvider: response.authProvider ?? user.authProvider,
                profileCompleted: true,
            };
            login(token, updatedUser, true);
            sessionStorage.removeItem('pendingCompleteProfilePassword');
            onNavigate('home');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось завершить регистрацию');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F9F9F9]">
            <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <h1 className="mb-2 text-2xl font-semibold">Завершите регистрацию</h1>
                <p className="mb-6 text-sm text-gray-600">
                    Укажите телефон и город, чтобы мы могли корректно оформлять бронирования и связь с партнерами.
                </p>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-800" htmlFor="phone">
                            Телефон
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(normalizePhone(e.target.value))}
                            placeholder="77011234567"
                            className="h-11 w-full rounded-md border border-gray-300 px-3 outline-none transition focus:border-[#00AFAE]"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-800" htmlFor="city">
                            Город
                        </label>
                        <input
                            id="city"
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Астана"
                            className="h-11 w-full rounded-md border border-gray-300 px-3 outline-none transition focus:border-[#00AFAE]"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-800" htmlFor="password">
                            Пароль
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введите пароль от аккаунта"
                            className="h-11 w-full rounded-md border border-gray-300 px-3 outline-none transition focus:border-[#00AFAE]"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="flex h-11 w-full items-center justify-center rounded-md bg-[#00AFAE] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Сохранение...
                            </>
                        ) : (
                            'Завершить'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
