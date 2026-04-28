import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  TrendingUp,
  Star,
  Calendar as CalendarIcon,
  Eye,
  Pencil,
  Trash2,
  Upload,
  ImagePlus,
  CreditCard,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar as CalendarUI } from "./ui/calendar";
import { ImageWithFallback } from "./ImageWithFallback";
import {
  PartnerServicesApi,
  PartnerServiceItem,
  CreateServiceRequest,
  ServiceCategory,
} from "../data/api/PartnerServicesApi";
import {
  ServicesAvailabilityApi,
  AvailabilityStatus,
  ServiceAvailabilityItem,
} from "../data/api/ServicesAvailabilityApi";
import { PartnerBookingsApi } from "../data/api/PartnerBookingsApi";
import type { Booking, BookingStatus } from "../data/api/BookingsApi";
import { FilesApi, parseUploadResponse } from "../data/api/FilesApi";
import { getImageUrl } from "../utils/imageUrl";
import { PRICE_TYPE_OPTIONS } from "../utils/priceType";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useLocation, useNavigate } from "react-router-dom";
import {
  PartnerSubscriptionsApi,
  type PartnerSubscription,
  type PartnerSubscriptionsHistoryPage,
} from "../data/api/PartnerSubscriptionsApi";
import { PaymentsApi, type SubscriptionPaymentMethod } from "../data/api/PaymentsApi";
import type { SubscriptionPlan } from "../data/api/AdminSubscriptionPlansApi";
import { type Review, type ReviewsSort, type ServiceReviewsSummary } from "../data/api/ReviewsApi";
import { ChatsApi } from "../data/api/ChatsApi";
import { PartnerReviewsApi } from "../data/api/PartnerReviewsApi";
import {
  PartnerServiceVariantsApi,
  type CreatePartnerVariantRequest,
} from "../data/api/PartnerServiceVariantsApi";
import type { AttributeDefinition, ServiceVariant } from "../data/api/ServiceVariantsApi";
import { KZ_CITIES } from "../utils/kzData";
import { PartnerStoriesSection } from "./stories/PartnerStoriesSection";

interface PartnerDashboardProps {
  onNavigate: (page: string) => void;
}

function buildImageCandidates(url: string): string[] {
  const raw = (url || "").trim();
  if (!raw) return [];

  const candidates: string[] = [];
  const push = (value: string) => {
    const resolved = getImageUrl(value);
    if (resolved && !candidates.includes(resolved)) {
      candidates.push(resolved);
    }
  };

  push(raw);
  if (!raw.startsWith("http://") && !raw.startsWith("https://") && !raw.startsWith("/")) {
    push(`/uploads/${raw}`);
    push(`/upload/${raw}`);
    push(`/api/v1/files/${raw}`);
  }
  if (raw.startsWith("/uploads/")) push(raw.replace("/uploads/", "/upload/"));
  if (raw.startsWith("/upload/")) push(raw.replace("/upload/", "/uploads/"));
  if (raw.startsWith("/uploads/")) {
    const fileName = raw.split("/").filter(Boolean).pop();
    if (fileName) {
      push(`/api/v1/files/${fileName}`);
    }
  }
  if (raw.startsWith("/upload/")) {
    const fileName = raw.split("/").filter(Boolean).pop();
    if (fileName) {
      push(`/api/v1/files/${fileName}`);
    }
  }

  return candidates;
}

function isSubscriptionAwaitingPayment(status: string): boolean {
  const u = (status || "").toUpperCase();
  if (u.includes("CANCEL")) return false;
  if (u.includes("EXPIRED")) return false;
  return (
    u.includes("PENDING") ||
    u.includes("AWAITING") ||
    u.includes("WAITING") ||
    u.includes("UNPAID")
  );
}

/** Если GET .../active вернул 404 (часто для PENDING), берём актуальную запись из истории по услуге */
function pickCurrentSubscriptionFromHistory(
  serviceId: string,
  historyRows: PartnerSubscription[]
): PartnerSubscription | null {
  const rows = historyRows.filter((r) => r.serviceId === serviceId);
  if (rows.length === 0) return null;
  const sorted = [...rows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  for (const row of sorted) {
    const u = (row.status || "").toUpperCase();
    if (u.includes("CANCEL")) continue;
    if (u.includes("EXPIRED")) continue;
    if (u.includes("REJECT")) continue;
    return row;
  }
  return null;
}

async function buildActiveSubByServiceId(
  api: PartnerSubscriptionsApi,
  services: PartnerServiceItem[],
  historyContent: PartnerSubscription[]
): Promise<Record<string, PartnerSubscription | null>> {
  const entries = await Promise.all(
    services.map(async (s) => {
      try {
        const sub = await api.getActiveSubscription(s.id);
        if (sub) return [s.id, sub] as const;
      } catch {
        /* сеть /5xx — пробуем историю */
      }
      const fb = pickCurrentSubscriptionFromHistory(s.id, historyContent);
      return [s.id, fb] as const;
    })
  );
  return Object.fromEntries(entries);
}

function formatSubscriptionDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
}

function appendImageExtensionIfMissing(url: string, fileName: string): string {
  const raw = (url || "").trim();
  if (!raw) return raw;
  if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(raw)) return raw;
  const match = fileName.toLowerCase().match(/\.(jpe?g|png|webp|gif)$/);
  if (!match) return raw;
  return `${raw}.${match[1]}`;
}

/** Превью картинки галереи с fallback при ошибке загрузки */
function GalleryImagePreview({ url, onRemove }: { url: string; onRemove: () => void }) {
  const candidates = buildImageCandidates(url);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(candidates.length === 0);
  const src = candidates[candidateIndex] || "";
  const handleError = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((v) => v + 1);
      return;
    }
    setFailed(true);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-200 w-20 h-20 bg-gray-100 flex items-center justify-center">
      {!failed && src ? (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          onError={handleError}
        />
      ) : (
        <div className="text-gray-400 text-xs text-center px-1">Не загружено</div>
      )}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs"
        onClick={onRemove}
      >
        Удалить
      </button>
    </div>
  );
}

function ThumbnailImagePreview({ url }: { url: string }) {
  const candidates = buildImageCandidates(url);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(candidates.length === 0);
  const src = candidates[candidateIndex] || "";

  const handleError = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((v) => v + 1);
      return;
    }
    setFailed(true);
  };

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 w-32 h-24 bg-gray-100 flex items-center justify-center">
      {!failed && src ? (
        <img src={src} alt="Обложка" className="w-full h-full object-cover" onError={handleError} />
      ) : (
        <div className="text-gray-400 text-xs text-center px-2">Не загружено</div>
      )}
    </div>
  );
}

const defaultServiceForm: CreateServiceRequest = {
  categoryId: "",
  name: "",
  shortDescription: "",
  fullDescription: "",
  priceFrom: 0,
  priceTo: 0,
  priceType: "FIXED",
  city: "",
  address: "",
  thumbnail: "",
  imageUrls: [],
};

type PartnerVariantFormState = {
  name: string;
  description: string;
  price: number;
  sortOrder: number;
  isActive: boolean;
  imageUrls: string[];
  attributes: Record<string, unknown>;
};

const defaultVariantForm: PartnerVariantFormState = {
  name: "",
  description: "",
  price: 0,
  sortOrder: 1,
  isActive: true,
  imageUrls: [],
  attributes: {},
};

function getChatIdFromUrl(chatUrl?: string): string | null {
  if (!chatUrl || !chatUrl.startsWith("/")) return null;
  try {
    const parsed = new URL(chatUrl, window.location.origin);
    const queryChatId = parsed.searchParams.get("chatId");
    if (queryChatId?.trim()) return queryChatId.trim();

    const segments = parsed.pathname.split("/").filter(Boolean);
    const maybeId = segments[segments.length - 1];
    if (maybeId && maybeId !== "chats" && maybeId !== "chat") return maybeId;
  } catch {
    return null;
  }
  return null;
}

