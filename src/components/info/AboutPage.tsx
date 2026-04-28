import { Heart, Sparkles, Users, Shield } from "lucide-react";
import { KazakhPattern } from "../KazakhPattern";
import { Button } from "../ui/button";

const IMG_CELEBRATION =
  "https://images.unsplash.com/photo-1519167758481-83f29da8c0cf?auto=format&fit=crop&w=1600&q=80";
const IMG_TEAM =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80";
const IMG_TABLE =
  "https://images.unsplash.com/photo-1464366400600-7161789df9db?auto=format&fit=crop&w=1600&q=80";

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <section className="relative bg-gradient-to-br from-[#165383] to-[#0d3d5c] text-white overflow-hidden">
        <KazakhPattern className="absolute inset-0 w-full h-full text-white opacity-35" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[#FFD700] font-medium text-sm uppercase tracking-wider mb-3">Toi Zhyry</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight mb-6">
              Мы соединяем гостей и лучших исполнителей для вашего тоя
            </h1>
            <p className="text-white/90 text-lg leading-relaxed mb-8">
              Платформа создана для того, чтобы организация праздника в Казахстане была простой: честные
              отзывы, прозрачные цены и удобное бронирование в несколько кликов.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-full bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white"
                onClick={() => onNavigate("catalog")}
              >
                Смотреть каталог
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-white/40 text-white bg-white/10 hover:bg-white/20"
                onClick={() => onNavigate("partners-info")}
              >
                Партнёрство
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20">
              <img src={IMG_CELEBRATION} alt="Торжество" className="w-full h-[320px] md:h-[400px] object-cover" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-xl overflow-hidden shadow-lg border-4 border-white hidden md:block">
              <img src={IMG_TABLE} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Heart,
              title: "С заботой о традициях",
              text: "Учитываем особенности казахстанских торжеств и помогаем собрать команду под ваш формат.",
            },
            {
              icon: Sparkles,
              title: "Качество услуг",
              text: "Рестораны, тамады, декор, транспорт и многое другое — в одном каталоге с рейтингами.",
            },
            {
              icon: Users,
              title: "Сообщество",
              text: "Клиенты находят проверенных партнёров, а исполнители — новых гостей без лишней суеты.",
            },
            {
              icon: Shield,
              title: "Прозрачность",
              text: "Бронирования и статусы отображаются в личном кабинете, меньше недопонимания между сторонами.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-[#00AFAE]/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-[#00AFAE]" />
              </div>
              <h3 className="text-[#222222] font-semibold mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg order-2 lg:order-1">
            <img src={IMG_TEAM} alt="Команда" className="w-full h-[300px] object-cover" />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#222222] mb-4">Кто мы</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Toi Zhyry — это цифровой сервис для планирования событий: от небольшой семейной встречи до
              масштабного банкета. Мы развиваем экосистему, где клиенту легко выбрать подрядчика, а бизнесу —
              получать заказы и управлять услугами онлайн.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Наша цель — сэкономить ваше время и нервы, чтобы вы могли сосредоточиться на главном: гостях и
              празднике.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-semibold text-[#222222] mb-4">Готовы начать?</h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-8">
          Загляните в каталог или узнайте, как стать партнёром платформы и рассказать о своей услуге тысячам
          пользователей.
        </p>
        <Button
          className="rounded-full bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white"
          onClick={() => onNavigate("catalog")}
        >
          Перейти в каталог
        </Button>
      </section>
    </div>
  );
}
