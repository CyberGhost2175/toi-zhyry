import { useEffect, useState, useCallback, useRef } from "react";
import { ServiceCard } from "./ServiceCard";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { ServicesCatalogApi, type ServicesSortType } from "../data/api/ServicesCatalogApi";
import { FavoritesApi } from "../data/api/FavoritesApi";
import type { ServiceCategory } from "../domain/entities/Category";
import type { CatalogService } from "../domain/entities/Service";
import type { ServicesFilterDto } from "../domain/entities/ServicesFilter";
import { toast } from "sonner";

const servicesApi = new ServicesCatalogApi();
const favoritesApi = new FavoritesApi();

const SORT_OPTIONS: { value: ServicesSortType; label: string }[] = [
  { value: "POPULARITY", label: "По популярности" },
  { value: "RATING", label: "По рейтингу" },
  { value: "PRICE_ASC", label: "Сначала дешевле" },
  { value: "PRICE_DESC", label: "Сначала дороже" },
];

const CITIES = ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе", "Тараз"];

interface CatalogPageProps {
  onNavigate: (page: string, state?: { serviceId?: string }) => void;
  initialCategoryName?: string;
  initialSearchQuery?: string;
}

export function CatalogPage({ onNavigate, initialCategoryName, initialSearchQuery }: CatalogPageProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [sortType, setSortType] = useState<ServicesSortType>("POPULARITY");

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [city, setCity] = useState<string>("");
  const [ratingMin, setRatingMin] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? "");
  const [searchInputValue, setSearchInputValue] = useState(initialSearchQuery ?? "");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasImages, setHasImages] = useState(false);
  const [minReviews, setMinReviews] = useState<number | undefined>(undefined);
  const [applyFiltersKey, setApplyFiltersKey] = useState(0);
  const minPrice = priceRange[0];
  const maxPrice = priceRange[1];

  // Синхронизация с initialSearchQuery при переходе с главной
  useEffect(() => {
    if (initialSearchQuery != null) {
      setSearchInputValue(initialSearchQuery);
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Дебаунс поиска: отправляем запрос через 400 мс после последнего ввода
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearchQuery(searchInputValue), 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInputValue]);

  const loadCategories = useCallback(async () => {
    try {
      const list = await servicesApi.getCategories();
      setCategories(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки категорий");
    }
  }, []);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filter: ServicesFilterDto = {
        categoryId: selectedCategoryId,
        priceMin: priceRange[0] || undefined,
        priceMax: priceRange[1] !== 500000 ? priceRange[1] : undefined,
        ratingMin,
        city: city || undefined,
        cities: city ? [city] : undefined,
        searchQuery: searchQuery.trim() || undefined,
        hasImages: hasImages || undefined,
        minReviews,
        sortType,
      };
      const res = await servicesApi.getServicesFilter(filter, { page, size });
      setServices(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось загрузить услуги";
      setError(msg);
      toast.error(msg);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [
    selectedCategoryId,
    page,
    size,
    sortType,
    priceRange,
    city,
    ratingMin,
    searchQuery,
    hasImages,
    minReviews,
  ]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // При переходе с главной с выбранной категорией — подставляем категорию после загрузки списка
  useEffect(() => {
    if (!initialCategoryName || categories.length === 0) return;
    const norm = (s: string) => (s || "").trim().toLowerCase();
    // Разбиваем "Фото-видео" или "Фото и видео" на слова для гибкого совпадения
    const keywords = initialCategoryName
      .split(/[\s\-/]+/)
      .map((w) => norm(w))
      .filter(Boolean);
    const found = categories.find((c) => {
      const combined = [c.nameRu, c.nameKz, c.slug].join(" ");
      const combinedNorm = norm(combined);
      return keywords.length > 0 && keywords.every((kw) => combinedNorm.includes(kw));
    });
    if (found) setSelectedCategoryId(found.id);
  }, [initialCategoryName, categories]);

  useEffect(() => {
    loadServices();
  }, [loadServices, applyFiltersKey]);

  // Сброс на первую страницу при изменении любого фильтра
  useEffect(() => {
    setPage(0);
  }, [selectedCategoryId, searchQuery, minPrice, maxPrice, city, ratingMin, hasImages]);

  const handleToggleFavorite = useCallback(async (serviceId: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await favoritesApi.removeFromFavorites(serviceId);
        toast.success("Удалено из избранного");
      } else {
        await favoritesApi.addToFavorites(serviceId);
        toast.success("Добавлено в избранное");
      }
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, isFavorite: !isFavorite } : s))
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  }, []);

  const handleResetFilters = () => {
    setSelectedCategoryId(undefined);
    setPriceRange([0, 500000]);
    setCity("");
    setRatingMin(undefined);
    setSearchQuery("");
    setSearchInputValue("");
    setHasImages(false);
    setMinReviews(undefined);
    setPage(0);
  };

  const handleSortChange = (value: string) => {
    const opt = SORT_OPTIONS.find((o) => o.label === value);
    if (opt) setSortType(opt.value);
    setPage(0);
  };

  const currentSortValue =
    SORT_OPTIONS.find((o) => o.value === sortType)?.label ?? "По популярности";

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-[#222222] mb-8">Каталог услуг</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories & Filters Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[#222222]">Категории и фильтры</h3>
                <Button variant="ghost" size="sm" className="text-[#00AFAE]" onClick={handleResetFilters}>
                  Сбросить
                </Button>
              </div>

              {/* Categories from API */}
              <div className="mb-6">
                <h4 className="text-[#222222] mb-3">Категория</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedCategoryId === undefined}
                      onCheckedChange={(checked) => checked === true && setSelectedCategoryId(undefined)}
                    />
                    <span className="text-gray-600">Все категории</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedCategoryId === cat.id}
                        onCheckedChange={(checked) => setSelectedCategoryId(checked ? cat.id : undefined)}
                      />
                      <span className="text-gray-600">{cat.nameRu || cat.nameKz || cat.slug}</span>
                    </label>
                  ))}
                  {categories.length === 0 && !loading && (
                    <p className="text-gray-500 text-sm">Нет категорий</p>
                  )}
                </div>
              </div>

              {/* Поиск по названию или описанию */}
              <div className="mb-6">
                <h4 className="text-[#222222] mb-3">Поиск</h4>
                <Input
                  placeholder="Название или описание..."
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-[#222222] mb-3">Цена, ₸</h4>
                <Slider
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                  max={500000}
                  step={5000}
                  className="mb-2"
                />
                <div className="flex items-center justify-between text-gray-600 text-sm">
                  <span>{priceRange[0].toLocaleString("ru-KZ")} ₸</span>
                  <span>{priceRange[1].toLocaleString("ru-KZ")} ₸</span>
                </div>
              </div>

              {/* City */}
              <div className="mb-6">
                <h4 className="text-[#222222] mb-3">Город</h4>
                <Select value={city || "all"} onValueChange={(v) => setCity(v === "all" ? "" : v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все города</SelectItem>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <h4 className="text-[#222222] mb-3">Рейтинг</h4>
                <div className="space-y-2">
                  {[5, 4, 3].map((r) => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={ratingMin === r}
                        onCheckedChange={(checked) => setRatingMin(checked ? r : undefined)}
                      />
                      <span className="text-gray-600">{r} ★ и выше</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Only with images */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={hasImages} onCheckedChange={(c) => setHasImages(!!c)} />
                  <span className="text-gray-600">Только с фото</span>
                </label>
              </div>

              <Button
                className="w-full bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white rounded-full"
                onClick={() => {
                  setPage(0);
                  setApplyFiltersKey((k) => k + 1);
                }}
              >
                Применить фильтры
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <p className="text-gray-600">
                {loading ? "Загрузка…" : error ? "Ошибка" : `Найдено ${totalElements} услуг`}
              </p>
              <Select value={currentSortValue} onValueChange={handleSortChange}>
                <SelectTrigger className="w-52 rounded-xl">
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt, i) => (
                    <SelectItem key={`${opt.value}-${i}`} value={opt.label}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-80 animate-pulse bg-gray-200/50" />
                ))}
              </div>
            )}

            {!loading && !error && services.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-500">
                По выбранным фильтрам услуг не найдено. Измените параметры или сбросьте фильтры.
              </div>
            )}

            {!loading && services.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onNavigate={(id) => onNavigate("service-detail", { serviceId: id })}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Назад
                    </Button>
                    <span className="text-gray-600 px-2">
                      {page + 1} из {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                      Далее
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
