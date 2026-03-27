import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { BookingsApi, type Booking } from "../../data/api/BookingsApi";
import { bookingStatusLabel } from "./bookingStatusLabel";
import { toast } from "sonner";
import { ImageWithFallback } from "../ImageWithFallback";
import { getImageUrl } from "../../utils/imageUrl";

const api = new BookingsApi();

function isHistoryStatus(status: string): boolean {
  const s = (status || "").toUpperCase();
  return s === "COMPLETED" || s === "CANCELLED" || s === "REJECTED" || s === "EXPIRED";
}

export function BookingsHistoryPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getBookings({ page: 0, size: 100 });
      const list = (res.content || []).filter((b) => isHistoryStatus(String(b.status)));
      setItems(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AFAE]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <History className="w-14 h-14 mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-medium text-[#222222] mb-2">История пуста</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
          Здесь появляются завершённые, отменённые и отклонённые бронирования.
        </p>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/profile/bookings">К активным</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((b) => (
        <div
          key={b.id}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4 sm:items-center"
        >
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
            <ImageWithFallback
              src={getImageUrl(b.serviceThumbnail || "")}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/profile/bookings/${b.id}`}
              className="font-medium text-[#222222] hover:text-[#00AFAE] flex items-center gap-1"
            >
              {b.serviceName}
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              {b.eventDate} · {b.eventTime} · гостей: {b.guestsCount}
            </p>
            <p className="text-sm text-[#00AFAE] mt-1">{bookingStatusLabel(String(b.status))}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link to={`/profile/bookings/${b.id}`}>Подробнее</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

