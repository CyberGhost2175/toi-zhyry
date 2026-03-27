import { useEffect, useMemo, useState } from "react";
import { Search, Utensils, Car, Mic, Palette, Camera, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ServiceCard } from "./ServiceCard";
import { KazakhPattern } from "./KazakhPattern";
import { ServicesCatalogApi } from "../data/api/ServicesCatalogApi";
import type { CatalogService } from "../domain/entities/Service";
import { ReviewsApi, type Review } from "../data/api/ReviewsApi";
import { useAuth } from "../contexts/AuthContext";

interface HomePageProps {
  onNavigate: (
    page: string,
    state?: { categoryName?: string; searchQuery?: string; serviceId?: string }
  ) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { user } = useAuth();
  const [heroSearch, setHeroSearch] = useState("");
  /** Категория, выбранная подсказкой (при ручном вводе сбрасывается) */
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [popularServices, setPopularServices] = useState<CatalogService[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [homeReviews, setHomeReviews] = useState<Review[]>([]);
  const [homeReviewsLoading, setHomeReviewsLoading] = useState(false);

  const servicesApi = useMemo(() => new ServicesCatalogApi(), []);
  const reviewsApi = useMemo(() => new ReviewsApi(), []);

  const categories = [
    { name: "Рестораны", icon: Utensils, color: "#00AFAE" },
    { name: "Кортежи", icon: Car, color: "#FFD700" },
    { name: "Тамады", icon: Mic, color: "#00AFAE" },
    { name: "Декораторы", icon: Palette, color: "#FFD700" },
    { name: "Фото-видео", icon: Camera, color: "#00AFAE" },
  ];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPopularLoading(true);
      try {
        const res = await servicesApi.getServices({
          page: 0,
          size: 6,
          sortBy: "rating",
          sortDirection: "DESC",
        });
        if (!cancelled) setPopularServices(res.content || []);
      } catch (_) {
        if (!cancelled) setPopularServices([]);
      } finally {
        if (!cancelled) setPopularLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [servicesApi]);

  useEffect(() => {
    if (popularServices.length === 0) return;
    let cancelled = false;
    (async () => {
      setHomeReviewsLoading(true);
      try {
        const topServices = popularServices.slice(0, 6);
        const results = await Promise.allSettled(
          topServices.map((s) => reviewsApi.getServiceReviews(s.id, { page: 0, size: 1 }))
        );
        const extracted: Review[] = [];
        for (const r of results) {
          if (r.status === "fulfilled") {
            const first = (r.value.content || [])[0];
            if (first) extracted.push(first);
          }
        }
        if (!cancelled) setHomeReviews(extracted.slice(0, 3));
      } catch (_) {
        if (!cancelled) setHomeReviews([]);
      } finally {
        if (!cancelled) setHomeReviewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [popularServices, reviewsApi]);

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#165383] to-[#165383]/80 text-white overflow-hidden">
        <KazakhPattern className="absolute inset-0 w-full h-full text-white" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-white mb-4">
              Организуйте незабываемое мероприятие
            </h1>
            <p className="text-white/90 mb-8">
              Найдите лучших партнёров для вашего тоя: рестораны, тамады, декораторы и многое другое
            </p>

            {/* Search */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Название услуги или категория (рестораны, тамады...)"
                    className="pl-12 h-12 border-gray-200 rounded-xl text-[#222222]"
                    value={heroSearch}
                    onChange={(e) => {
                      setHeroSearch(e.target.value);
                      setSelectedCategoryName(null);
                    }}
                  />
                </div>
                <Button
                  className="bg-[#165383] hover:bg-[#00AFAE]/90 text-white h-12 px-8 rounded-xl"
                  onClick={() =>
                    onNavigate("catalog", {
                      searchQuery: heroSearch.trim() || undefined,
                      categoryName: selectedCategoryName || undefined,
                    })
                  }
                >
                  Найти
                </Button>
              </div>

              {/* Подсказки: подставляют текст и задают категорию для фильтра в каталоге */}
              <p className="text-sm text-gray-500 mt-2 mb-1">Поиск по ключевым словам или выберите категорию:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setHeroSearch(cat.name);
                      setSelectedCategoryName(cat.name);
                    }}
                    className="px-4 py-2 bg-[#F9F9F9] text-[#222222] rounded-full hover:bg-[#00AFAE] hover:text-white transition-colors"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-[#222222] text-center mb-12">Популярные категории</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.name}
                type="button"
                onClick={() => onNavigate("catalog", { categoryName: category.name })}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Icon className="w-8 h-8" style={{ color: category.color }} />
                </div>
                <h3 className="text-[#222222] text-center">{category.name}</h3>
              </button>
            );
          })}
        </div>
      </section>

      {/* Popular Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[#222222]">Популярные услуги</h2>
          <Button 
            variant="ghost" 
            className="text-[#00AFAE]"
            onClick={() => onNavigate('catalog')}
          >
            Смотреть все
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularLoading ? (
            <div className="col-span-full text-center text-gray-500 py-10">Загрузка услуг...</div>
          ) : popularServices.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-10">Нет услуг для отображения.</div>
          ) : (
            popularServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onNavigate={(id) => onNavigate("service-detail", { serviceId: id })}
              />
            ))
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-[#222222] text-center mb-12">Отзывы клиентов</h2>

          {homeReviewsLoading ? (
            <div className="text-center text-gray-500 py-8">Загрузка отзывов...</div>
          ) : homeReviews.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Пока нет отзывов для отображения.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {homeReviews.map((review) => (
                <div key={review.id} className="bg-[#F9F9F9] p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#00AFAE] to-[#FFD700] rounded-full flex items-center justify-center text-white">
                      {(review.userFullName || "U")
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-[#222222]">{review.userFullName || "Пользователь"}</h4>
                      <div className="flex gap-1">
                        {[...Array(Math.max(0, Math.min(5, Number(review.rating) || 0)))].map((_, i) => (
                          <span key={i} className="text-[#FFD700]">★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 line-clamp-4 whitespace-pre-wrap">{review.comment || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-[#00AFAE] to-[#00AFAE]/80 rounded-3xl p-12 text-center text-white relative overflow-hidden">
          <KazakhPattern className="absolute inset-0 w-full h-full text-white" />
          
          <div className="relative">
            <h2 className="text-white mb-4">Станьте нашим партнёром</h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Присоединяйтесь к платформе Toi Zhyry и получайте больше заказов для вашего бизнеса
            </p>
            <Button 
              className="bg-white text-[#00AFAE] hover:bg-white/90 rounded-full px-8"
              onClick={() => onNavigate('partner-dashboard')}
            >
              {user?.role?.toUpperCase() === "PARTNER" || user?.role?.toUpperCase() === "ADMIN"
                ? "Личный кабинет"
                : "Зарегистрироваться как партнёр"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
