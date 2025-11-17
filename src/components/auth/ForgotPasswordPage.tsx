import { useState } from 'react';
import { ArrowLeft, Mail, Check } from 'lucide-react';
import {Label} from "../ui/label";
import {Input} from "../ui/input";
import {Button} from "../ui/button";

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement password reset logic
    console.log('Password reset requested for:', email);
    setIsSubmitted(true);
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
          <p className="text-gray-600">
            {isSubmitted ? 'Проверьте ваш email' : 'Восстановление пароля'}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          {!isSubmitted ? (
            <>
              <div className="w-16 h-16 rounded-full bg-[#00AFAE]/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8" style={{ color: '#00AFAE' }} />
              </div>

              <p className="text-center text-gray-600 mb-6">
                Введите ваш email, и мы отправим вам инструкции по восстановлению пароля
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#00AFAE' }}
                >
                  Отправить инструкции
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button 
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="inline-flex items-center gap-2 text-sm hover:underline"
                  style={{ color: '#00AFAE' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Вернуться к входу
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-xl text-center mb-4">Письмо отправлено!</h2>
              
              <p className="text-center text-gray-600 mb-6">
                Мы отправили инструкции по восстановлению пароля на адрес:
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                <p className="font-medium" style={{ color: '#00AFAE' }}>{email}</p>
              </div>

              <p className="text-sm text-center text-gray-600 mb-6">
                Не получили письмо? Проверьте папку «Спам» или{' '}
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="hover:underline"
                  style={{ color: '#00AFAE' }}
                >
                  попробуйте снова
                </button>
              </p>

              <Button
                variant="outline"
                className="w-full h-12 border-gray-300"
                onClick={() => onNavigate('login')}
              >
                Вернуться к входу
              </Button>
            </>
          )}
        </div>

        {/* Decorative Pattern */}
        <div className="mt-8 text-center opacity-20">
          <svg width="100" height="20" viewBox="0 0 100 20" fill="none" className="inline-block">
            <pattern id="kazakh-pattern-forgot" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M10 0L12 8L10 10L8 8L10 0Z" fill="#00AFAE" />
              <circle cx="10" cy="10" r="2" fill="#FFD700" />
            </pattern>
            <rect width="100" height="20" fill="url(#kazakh-pattern-forgot)" />
          </svg>
        </div>
      </div>
    </div>
  );
}