import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from "@radix-ui/react-label";
import {Input} from "../ui/input";
import {Button} from "../ui/button";
import {Separator} from "../ui/separator";

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement authentication logic
    console.log('Login attempt:', formData);
    // Navigate to client dashboard after successful login
    onNavigate('client-dashboard');
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
          <p className="text-gray-600">Войдите в свой аккаунт</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-12"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.remember}
                  onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                  style={{ accentColor: '#00AFAE' }}
                />
                <span className="text-sm text-gray-600">Запомнить меня</span>
              </label>
              <button 
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-sm hover:underline"
                style={{ color: '#00AFAE' }}
              >
                Забыли пароль?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#00AFAE' }}
            >
              Войти
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
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-300 hover:bg-gray-50"
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
              Войти через Google
            </Button>
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