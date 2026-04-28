import { CheckCircle2, TrendingUp, Megaphone, Wallet, Headphones, ArrowRight } from "lucide-react";
import { KazakhPattern } from "../KazakhPattern";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";

const IMG_PARTNER =
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80";
const IMG_HANDSHAKE =
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=80";

interface PartnersMarketingPageProps {
  onNavigate: (page: string) => void;
}

export function PartnersMarketingPage({ onNavigate }: PartnersMarketingPageProps) {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role?.toUpperCase();
  /** Кабинет партнёра (не страница подачи заявки) */
  const goesToPartnerCabinet = role === "PARTNER" || role === "ADMIN";

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <section className="relative bg-gradient-to-br from-[#0f766e] via-[#0d9488] to-[#165383] text-white overflow-hidden">
        <KazakhPattern className="absolute inset-0 w-full h-full text-white opacity-25" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#FFD700] font-medium text-sm uppercase tracking-wider mb-3">
                Партнёрская программа
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mb-6">
                Развивайте бизнес вместе с Toi Zhyry
              </h1>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                Размещайте услуги, получайте бронирования, управляйте календарём и подписками в одном кабинете.
                Мы помогаем ресторанам, тамадам, декораторам и другим исполнителям находить клиентов по всему
                Казахстану.
              </p>
              <div className="flex flex-wrap gap-3">
                {goesToPartnerCabinet ? (
                  <Button
                    className="rounded-full bg-[#FFD700] text-[#222222] hover:bg-[#FFD700]/90"
                    onClick={() => onNavigate("partner-dashboard")}
                  >
                    В личный кабинет
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      className="rounded-full bg-[#FFD700] text-[#222222] hover:bg-[#FFD700]/90"
                      onClick={() => onNavigate("partner-dashboard")}
                    >
                      Подать заявку
                    </Button>
                    {!isAuthenticated && (
                      <Button
                        variant="outline"
                        className="rounded-full border-white/50 text-white bg-white/10 hover:bg-white/20"
                        onClick={() => onNavigate("login")}
                      >
                        Уже есть аккаунт
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/30">
              <img src={IMG_PARTNER} alt="Партнёры" className="w-full h-[280px] md:h-[380px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#222222] text-center mb-12">
          Что вы получаете
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Megaphone,
              title: "Витрина услуг",
              text: "Карточки с фото, описанием и ценами — клиенты видят вас в каталоге и в поиске.",
            },
            {
              icon: TrendingUp,
              title: "Рост заявок",
              text: "Отзывы и рейтинг помогают выделиться среди конкурентов и получать больше обращений.",
            },
            {
              icon: Wallet,
              title: "Гибкие тарифы",
              text: "Подписки по услугам: подключайте тарифы под конкретные объявления и масштабируйтесь постепенно.",
            },
            {
              icon: CheckCircle2,
              title: "Бронирования в одном месте",
              text: "Подтверждайте или отклоняйте заявки, ведите статусы и общайтесь с гостями прозрачно.",
            },
            {
              icon: Headphones,
              title: "Поддержка",
              text: "Раздел помощи, FAQ и юридические документы — всё собрано на сайте для вашего удобства.",
            },
            {
              icon: ArrowRight,
              title: "Развитие платформы",
              text: "Мы постоянно улучшаем продукт: уведомления, оплату, модерацию и новые инструменты для партнёров.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-[#00AFAE]/30 transition-colors"
            >
              <Icon className="w-8 h-8 text-[#00AFAE] mb-4" />
              <h3 className="text-[#222222] font-semibold mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img src={IMG_HANDSHAKE} alt="Сотрудничество" className="w-full h-[280px] object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[#222222] mb-4">Как начать</h2>
            <ol className="space-y-4 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00AFAE] text-white flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <span>Зарегистрируйтесь и подайте заявку на статус партнёра с реквизитами компании.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00AFAE] text-white flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <span>После проверки создайте услуги, загрузите фото и настройте доступность.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00AFAE] text-white flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <span>Подключите тариф по подписке для объявлений и принимайте бронирования.</span>
              </li>
            </ol>
            <div className="mt-8">
              <Button
                className="rounded-full bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white"
                onClick={() => onNavigate("partner-dashboard")}
              >
                {goesToPartnerCabinet ? "В личный кабинет" : "Подать заявку"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
