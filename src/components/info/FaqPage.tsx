import { HelpCircle, Search } from "lucide-react";
import { InfoPageShell } from "./InfoPageShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Input } from "../ui/input";
import { useMemo, useState } from "react";

const IMG_FAQ =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Как забронировать услугу?",
    a: "Выберите услугу в каталоге, укажите дату и количество гостей, затем отправьте заявку. Статус бронирования можно отслеживать в разделе «Бронирования» в профиле.",
  },
  {
    q: "Как стать партнёром?",
    a: "Зарегистрируйтесь, откройте раздел для партнёров и подайте заявку с данными компании. После проверки вы получите доступ к кабинету и сможете создавать объявления.",
  },
  {
    q: "Зачем нужна подписка на объявление?",
    a: "Подписка позволяет размещать услугу в активном режиме согласно выбранному тарифу. Условия и сроки отображаются в кабинете партнёра при подключении плана.",
  },
  {
    q: "Как отменить бронирование?",
    a: "Откройте карточку бронирования в профиле или в кабинете партнёра и воспользуйтесь отменой, если статус это допускает. Условия отмены могут зависеть от политики исполнителя.",
  },
  {
    q: "Где смотреть уведомления?",
    a: "Колокольчик в шапке сайта и раздел «Уведомления» в профиле. В настройках можно управлять типами рассылок.",
  },
  {
    q: "Как оставить отзыв?",
    a: "После завершённого бронирования клиент может оставить отзыв о услуге. Отзывы помогают другим гостям выбирать исполнителей.",
  },
  {
    q: "Как связаться с поддержкой?",
    a: "Используйте раздел «Помощь» и e-mail info@toizhyry.kz. Мы ответим в рабочие часы.",
  },
];

export function FaqPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withIndex = FAQ_ITEMS.map((item, i) => ({ ...item, i }));
    if (!q) return withIndex;
    return withIndex.filter(
      (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <InfoPageShell
      eyebrow="Вопросы и ответы"
      title="FAQ"
      subtitle="Коротко о бронированиях, партнёрском кабинете и работе платформы — найдите нужное за пару секунд."
      heroImageUrl={IMG_FAQ}
      wide
    >
      <div className="space-y-8">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 rounded-3xl bg-white p-5 md:p-6 shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Поиск по вопросам и ответам..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 h-12 rounded-2xl border-gray-200 bg-gray-50/80 focus-visible:ring-[#00AFAE]"
              />
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 shrink-0">
              <HelpCircle className="w-5 h-5 text-[#00AFAE]" />
              <span>
                <strong className="text-[#222222]">{FAQ_ITEMS.length}</strong> тем
              </span>
            </div>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-[#00AFAE] to-[#0d9488] p-5 text-white shadow-lg flex flex-col justify-center">
            <p className="text-white/90 text-sm font-medium mb-1">Нужна помощь?</p>
            <a href="mailto:info@toizhyry.kz" className="text-[#FFD700] font-semibold hover:underline text-sm">
              info@toizhyry.kz
            </a>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4 md:p-8 shadow-lg shadow-gray-200/50 border border-gray-100">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Ничего не найдено — попробуйте другой запрос.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-3">
              {filtered.map((item) => (
                <AccordionItem
                  key={item.i}
                  value={`item-${item.i}`}
                  className="border border-gray-100 rounded-2xl px-4 md:px-5 bg-gray-50/50 data-[state=open]:bg-white data-[state=open]:shadow-md data-[state=open]:border-[#00AFAE]/25 transition-all"
                >
                  <AccordionTrigger className="text-left text-[#222222] hover:no-underline py-4 md:py-5 text-sm md:text-base font-medium hover:text-[#0d9488] [&[data-state=open]]:text-[#00AFAE]">
                    <span className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#00AFAE]/10 text-[#00AFAE] text-xs font-bold flex items-center justify-center mt-0.5">
                        {String(item.i + 1).padStart(2, "0")}
                      </span>
                      {item.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-sm md:text-base leading-relaxed pb-5 pl-11 md:pl-11">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </InfoPageShell>
  );
}
