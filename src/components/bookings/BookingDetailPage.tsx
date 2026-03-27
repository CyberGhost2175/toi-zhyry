import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Loader2, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { BookingsApi, type Booking } from "../../data/api/BookingsApi";
import { bookingStatusLabel, canCancelBooking } from "./bookingStatusLabel";
import { toast } from "sonner";
import { ImageWithFallback } from "../ImageWithFallback";
import { getImageUrl } from "../../utils/imageUrl";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ReviewsApi, type Review } from "../../data/api/ReviewsApi";
import { FilesApi } from "../../data/api/FilesApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

const api = new BookingsApi();
const reviewsApi = new ReviewsApi();
const filesApi = new FilesApi();

export function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImageUrls, setReviewImageUrls] = useState<string[]>([]);
  const [reviewImageUploading, setReviewImageUploading] = useState(false);
  const reviewImagesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const b = await api.getBookingById(bookingId);
        if (!cancelled) setBooking(b);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
          setBooking(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const handleCancel = async () => {
    if (!bookingId) return;
    setCancelLoading(true);
    try {
      const b = await api.cancelBooking(bookingId);
      setBooking(b);
      toast.success("Бронирование отменено");
      setCancelOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось отменить");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!bookingId) return;
    setCompleteLoading(true);
    try {
      const b = await api.completeBooking(bookingId);
      setBooking(b);
      toast.success("Вы подтвердили завершение сделки");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось подтвердить завершение");
    } finally {
      setCompleteLoading(false);
    }
  };

  const openReviewDialog = async () => {
    if (!bookingId) return;
    setReviewLoading(true);
    try {
      const res = await reviewsApi.getMyReviews({ page: 0, size: 100 });
      const found = (res.content || []).find((r) => r.bookingId === bookingId) || null;
      setExistingReview(found);
      setReviewRating(found?.rating || 5);
      setReviewComment(found?.comment || "");
      setReviewImageUrls(found?.imageUrls || []);
      setReviewDialogOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить отзыв");
    } finally {
      setReviewLoading(false);
    }
  };

  const submitReview = async () => {
    if (!bookingId) return;
    if (!reviewComment.trim()) {
      toast.error("Добавьте текст отзыва");
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error("Оценка должна быть от 1 до 5");
      return;
    }
    setReviewLoading(true);
    try {
      if (existingReview) {
        const updated = await reviewsApi.updateReview(existingReview.id, {
          rating: reviewRating,
          comment: reviewComment.trim(),
          imageUrls: reviewImageUrls.length ? reviewImageUrls : undefined,
        });
        setExistingReview(updated);
        toast.success("Отзыв обновлён");
      } else {
        const created = await reviewsApi.createReview({
          bookingId,
          rating: reviewRating,
          comment: reviewComment.trim(),
          imageUrls: reviewImageUrls.length ? reviewImageUrls : undefined,
        });
        setExistingReview(created);
        toast.success("Отзыв отправлен");
      }
      setReviewDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить отзыв");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReviewImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    e.target.value = "";
    setReviewImageUploading(true);
    try {
      const urls = await filesApi.uploadMultiple(files);
      if (urls.length === 0) {
        toast.error("Сервер не вернул URL загруженных файлов");
        return;
      }
      setReviewImageUrls((prev) => [...prev, ...urls]);
      toast.success(`Загружено фото: ${urls.length}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки изображений");
    } finally {
      setReviewImageUploading(false);
    }
  };

  const removeReviewImage = (index: number) => {
    setReviewImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AFAE]" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-white rounded-2xl border p-8 text-center">
        <p className="text-gray-600 mb-4">Бронирование не найдено</p>
        <Button variant="outline" asChild>
          <Link to="/profile/bookings">К списку</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Button variant="ghost" size="sm" className="rounded-full" asChild>
          <Link to="/profile/bookings">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Назад
          </Link>
        </Button>
      </div>
      <div className="p-6 grid gap-6 md:grid-cols-[140px,1fr]">
        <div className="w-full aspect-square max-w-[140px] rounded-xl overflow-hidden bg-gray-100">
          <ImageWithFallback
            src={getImageUrl(booking.serviceThumbnail || "")}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#222222]">{booking.serviceName}</h1>
          <p className="text-sm text-gray-500 mt-1">{booking.serviceCategory}</p>
          <p className="text-[#00AFAE] font-medium mt-2">{bookingStatusLabel(String(booking.status))}</p>
          {String(booking.status).toUpperCase() === "CONFIRMED" &&
            booking.partnerConfirmed &&
            !booking.clientConfirmed && (
              <p className="text-sm text-sky-700 mt-1">
                Партнёр подтвердил завершение. Подтвердите сделку со своей стороны.
              </p>
            )}
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-gray-500 w-36 shrink-0">Дата</dt>
              <dd>{booking.eventDate}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-36 shrink-0">Время</dt>
              <dd>{booking.eventTime}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-36 shrink-0">Гостей</dt>
              <dd>{booking.guestsCount}</dd>
            </div>
            {booking.notes && (
              <div className="flex gap-2">
                <dt className="text-gray-500 w-36 shrink-0">Заметка</dt>
                <dd className="whitespace-pre-wrap">{booking.notes}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="text-gray-500 w-36 shrink-0">Сумма</dt>
              <dd>{booking.totalPrice != null ? `${booking.totalPrice} ₸` : "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-36 shrink-0">Партнёр</dt>
              <dd>{booking.partnerCompanyName}</dd>
            </div>
            {booking.partnerPhone && (
              <div className="flex gap-2">
                <dt className="text-gray-500 w-36 shrink-0">Телефон</dt>
                <dd>{booking.partnerPhone}</dd>
              </div>
            )}
          </dl>
          {canCancelBooking(String(booking.status)) && (
            <Button
              variant="outline"
              className="mt-6 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setCancelOpen(true)}
            >
              Отменить бронирование
            </Button>
          )}
          {String(booking.status).toUpperCase() === "CONFIRMED" &&
            booking.partnerConfirmed &&
            !booking.clientConfirmed && (
              <Button
                className="mt-3 ml-0 md:ml-2 bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white"
                onClick={handleComplete}
                disabled={completeLoading}
              >
                {completeLoading ? "Подтверждение..." : "Подтвердить завершение"}
              </Button>
            )}
          {String(booking.status).toUpperCase() === "COMPLETED" && (
            <Button
              variant="outline"
              className="mt-3 ml-0 md:ml-2 border-[#00AFAE] text-[#00AFAE] hover:bg-[#00AFAE]/10"
              onClick={openReviewDialog}
              disabled={reviewLoading}
            >
              {existingReview ? "Редактировать отзыв" : "Оставить отзыв"}
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить бронирование?</AlertDialogTitle>
            <AlertDialogDescription>
              Статусы PENDING_CONFIRMATION и CONFIRMED можно отменить. Подтвердите действие.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>Назад</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={cancelLoading}
            >
              {cancelLoading ? "Отмена…" : "Отменить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{existingReview ? "Редактировать отзыв" : "Оставить отзыв"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="review-rating">Оценка (1-5)</Label>
              <Input
                id="review-rating"
                type="number"
                min={1}
                max={5}
                value={reviewRating}
                onChange={(e) => setReviewRating(Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 1)))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-comment">Комментарий</Label>
              <Textarea
                id="review-comment"
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Поделитесь впечатлениями"
              />
            </div>
            <div className="space-y-2">
              <Label>Фото (опционально)</Label>
              <div className="flex gap-2 flex-wrap items-center">
                <input
                  ref={reviewImagesInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleReviewImagesUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => reviewImagesInputRef.current?.click()}
                  disabled={reviewImageUploading}
                >
                  {reviewImageUploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-1" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-4 h-4 mr-1" />
                      Добавить фото
                    </>
                  )}
                </Button>
                <span className="text-xs text-gray-500">JPG, PNG, WEBP, GIF до 5 МБ</span>
              </div>
              {reviewImageUrls.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {reviewImageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative group rounded-lg overflow-hidden border w-16 h-16">
                      <ImageWithFallback
                        src={getImageUrl(url)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeReviewImage(index)}
                        className="absolute inset-0 bg-black/50 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)} disabled={reviewLoading}>
              Отмена
            </Button>
            <Button className="bg-[#00AFAE] hover:bg-[#00AFAE]/90" onClick={submitReview} disabled={reviewLoading}>
              {reviewLoading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
