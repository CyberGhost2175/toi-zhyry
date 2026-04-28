import {
  Mail,
  MessageCircle,
  BookOpen,
  LifeBuoy,
  ArrowRight,
  Shield,
  FileText,
  Sparkles,
} from "lucide-react";
import { InfoPageShell } from "./InfoPageShell";
import { Button } from "../ui/button";

const IMG_HELP =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80";

interface HelpPageProps {
  onNavigate: (page: string) => void;
}

export function HelpPage({ onNavigate }: HelpPageProps) {
  return (
    <InfoPageShell
      eyebrow="Центр поддержки"
      title="Помощь"
      subtitle="Быстрый доступ к ответам, документам и контактам команды Toi Zhyry."
      heroImageUrl={IMG_HELP}
      wide
    >
      <div className="space-y-8 md:space-y-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          <button
            type="button"
            onClick={() => onNavigate("faq")}
            className="group text-left relative overflow-hidden rounded-3xl p-6 md:p-7 bg-gradient-to-br from-white to-[#ecfeff] border border-[#00AFAE]/20 shadow-md shadow-[#00AFAE]/5 hover:shadow-xl hover:shadow-[#00AFAE]/10 hover:border-[#00AFAE]/35 transition-all duration-300"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[#00AFAE]/10 group-hover:bg-[#00AFAE]/15 transition-colors" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-[#00AFAE] flex items-center justify-center text-white shadow-lg shadow-[#00AFAE]/30 mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-[#222222] text-lg mb-2 group-hover:text-[#0d9488] transition-colors">
                Частые вопросы
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Подборка ответов по сервису, бронированиям и кабинету партнёра.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-[#00AFAE]">
                Открыть FAQ
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>

          <a
            href="mailto:info@toizhyry.kz"
            className="group relative overflow-hidden rounded-3xl p-6 md:p-7 bg-gradient-to-br from-white to-amber-50/50 border border-amber-200/40 shadow-md hover:shadow-xl hover:border-amber-300/50 transition-all duration-300 block"
          >
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-[#FFD700]/15" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFD700] to-amber-400 flex items-center justify-center text-[#222222] shadow-lg mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-[#222222] text-lg mb-2">Написать в поддержку</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                Ответим на письмо в рабочие часы.
              </p>
              <p className="text-[#00AFAE] font-medium text-sm">info@toizhyry.kz</p>
            </div>
          </a>

          <div className="sm:col-span-2 lg:col-span-1 rounded-3xl p-6 md:p-7 bg-gradient-to-br from-[#165383] to-[#0f766e] text-white shadow-xl shadow-[#165383]/20 border border-white/10">
            <Sparkles className="w-8 h-8 text-[#FFD700] mb-4" />
            <h3 className="font-semibold text-lg mb-2">Юридические документы</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-5">
              Политика конфиденциальности и пользовательское соглашение в одном клике.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate("privacy")}
                className="text-left text-sm font-medium py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-[#FFD700] shrink-0" />
                Конфиденциальность
              </button>
              <button
                type="button"
                onClick={() => onNavigate("terms")}
                className="text-left text-sm font-medium py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-[#FFD700] shrink-0" />
                Условия использования
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 md:p-10 shadow-lg shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00AFAE] via-[#0d9488] to-[#FFD700]" />
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#00AFAE]/10 flex items-center justify-center">
              <LifeBuoy className="w-7 h-7 text-[#00AFAE]" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-[#222222] mb-4">
                Чем мы можем помочь
              </h2>
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-gray-600 text-sm md:text-base">
                {[
                  "Найти услугу и оформить бронирование",
                  "Стать партнёром и заполнить карточку услуги",
                  "Подписки и оплата в кабинете партнёра",
                  "Уведомления и статусы заказов",
                ].map((line) => (
                  <li key={line} className="flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00AFAE] mt-2 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#00AFAE]/12 via-white to-[#FFD700]/10 border border-[#00AFAE]/20 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 text-[#00AFAE]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#222222] mb-1">Не нашли ответ?</h2>
              <p className="text-gray-600 text-sm md:text-base max-w-xl">
                Загляните в FAQ или напишите нам на почту — мы подскажем по шагам.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              className="rounded-full bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white"
              onClick={() => onNavigate("faq")}
            >
              FAQ
            </Button>
            <Button variant="outline" className="rounded-full border-[#165383]/30" onClick={() => onNavigate("privacy")}>
              Конфиденциальность
            </Button>
            <Button variant="outline" className="rounded-full border-[#165383]/30" onClick={() => onNavigate("terms")}>
              Условия
            </Button>
          </div>
        </div>
      </div>
    </InfoPageShell>
  );
}
