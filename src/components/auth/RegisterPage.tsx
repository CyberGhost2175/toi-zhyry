import { useState } from 'react';
import { Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { diContainer } from '../../di/DIContainer';

interface RegisterPageProps {
    onNavigate: (page: string) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        city: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
    });

    const registerUseCase = diContainer.getRegisterUseCase();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Проверка совпадения паролей
        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        // Проверка согласия с условиями
        if (!formData.agreeToTerms) {
            setError('Необходимо согласиться с условиями использования');
            return;
        }

        setIsLoading(true);

        try {
            // Очищаем телефон перед отправкой - только цифры, формат 77XXXXXXXXX
            const cleanPhone = formData.phone.replace(/\D/g, ''); // убираем все кроме цифр
            const phoneForBackend = cleanPhone.startsWith('7') ? cleanPhone : '7' + cleanPhone;

            await registerUseCase.execute({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: phoneForBackend, // отправляем только цифры
                city: formData.city,
            });

            // Успешная регистрация - переход на страницу входа
            onNavigate('login');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка при регистрации');
        } finally {
            setIsLoading(false);
        }
    };

    const passwordRequirements = [
        { text: 'Минимум 8 символов', met: formData.password.length >= 8 },
        { text: 'Одна заглавная буква', met: /[A-Z]/.test(formData.password) },
        { text: 'Одна цифра', met: /\d/.test(formData.password) },
        { text: 'Один спецсимвол (@$!%*?&#)', met: /[@$!%*?&#]/.test(formData.password) },
    ];

    const isFormValid =
        formData.agreeToTerms &&
        formData.password === formData.confirmPassword &&
        passwordRequirements.every(req => req.met) &&
        formData.firstName.trim() &&
        formData.lastName.trim() &&
        formData.email.trim() &&
        formData.phone.trim() &&
        formData.city.trim();

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#F9F9F9' }}>
            <div className="w-full max-w-2xl">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <button onClick={() => onNavigate('home')} className="inline-block">
                        <h1 className="text-3xl mb-2" style={{ color: '#00AFAE' }}>
                            Toi Zhyry
                        </h1>
                    </button>
                    <p className="text-gray-600">Создайте аккаунт и начните организовывать мероприятия</p>
                </div>

                {/* Registration Form */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* First Name */}
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Имя</Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="Иван"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    className="h-12"
                                />
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Фамилия</Label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="Иванов"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    className="h-12"
                                />
                            </div>
                        </div>

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Телефон</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+7 (777) 123-45-67"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    className="h-12"
                                />
                            </div>

                            {/* City */}
                            <div className="space-y-2">
                                <Label htmlFor="city">Город</Label>
                                <Input
                                    id="city"
                                    type="text"
                                    placeholder="Алматы"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    className="h-12"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Пароль</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Создайте надежный пароль"
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

                            {/* Password Requirements */}
                            {formData.password && (
                                <div className="mt-3 space-y-2">
                                    {passwordRequirements.map((req, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                            <div
                                                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                                    req.met ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                            >
                                                {req.met && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className={req.met ? 'text-green-600' : 'text-gray-600'}>
                        {req.text}
                      </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Повторите пароль"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    className="h-12 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-sm text-red-600">Пароли не совпадают</p>
                            )}
                        </div>

                        {/* Terms and Conditions */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={formData.agreeToTerms}
                                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                                required
                                disabled={isLoading}
                                className="w-4 h-4 mt-1 rounded border-gray-300"
                                style={{ accentColor: '#00AFAE' }}
                            />
                            <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                                Я согласен с Условиями использования и Политикой конфиденциальности
                            </label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 text-white hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#00AFAE' }}
                            disabled={!isFormValid || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Регистрация...
                                </>
                            ) : (
                                'Зарегистрироваться'
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

                    {/* Social Registration */}
                    <div className="space-y-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 border-gray-300 hover:bg-gray-50"
                            disabled={isLoading}
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Зарегистрироваться через Google
                        </Button>
                    </div>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Уже есть аккаунт?{' '}
                            <button
                                type="button"
                                onClick={() => onNavigate('login')}
                                className="hover:underline"
                                style={{ color: '#00AFAE' }}
                                disabled={isLoading}
                            >
                                Войти
                            </button>
                        </p>
                    </div>
                </div>

                {/* Decorative Pattern */}
                <div className="mt-8 text-center opacity-20">
                    <svg width="100" height="20" viewBox="0 0 100 20" fill="none" className="inline-block">
                        <pattern id="kazakh-pattern-register" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M10 0L12 8L10 10L8 8L10 0Z" fill="#00AFAE" />
                            <circle cx="10" cy="10" r="2" fill="#FFD700" />
                        </pattern>
                        <rect width="100" height="20" fill="url(#kazakh-pattern-register)" />
                    </svg>
                </div>
            </div>
        </div>
    );
}