export function PartnerDashboard({ onNavigate }: PartnerDashboardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const servicesApi = new PartnerServicesApi();
  const availabilityApi = new ServicesAvailabilityApi();
  const partnerBookingsApi = new PartnerBookingsApi();
  const partnerSubscriptionsApi = new PartnerSubscriptionsApi();
  const partnerVariantsApi = new PartnerServiceVariantsApi();
  const paymentsApi = new PaymentsApi();
  const chatsApi = new ChatsApi();
  const filesApi = new FilesApi();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploadThumbnailLoading, setUploadThumbnailLoading] = useState(false);
  const [uploadGalleryLoading, setUploadGalleryLoading] = useState(false);
  const [servicesList, setServicesList] = useState<PartnerServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesPage, setServicesPage] = useState(0);
  const [servicesTotalPages, setServicesTotalPages] = useState(0);
  const [servicesTotalElements, setServicesTotalElements] = useState(0);

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<PartnerServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState<CreateServiceRequest & { isActive?: boolean }>(defaultServiceForm);
  const [serviceSubmitLoading, setServiceSubmitLoading] = useState(false);

  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [variantsModalOpen, setVariantsModalOpen] = useState(false);
  const [variantsService, setVariantsService] = useState<PartnerServiceItem | null>(null);
  const [variantsList, setVariantsList] = useState<ServiceVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantSchema, setVariantSchema] = useState<AttributeDefinition[]>([]);
  const [variantForm, setVariantForm] = useState<PartnerVariantFormState>(defaultVariantForm);
  const [editingVariant, setEditingVariant] = useState<ServiceVariant | null>(null);
  const [variantSubmitLoading, setVariantSubmitLoading] = useState(false);
  const [variantDeleteTarget, setVariantDeleteTarget] = useState<ServiceVariant | null>(null);
  const [variantDeleteLoading, setVariantDeleteLoading] = useState(false);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "services" | "bookings" | "calendar" | "subscriptions" | "reviews" | "stories"
  >("services");
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<"ALL" | BookingStatus>("ALL");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [partnerReviews, setPartnerReviews] = useState<Review[]>([]);
  const [partnerReviewsLoading, setPartnerReviewsLoading] = useState(false);
  const [partnerReviewsSort, setPartnerReviewsSort] = useState<ReviewsSort>("NEW");
  const [partnerReviewsServiceId, setPartnerReviewsServiceId] = useState("");
  const [partnerReviewsPage, setPartnerReviewsPage] = useState(0);
  const [partnerReviewsTotalPages, setPartnerReviewsTotalPages] = useState(0);
  const [partnerReviewsTotalElements, setPartnerReviewsTotalElements] = useState(0);
  const [partnerReviewsSummary, setPartnerReviewsSummary] = useState<ServiceReviewsSummary | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const tab = q.get("tab");
    if (
      tab === "bookings" ||
      tab === "calendar" ||
      tab === "reviews" ||
      tab === "services" ||
      tab === "subscriptions" ||
      tab === "stories"
    ) {
      setActiveTab(tab);
      return;
    }
    setActiveTab("services");
  }, [location.search]);

  /** Диплинк из уведомлений: ?tab=bookings&bookingId=… */
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("tab") !== "bookings") return;
    const bookingId = q.get("bookingId")?.trim();
    if (!bookingId) return;

    q.delete("bookingId");
    const qs = q.toString();
    navigate(
      { pathname: location.pathname, search: qs ? `?${qs}` : "" },
      { replace: true }
    );

    let cancelled = false;
    setBookingActionLoading(true);
    void (async () => {
      try {
        const detail = await partnerBookingsApi.getBookingById(bookingId);
        if (cancelled) return;
        setSelectedBooking(detail);
        setRejectReason(detail.rejectionReason || "");
        setBookingDetailOpen(true);
      } catch (e) {
        if (!cancelled) {
          toast.error("Не удалось загрузить детали", {
            description: e instanceof Error ? e.message : undefined,
          });
        }
      } finally {
        if (!cancelled) setBookingActionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.search, location.pathname, navigate]);

  const loadPartnerBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await partnerBookingsApi.getBookings({
        status: bookingStatusFilter === "ALL" ? undefined : bookingStatusFilter,
        page: 0,
        size: 50,
      });
      setBookingsList(res.content || []);
    } catch (e) {
      toast.error("Ошибка загрузки бронирований", {
        description: e instanceof Error ? e.message : "Попробуйте позже",
      });
      setBookingsList([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "bookings") return;
    loadPartnerBookings();
  }, [activeTab, bookingStatusFilter]);

  useEffect(() => {
    if (activeTab !== "reviews") return;
    if (servicesList.length > 0 && !partnerReviewsServiceId) {
      setPartnerReviewsServiceId(servicesList[0].id);
      return;
    }
    if (!partnerReviewsServiceId) {
      setPartnerReviews([]);
      setPartnerReviewsSummary(null);
      return;
    }
    let cancelled = false;
    const partnerReviewsApi = new PartnerReviewsApi();
    setPartnerReviewsLoading(true);
    void (async () => {
      try {
        const [res, summary] = await Promise.all([
          partnerReviewsApi.getMyServiceReviews(partnerReviewsServiceId, {
            page: partnerReviewsPage,
            size: 20,
            sort: partnerReviewsSort,
          }),
          partnerReviewsApi.getMyServiceReviewsSummary(partnerReviewsServiceId),
        ]);
        if (!cancelled) {
          setPartnerReviews(res.content || []);
          setPartnerReviewsTotalPages(res.totalPages ?? 0);
          setPartnerReviewsTotalElements(res.totalElements ?? 0);
          setPartnerReviewsSummary(summary);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error("Не удалось загрузить отзывы", {
            description: e instanceof Error ? e.message : undefined,
          });
          setPartnerReviews([]);
          setPartnerReviewsSummary(null);
          setPartnerReviewsTotalPages(0);
          setPartnerReviewsTotalElements(0);
        }
      } finally {
        if (!cancelled) setPartnerReviewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, partnerReviewsPage, partnerReviewsServiceId, partnerReviewsSort, servicesList]);

  useEffect(() => {
    setPartnerReviewsPage(0);
  }, [partnerReviewsServiceId, partnerReviewsSort]);

  const [subscriptionsPanelLoading, setSubscriptionsPanelLoading] = useState(false);
  const [catalogPlans, setCatalogPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionsHistory, setSubscriptionsHistory] = useState<PartnerSubscriptionsHistoryPage | null>(null);
  const [subscriptionsHistoryPage, setSubscriptionsHistoryPage] = useState(0);
  const [activeSubByServiceId, setActiveSubByServiceId] = useState<Record<string, PartnerSubscription | null>>({});
  const [selectedPlanIdByServiceId, setSelectedPlanIdByServiceId] = useState<Record<string, string>>({});
  const [subscribeServiceLoadingId, setSubscribeServiceLoadingId] = useState<string | null>(null);
  const [cancelSubscriptionTarget, setCancelSubscriptionTarget] = useState<PartnerSubscription | null>(null);
  const [cancelSubscriptionLoading, setCancelSubscriptionLoading] = useState(false);
  const [paySubscriptionTarget, setPaySubscriptionTarget] = useState<PartnerSubscription | null>(null);
  const [payMethod, setPayMethod] = useState<SubscriptionPaymentMethod>("KASPI");
  const [paySubscriptionLoading, setPaySubscriptionLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "subscriptions") return;
    let cancelled = false;
    (async () => {
      setSubscriptionsPanelLoading(true);
      try {
        const [plans, hist, svcRes] = await Promise.all([
          partnerSubscriptionsApi.listAvailablePlans(),
          partnerSubscriptionsApi.getSubscriptionsHistory({
            page: subscriptionsHistoryPage,
            size: 100,
          }),
          servicesApi.getMyServices({ page: servicesPage, size: 10 }),
        ]);
        if (cancelled) return;
        setCatalogPlans(plans);
        setSubscriptionsHistory(hist);
        const services = svcRes.content || [];
        setServicesList(services);
        setServicesTotalPages(svcRes.totalPages ?? 0);
        setServicesTotalElements(svcRes.totalElements ?? 0);

        const historyRows = hist.content || [];
        const activeMap = await buildActiveSubByServiceId(
          partnerSubscriptionsApi,
          services,
          historyRows
        );
        if (cancelled) return;
        setActiveSubByServiceId(activeMap);
      } catch (e) {
        if (!cancelled) {
          toast.error("Не удалось загрузить данные подписок", {
            description: e instanceof Error ? e.message : "Попробуйте позже",
          });
        }
      } finally {
        if (!cancelled) setSubscriptionsPanelLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, servicesPage, subscriptionsHistoryPage]);

  const purchasablePlans = useMemo(() => {
    return catalogPlans.filter((p) => {
      const st = (p.status || "").toUpperCase();
      if (!st) return true;
      return st === "ACTIVE" || st === "ENABLED";
    });
  }, [catalogPlans]);

  const reloadSubscriptionsHistoryAndActives = async () => {
    try {
      const hist = await partnerSubscriptionsApi.getSubscriptionsHistory({
        page: subscriptionsHistoryPage,
        size: 100,
      });
      setSubscriptionsHistory(hist);
      const activeMap = await buildActiveSubByServiceId(
        partnerSubscriptionsApi,
        servicesList,
        hist.content || []
      );
      setActiveSubByServiceId((prev) => ({ ...prev, ...activeMap }));
    } catch {
      // вторичная перезагрузка — без отдельного toast
    }
  };

  const handleSubscribeServicePlan = async (serviceId: string) => {
    const planId = (selectedPlanIdByServiceId[serviceId] || purchasablePlans[0]?.id || "").trim();
    if (!planId) {
      toast.error("Нет доступных тарифов для подключения");
      return;
    }
    setSubscribeServiceLoadingId(serviceId);
    try {
      const created = await partnerSubscriptionsApi.subscribeServiceToPlan(serviceId, planId);
      if (created.plan?.id) {
        setSelectedPlanIdByServiceId((prev) => ({ ...prev, [serviceId]: created.plan.id }));
      }
      toast.success("Подписка оформлена");
      await reloadSubscriptionsHistoryAndActives();
    } catch (e) {
      toast.error("Не удалось оформить подписку", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSubscribeServiceLoadingId(null);
    }
  };

  const handleConfirmCancelSubscription = async () => {
    if (!cancelSubscriptionTarget) return;
    setCancelSubscriptionLoading(true);
    try {
      await partnerSubscriptionsApi.cancelSubscription(cancelSubscriptionTarget.id);
      toast.success("Подписка отменена");
      setCancelSubscriptionTarget(null);
      await reloadSubscriptionsHistoryAndActives();
    } catch (e) {
      toast.error("Не удалось отменить подписку", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setCancelSubscriptionLoading(false);
    }
  };

  const handlePaySubscription = async () => {
    if (!paySubscriptionTarget) return;
    setPaySubscriptionLoading(true);
    try {
      const res = await paymentsApi.processSubscriptionPayment({
        subscriptionId: paySubscriptionTarget.id,
        paymentMethod: payMethod,
      });
      toast.success(res.message?.trim() ? res.message : "Оплата обработана", {
        description: `${res.paymentStatus} · ${res.amount} ₸`,
      });
      const paidServiceId = paySubscriptionTarget.serviceId;
      const paidPlanId = paySubscriptionTarget.plan?.id;
      if (paidServiceId && paidPlanId) {
        setSelectedPlanIdByServiceId((prev) => ({ ...prev, [paidServiceId]: paidPlanId }));
      }
      setPaySubscriptionTarget(null);
      await reloadSubscriptionsHistoryAndActives();
    } catch (e) {
      toast.error("Ошибка оплаты", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setPaySubscriptionLoading(false);
    }
  };

  const openBookingDetails = async (bookingId: string) => {
    setBookingActionLoading(true);
    try {
      const detail = await partnerBookingsApi.getBookingById(bookingId);
      setSelectedBooking(detail);
      setRejectReason(detail.rejectionReason || "");
      setBookingDetailOpen(true);
    } catch (e) {
      toast.error("Не удалось загрузить детали", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBookingActionLoading(false);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    setBookingActionLoading(true);
    try {
      const updated = await partnerBookingsApi.confirmBooking(bookingId);
      setSelectedBooking(updated);
      setBookingsList((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toast.success("Бронирование подтверждено");
    } catch (e) {
      toast.error("Не удалось подтвердить", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBookingActionLoading(false);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    setBookingActionLoading(true);
    try {
      const updated = await partnerBookingsApi.rejectBooking(bookingId, {
        rejectionReason: rejectReason.trim() || undefined,
      });
      setSelectedBooking(updated);
      setBookingsList((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toast.success("Бронирование отклонено");
    } catch (e) {
      toast.error("Не удалось отклонить", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBookingActionLoading(false);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    setBookingActionLoading(true);
    try {
      await partnerBookingsApi.completeBooking(bookingId);
      const freshDetail = await partnerBookingsApi.getBookingById(bookingId);
      setSelectedBooking(freshDetail);
      await loadPartnerBookings();
      toast.success("Статус обновлён");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Не удалось завершить бронирование";
      if (message.includes("уже подтвердили завершение сделки")) {
        try {
          const freshDetail = await partnerBookingsApi.getBookingById(bookingId);
          setSelectedBooking(freshDetail);
          await loadPartnerBookings();
          toast.message("Завершение уже было подтверждено ранее");
        } catch {
          toast.message("Завершение уже было подтверждено ранее");
        }
      } else {
        toast.error("Не удалось завершить", {
          description: message,
        });
      }
    } finally {
      setBookingActionLoading(false);
    }
  };

  const openChatWithClient = async (booking: Booking) => {
    try {
      const chatIdFromUrl = getChatIdFromUrl(booking.chatUrl);
      if (chatIdFromUrl) {
        navigate(`/profile/chats?chatId=${encodeURIComponent(chatIdFromUrl)}`);
        return;
      }

      const chats = await chatsApi.getMyChats(true, { page: 0, size: 200 });
      const existing = (chats.content || []).find((chat) => chat.userId === booking.userId);
      if (existing) {
        navigate(`/profile/chats?chatId=${encodeURIComponent(existing.id)}`);
        return;
      }

      toast.message("Чат с клиентом пока не создан", {
        description: "Клиент сможет начать диалог из карточки услуги или заказа.",
      });
      navigate("/profile/chats");
    } catch (e) {
      toast.error("Не удалось открыть чат", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  // --- Calendar (availability management) ---
  const toYMD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const parseYMDToDate = (ymd: string): Date => new Date(`${ymd}T00:00:00`);

  const getCalendarRange = (): { from: string; to: string } => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 60);
    return { from: toYMD(start), to: toYMD(end) };
  };

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [calendarServiceId, setCalendarServiceId] = useState<string>("");
  const [availabilityItems, setAvailabilityItems] = useState<ServiceAvailabilityItem[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | undefined>(undefined);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [availabilityDraftStatus, setAvailabilityDraftStatus] = useState<AvailabilityStatus>("BLOCKED");
  const [availabilityDraftNote, setAvailabilityDraftNote] = useState<string>("");
  const [availabilityDraftExisting, setAvailabilityDraftExisting] = useState<ServiceAvailabilityItem | null>(null);

  const availabilityByDate = useMemo(() => {
    const map = new Map<string, ServiceAvailabilityItem>();
    for (const item of availabilityItems) {
      map.set(item.date, item);
    }
    return map;
  }, [availabilityItems]);

  const blockedDates = useMemo(() => {
    return availabilityItems
      .filter((i) => i.status === "BLOCKED")
      .map((i) => parseYMDToDate(i.date));
  }, [availabilityItems]);

  const availableDates = useMemo(() => {
    return availabilityItems
      .filter((i) => i.status === "AVAILABLE")
      .map((i) => parseYMDToDate(i.date));
  }, [availabilityItems]);

  useEffect(() => {
    if (!calendarServiceId && servicesList.length > 0) {
      setCalendarServiceId(servicesList[0].id);
    }
  }, [calendarServiceId, servicesList]);

  const loadAvailabilityForCalendar = async (serviceId: string) => {
    const { from, to } = getCalendarRange();
    setAvailabilityLoading(true);
    try {
      const items = await availabilityApi.getAvailability(serviceId, { from, to });
      setAvailabilityItems(items || []);
    } catch (e) {
      toast.error("Ошибка загрузки доступности", {
        description: e instanceof Error ? e.message : "Не удалось загрузить доступность",
      });
      setAvailabilityItems([]);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    if (!calendarServiceId) return;
    loadAvailabilityForCalendar(calendarServiceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarServiceId]);

  const openAvailabilityDialogForDate = (date: Date) => {
    const ymd = toYMD(date);
    const existing = availabilityByDate.get(ymd) ?? null;
    setCalendarSelectedDate(date);
    setAvailabilityDraftExisting(existing);
    setAvailabilityDraftStatus(existing?.status ?? "BLOCKED");
    setAvailabilityDraftNote(existing?.note ?? "");
    setAvailabilityDialogOpen(true);
  };

  const handleSaveAvailability = async () => {
    if (!calendarServiceId || !calendarSelectedDate) return;
    const ymd = toYMD(calendarSelectedDate);
    const note = availabilityDraftNote.trim();

    try {
      await availabilityApi.setAvailability(calendarServiceId, {
        dates: [ymd],
        status: availabilityDraftStatus,
        ...(note ? { note } : {}),
      });
      toast.success("Доступность сохранена");
      setAvailabilityDialogOpen(false);
      await loadAvailabilityForCalendar(calendarServiceId);
    } catch (e) {
      toast.error("Не удалось сохранить доступность", {
        description: e instanceof Error ? e.message : "Попробуйте позже",
      });
    }
  };

  const handleDeleteAvailability = async () => {
    if (!calendarServiceId || !calendarSelectedDate || !availabilityDraftExisting) return;
    const ymd = toYMD(calendarSelectedDate);

    try {
      await availabilityApi.deleteAvailability(calendarServiceId, ymd);
      toast.success("Настройка удалена");
      setAvailabilityDialogOpen(false);
      await loadAvailabilityForCalendar(calendarServiceId);
    } catch (e) {
      toast.error("Не удалось удалить настройку", {
        description: e instanceof Error ? e.message : "Попробуйте позже",
      });
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadThumbnailLoading(true);
    try {
      const res = await filesApi.upload(file);
      const urls = parseUploadResponse(res);
      const url = urls[0] ? appendImageExtensionIfMissing(urls[0], file.name) : "";
      if (url) {
        setServiceForm((f) => ({ ...f, thumbnail: url }));
        toast.success("Обложка загружена");
      } else {
        toast.error("Сервер не вернул URL изображения.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploadThumbnailLoading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    e.target.value = "";
    setUploadGalleryLoading(true);
    try {
      const newUrls = await filesApi.uploadMultiple(files);
      if (newUrls.length > 0) {
        const normalizedUrls = newUrls.map((url, index) =>
          appendImageExtensionIfMissing(url, files[index]?.name || "")
        );
        setServiceForm((f) => ({
          ...f,
          imageUrls: [...(f.imageUrls || []), ...normalizedUrls],
        }));
        toast.success(`Загружено изображений: ${normalizedUrls.length}`);
      } else {
        toast.error("Сервер не вернул URL изображений. Проверьте формат ответа API.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploadGalleryLoading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setServiceForm((f) => ({
      ...f,
      imageUrls: (f.imageUrls || []).filter((_, i) => i !== index),
    }));
  };

  const loadServices = async () => {
    setServicesLoading(true);
    try {
      const res = await servicesApi.getMyServices({ page: servicesPage, size: 10 });
      setServicesList(res.content || []);
      setServicesTotalPages(res.totalPages ?? 0);
      setServicesTotalElements(res.totalElements ?? 0);
    } catch (e) {
      toast.error("Ошибка загрузки услуг", {
        description: e instanceof Error ? e.message : "Не удалось загрузить список",
      });
      setServicesList([]);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [servicesPage]);

  const openCreateModal = async () => {
    setEditingService(null);
    setServiceForm(defaultServiceForm);
    setServiceModalOpen(true);
    setCategoriesLoading(true);
    try {
      const list = await servicesApi.getCategories();
      setCategories(list);
    } catch (e) {
      toast.error("Не удалось загрузить категории", {
        description: e instanceof Error ? e.message : undefined,
      });
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const openEditModal = (s: PartnerServiceItem) => {
    setEditingService(s);
    setServiceForm({
      categoryId: s.categoryId,
      name: s.name,
      shortDescription: s.shortDescription || "",
      fullDescription: s.fullDescription || "",
      priceFrom: s.priceFrom ?? 0,
      priceTo: s.priceTo ?? 0,
      priceType: s.priceType || "FIXED",
      city: s.city || "",
      address: s.address || "",
      thumbnail: s.thumbnail || "",
      imageUrls: s.images?.length ? s.images : [],
      isActive: true,
    });
    setServiceModalOpen(true);
  };

  const getCategorySlugByService = (service: PartnerServiceItem): string => {
    const fromCatalog = categories.find((cat) => cat.id === service.categoryId)?.slug;
    if (fromCatalog) return fromCatalog;
    const raw = (service.categoryName || "").toLowerCase();
    if (raw.includes("ресторан") || raw.includes("restaurant")) return "restaurants";
    if (raw.includes("транспорт") || raw.includes("transport")) return "transport";
    if (raw.includes("ведущ") || raw.includes("музык")) return "hosts-musicians";
    if (raw.includes("декор")) return "decorators";
    if (raw.includes("фото") || raw.includes("видео")) return "photo-video";
    if (raw.includes("кейтер")) return "catering";
    return raw.replace(/\s+/g, "-");
  };

  const loadVariantsForService = async (service: PartnerServiceItem) => {
    if (categories.length === 0) {
      try {
        const list = await servicesApi.getCategories();
        setCategories(list);
      } catch {
        // fallback на эвристику ниже
      }
    }
    const slug = getCategorySlugByService(service);
    if (!slug) {
      toast.error("Не удалось определить slug категории для схемы атрибутов");
      return;
    }
    setVariantsService(service);
    setVariantsModalOpen(true);
    setEditingVariant(null);
    setVariantForm(defaultVariantForm);
    setVariantsLoading(true);
    try {
      const [schema, variants] = await Promise.all([
        partnerVariantsApi.getAttributeSchema(slug),
        partnerVariantsApi.getServiceVariants(service.id),
      ]);
      setVariantSchema((schema || []).sort((a, b) => a.sortOrder - b.sortOrder));
      setVariantsList(variants || []);
    } catch (e) {
      toast.error("Не удалось загрузить варианты услуги", {
        description: e instanceof Error ? e.message : undefined,
      });
      setVariantSchema([]);
      setVariantsList([]);
    } finally {
      setVariantsLoading(false);
    }
  };

  const startCreateVariant = () => {
    setEditingVariant(null);
    setVariantForm(defaultVariantForm);
  };

  const startEditVariant = (variant: ServiceVariant) => {
    setEditingVariant(variant);
    setVariantForm({
      name: variant.name || "",
      description: variant.description || "",
      price: Number(variant.price) || 0,
      sortOrder: variant.sortOrder ?? 1,
      isActive: variant.isActive ?? true,
      imageUrls: Array.isArray(variant.imageUrls) ? variant.imageUrls : [],
      attributes: (variant.attributes as Record<string, unknown>) || {},
    });
  };

  const buildVariantPayload = (): CreatePartnerVariantRequest | null => {
    if (!variantForm.name.trim()) {
      toast.error("Укажите название варианта");
      return null;
    }
    const attributes: Record<string, unknown> = {};
    for (const attr of variantSchema) {
      if (attr.type === "INTEGER" && attr.matchStrategy === "RANGE_CONTAINS") {
        const minKey = attr.storageKeys?.min || "";
        const maxKey = attr.storageKeys?.max || "";
        const minValue = variantForm.attributes[minKey];
        const maxValue = variantForm.attributes[maxKey];
        if (attr.isRequired && (minValue === undefined || maxValue === undefined || minValue === "" || maxValue === "")) {
          toast.error(`Заполните обязательный атрибут: ${attr.labelRu}`);
          return null;
        }
        if (minValue !== undefined && minValue !== "") attributes[minKey] = Number(minValue);
        if (maxValue !== undefined && maxValue !== "") attributes[maxKey] = Number(maxValue);
        if (
          minValue !== undefined &&
          minValue !== "" &&
          maxValue !== undefined &&
          maxValue !== "" &&
          Number(minValue) > Number(maxValue)
        ) {
          toast.error(`Атрибут "${attr.labelRu}": минимум не может быть больше максимума`);
          return null;
        }
      } else {
        const valueKey = attr.storageKeys?.value || "";
        const rawValue = variantForm.attributes[valueKey];
        const isEmptyArray = Array.isArray(rawValue) && rawValue.length === 0;
        const isEmpty = rawValue === undefined || rawValue === null || rawValue === "" || isEmptyArray;
        if (attr.isRequired && isEmpty) {
          toast.error(`Заполните обязательный атрибут: ${attr.labelRu}`);
          return null;
        }
        if (isEmpty) continue;
        if (attr.type === "INTEGER") {
          const numeric = Number(rawValue);
          const min = Number(attr.validationRules?.min);
          const max = Number(attr.validationRules?.max);
          if (!Number.isNaN(min) && numeric < min) {
            toast.error(`Атрибут "${attr.labelRu}": значение меньше минимального (${min})`);
            return null;
          }
          if (!Number.isNaN(max) && numeric > max) {
            toast.error(`Атрибут "${attr.labelRu}": значение больше максимального (${max})`);
            return null;
          }
          attributes[valueKey] = Number(rawValue);
        } else {
          if (typeof rawValue === "string") {
            const maxLength = Number(attr.validationRules?.maxLength);
            if (!Number.isNaN(maxLength) && rawValue.length > maxLength) {
              toast.error(`Атрибут "${attr.labelRu}": превышена максимальная длина (${maxLength})`);
              return null;
            }
            const pattern = attr.validationRules?.pattern;
            if (pattern) {
              try {
                if (!new RegExp(pattern).test(rawValue)) {
                  toast.error(`Атрибут "${attr.labelRu}": значение не соответствует формату`);
                  return null;
                }
              } catch {
                // ignore invalid regex from backend
              }
            }
            const options = attr.validationRules?.options || [];
            if (Array.isArray(options) && options.length > 0 && !options.includes(rawValue)) {
              toast.error(`Атрибут "${attr.labelRu}": недопустимое значение`);
              return null;
            }
          }
          if (Array.isArray(rawValue)) {
            const options = attr.validationRules?.options || [];
            if (Array.isArray(options) && options.length > 0 && rawValue.some((val) => !options.includes(String(val)))) {
              toast.error(`Атрибут "${attr.labelRu}": выбран недопустимый вариант`);
              return null;
            }
          }
          attributes[valueKey] = rawValue;
        }
      }
    }
    return {
      name: variantForm.name.trim(),
      description: variantForm.description.trim() || undefined,
      price: Number(variantForm.price) || 0,
      sortOrder: Number(variantForm.sortOrder) || 1,
      isActive: variantForm.isActive,
      imageUrls: variantForm.imageUrls || [],
      attributes,
    };
  };

  const saveVariant = async () => {
    if (!variantsService) return;
    const payload = buildVariantPayload();
    if (!payload) return;
    setVariantSubmitLoading(true);
    try {
      if (editingVariant) {
        await partnerVariantsApi.updateVariant(variantsService.id, editingVariant.id, payload);
        toast.success("Вариант обновлён");
      } else {
        await partnerVariantsApi.createVariant(variantsService.id, payload);
        toast.success("Вариант создан");
      }
      await loadVariantsForService(variantsService);
      setEditingVariant(null);
      setVariantForm(defaultVariantForm);
    } catch (e) {
      toast.error("Не удалось сохранить вариант", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setVariantSubmitLoading(false);
    }
  };

  const deleteVariant = async () => {
    if (!variantsService || !variantDeleteTarget) return;
    setVariantDeleteLoading(true);
    try {
      await partnerVariantsApi.deleteVariant(variantsService.id, variantDeleteTarget.id);
      toast.success("Вариант удалён");
      setVariantDeleteTarget(null);
      await loadVariantsForService(variantsService);
      if (editingVariant?.id === variantDeleteTarget.id) {
        setEditingVariant(null);
        setVariantForm(defaultVariantForm);
      }
    } catch (e) {
      toast.error("Не удалось удалить вариант", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setVariantDeleteLoading(false);
    }
  };

  const handleSaveService = async () => {
    if (!serviceForm.name.trim()) {
      toast.error("Заполните название услуги");
      return;
    }
    if (!editingService && !serviceForm.categoryId?.trim()) {
      toast.error("Выберите категорию для новой услуги");
      return;
    }
    setServiceSubmitLoading(true);
    try {
      if (editingService) {
        await servicesApi.updateService(editingService.id, {
          name: serviceForm.name,
          shortDescription: serviceForm.shortDescription,
          fullDescription: serviceForm.fullDescription,
          priceFrom: Number(serviceForm.priceFrom) || 0,
          priceTo: Number(serviceForm.priceTo) || 0,
          priceType: serviceForm.priceType,
          city: serviceForm.city,
          address: serviceForm.address,
          thumbnail: serviceForm.thumbnail || undefined,
          // Always send array to avoid backend null images collection.
          imageUrls: serviceForm.imageUrls ?? [],
          isActive: serviceForm.isActive ?? true,
        });
        toast.success("Услуга обновлена", {
          description: "Изменения сохранены.",
        });
      } else {
        await servicesApi.createService({
          categoryId: (serviceForm.categoryId || "").trim(),
          name: serviceForm.name,
          shortDescription: serviceForm.shortDescription,
          fullDescription: serviceForm.fullDescription,
          priceFrom: Number(serviceForm.priceFrom) || 0,
          priceTo: Number(serviceForm.priceTo) || 0,
          priceType: serviceForm.priceType,
          city: serviceForm.city,
          address: serviceForm.address,
          thumbnail: serviceForm.thumbnail || undefined,
          // Always send array to avoid backend null images collection.
          imageUrls: serviceForm.imageUrls ?? [],
        });
        toast.success("Услуга создана и отправлена на модерацию", {
          description: "После одобрения администратором она появится в каталоге. Мы уведомим вас.",
        });
      }
      setServiceModalOpen(false);
      loadServices();
    } catch (e) {
      toast.error(editingService ? "Ошибка обновления услуги" : "Ошибка создания услуги", {
        description: e instanceof Error ? e.message : "Попробуйте позже",
      });
    } finally {
      setServiceSubmitLoading(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deleteServiceId) return;
    setDeleteLoading(true);
    try {
      await servicesApi.deleteService(deleteServiceId);
      toast.success("Услуга удалена");
      setDeleteServiceId(null);
      loadServices();
    } catch (e) {
      toast.error("Ошибка удаления услуги", {
        description: e instanceof Error ? e.message : "Попробуйте позже",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const statsData = [
    { month: 'Июн', bookings: 12, revenue: 450 },
    { month: 'Июл', bookings: 18, revenue: 680 },
    { month: 'Авг', bookings: 24, revenue: 920 },
    { month: 'Сен', bookings: 21, revenue: 780 },
    { month: 'Окт', bookings: 28, revenue: 1050 },
    { month: 'Ноя', bookings: 15, revenue: 580 },
  ];

  const getStatusColor = (status: string) => {
    switch ((status || "").toUpperCase()) {
      case "PENDING_CONFIRMATION":
        return "bg-blue-100 text-blue-700";
      case "CONFIRMED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "COMPLETED":
        return "bg-purple-100 text-purple-700";
      case "CANCELLED":
        return "bg-gray-100 text-gray-700";
      case "EXPIRED":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const bookingStatusLabel = (status: string) => {
    switch ((status || "").toUpperCase()) {
      case "PENDING_CONFIRMATION":
        return "Ожидает подтверждения";
      case "CONFIRMED":
        return "Подтверждено";
      case "REJECTED":
        return "Отклонено";
      case "COMPLETED":
        return "Завершено";
      case "CANCELLED":
        return "Отменено";
      case "EXPIRED":
        return "Истекло";
      default:
        return status || "—";
    }
  };

  const getBookingDisplayStatus = (booking: Booking) => {
    const status = String(booking.status || "").toUpperCase();
    if (status === "CONFIRMED" && booking.partnerConfirmed && !booking.clientConfirmed) {
      return {
        label: "Ожидает подтверждения клиента",
        color: "bg-sky-100 text-sky-700",
      };
    }
    return {
      label: bookingStatusLabel(status),
      color: getStatusColor(status),
    };
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#222222] mb-2">Кабинет партнёра</h1>
            <p className="text-gray-600">Управляйте вашими услугами и заказами</p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate('home')}
            className="rounded-full"
          >
            На главную
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-600">Доход (месяц)</CardTitle>
              <TrendingUp className="w-5 h-5 text-[#00AFAE]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#222222] mb-1">1 050 000 ₸</div>
              <p className="text-green-600">+23% к прошлому месяцу</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-600">Бронирований</CardTitle>
              <CalendarIcon className="w-5 h-5 text-[#FFD700]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#222222] mb-1">28</div>
              <p className="text-green-600">+15% к прошлому месяцу</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-600">Средний рейтинг</CardTitle>
              <Star className="w-5 h-5 text-[#FFD700]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#222222] mb-1">4.8</div>
              <p className="text-gray-600">Из 127 отзывов</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-600">Просмотры</CardTitle>
              <Eye className="w-5 h-5 text-[#00AFAE]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#222222] mb-1">2 110</div>
              <p className="text-green-600">+8% к прошлому месяцу</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#222222]">Доход</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#00AFAE" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#222222]">Бронирования</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#FFD700" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as "services" | "bookings" | "calendar" | "subscriptions" | "reviews" | "stories")
          }
          className="space-y-6"
        >
          <TabsList className="bg-white p-1 rounded-xl flex flex-wrap gap-1">
            <TabsTrigger value="services" className="rounded-lg">Мои услуги</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-lg">Бронирования</TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-lg">Календарь</TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-lg">Подписки</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg">Отзывы</TabsTrigger>
            <TabsTrigger value="stories" className="rounded-lg">Сторис</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#222222]">Мои услуги</CardTitle>
                <Button
                  className="bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white rounded-full"
                  onClick={openCreateModal}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить услугу
                </Button>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="py-12 text-center text-gray-500">Загрузка...</div>
                ) : servicesList.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    У вас пока нет услуг. Нажмите «Добавить услугу», чтобы создать первую.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {servicesList.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <ImageWithFallback
                            src={getImageUrl(service.thumbnail) || ""}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-[#222222] font-medium truncate">{service.name}</h3>
                            {service.categoryName && (
                              <Badge variant="secondary" className="flex-shrink-0">{service.categoryName}</Badge>
                            )}
                          </div>
                          {service.shortDescription && (
                            <p className="text-gray-600 text-sm line-clamp-2 mb-2">{service.shortDescription}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-gray-600 text-sm">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {service.viewsCount ?? 0} просмотров
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                              {(service.rating ?? 0).toFixed(1)}
                            </span>
                            {(service.priceFrom != null || service.priceTo != null) && (
                              <span>
                                {service.priceFrom != null && service.priceTo != null
                                  ? `${service.priceFrom} – ${service.priceTo} ₸`
                                  : service.priceFrom != null
                                    ? `от ${service.priceFrom} ₸`
                                    : `до ${service.priceTo} ₸`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button variant="outline" size="sm" className="rounded-full" onClick={() => void loadVariantsForService(service)}>
                            Варианты
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-full" onClick={() => openEditModal(service)}>
                            <Pencil className="w-4 h-4 mr-1" />
                            Редактировать
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setDeleteServiceId(service.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {servicesTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-600">Всего: {servicesTotalElements}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={servicesPage === 0}
                        onClick={() => setServicesPage((p) => Math.max(0, p - 1))}
                      >
                        Назад
                      </Button>
                      <span className="flex items-center px-2 text-sm">
                        {servicesPage + 1} / {servicesTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={servicesPage >= servicesTotalPages - 1}
                        onClick={() => setServicesPage((p) => p + 1)}
                      >
                        Вперёд
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create/Edit Service Modal */}
            <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingService ? "Редактировать услугу" : "Добавить услугу"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  {!editingService && (
                    <div className="space-y-2">
                      <Label>Категория *</Label>
                      {categoriesLoading ? (
                        <p className="text-sm text-gray-500">Загрузка категорий...</p>
                      ) : (
                        <Select
                          value={serviceForm.categoryId || undefined}
                          onValueChange={(v) => setServiceForm((f) => ({ ...f, categoryId: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.nameRu || cat.nameKz || cat.slug || cat.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Название *</Label>
                    <Input
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Название услуги"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Краткое описание</Label>
                    <Input
                      value={serviceForm.shortDescription}
                      onChange={(e) => setServiceForm((f) => ({ ...f, shortDescription: e.target.value }))}
                      placeholder="Краткое описание"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Полное описание</Label>
                    <Textarea
                      value={serviceForm.fullDescription}
                      onChange={(e) => setServiceForm((f) => ({ ...f, fullDescription: e.target.value }))}
                      placeholder="Подробное описание"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Цена от (₸)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={serviceForm.priceFrom || ""}
                        onChange={(e) => setServiceForm((f) => ({ ...f, priceFrom: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Цена до (₸)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={serviceForm.priceTo || ""}
                        onChange={(e) => setServiceForm((f) => ({ ...f, priceTo: Number(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Тип цены</Label>
                    <Select
                      value={serviceForm.priceType || "FIXED"}
                      onValueChange={(v) => setServiceForm((f) => ({ ...f, priceType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип цены" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICE_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Город</Label>
                    <Select
                      value={serviceForm.city || ""}
                      onValueChange={(v) => setServiceForm((f) => ({ ...f, city: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите город" />
                      </SelectTrigger>
                      <SelectContent>
                        {KZ_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Адрес</Label>
                    <Input
                      value={serviceForm.address}
                      onChange={(e) => setServiceForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="Адрес"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Обложка услуги</Label>
                    <div className="flex gap-2 flex-wrap items-center">
                      <Input
                        value={serviceForm.thumbnail || ""}
                        onChange={(e) => setServiceForm((f) => ({ ...f, thumbnail: e.target.value }))}
                        placeholder="URL или загрузите файл (JPG, PNG, WEBP, GIF до 5 МБ)"
                        className="flex-1 min-w-[200px]"
                      />
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleThumbnailUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadThumbnailLoading}
                        onClick={() => thumbnailInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        {uploadThumbnailLoading ? "Загрузка..." : "Загрузить"}
                      </Button>
                    </div>
                    {serviceForm.thumbnail && (
                      <ThumbnailImagePreview url={serviceForm.thumbnail} />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Галерея (доп. изображения)</Label>
                    <div className="flex gap-2 flex-wrap items-center">
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="hidden"
                        onChange={handleGalleryUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadGalleryLoading}
                        onClick={() => galleryInputRef.current?.click()}
                      >
                        <ImagePlus className="w-4 h-4 mr-1" />
                        {uploadGalleryLoading ? "Загрузка..." : "Загрузить несколько"}
                      </Button>
                      <span className="text-sm text-gray-500">JPG, PNG, WEBP, GIF до 5 МБ</span>
                    </div>
                    {(serviceForm.imageUrls?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {serviceForm.imageUrls!.map((url, i) => (
                          <GalleryImagePreview
                            key={`${url}-${i}`}
                            url={url}
                            onRemove={() => removeGalleryImage(i)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setServiceModalOpen(false)}>
                    Отмена
                  </Button>
                  <Button
                    className="bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white"
                    onClick={handleSaveService}
                    disabled={serviceSubmitLoading}
                  >
                    {serviceSubmitLoading ? "Сохранение..." : editingService ? "Сохранить" : "Создать"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={variantsModalOpen} onOpenChange={setVariantsModalOpen}>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Варианты услуги{variantsService ? `: ${variantsService.name}` : ""}
                  </DialogTitle>
                </DialogHeader>
                {variantsLoading ? (
                  <div className="py-10 text-center text-gray-500">Загрузка вариантов...</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[#222222]">Существующие варианты</h4>
                        <Button type="button" variant="outline" size="sm" onClick={startCreateVariant}>
                          <Plus className="w-4 h-4 mr-1" />
                          Новый
                        </Button>
                      </div>
                      {variantsList.length === 0 ? (
                        <div className="text-sm text-gray-500">Пока нет вариантов услуги.</div>
                      ) : (
                        <div className="space-y-2">
                          {variantsList.map((variant) => (
                            <div
                              key={variant.id}
                              className="border border-gray-200 rounded-xl p-3 flex items-start justify-between gap-3"
                            >
                              <div>
                                <p className="text-[#222222] font-medium">{variant.name}</p>
                                <p className="text-sm text-gray-600">
                                  {(variant.price || 0).toLocaleString("ru-KZ")} ₸
                                  {variant.isActive === false ? " · неактивен" : ""}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button type="button" variant="outline" size="sm" onClick={() => startEditVariant(variant)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => setVariantDeleteTarget(variant)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[#222222]">
                        {editingVariant ? "Редактирование варианта" : "Создание варианта"}
                      </h4>
                      <div className="space-y-2">
                        <Label>Название *</Label>
                        <Input
                          value={variantForm.name}
                          onChange={(e) => setVariantForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Описание</Label>
                        <Textarea
                          rows={2}
                          value={variantForm.description}
                          onChange={(e) => setVariantForm((prev) => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Цена *</Label>
                          <Input
                            type="number"
                            min={0}
                            value={variantForm.price}
                            onChange={(e) =>
                              setVariantForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Порядок</Label>
                          <Input
                            type="number"
                            min={1}
                            value={variantForm.sortOrder}
                            onChange={(e) =>
                              setVariantForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 1 }))
                            }
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={variantForm.isActive}
                          onChange={(e) => setVariantForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                        />
                        Вариант активен
                      </label>

                      <div className="space-y-3 pt-2 border-t">
                        <p className="text-sm text-gray-700">Атрибуты категории</p>
                        {variantSchema.length === 0 ? (
                          <p className="text-sm text-gray-500">Схема атрибутов для категории не найдена.</p>
                        ) : (
                          variantSchema.map((attr) => {
                            if (attr.type === "INTEGER" && attr.matchStrategy === "RANGE_CONTAINS") {
                              const minKey = attr.storageKeys?.min || "";
                              const maxKey = attr.storageKeys?.max || "";
                              return (
                                <div key={attr.attributeId} className="space-y-2">
                                  <Label>{attr.labelRu}{attr.isRequired ? " *" : ""}</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      type="number"
                                      placeholder={`От${attr.unit ? ` (${attr.unit})` : ""}`}
                                      value={String(variantForm.attributes[minKey] ?? "")}
                                      onChange={(e) =>
                                        setVariantForm((prev) => ({
                                          ...prev,
                                          attributes: { ...prev.attributes, [minKey]: e.target.value === "" ? undefined : Number(e.target.value) },
                                        }))
                                      }
                                    />
                                    <Input
                                      type="number"
                                      placeholder={`До${attr.unit ? ` (${attr.unit})` : ""}`}
                                      value={String(variantForm.attributes[maxKey] ?? "")}
                                      onChange={(e) =>
                                        setVariantForm((prev) => ({
                                          ...prev,
                                          attributes: { ...prev.attributes, [maxKey]: e.target.value === "" ? undefined : Number(e.target.value) },
                                        }))
                                      }
                                    />
                                  </div>
                                </div>
                              );
                            }

                            const valueKey = attr.storageKeys?.value || "";
                            const options = attr.validationRules?.options || [];
                            const value = variantForm.attributes[valueKey];
                            return (
                              <div key={attr.attributeId} className="space-y-2">
                                <Label>{attr.labelRu}{attr.isRequired ? " *" : ""}</Label>
                                {attr.type === "BOOLEAN" ? (
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(value)}
                                      onChange={(e) =>
                                        setVariantForm((prev) => ({
                                          ...prev,
                                          attributes: { ...prev.attributes, [valueKey]: e.target.checked },
                                        }))
                                      }
                                    />
                                    Да/Нет
                                  </label>
                                ) : attr.type === "STRING_ARRAY" && options.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {options.map((opt) => {
                                      const selected = Array.isArray(value) && value.includes(opt);
                                      return (
                                        <label key={opt} className="text-xs border rounded px-2 py-1 flex items-center gap-1">
                                          <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={(e) =>
                                              setVariantForm((prev) => {
                                                const current = Array.isArray(prev.attributes[valueKey]) ? [...(prev.attributes[valueKey] as string[])] : [];
                                                const next = e.target.checked
                                                  ? Array.from(new Set([...current, opt]))
                                                  : current.filter((v) => v !== opt);
                                                return { ...prev, attributes: { ...prev.attributes, [valueKey]: next } };
                                              })
                                            }
                                          />
                                          {opt}
                                        </label>
                                      );
                                    })}
                                  </div>
                                ) : options.length > 0 ? (
                                  <Select
                                    value={typeof value === "string" ? value : ""}
                                    onValueChange={(next) =>
                                      setVariantForm((prev) => ({
                                        ...prev,
                                        attributes: { ...prev.attributes, [valueKey]: next },
                                      }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Выберите значение" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {options.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                          {opt}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    type={attr.type === "INTEGER" ? "number" : "text"}
                                    value={String(value ?? "")}
                                    onChange={(e) =>
                                      setVariantForm((prev) => ({
                                        ...prev,
                                        attributes: {
                                          ...prev.attributes,
                                          [valueKey]: attr.type === "INTEGER"
                                            ? (e.target.value === "" ? undefined : Number(e.target.value))
                                            : e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={startCreateVariant}>
                          Очистить
                        </Button>
                        <Button
                          type="button"
                          className="bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white"
                          onClick={() => void saveVariant()}
                          disabled={variantSubmitLoading}
                        >
                          {variantSubmitLoading ? "Сохранение..." : editingVariant ? "Сохранить" : "Создать"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteServiceId} onOpenChange={(open) => !open && setDeleteServiceId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить услугу?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Услуга будет удалена.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteService();
                    }}
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteLoading ? "Удаление..." : "Удалить"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!variantDeleteTarget} onOpenChange={(open) => !open && setVariantDeleteTarget(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить вариант?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вариант будет удалён. Если есть активные брони, бэкенд вернет ошибку и удаление не выполнится.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      void deleteVariant();
                    }}
                    disabled={variantDeleteLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {variantDeleteLoading ? "Удаление..." : "Удалить"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="text-[#222222]">Входящие бронирования</CardTitle>
                  <div className="w-full md:w-[280px]">
                    <Select
                      value={bookingStatusFilter}
                      onValueChange={(v) => setBookingStatusFilter(v as "ALL" | BookingStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Фильтр по статусу" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Все статусы</SelectItem>
                        <SelectItem value="PENDING_CONFIRMATION">Ожидает подтверждения</SelectItem>
                        <SelectItem value="CONFIRMED">Подтверждено</SelectItem>
                        <SelectItem value="REJECTED">Отклонено</SelectItem>
                        <SelectItem value="COMPLETED">Завершено</SelectItem>
                        <SelectItem value="CANCELLED">Отменено</SelectItem>
                        <SelectItem value="EXPIRED">Истекло</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="py-10 text-center text-gray-500">Загрузка бронирований...</div>
                ) : bookingsList.length === 0 ? (
                  <div className="py-10 text-center text-gray-500">Пока нет входящих бронирований.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Услуга</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Гостей</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookingsList.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="text-[#00AFAE]">{booking.id.slice(0, 8)}...</TableCell>
                          <TableCell>{booking.userFullName || "—"}</TableCell>
                          <TableCell>{booking.serviceName || "—"}</TableCell>
                          <TableCell>{booking.eventDate}{booking.eventTime ? ` ${booking.eventTime}` : ""}</TableCell>
                          <TableCell>{booking.guestsCount ?? "—"}</TableCell>
                          <TableCell className="text-[#00AFAE]">
                            {booking.totalPrice != null ? `${booking.totalPrice} ₸` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge className={getBookingDisplayStatus(booking).color}>
                              {getBookingDisplayStatus(booking).label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => openBookingDetails(booking.id)}
                              disabled={bookingActionLoading}
                            >
                              Детали
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Dialog open={bookingDetailOpen} onOpenChange={setBookingDetailOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Детали бронирования</DialogTitle>
                  <DialogDescription>ID: {selectedBooking?.id || "—"}</DialogDescription>
                </DialogHeader>

                {selectedBooking ? (
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-500">Клиент:</span> {selectedBooking.userFullName || "—"}</div>
                      <div><span className="text-gray-500">Телефон:</span> {selectedBooking.userPhone || "—"}</div>
                      <div><span className="text-gray-500">Услуга:</span> {selectedBooking.serviceName || "—"}</div>
                      <div><span className="text-gray-500">Категория:</span> {selectedBooking.serviceCategory || "—"}</div>
                      <div><span className="text-gray-500">Дата:</span> {selectedBooking.eventDate}</div>
                      <div><span className="text-gray-500">Время:</span> {selectedBooking.eventTime || "—"}</div>
                      <div><span className="text-gray-500">Гостей:</span> {selectedBooking.guestsCount ?? "—"}</div>
                      <div><span className="text-gray-500">Сумма:</span> {selectedBooking.totalPrice != null ? `${selectedBooking.totalPrice} ₸` : "—"}</div>
                      <div className="md:col-span-2">
                        <span className="text-gray-500">Статус:</span>{" "}
                        <Badge className={getBookingDisplayStatus(selectedBooking).color}>
                          {getBookingDisplayStatus(selectedBooking).label}
                        </Badge>
                      </div>
                      {selectedBooking.notes && (
                        <div className="md:col-span-2"><span className="text-gray-500">Комментарий клиента:</span> {selectedBooking.notes}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Причина отклонения (опционально)</Label>
                      <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Укажите причину, если отклоняете бронирование"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-500">Нет данных.</div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setBookingDetailOpen(false)}>
                    Закрыть
                  </Button>
                  {selectedBooking && (
                    <>
                      <Button
                        variant="outline"
                        className="border-[#00AFAE] text-[#00AFAE] hover:bg-[#00AFAE]/10"
                        onClick={() => openChatWithClient(selectedBooking)}
                        disabled={bookingActionLoading}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Чат с клиентом
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleRejectBooking(selectedBooking.id)}
                        disabled={bookingActionLoading || String(selectedBooking.status).toUpperCase() !== "PENDING_CONFIRMATION"}
                      >
                        Отклонить
                      </Button>
                      <Button
                        className="bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white"
                        onClick={() => handleConfirmBooking(selectedBooking.id)}
                        disabled={bookingActionLoading || String(selectedBooking.status).toUpperCase() !== "PENDING_CONFIRMATION"}
                      >
                        Подтвердить
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleCompleteBooking(selectedBooking.id)}
                        disabled={
                          bookingActionLoading ||
                          String(selectedBooking.status).toUpperCase() !== "CONFIRMED" ||
                          Boolean(selectedBooking.partnerConfirmed)
                        }
                      >
                        Завершить
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#222222]">Календарь занятости</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 md:items-end">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#222222]">Услуга</Label>
                    <Select
                      value={calendarServiceId || undefined}
                      onValueChange={(v) => {
                        setCalendarServiceId(v);
                        setCalendarSelectedDate(undefined);
                        setAvailabilityItems([]);
                      }}
                      disabled={servicesLoading || servicesList.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            servicesList.length === 0 ? "У вас пока нет услуг" : "Выберите услугу"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {servicesList.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-sm text-gray-500">
                    Нажмите на дату в календаре, чтобы поставить статус доступности.
                  </div>
                </div>

                {availabilityLoading ? (
                  <div className="text-center py-10 text-gray-500">Загрузка доступности...</div>
                ) : servicesList.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Создайте услугу в кабинете, чтобы управлять календарём.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[auto,minmax(0,280px)] lg:justify-start items-start">
                    <div className="w-fit max-w-full bg-white border border-gray-100 rounded-xl p-3 sm:p-4">
                      <CalendarUI
                        className="w-fit"
                        mode="single"
                        selected={calendarSelectedDate ?? undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          // Safety: onSelect sometimes triggers even when date is disabled.
                          if (date < startOfToday) return;
                          openAvailabilityDialogForDate(date);
                        }}
                        disabled={(date) => date < startOfToday}
                        modifiers={{
                          blocked: blockedDates,
                          available: availableDates,
                        }}
                        modifiersClassNames={{
                          blocked:
                            "bg-red-100 text-red-700 hover:bg-red-100 aria-selected:bg-red-100 aria-selected:text-red-700",
                          available:
                            "bg-green-100 text-green-700 hover:bg-green-100 aria-selected:bg-green-100 aria-selected:text-green-700",
                        }}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300" />
                        Доступно
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-300" />
                        Недоступно
                      </div>
                      <div className="text-xs text-gray-500">Даты без настройки не подсвечиваются.</div>

                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl w-full"
                          onClick={() => loadAvailabilityForCalendar(calendarServiceId)}
                          disabled={!calendarServiceId || availabilityLoading}
                        >
                          Обновить
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={availabilityDialogOpen} onOpenChange={setAvailabilityDialogOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Настройка доступности</DialogTitle>
                  <DialogDescription>
                    {calendarSelectedDate ? toYMD(calendarSelectedDate) : ""}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="space-y-2">
                    <Label>Статус</Label>
                    <Select
                      value={availabilityDraftStatus}
                      onValueChange={(v) => setAvailabilityDraftStatus(v as AvailabilityStatus)}
                    >
                      <SelectTrigger className="rounded-xl bg-white border-gray-200 h-10">
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Доступна</SelectItem>
                        <SelectItem value="BLOCKED">Недоступна</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Заметка (опционально)</Label>
                    <Textarea
                      value={availabilityDraftNote}
                      onChange={(e) => setAvailabilityDraftNote(e.target.value)}
                      placeholder="Например: ремонт / бронь / персональная настройка"
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAvailabilityDialogOpen(false)}>
                    Отмена
                  </Button>

                  {availabilityDraftExisting && (
                    <Button variant="destructive" onClick={handleDeleteAvailability}>
                      Сбросить
                    </Button>
                  )}

                  <Button
                    className="bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white"
                    onClick={handleSaveAvailability}
                    disabled={!calendarSelectedDate}
                  >
                    Сохранить
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#222222] flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#00AFAE]" />
                    Подписки по услугам
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {purchasablePlans.length === 0 && !subscriptionsPanelLoading && (
                    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      Список тарифов пуст или недоступен. Проверьте endpoint{" "}
                      <code className="text-xs">GET /api/v1/subscription-plans</code>.
                    </p>
                  )}
                  {subscriptionsPanelLoading ? (
                    <div className="py-12 text-center text-gray-500">Загрузка...</div>
                  ) : servicesList.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">
                      Нет услуг — сначала добавьте услугу во вкладке «Мои услуги».
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Услуга</TableHead>
                          <TableHead>Текущая подписка</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {servicesList.map((service) => {
                          const active = activeSubByServiceId[service.id];
                          const awaiting = active ? isSubscriptionAwaitingPayment(active.status) : false;
                          const activePaid = Boolean(active && !awaiting);
                          const planSelectValue = (() => {
                            if (activePaid && active?.plan?.id) {
                              const inCatalog = purchasablePlans.some((p) => p.id === active.plan.id);
                              if (inCatalog) return active.plan.id;
                            }
                            return (
                              selectedPlanIdByServiceId[service.id] || purchasablePlans[0]?.id || ""
                            );
                          })();
                          return (
                            <TableRow key={service.id}>
                              <TableCell className="font-medium text-[#222222]">{service.name}</TableCell>
                              <TableCell>
                                {!active ? (
                                  <span className="text-gray-500 text-sm">Нет активной подписки</span>
                                ) : (
                                  <div className="text-sm space-y-1">
                                    <div>
                                      <span className="text-gray-500">Тариф:</span>{" "}
                                      <span className="font-medium text-[#222222]">
                                        {active.plan?.name ?? "—"}
                                        {active.plan && !active.plan.isFree && active.plan.price != null
                                          ? ` · ${active.plan.price} \u20B8`
                                          : active.plan?.isFree
                                            ? " · бесплатно"
                                            : ""}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Статус:</span>{" "}
                                      <Badge variant="secondary">{active.status}</Badge>
                                    </div>
                                    <div className="text-gray-600">
                                      Начало: {formatSubscriptionDate(active.startsAt)}
                                    </div>
                                    <div className="text-gray-600">
                                      Окончание: {formatSubscriptionDate(active.expiresAt)}
                                    </div>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col items-end gap-2">
                                  {awaiting && active && (
                                    <div className="flex flex-wrap gap-2 justify-end">
                                      <Button
                                        size="sm"
                                        className="rounded-full bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white"
                                        onClick={() => {
                                          setPayMethod("KASPI");
                                          setPaySubscriptionTarget(active);
                                        }}
                                      >
                                        Оплатить
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-full text-red-600 border-red-200"
                                        onClick={() => setCancelSubscriptionTarget(active)}
                                      >
                                        Отменить
                                      </Button>
                                    </div>
                                  )}
                                  {(!active || (active && !awaiting)) && purchasablePlans.length > 0 && (
                                    <div className="flex flex-wrap gap-2 justify-end items-center">
                                      <Select
                                        value={planSelectValue ? planSelectValue : undefined}
                                        onValueChange={(v) =>
                                          setSelectedPlanIdByServiceId((prev) => ({ ...prev, [service.id]: v }))
                                        }
                                      >
                                        <SelectTrigger className="w-[200px] rounded-lg">
                                          <SelectValue placeholder="Тариф" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {purchasablePlans.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                              {p.name}
                                              {!p.isFree && p.price != null ? ` · ${p.price} ₸` : p.isFree ? " · бесплатно" : ""}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-full"
                                        disabled={
                                          subscribeServiceLoadingId === service.id ||
                                          Boolean(active && !awaiting)
                                        }
                                        onClick={() => handleSubscribeServicePlan(service.id)}
                                      >
                                        {subscribeServiceLoadingId === service.id ? "…" : "Подключить"}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                  {servicesTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t text-sm text-gray-600">
                      <span>Услуги: {servicesTotalElements}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={servicesPage === 0}
                          onClick={() => setServicesPage((p) => Math.max(0, p - 1))}
                        >
                          Назад
                        </Button>
                        <span className="flex items-center px-2">
                          {servicesPage + 1} / {servicesTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={servicesPage >= servicesTotalPages - 1}
                          onClick={() => setServicesPage((p) => p + 1)}
                        >
                          Вперёд
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#222222]">История подписок</CardTitle>
                </CardHeader>
                <CardContent>
                  {subscriptionsHistory == null && subscriptionsPanelLoading ? (
                    <div className="py-8 text-center text-gray-500">Загрузка...</div>
                  ) : subscriptionsHistory == null ? (
                    <div className="py-8 text-center text-gray-500">Не удалось загрузить историю.</div>
                  ) : subscriptionsHistory.content.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">История пуста.</div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Создана</TableHead>
                            <TableHead>Услуга</TableHead>
                            <TableHead>Тариф</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Сумма</TableHead>
                            <TableHead>Окончание</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscriptionsHistory.content.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell className="text-sm">{formatSubscriptionDate(row.createdAt)}</TableCell>
                              <TableCell>{row.serviceName || "—"}</TableCell>
                              <TableCell>{row.plan?.name ?? "—"}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{row.status}</Badge>
                              </TableCell>
                              <TableCell>{row.paidAmount != null ? `${row.paidAmount} ₸` : "—"}</TableCell>
                              <TableCell className="text-sm">{formatSubscriptionDate(row.expiresAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {(subscriptionsHistory.totalPages ?? 0) > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <span className="text-sm text-gray-600">
                            Всего: {subscriptionsHistory.totalElements ?? 0}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={subscriptionsHistoryPage === 0}
                              onClick={() => setSubscriptionsHistoryPage((p) => Math.max(0, p - 1))}
                            >
                              Назад
                            </Button>
                            <span className="flex items-center px-2 text-sm">
                              {subscriptionsHistoryPage + 1} / {subscriptionsHistory.totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={subscriptionsHistoryPage >= (subscriptionsHistory.totalPages ?? 1) - 1}
                              onClick={() => setSubscriptionsHistoryPage((p) => p + 1)}
                            >
                              Вперёд
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <AlertDialog
              open={Boolean(cancelSubscriptionTarget)}
              onOpenChange={(open) => {
                if (!open) setCancelSubscriptionTarget(null);
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Отменить подписку?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Подписка в ожидании оплаты будет отменена. Это действие нельзя отменить из интерфейса.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={cancelSubscriptionLoading}>Нет</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-600/90"
                    disabled={cancelSubscriptionLoading}
                    onClick={(e) => {
                      e.preventDefault();
                      void handleConfirmCancelSubscription();
                    }}
                  >
                    {cancelSubscriptionLoading ? "…" : "Да, отменить"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Dialog
              open={Boolean(paySubscriptionTarget)}
              onOpenChange={(open) => {
                if (!open) setPaySubscriptionTarget(null);
              }}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Оплата подписки</DialogTitle>
                  <DialogDescription>
                    {paySubscriptionTarget?.serviceName} — {paySubscriptionTarget?.plan?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-2">
                    <Label>Способ оплаты</Label>
                    <Select
                      value={payMethod}
                      onValueChange={(v) => setPayMethod(v as SubscriptionPaymentMethod)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KASPI">Kaspi</SelectItem>
                        <SelectItem value="BANK_CARD">Банковская карта</SelectItem>
                        <SelectItem value="GOOGLE_PAY">Google Pay</SelectItem>
                        <SelectItem value="APPLE_PAY">Apple Pay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPaySubscriptionTarget(null)}>
                    Закрыть
                  </Button>
                  <Button
                    className="bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white"
                    disabled={paySubscriptionLoading}
                    onClick={() => void handlePaySubscription()}
                  >
                    {paySubscriptionLoading ? "Обработка…" : "Оплатить"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card className="border-0 shadow-sm">
              <CardHeader className="space-y-4">
                <CardTitle className="text-[#222222]">Отзывы по моим услугам</CardTitle>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),220px]">
                  <div className="space-y-2">
                    <span className="text-sm text-gray-500">Услуга</span>
                    <Select
                      value={partnerReviewsServiceId || undefined}
                      onValueChange={(v) => setPartnerReviewsServiceId(v)}
                      disabled={servicesLoading || servicesList.length === 0}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue
                          placeholder={
                            servicesList.length === 0 ? "У вас пока нет услуг" : "Выберите услугу"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {servicesList.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-gray-500 whitespace-nowrap">Сортировка</span>
                    <Select
                      value={partnerReviewsSort}
                      onValueChange={(v) => setPartnerReviewsSort(v as ReviewsSort)}
                      disabled={!partnerReviewsServiceId}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">Сначала новые</SelectItem>
                        <SelectItem value="BEST">С высокой оценкой</SelectItem>
                        <SelectItem value="WORST">С низкой оценкой</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {partnerReviewsSummary && partnerReviewsServiceId && (
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="px-3 py-2 bg-[#F9F9F9] border border-gray-200 rounded-lg">
                      Средний рейтинг:{" "}
                      <span className="font-semibold text-[#222222]">
                        {Number(partnerReviewsSummary.averageRating || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="px-3 py-2 bg-[#F9F9F9] border border-gray-200 rounded-lg">
                      Всего отзывов:{" "}
                      <span className="font-semibold text-[#222222]">
                        {partnerReviewsSummary.totalReviews ?? 0}
                      </span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!partnerReviewsServiceId ? (
                  <p className="text-gray-600 text-sm">
                    Выберите услугу, чтобы посмотреть отзывы клиентов.
                  </p>
                ) : partnerReviewsLoading ? (
                  <div className="flex justify-center py-16 text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin text-[#00AFAE]" />
                  </div>
                ) : partnerReviews.length === 0 ? (
                  <p className="text-gray-600 text-sm">
                    Пока нет отзывов по вашим услугам. После завершённых бронирований клиенты смогут оставить
                    оценку.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {partnerReviews.map((review) => (
                      <div key={review.id} className="p-4 border border-gray-200 rounded-xl">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <h4 className="text-[#222222] mb-1 truncate">
                              {review.userFullName?.trim() || "Клиент"}
                            </h4>
                            <p className="text-gray-500 text-sm truncate">{review.serviceName}</p>
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.round(Number(review.rating) || 0)
                                    ? "fill-[#FFD700] text-[#FFD700]"
                                    : "text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-2 whitespace-pre-wrap">
                          {review.comment?.trim() || "—"}
                        </p>
                        {review.imageUrls && review.imageUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {review.imageUrls.map((url) => (
                              <a
                                key={url}
                                href={getImageUrl(url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-lg overflow-hidden border border-gray-100 w-16 h-16"
                              >
                                <img
                                  src={getImageUrl(url)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                        <p className="text-gray-400 text-sm">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleString("ru-RU", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {partnerReviewsTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-600">Всего: {partnerReviewsTotalElements}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={partnerReviewsPage === 0}
                        onClick={() => setPartnerReviewsPage((p) => Math.max(0, p - 1))}
                      >
                        Назад
                      </Button>
                      <span className="flex items-center px-2 text-sm">
                        {partnerReviewsPage + 1} / {partnerReviewsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={partnerReviewsPage >= partnerReviewsTotalPages - 1}
                        onClick={() => setPartnerReviewsPage((p) => p + 1)}
                      >
                        Вперёд
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stories">
            <PartnerStoriesSection services={servicesList} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
