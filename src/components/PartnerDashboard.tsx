import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, TrendingUp, Star, Calendar as CalendarIcon, Eye, Pencil, Trash2, Upload, ImagePlus } from "lucide-react";
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
import { useLocation } from "react-router-dom";

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

export function PartnerDashboard({ onNavigate }: PartnerDashboardProps) {
  const location = useLocation();
  const servicesApi = new PartnerServicesApi();
  const availabilityApi = new ServicesAvailabilityApi();
  const partnerBookingsApi = new PartnerBookingsApi();
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

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"services" | "bookings" | "calendar" | "reviews">("services");
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<"ALL" | BookingStatus>("ALL");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const tab = q.get("tab");
    if (tab === "bookings" || tab === "calendar" || tab === "reviews" || tab === "services") {
      setActiveTab(tab);
      return;
    }
    setActiveTab("services");
  }, [location.search]);

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
          imageUrls: serviceForm.imageUrls?.length ? serviceForm.imageUrls : undefined,
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
          imageUrls: serviceForm.imageUrls?.length ? serviceForm.imageUrls : undefined,
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

  const reviews = [
    {
      client: "Айжан Сагинова",
      service: "Ресторан «Алатау»",
      rating: 5,
      text: "Потрясающий ресторан! Все гости были в восторге!",
      date: "15 октября 2025",
    },
    {
      client: "Нурлан Ибрагимов",
      service: "Ресторан «Алатау»",
      rating: 5,
      text: "Отличное место для проведения банкетов. Рекомендую!",
      date: "3 октября 2025",
    },
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "services" | "bookings" | "calendar" | "reviews")} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl">
            <TabsTrigger value="services" className="rounded-lg">Мои услуги</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-lg">Бронирования</TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-lg">Календарь</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg">Отзывы</TabsTrigger>
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
                    <Input
                      value={serviceForm.city}
                      onChange={(e) => setServiceForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="Город"
                    />
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

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#222222]">Отзывы клиентов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-[#222222] mb-1">{review.client}</h4>
                          <p className="text-gray-500">{review.service}</p>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{review.text}</p>
                      <p className="text-gray-400">{review.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
