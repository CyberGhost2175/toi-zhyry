import { useEffect, useMemo, useState } from 'react';
import { Loader2, MailCheck, CircleAlert } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '@radix-ui/react-label';
import { AuthApi } from '../../data/api/AuthApi';

interface EmailVerificationPageProps {
    onNavigate: (page: string) => void;
}

export function EmailVerificationPage({ onNavigate }: EmailVerificationPageProps) {
    const [searchParams] = useSearchParams();
    const { token: tokenFromPath } = useParams<{ token?: string }>();
    const tokenFromQuery = searchParams.get('token') ?? '';
    const tokenFromHash = (() => {
        const hash = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hash);
        return hashParams.get('token') ?? '';
    })();
    const token = tokenFromQuery || tokenFromPath || tokenFromHash;
    const emailFromQuery = searchParams.get('email') ?? '';
    const authApi = useMemo(() => new AuthApi(), []);

    const [isVerifying, setIsVerifying] = useState<boolean>(Boolean(token));
    const [isVerified, setIsVerified] = useState(false);
    const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    const [email, setEmail] = useState(emailFromQuery);
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);
    const [resendError, setResendError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setIsVerifying(false);
            setVerifyMessage('Проверьте вашу почту и перейдите по ссылке из письма.');
            return;
        }

        let cancelled = false;
        setIsVerifying(true);
        setVerifyError(null);
        setVerifyMessage(null);

        authApi
            .verifyEmail(token)
            .then((data) => {
                if (cancelled) return;
                setIsVerified(true);
                setVerifyMessage(data.message || 'Email успешно подтвержден.');
            })
            .catch((error: Error) => {
                if (cancelled) return;
                setVerifyError(error.message || 'Не удалось подтвердить email.');
            })
            .finally(() => {
                if (!cancelled) setIsVerifying(false);
            });

        return () => {
            cancelled = true;
        };
    }, [token, authApi]);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        setResendError(null);
        setResendMessage(null);

        if (!email.trim()) {
            setResendError('Укажите email для повторной отправки письма.');
            return;
        }

        setIsResending(true);
        try {
            const response = await authApi.resendVerification(email.trim());
            setResendMessage(response.message || 'Письмо отправлено. Проверьте почту.');
        } catch (error) {
            setResendError(error instanceof Error ? error.message : 'Не удалось отправить письмо.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#F9F9F9' }}>
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                    <div className="text-center mb-6">
                        {isVerified ? (
                            <MailCheck className="w-10 h-10 mx-auto mb-3" style={{ color: '#00AFAE' }} />
                        ) : (
                            <CircleAlert className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                        )}
                        <h1 className="text-2xl mb-2" style={{ color: '#00AFAE' }}>
                            Подтверждение email
                        </h1>
                        <p className="text-sm text-gray-600">
                            Подтвердите почту, чтобы завершить регистрацию и войти в аккаунт.
                        </p>
                    </div>

                    {isVerifying && (
                        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 flex items-center">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Проверяем токен подтверждения...
                        </div>
                    )}

                    {!isVerifying && verifyMessage && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                            {verifyMessage}
                        </div>
                    )}

                    {!isVerifying && verifyError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {verifyError}
                        </div>
                    )}

                    <form onSubmit={handleResend} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="resend-email">Email</Label>
                            <Input
                                id="resend-email"
                                type="email"
                                placeholder="example@mail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isResending}
                                className="h-12"
                                required
                            />
                        </div>

                        {resendMessage && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                {resendMessage}
                            </div>
                        )}

                        {resendError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                {resendError}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="outline"
                            className="w-full h-12 border-gray-300 hover:bg-gray-50"
                            disabled={isResending}
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
                    </form>

                    <Button
                        type="button"
                        className="w-full h-12 mt-4 text-white hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#00AFAE' }}
                        onClick={() => onNavigate('login')}
                    >
                        Перейти ко входу
                    </Button>
                </div>
            </div>
        </div>
    );
}
