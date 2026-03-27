import { useCallback, useEffect, useMemo, useState } from "react";
import { Star, MapPin, Calendar, MessageCircle, Share2, Heart, ChevronLeft, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { DatePicker } from "./ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { ImageWithFallback } from "./ImageWithFallback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ServicesCatalogApi } from "../data/api/ServicesCatalogApi";
import { FavoritesApi } from "../data/api/FavoritesApi";
import { CartApi } from "../data/api/CartApi";
import { BookingsApi } from "../data/api/BookingsApi";
import { ServicesAvailabilityApi, type ServiceAvailabilityItem } from "../data/api/ServicesAvailabilityApi";
import { ReviewsApi, type Review } from "../data/api/ReviewsApi";
import { useAuth } from "../contexts/AuthContext";
import type { CatalogService } from "../domain/entities/Service";
import { getImageUrl } from "../utils/imageUrl";
import { formatPriceByType } from "../utils/priceType";
import { toast } from "sonner";
import { Textarea } from "./ui/textarea";

const servicesApi = new ServicesCatalogApi();
const favoritesApi = new FavoritesApi();
const cartApi = new CartApi();
const bookingsApi = new BookingsApi();
const availabilityApi = new ServicesAvailabilityApi();
const reviewsApi = new ReviewsApi();

interface ServiceDetailPageProps {
  onNavigate: (page: string) => void;
  serviceId?: string;
}

