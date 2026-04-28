import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MessageSquare } from "lucide-react";
import { ReviewsApi, type Review } from "../../data/api/ReviewsApi";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";

const api = new ReviewsApi();

export function MyReviewsPage() {
  const { user } = useAuth();
  const isPartner = user?.role?.toUpperCase() === "PARTNER";
  const partnerId = (user?.id || "").trim();

  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (isPartner) {
          if (!partnerId) {
            if (!cancelled) setItems([]);
            return;
          }
          const res = await api.getPartnerReviews(partnerId, { page: 0, size: 100, sort: "NEW" });
          if (!cancelled) setItems(res.content || []);
        } else {
          const res = await api.getMyReviews({ page: 0, size: 50 });
          if (!cancelled) setItems(res.content || []);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPartner, partnerId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-center py-16 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#00AFAE]" />
        </div>
      </div>
    );
  }

  if (isPartner && !partnerId) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-600 text-sm">
            Не удалось определить профиль. Выйдите из аккаунта и войдите снова.
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <MessageSquare className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-medium text-[#222222] mb-2">Пока нет отзывов</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            {isPartner
              ? "Когда клиенты оставят отзывы на ваши услуги после завершённых бронирований, они появятся здесь."
              : "Оставляйте отзывы после завершённых бронирований — они появятся здесь."}
          </p>
          {!isPartner && (
            <Button asChild className="bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white rounded-full">
              <Link to="/catalog">Перейти в каталог</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-[#222222] text-xl font-semibold">
            {isPartner ? "Отзывы о моих услугах" : "Мои отзывы"}
          </h1>
          {isPartner && (
            <p className="text-sm text-gray-500 mt-1">Отзывы клиентов по вашим услугам</p>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((r) => (
            <div key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {isPartner && (
                    <>
                      <div className="text-sm text-gray-500">Клиент</div>
                      <div className="text-[#222222] font-medium truncate">
                        {r.userFullName?.trim() || "—"}
                      </div>
                    </>
                  )}
                  <div className={`text-sm text-gray-500 ${isPartner ? "mt-2" : ""}`}>Услуга</div>
                  <div className="text-[#222222] font-medium truncate">{r.serviceName}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("ru-RU") : "—"}
                  </div>
                </div>
                <div className="shrink-0 text-[#FFD700] font-semibold">{Number(r.rating) || 0}/5</div>
              </div>
              <div className="mt-3 text-gray-700 whitespace-pre-wrap">{r.comment || "—"}</div>
              <div className="mt-3">
                <Button variant="outline" size="sm" className="rounded-full" asChild>
                  <Link
                    to={
                      isPartner
                        ? `/partner/dashboard?tab=bookings&bookingId=${encodeURIComponent(r.bookingId)}`
                        : `/profile/bookings/${r.bookingId}`
                    }
                  >
                    Открыть бронирование
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

