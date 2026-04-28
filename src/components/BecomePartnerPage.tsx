import { useState, useEffect } from 'react';
import {
  Handshake,
  TrendingUp,
  Users,
  Shield,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PartnerApi, PartnerApplication, PartnerRegisterRequest } from '../data/api/PartnerApi';
import { useAuth } from '../contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { KZ_CITIES, KZ_REGIONS, formatKzPhoneInput, normalizeKzPhone } from '../utils/kzData';

interface BecomePartnerPageProps {
  onNavigate: (page: string) => void;
}

const defaultForm: PartnerRegisterRequest = {
  bin: '',
  companyName: '',
  city: '',
  phone: '',
  email: '',
  description: '',
  address: '',
  region: '',
  whatsapp: '',
  telegram: '',
  instagram: '',
  website: '',
  logoUrl: '',
};

export function BecomePartnerPage({ onNavigate }: BecomePartnerPageProps) {
  const { isAuthenticated, user } = useAuth();
  const role = user?.role?.toUpperCase();
  const isPartnerByRole = role === 'PARTNER';
  const [activeTab, setActiveTab] = useState('about');
  const [formData, setFormData] = useState<PartnerRegisterRequest>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [myApplication, setMyApplication] = useState<PartnerApplication | null | 'loading'>('loading');

  const partnerApi = new PartnerApi();

  useEffect(() => {
    if (activeTab === 'my-application') {
      loadMyApplication();
    }
  }, [activeTab]);

  const loadMyApplication = async () => {
    setMyApplication('loading');
    try {
      const app = await partnerApi.getMyApplication();
      setMyApplication(app);
    } catch {
      setMyApplication(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }
    setSubmitError(null);
    if (!formData.city) {
      setSubmitError("Выберите город");
      return;
    }
    if (normalizeKzPhone(formData.phone).length !== 11) {
      setSubmitError("Укажите корректный номер телефона в формате KZ");
      return;
    }
    setIsSubmitting(true);
    try {
      await partnerApi.submitApplication({
        ...formData,
        phone: normalizeKzPhone(formData.phone),
        whatsapp: normalizeKzPhone(formData.whatsapp || ""),
        email: formData.email || user?.email || '',
      });
      setSubmitSuccess(true);
      setFormData(defaultForm);
      setActiveTab('my-application');
      loadMyApplication();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Ошибка при отправке заявки');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusInfo = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
      case 'НА РАССМОТРЕНИИ':
        return { label: 'На рассмотрении', icon: Clock, color: 'text-amber-600 bg-amber-50' };
      case 'APPROVED':
      case 'ОДОБРЕНО':
        return { label: 'Одобрено', icon: CheckCircle2, color: 'text-green-600 bg-green-50' };
      case 'REJECTED':
      case 'ОТКЛОНЕНО':
        return { label: 'Отклонено', icon: XCircle, color: 'text-red-600 bg-red-50' };
      default:
        return { label: status || '—', icon: FileText, color: 'text-gray-600 bg-gray-50' };
    }
  };

  const isApprovedStatus = (status?: string) =>
    status?.toUpperCase() === 'APPROVED' || status?.toUpperCase() === 'ОДОБРЕНО';

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => onNavigate('home')}
          className="mb-6 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          На главную
        </Button>

        {/* Hero */}
        <div
          className="relative rounded-2xl overflow-hidden mb-10 p-8 md:p-12 text-white"
          style={{ background: 'linear-gradient(135deg, #00AFAE 0%, #008B8A 50%, #006D6C 100%)' }}
        >
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Партнёрство с Toi Zhyry</h1>
            <p className="text-white/90 max-w-2xl text-lg">
              Размещайте свои услуги на платформе, привлекайте клиентов и развивайте бизнес вместе с нами.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { icon: TrendingUp, title: 'Рост заказов', text: 'Доступ к базе клиентов платформы' },
            { icon: Users, title: 'Новые клиенты', text: 'Продвижение ваших услуг' },
            { icon: Shield, title: 'Надёжность', text: 'Прозрачные условия и выплаты' },
            { icon: Handshake, title: 'Поддержка', text: 'Помощь в настройке и продвижении' },
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title} className="border-0 shadow-sm bg-white">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(0,175,174,0.12)' }}>
                  <Icon className="w-6 h-6" style={{ color: '#00AFAE' }} />
                </div>
                <h3 className="font-semibold text-[#222222] mb-1">{title}</h3>
                <p className="text-sm text-gray-600">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full flex flex-wrap h-auto gap-1">
            <TabsTrigger value="about" className="rounded-lg flex-1 min-w-[140px]">
              О партнёрстве
            </TabsTrigger>
            <TabsTrigger value="apply" className="rounded-lg flex-1 min-w-[140px]">
              Подать заявку
            </TabsTrigger>
            <TabsTrigger value="my-application" className="rounded-lg flex-1 min-w-[140px]">
              Моя заявка
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-[#222222]">Условия партнёрства</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-600">
                <ol className="list-decimal list-inside space-y-3">
                  <li>Вы — юридическое лицо или ИП с действующей регистрацией в РК.</li>
                  <li>Готовность предоставлять качественные услуги в сфере мероприятий (банкеты, декор, аренда, развлечения и т.д.).</li>
                  <li>Своевременное подтверждение заказов и связь с клиентами.</li>
                  <li>Соблюдение правил платформы и политики конфиденциальности.</li>
                  <li>После одобрения заявки — заполнение карточки услуг и загрузка материалов.</li>
                </ol>
                <p className="pt-2 text-sm text-gray-500">
                  Оставьте заявку через форму «Подать заявку». Мы рассмотрим её в течение нескольких рабочих дней и свяжемся с вами.
                </p>
              </CardContent>
            </Card>
          </TabsContent>image.png

          <TabsContent value="apply" className="space-y-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-[#222222]">Заявка на партнёрство</CardTitle>
                <p className="text-sm text-gray-600">
                  Заполните данные о компании. Заявку может подать только авторизованный пользователь.
                </p>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-600 mb-4">Войдите в аккаунт, чтобы подать заявку на партнёрство.</p>
                    <Button
                      className="rounded-full text-white"
                      style={{ backgroundColor: '#00AFAE' }}
                      onClick={() => onNavigate('login')}
                    >
                      Войти
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {submitError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {submitError}
                      </div>
                    )}
                    {submitSuccess && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        Заявка успешно отправлена. Статус можно посмотреть во вкладке «Моя заявка».
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="bin">БИН *</Label>
                        <Input
                          id="bin"
                          value={formData.bin}
                          onChange={(e) => setFormData({ ...formData, bin: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                          placeholder="012345678901"
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Название компании *</Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          placeholder="ТОО «Пример»"
                          required
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="city">Город *</Label>
                        <Select value={formData.city} onValueChange={(v) => setFormData({ ...formData, city: v })}>
                          <SelectTrigger id="city" className="h-12">
                            <SelectValue placeholder="Выберите город" />
                          </SelectTrigger>
                          <SelectContent>
                            {KZ_CITIES.map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region">Регион</Label>
                        <Select value={formData.region || ""} onValueChange={(v) => setFormData({ ...formData, region: v })}>
                          <SelectTrigger id="region" className="h-12">
                            <SelectValue placeholder="Выберите регион" />
                          </SelectTrigger>
                          <SelectContent>
                            {KZ_REGIONS.map((region) => (
                              <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Адрес *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="ул. Примерная, 1"
                        required
                        className="h-12"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Телефон *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: formatKzPhoneInput(e.target.value) })}
                          placeholder="+7 (777) 123-45-67"
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || user?.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="company@example.com"
                          required
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: formatKzPhoneInput(e.target.value) })}
                          placeholder="+7 (777) 123-45-67"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telegram">Telegram</Label>
                        <Input
                          id="telegram"
                          value={formData.telegram}
                          onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                          placeholder="@company"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.instagram}
                          onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                          placeholder="@company"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Сайт</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://example.com"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">О компании / услугах *</Label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Краткое описание деятельности и услуг"
                        required
                        rows={4}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AFAE]/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">Ссылка на логотип</Label>
                      <Input
                        id="logoUrl"
                        value={formData.logoUrl}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                        placeholder="https://..."
                        className="h-12"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 text-white rounded-full"
                      style={{ backgroundColor: '#00AFAE' }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        'Отправить заявку'
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-application" className="space-y-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-[#222222]">Статус заявки на партнёрство</CardTitle>
                <p className="text-sm text-gray-600">
                  Здесь отображается ваша поданная заявка. Войдите в аккаунт, чтобы увидеть данные.
                </p>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <div className="py-8 text-center text-gray-600">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Войдите в аккаунт, чтобы посмотреть заявку.</p>
                    <Button
                      variant="outline"
                      className="mt-4 rounded-full"
                      onClick={() => onNavigate('login')}
                    >
                      Войти
                    </Button>
                  </div>
                ) : myApplication === 'loading' ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                    <Loader2 className="w-10 h-10 animate-spin mb-3" style={{ color: '#00AFAE' }} />
                    <p>Загрузка заявки...</p>
                  </div>
                ) : !myApplication ? (
                  <div className="py-8 text-center text-gray-600">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    {isPartnerByRole ? (
                      <>
                        <p>Ваша роль уже обновлена до партнёра.</p>
                        <p className="text-sm mt-1">Вы можете сразу перейти в кабинет партнёра.</p>
                        <Button
                          className="mt-4 rounded-full text-white"
                          style={{ backgroundColor: '#00AFAE' }}
                          onClick={() => onNavigate('partner-dashboard')}
                        >
                          Перейти в кабинет партнёра
                        </Button>
                      </>
                    ) : (
                      <>
                        <p>Вы ещё не подавали заявку на партнёрство.</p>
                        <p className="text-sm mt-1">Перейдите во вкладку «Подать заявку», чтобы отправить заявку.</p>
                        <Button
                          className="mt-4 rounded-full text-white"
                          style={{ backgroundColor: '#00AFAE' }}
                          onClick={() => setActiveTab('apply')}
                        >
                          Подать заявку
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">БИН</p>
                        <p className="font-medium text-[#222222]">{myApplication.bin || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Статус</p>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(myApplication.status).color}`}
                        >
                          {(() => {
                            const { icon: Icon, label } = getStatusInfo(myApplication.status);
                            return (
                              <>
                                <Icon className="w-4 h-4" />
                                {label}
                              </>
                            );
                          })()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Дата подачи</p>
                        <p className="text-[#222222]">{formatDate(myApplication.createdAt)}</p>
                      </div>
                      {myApplication.approvedAt && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Дата одобрения</p>
                          <p className="text-[#222222]">{formatDate(myApplication.approvedAt)}</p>
                        </div>
                      )}
                      {myApplication.approvedByEmail && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Одобрил</p>
                          <p className="text-[#222222]">{myApplication.approvedByEmail}</p>
                        </div>
                      )}
                    </div>
                    {myApplication.rejectionReason && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-1">Причина отклонения</p>
                        <p className="text-sm text-red-700">{myApplication.rejectionReason}</p>
                      </div>
                    )}
                    {(isPartnerByRole || isApprovedStatus(myApplication.status)) && (
                      <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-green-800">Заявка одобрена</p>
                          <p className="text-sm text-green-700">Откройте кабинет партнёра для управления услугами и бронированиями.</p>
                        </div>
                        <Button
                          className="rounded-full text-white"
                          style={{ backgroundColor: '#00AFAE' }}
                          onClick={() => onNavigate('partner-dashboard')}
                        >
                          Перейти в кабинет партнёра
                        </Button>
                      </div>
                    )}
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400">ID заявки: {myApplication.id}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