export function ServiceDetailPage({ onNavigate, serviceId }: ServiceDetailPageProps) {
  const { isAuthenticated } = useAuth();
  const [service, setService] = useState<CatalogService | null>(null);
  const [loading, setLoading] = useState(!!serviceId);
  const [error, setError] = useState<string | null>(null);
  const [addToCartOpen, setAddToCartOpen] = useState(false);
  const [addToCartQuantity, setAddToCartQuantity] = useState(1);
  const [addToCartDate, setAddToCartDate] = useState<Date | undefined>(undefined);
  const [addToCartNotes, setAddToCartNotes] = useState("");
  const [addToCartLoading, setAddToCartLoading] = useState(false);

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingEventDate, setBookingEventDate] = useState<Date | undefined>(undefined);
  const [bookingEventTime, setBookingEventTime] = useState("12:00");
  const [bookingGuestsCount, setBookingGuestsCount] = useState(1);
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingSubmitLoading, setBookingSubmitLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityItems, setAvailabilityItems] = useState<ServiceAvailabilityItem[]>([]);
  const [serviceReviews, setServiceReviews] = useState<Review[]>([]);
  const [serviceReviewsLoading, setServiceReviewsLoading] = useState(false);

  const toYMD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const calendarRange = useMemo(() => {
    const from = new Date(startOfToday);
    const to = new Date(startOfToday);
    to.setDate(to.getDate() + 60);
    return { from, to, fromYMD: toYMD(from), toYMD: toYMD(to) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOfToday]);

  const availableSet = useMemo(() => {
    const map = new Set<string>();
    for (const item of availabilityItems) {
      const status = (item.status || "").toUpperCase();
      const isAvailable =
        status === "AVAILABLE" || status === "FREE" || status === "OPEN" || status === "ДОСТУПНО";
      if (isAvailable) map.add(item.date);
    }
    return map;
  }, [availabilityItems]);

  const disabledDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d < startOfToday) return true;
    if (d < calendarRange.from) return true;
    if (d > calendarRange.to) return true;
    // Если данные загрузились — разрешаем только AVAILABLE, иначе не глушим (чтобы не ломать UX при сбое).
    if (availabilityItems.length > 0) {
      return !availableSet.has(toYMD(d));
    }
    return false;
  };

  useEffect(() => {
    if (!serviceId) {
      setService(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    servicesApi
      .getServiceById(serviceId)
      .then(setService)
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    (async () => {
      setServiceReviewsLoading(true);
      let merged: Review[] = [];

      // 1) Пытаемся получить публичные отзывы (может быть 403 на некоторых стендах)
      try {
        const publicRes = await reviewsApi.getServiceReviews(serviceId, { page: 0, size: 20 });
        merged = publicRes.content || [];
      } catch (_) {
        // Игнорируем, чтобы всё равно попробовать "мои отзывы"
      }

      // 2) Для авторизованного клиента обязательно пробуем подмешать его отзывы
      if (isAuthenticated) {
        try {
          const myRes = await reviewsApi.getMyReviews({ page: 0, size: 100 });
          const mineForService = (myRes.content || []).filter((r) => r.serviceId === serviceId);
          const ids = new Set(merged.map((r) => r.id));
          for (const r of mineForService) {
            if (!ids.has(r.id)) {
              merged = [r, ...merged];
              ids.add(r.id);
            }
          }
        } catch (_) {
          // Ничего: хотя бы публичные уже отображены, если были.
        }
      }

      if (!cancelled) {
        setServiceReviews(merged);
        setServiceReviewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId, isAuthenticated]);

  const handleToggleFavorite = useCallback(async () => {
    if (!service) return;
    try {
      if (service.isFavorite) {
        await favoritesApi.removeFromFavorites(service.id);
        toast.success("Удалено из избранного");
      } else {
        await favoritesApi.addToFavorites(service.id);
        toast.success("Добавлено в избранное");
      }
      setService((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  }, [service]);

  const openAddToCartDialog = useCallback(() => {
    if (!isAuthenticated) {
      onNavigate("login");
      return;
    }
    setAddToCartQuantity(1);
    setAddToCartDate(undefined);
    setAddToCartNotes("");
    setAddToCartOpen(true);
  }, [isAuthenticated, onNavigate]);

  const openBookingDialog = useCallback(() => {
    if (!isAuthenticated) {
      onNavigate("login");
      return;
    }
    setBookingEventDate(undefined);
    setBookingEventTime("12:00");
    setBookingGuestsCount(1);
    setBookingNotes("");
    setBookingDialogOpen(true);
  }, [isAuthenticated, onNavigate]);

  useEffect(() => {
    if ((!addToCartOpen && !bookingDialogOpen) || !service?.id) return;
    let cancelled = false;
    const run = async () => {
      setAvailabilityLoading(true);
      try {
        const items = await availabilityApi.getAvailability(service.id, {
          from: calendarRange.fromYMD,
          to: calendarRange.toYMD,
        });
        if (cancelled) return;
        const normalized = items || [];
        const newSet = new Set<string>();
        for (const item of normalized) {
          const status = (item.status || "").toUpperCase();
          const isAvailable =
            status === "AVAILABLE" || status === "FREE" || status === "OPEN" || status === "ДОСТУПНО";
          if (isAvailable) newSet.add(item.date);
        }
        setAvailabilityItems(normalized);
        // Если текущая дата не доступна — сбрасываем (используем fetched items, а не состояние).
        const validateDate = (prev: Date | undefined) => {
          if (!prev) return prev;
          const d = new Date(prev);
          d.setHours(0, 0, 0, 0);
          if (d < startOfToday || d < calendarRange.from || d > calendarRange.to) return undefined;
          if (normalized.length > 0 && !newSet.has(toYMD(d))) return undefined;
          return prev;
        };
        setAddToCartDate((prev) => validateDate(prev));
        setBookingEventDate((prev) => validateDate(prev));
      } catch (e) {
        if (cancelled) return;
        toast.error("Не удалось загрузить доступные даты", {
          description: e instanceof Error ? e.message : undefined,
        });
        setAvailabilityItems([]);
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addToCartOpen, bookingDialogOpen, service?.id]);

  const submitBooking = useCallback(async () => {
    if (!service) return;
    if (!bookingEventDate) {
      toast.error("Выберите дату мероприятия");
      return;
    }
    const time = bookingEventTime.trim();
    if (!time) {
      toast.error("Укажите время");
      return;
    }
    setBookingSubmitLoading(true);
    try {
      await bookingsApi.createBooking({
        serviceId: service.id,
        eventDate: toYMD(bookingEventDate),
        eventTime: time,
        guestsCount: Math.max(1, bookingGuestsCount),
        notes: bookingNotes.trim() || undefined,
      });
      toast.success("Бронирование создано");
      setBookingDialogOpen(false);
      onNavigate("client-bookings");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка бронирования");
    } finally {
      setBookingSubmitLoading(false);
    }
  }, [service, bookingEventDate, bookingEventTime, bookingGuestsCount, bookingNotes, onNavigate]);

  const submitAddToCart = useCallback(async () => {
    if (!service) return;
    if (!addToCartDate) {
      toast.error("Выберите дату бронирования");
      return;
    }
    setAddToCartLoading(true);
    try {
      await cartApi.addToCart({
        serviceId: service.id,
        quantity: addToCartQuantity,
        eventDate: addToCartDate ? toYMD(addToCartDate) : undefined,
        notes: addToCartNotes.trim() || undefined,
      });
      toast.success("Добавлено в корзину");
      setService((prev) => (prev ? { ...prev, inCart: true } : null));
      setAddToCartOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setAddToCartLoading(false);
    }
  }, [service, addToCartQuantity, addToCartDate, addToCartNotes]);

  if (!serviceId) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Выберите услугу в каталоге</p>
          <Button onClick={() => onNavigate("catalog")} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
            Перейти в каталог
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="aspect-video bg-gray-200 rounded-2xl animate-pulse" />
              <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Услуга не найдена"}</p>
          <Button onClick={() => onNavigate("catalog")} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Вернуться к каталогу
          </Button>
        </div>
      </div>
    );
  }

  const gallery = [service.thumbnail, ...(service.images || [])].filter(Boolean);
  const mainImage = getImageUrl(gallery[0] || "");
  const thumbnails = gallery.slice(1, 4).map((img) => getImageUrl(img));

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate("catalog")}
          className="flex items-center gap-2 text-[#00AFAE] mb-6 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Вернуться к каталогу
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
              <div className="aspect-video relative">
                <ImageWithFallback
                  src={mainImage}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button size="icon" variant="secondary" className="rounded-full bg-white/90 backdrop-blur-sm">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full bg-white/90 backdrop-blur-sm"
                    onClick={handleToggleFavorite}
                    aria-label={service.isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
                  >
                    <Heart
                      className={`w-5 h-5 ${service.isFavorite ? "fill-red-500 text-red-500" : ""}`}
                    />
                  </Button>
                </div>
              </div>
              {thumbnails.length > 0 && (
                <div className="grid grid-cols-3 gap-2 p-2">
                  {thumbnails.map((img, index) => (
                    <div key={index} className="aspect-video rounded-lg overflow-hidden">
                      <ImageWithFallback
                        src={img}
                        alt={`${service.name} ${index + 2}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-[#222222] mb-2">{service.name}</h1>
                  <div className="flex items-center gap-4 text-gray-600 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-[#FFD700] text-[#FFD700]" />
                      <span>
                        {service.rating?.toFixed(1) ?? "—"} ({service.reviewsCount ?? 0} отзывов)
                      </span>
                    </div>
                    {(service.city || service.address) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-5 h-5 text-[#00AFAE]" />
                        <span>{[service.city, service.address].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Tabs defaultValue="description" className="mt-6">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="description">Описание</TabsTrigger>
                  <TabsTrigger value="reviews">Отзывы</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-6">
                  {service.shortDescription && (
                    <p className="text-gray-600 leading-relaxed">{service.shortDescription}</p>
                  )}
                  {service.fullDescription && (
                    <p className="text-gray-600 leading-relaxed mt-4 whitespace-pre-wrap">
                      {service.fullDescription}
                    </p>
                  )}
                  {!service.shortDescription && !service.fullDescription && (
                    <p className="text-gray-500">Описание не указано.</p>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  {serviceReviewsLoading ? (
                    <p className="text-gray-500">Загрузка отзывов...</p>
                  ) : serviceReviews.length === 0 ? (
                    <p className="text-gray-500">Пока нет отзывов по этой услуге.</p>
                  ) : (
                    <div className="space-y-6">
                      {serviceReviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#00AFAE] to-[#FFD700] rounded-full flex items-center justify-center text-white flex-shrink-0">
                              {(review.userFullName || "U")
                                .split(" ")
                                .map((p) => p[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[#222222]">{review.userFullName || "Пользователь"}</h4>
                                <span className="text-gray-500">
                                  {review.createdAt
                                    ? new Date(review.createdAt).toLocaleDateString("ru-RU")
                                    : "—"}
                                </span>
                              </div>
                              <div className="flex gap-1 mb-2">
                                {[...Array(Math.max(0, Math.min(5, Number(review.rating) || 0)))].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                                ))}
                              </div>
                              <p className="text-gray-600 whitespace-pre-wrap">{review.comment || "—"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="mb-6">
                <p className="text-gray-600 mb-2">Цена</p>
                <h2 className="text-[#00AFAE]">
                  {formatPriceByType(service.priceFrom ?? 0, service.priceTo ?? 0, service.priceType)}
                </h2>
              </div>

             

              <div className="space-y-3">
                <Button
                  onClick={openBookingDialog}
                  className="w-full bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white rounded-full h-12"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Забронировать
                </Button>
                <Button
                  onClick={openAddToCartDialog}
                  variant="outline"
                  className="w-full rounded-full h-12 border-[#00AFAE] text-[#00AFAE] hover:bg-[#00AFAE]/10"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  В корзину
                </Button>
                <Button variant="outline" className="w-full rounded-full h-12">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Связаться с партнёром
                </Button>
              </div>

              <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Бронирование</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Дата мероприятия *</Label>
                      <DatePicker
                        placeholder="Выберите дату"
                        value={bookingEventDate}
                        onChange={setBookingEventDate}
                        disabled={availabilityLoading}
                        disabledDate={disabledDate}
                      />
                      {availabilityLoading && (
                        <div className="text-xs text-gray-500">Загрузка свободных дат...</div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="booking-time">Время *</Label>
                      <Input
                        id="booking-time"
                        type="time"
                        value={bookingEventTime}
                        onChange={(e) => setBookingEventTime(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="booking-guests">Количество гостей *</Label>
                      <Input
                        id="booking-guests"
                        type="number"
                        min={1}
                        value={bookingGuestsCount}
                        onChange={(e) => setBookingGuestsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="booking-notes">Заметка (необязательно)</Label>
                      <Textarea
                        id="booking-notes"
                        placeholder="Пожелания, комментарий..."
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBookingDialogOpen(false)} disabled={bookingSubmitLoading}>
                      Отмена
                    </Button>
                    <Button
                      className="bg-[#00AFAE] hover:bg-[#00AFAE]/90"
                      onClick={submitBooking}
                      disabled={bookingSubmitLoading || availabilityLoading || !bookingEventDate}
                    >
                      {bookingSubmitLoading ? "Отправка…" : "Забронировать"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={addToCartOpen} onOpenChange={setAddToCartOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Добавить в корзину</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cart-quantity">Количество человек</Label>
                      <Input
                        id="cart-quantity"
                        type="number"
                        min={1}
                        value={addToCartQuantity}
                        onChange={(e) => setAddToCartQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Дата мероприятия</Label>
                      <DatePicker
                        placeholder="Выберите дату"
                        value={addToCartDate}
                        onChange={setAddToCartDate}
                        disabled={availabilityLoading}
                        disabledDate={disabledDate}
                      />
                      {availabilityLoading && <div className="text-xs text-gray-500">Загрузка свободных дат...</div>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cart-notes">Заметка (необязательно)</Label>
                      <Input
                        id="cart-notes"
                        placeholder="Пожелания, комментарий..."
                        value={addToCartNotes}
                        onChange={(e) => setAddToCartNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddToCartOpen(false)} disabled={addToCartLoading}>
                      Отмена
                    </Button>
                    <Button
                      className="bg-[#00AFAE] hover:bg-[#00AFAE]/90"
                      onClick={submitAddToCart}
                      disabled={addToCartLoading || availabilityLoading || !addToCartDate}
                    >
                      {addToCartLoading ? "Добавление…" : "Добавить в корзину"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {service.partnerName && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-[#222222] mb-3">О партнёре</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#00AFAE] to-[#FFD700] rounded-full flex items-center justify-center text-white">
                      {service.partnerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[#222222]">{service.partnerName}</p>
                      <p className="text-gray-500">Партнёр</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div>
                      <p>Рейтинг</p>
                      <p className="text-[#222222]">{service.rating?.toFixed(1) ?? "—"}</p>
                    </div>
                    <div>
                      <p>Отзывов</p>
                      <p className="text-[#222222]">{service.reviewsCount ?? 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
