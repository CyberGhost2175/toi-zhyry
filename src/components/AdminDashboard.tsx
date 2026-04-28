import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Briefcase,
  FileCheck,
  Search,
  Check,
  X,
  Eye,
  LogIn,
  ArrowLeft,
  Package,
  Star,
  FolderTree,
  Pencil,
  Trash2,
  Bell,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AdminApi,
  PartnerApplicationItem,
  PartnerApplicationStatus,
  PartnerDirectoryItem,
  PartnerDirectoryResponse,
  type AdminTestNotificationRequest,
} from "../data/api/AdminApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  AdminServicesApi,
  AdminServiceItem,
} from "../data/api/AdminServicesApi";
import {
  AdminUsersApi,
  AdminUser,
  PagedUsersResponse,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
  UserStatistics,
  LoginHistoryItem,
  PagedLoginHistoryResponse,
  UserLoginStats,
} from "../data/api/AdminUsersApi";
import {
  AdminCategoriesApi,
  AdminCategory,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "../data/api/AdminCategoriesApi";
import {
  AdminReviewsApi,
  type AdminReviewRow,
  type AdminReviewsPageResponse,
} from "../data/api/AdminReviewsApi";
import {
  AdminSubscriptionPlansApi,
  type CreateSubscriptionPlanRequest,
  type SubscriptionPlan,
  type UpdateSubscriptionPlanRequest,
} from "../data/api/AdminSubscriptionPlansApi";
import { ImageWithFallback } from "./ImageWithFallback";
import { getImageUrl } from "../utils/imageUrl";
import { getPriceTypeLabel } from "../utils/priceType";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { Switch } from "./ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import {
  AttributesApi,
  type CategoryAttributeBinding,
  type CreateAdminAttributeRequest,
} from "../data/api/AttributesApi";
import { KZ_CITIES, formatKzPhoneInput, normalizeKzPhone } from "../utils/kzData";
import { AdminStoriesSection } from "./stories/AdminStoriesSection";

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "На рассмотрении",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено",
  INACTIVE: "Неактивно",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  INACTIVE: "bg-gray-100 text-gray-700",
};

function formatDate(s: string) {
  return new Date(s).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<
    | "applications"
    | "partners"
    | "users"
    | "services"
    | "reviews-moderation"
    | "attributes"
    | "categories"
    | "subscription-plans"
    | "stories"
    | "notifications-test"
  >("applications");
  const [applicationsStatusFilter, setApplicationsStatusFilter] = useState<PartnerApplicationStatus>("PENDING");
  const [applications, setApplications] = useState<PartnerApplicationItem[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  const [partnerDirectory, setPartnerDirectory] = useState<PartnerDirectoryResponse | null>(null);
  const [partnersPage, setPartnersPage] = useState(0);
  const [partnersSize] = useState(20);
  const [partnersCity, setPartnersCity] = useState("");
  const [partnersStatus, setPartnersStatus] = useState<string>("");
  const [partnersSearch, setPartnersSearch] = useState("");
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnersError, setPartnersError] = useState<string | null>(null);

  const [selectedApplication, setSelectedApplication] = useState<PartnerApplicationItem | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveValue, setApproveValue] = useState<boolean>(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approveSubmitting, setApproveSubmitting] = useState(false);

  const [selectedPartner, setSelectedPartner] = useState<PartnerDirectoryItem | null>(null);
  const [partnerDetailOpen, setPartnerDetailOpen] = useState(false);
  const [partnerDetailLoading, setPartnerDetailLoading] = useState(false);

  const [pendingServices, setPendingServices] = useState<AdminServiceItem[]>([]);
  const [pendingServicesLoading, setPendingServicesLoading] = useState(false);
  const [allServicesData, setAllServicesData] = useState<{ content: AdminServiceItem[]; totalPages: number; totalElements: number } | null>(null);
  const [servicesPage, setServicesPage] = useState(0);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceDetail, setServiceDetail] = useState<AdminServiceItem | null>(null);
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [serviceDetailLoading, setServiceDetailLoading] = useState(false);
  const [serviceApprovalTarget, setServiceApprovalTarget] = useState<{ service: AdminServiceItem; isApproved: boolean } | null>(null);
  const [serviceRejectionReason, setServiceRejectionReason] = useState("");
  const [serviceApprovalSubmitting, setServiceApprovalSubmitting] = useState(false);
  const [servicesTab, setServicesTab] = useState<"pending" | "all">("pending");

  const [usersData, setUsersData] = useState<PagedUsersResponse | null>(null);
  const [usersPage, setUsersPage] = useState(0);
  const [usersSize] = useState(20);
  const [usersRole, setUsersRole] = useState<string>("");
  const [usersSearch, setUsersSearch] = useState("");
  const [usersEmailVerified, setUsersEmailVerified] = useState<boolean | undefined>(undefined);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState<CreateAdminUserRequest>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    role: "USER",
    emailVerified: false,
  });
  const [createUserSubmitting, setCreateUserSubmitting] = useState(false);
  const [editUserTarget, setEditUserTarget] = useState<AdminUser | null>(null);
  const [editUserForm, setEditUserForm] = useState<UpdateAdminUserRequest>({ email: "", firstName: "", lastName: "", phone: "", city: "" });
  const [editUserSubmitting, setEditUserSubmitting] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);
  const [deleteUserSubmitting, setDeleteUserSubmitting] = useState(false);
  const [roleUserTarget, setRoleUserTarget] = useState<AdminUser | null>(null);
  const [roleUserNewRole, setRoleUserNewRole] = useState<"USER" | "PARTNER" | "ADMIN">("USER");
  const [roleUserSubmitting, setRoleUserSubmitting] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<AdminUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetPasswordSubmitting, setResetPasswordSubmitting] = useState(false);

  const [usersStatistics, setUsersStatistics] = useState<UserStatistics | null>(null);
  const [usersStatisticsLoading, setUsersStatisticsLoading] = useState(false);
  const [loginHistoryUserId, setLoginHistoryUserId] = useState<string>("");
  const [loginHistoryUsers, setLoginHistoryUsers] = useState<AdminUser[]>([]);
  const [loginHistoryData, setLoginHistoryData] = useState<PagedLoginHistoryResponse | null>(null);
  const [loginHistoryStats, setLoginHistoryStats] = useState<UserLoginStats | null>(null);
  const [loginHistoryPage, setLoginHistoryPage] = useState(0);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [usersTab, setUsersTab] = useState<"list" | "login-history">("list");

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryCreateOpen, setCategoryCreateOpen] = useState(false);
  const [categoryCreateForm, setCategoryCreateForm] = useState<CreateCategoryRequest>({
    nameRu: "",
    nameKz: "",
    slug: "",
    description: "",
    icon: "",
    displayOrder: 0,
  });
  const [categoryCreateSubmitting, setCategoryCreateSubmitting] = useState(false);
  const [categoryEditTarget, setCategoryEditTarget] = useState<AdminCategory | null>(null);
  const [categoryEditForm, setCategoryEditForm] = useState<UpdateCategoryRequest>({
    nameRu: "",
    nameKz: "",
    slug: "",
    description: "",
    icon: "",
    displayOrder: 0,
    isActive: true,
  });
  const [categoryEditSubmitting, setCategoryEditSubmitting] = useState(false);
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<AdminCategory | null>(null);
  const [categoryDeleteSubmitting, setCategoryDeleteSubmitting] = useState(false);
  const [attributesData, setAttributesData] = useState<{ content: unknown[]; totalElements: number; totalPages: number } | null>(null);
  const [attributesPage, setAttributesPage] = useState(0);
  const [attributesSearch, setAttributesSearch] = useState("");
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [attributeCreateOpen, setAttributeCreateOpen] = useState(false);
  const [attributeCreateSubmitting, setAttributeCreateSubmitting] = useState(false);
  const [attributeCreateForm, setAttributeCreateForm] = useState<CreateAdminAttributeRequest>({
    key: "",
    type: "STRING",
    matchStrategy: "SINGLE_EQ",
    storageKeys: { value: "" },
    labelRu: "",
    labelKk: "",
    unit: "",
    validationRules: null,
  });
  const [attributeDeleteTarget, setAttributeDeleteTarget] = useState<{ id: string; key: string } | null>(null);
  const [attributeDeleteSubmitting, setAttributeDeleteSubmitting] = useState(false);
  const [attributeEditTarget, setAttributeEditTarget] = useState<{ id: string; key: string } | null>(null);
  const [attributeEditForm, setAttributeEditForm] = useState({
    labelRu: "",
    labelKk: "",
    unit: "",
  });
  const [attributeEditSubmitting, setAttributeEditSubmitting] = useState(false);
  const [selectedCategoryForBindings, setSelectedCategoryForBindings] = useState<string>("");
  const [categoryBindings, setCategoryBindings] = useState<CategoryAttributeBinding[]>([]);
  const [bindingsLoading, setBindingsLoading] = useState(false);
  const [bindingForm, setBindingForm] = useState({
    attributeId: "",
    isRequired: false,
    isFilterable: true,
    sortOrder: 1,
  });

  const [testNotifTitle, setTestNotifTitle] = useState("Тест уведомления");
  const [testNotifMessage, setTestNotifMessage] = useState("Проверка каналов доставки из админ-панели.");
  const [testNotifRecipientEmail, setTestNotifRecipientEmail] = useState("");
  const [testNotifPush, setTestNotifPush] = useState(true);
  const [testNotifEmailChannel, setTestNotifEmailChannel] = useState(true);
  const [testNotifSms, setTestNotifSms] = useState(false);
  const [testNotifSubmitting, setTestNotifSubmitting] = useState(false);

  const [adminReviewsData, setAdminReviewsData] = useState<AdminReviewsPageResponse | null>(null);
  const [adminReviewsPage, setAdminReviewsPage] = useState(0);
  const [adminReviewsSize] = useState(20);
  const [adminReviewsLoading, setAdminReviewsLoading] = useState(false);
  const [adminReviewsError, setAdminReviewsError] = useState<string | null>(null);
  const [reviewDeleteTarget, setReviewDeleteTarget] = useState<AdminReviewRow | null>(null);
  const [reviewDeleteSubmitting, setReviewDeleteSubmitting] = useState(false);
  const [reviewActionId, setReviewActionId] = useState<string | null>(null);

  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionPlansLoading, setSubscriptionPlansLoading] = useState(false);
  const [subscriptionPlansError, setSubscriptionPlansError] = useState<string | null>(null);
  const [planCreateOpen, setPlanCreateOpen] = useState(false);
  const [planCreateForm, setPlanCreateForm] = useState<CreateSubscriptionPlanRequest>({
    name: "",
    slug: "",
    description: "",
    price: 0,
    durationDays: 30,
    isFree: false,
    displayOrder: 0,
  });
  const [planCreateSubmitting, setPlanCreateSubmitting] = useState(false);
  const [planEditTarget, setPlanEditTarget] = useState<SubscriptionPlan | null>(null);
  const [planEditForm, setPlanEditForm] = useState<UpdateSubscriptionPlanRequest>({
    name: "",
    description: "",
    price: 0,
    durationDays: 30,
    isFree: false,
    displayOrder: 0,
  });
  const [planEditSubmitting, setPlanEditSubmitting] = useState(false);
  const [planDeactivateTarget, setPlanDeactivateTarget] = useState<SubscriptionPlan | null>(null);
  const [planDeactivateSubmitting, setPlanDeactivateSubmitting] = useState(false);
  const [planActionId, setPlanActionId] = useState<string | null>(null);

  const adminApi = new AdminApi();
  const adminServicesApi = new AdminServicesApi();
  const adminUsersApi = new AdminUsersApi();
  const adminCategoriesApi = new AdminCategoriesApi();
  const attributesApi = new AttributesApi();
  const adminReviewsApi = new AdminReviewsApi();
  const adminSubscriptionPlansApi = new AdminSubscriptionPlansApi();

  const loadApplications = async () => {
    setApplicationsLoading(true);
    setApplicationsError(null);
    try {
      const data = await adminApi.getApplicationsByStatus(applicationsStatusFilter);
      setApplications(Array.isArray(data) ? data : []);
    } catch (e) {
      setApplicationsError(e instanceof Error ? e.message : "Ошибка загрузки");
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "applications") loadApplications();
  }, [activeSection, applicationsStatusFilter]);

  const loadPartners = async () => {
    setPartnersLoading(true);
    setPartnersError(null);
    try {
      const data = await adminApi.getPartnerDirectory({
        page: partnersPage,
        size: partnersSize,
        sortBy: "createdAt",
        sortDirection: "DESC",
        ...(partnersCity && { city: partnersCity }),
        ...(partnersStatus && { status: partnersStatus as PartnerApplicationStatus }),
        ...(partnersSearch && { search: partnersSearch }),
      });
      setPartnerDirectory(data);
    } catch (e) {
      setPartnersError(e instanceof Error ? e.message : "Ошибка загрузки");
      setPartnerDirectory(null);
    } finally {
      setPartnersLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "partners") loadPartners();
  }, [activeSection, partnersPage, partnersSize, partnersCity, partnersStatus, partnersSearch]);

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const data = await adminUsersApi.getUsers({
        page: usersPage,
        size: usersSize,
        sortBy: "createdAt",
        sortDirection: "DESC",
        ...(usersRole && { role: usersRole }),
        ...(usersSearch.trim() && { search: usersSearch.trim() }),
        ...(usersEmailVerified !== undefined && { emailVerified: usersEmailVerified }),
      });
      setUsersData(data);
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "Ошибка загрузки");
      setUsersData(null);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "users") loadUsers();
  }, [activeSection, usersPage, usersSize, usersRole, usersSearch, usersEmailVerified]);

  const loadUsersStatistics = async () => {
    setUsersStatisticsLoading(true);
    try {
      const data = await adminUsersApi.getUsersStatistics();
      setUsersStatistics(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки статистики");
      setUsersStatistics(null);
    } finally {
      setUsersStatisticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "users") loadUsersStatistics();
  }, [activeSection]);

  const loadLoginHistoryUsers = async () => {
    try {
      const data = await adminUsersApi.getUsers({ page: 0, size: 100, sortBy: "createdAt", sortDirection: "DESC" });
      setLoginHistoryUsers(data.content || []);
    } catch {
      setLoginHistoryUsers([]);
    }
  };

  const loadLoginHistory = async () => {
    if (!loginHistoryUserId) {
      setLoginHistoryData(null);
      setLoginHistoryStats(null);
      return;
    }
    setLoginHistoryLoading(true);
    try {
      const [historyRes, statsRes] = await Promise.all([
        adminUsersApi.getLoginHistory(loginHistoryUserId, { page: loginHistoryPage, size: 20 }),
        adminUsersApi.getLoginHistoryStats(loginHistoryUserId),
      ]);
      setLoginHistoryData(historyRes);
      setLoginHistoryStats(statsRes);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки истории входов");
      setLoginHistoryData(null);
      setLoginHistoryStats(null);
    } finally {
      setLoginHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadLoginHistory();
  }, [loginHistoryUserId, loginHistoryPage]);

  const handleApproveReject = async () => {
    if (!selectedApplication) return;
    setApproveSubmitting(true);
    try {
      await adminApi.approveOrRejectApplication(selectedApplication.id, {
        approved: approveValue,
        ...(!approveValue && rejectionReason && { rejectionReason }),
      });
      setApproveModalOpen(false);
      setSelectedApplication(null);
      setRejectionReason("");
      loadApplications();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setApproveSubmitting(false);
    }
  };

  const openPartnerDetail = async (id: string) => {
    setPartnerDetailLoading(true);
    setPartnerDetailOpen(true);
    try {
      const partner = await adminApi.getPartnerById(id);
      setSelectedPartner(partner);
    } catch (e) {
      setSelectedPartner(null);
      setPartnersError(e instanceof Error ? e.message : "Ошибка загрузки профиля");
    } finally {
      setPartnerDetailLoading(false);
    }
  };

  const openUserDetail = async (userId: string) => {
    setUserDetailLoading(true);
    setUserDetailOpen(true);
    setSelectedUser(null);
    try {
      const user = await adminUsersApi.getUserById(userId);
      setSelectedUser(user);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки пользователя");
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createUserForm.email || !createUserForm.password || !createUserForm.firstName || !createUserForm.lastName) {
      toast.error("Заполните email, пароль, имя и фамилию");
      return;
    }
    setCreateUserSubmitting(true);
    try {
      await adminUsersApi.createUser({
        ...createUserForm,
        phone: normalizeKzPhone(createUserForm.phone || ""),
      });
      toast.success("Пользователь создан");
      setCreateUserOpen(false);
      setCreateUserForm({ email: "", password: "", firstName: "", lastName: "", phone: "", city: "", role: "USER", emailVerified: false });
      loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка создания");
    } finally {
      setCreateUserSubmitting(false);
    }
  };

  const openEditUser = (user: AdminUser) => {
    setEditUserTarget(user);
    setEditUserForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: formatKzPhoneInput(user.phone || ""),
      city: user.city || "",
    });
  };

  const saveEditUser = async () => {
    if (!editUserTarget) return;
    setEditUserSubmitting(true);
    try {
      await adminUsersApi.updateUser(editUserTarget.id, {
        ...editUserForm,
        phone: normalizeKzPhone(editUserForm.phone || ""),
      });
      toast.success("Пользователь обновлён");
      setEditUserTarget(null);
      loadUsers();
      if (selectedUser?.id === editUserTarget.id) {
        setSelectedUser({
          ...selectedUser,
          ...editUserForm,
          phone: normalizeKzPhone(editUserForm.phone || ""),
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка обновления");
    } finally {
      setEditUserSubmitting(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserTarget) return;
    setDeleteUserSubmitting(true);
    try {
      await adminUsersApi.deleteUser(deleteUserTarget.id);
      toast.success("Пользователь удалён");
      setDeleteUserTarget(null);
      setUserDetailOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка удаления");
    } finally {
      setDeleteUserSubmitting(false);
    }
  };

  const handleSetRole = async () => {
    if (!roleUserTarget) return;
    setRoleUserSubmitting(true);
    try {
      const updated = await adminUsersApi.setUserRole(roleUserTarget.id, { role: roleUserNewRole });
      toast.success("Роль изменена");
      setRoleUserTarget(null);
      loadUsers();
      if (selectedUser?.id === roleUserTarget.id) setSelectedUser(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка смены роли");
    } finally {
      setRoleUserSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordTarget || !resetPasswordValue.trim()) {
      toast.error("Введите новый пароль");
      return;
    }
    setResetPasswordSubmitting(true);
    try {
      await adminUsersApi.resetPassword(resetPasswordTarget.id, { newPassword: resetPasswordValue });
      toast.success("Пароль сброшен");
      setResetPasswordTarget(null);
      setResetPasswordValue("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сброса пароля");
    } finally {
      setResetPasswordSubmitting(false);
    }
  };

  const handleSetEmailVerification = async (user: AdminUser, emailVerified: boolean) => {
    try {
      const updated = await adminUsersApi.setEmailVerification(user.id, { emailVerified });
      toast.success(emailVerified ? "Email подтверждён" : "Подтверждение снято");
      loadUsers();
      if (selectedUser?.id === user.id) setSelectedUser(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleSetActiveStatus = async (user: AdminUser, isActive: boolean) => {
    try {
      const updated = await adminUsersApi.setActiveStatus(user.id, { isActive });
      toast.success(isActive ? "Пользователь разблокирован" : "Пользователь заблокирован");
      loadUsers();
      if (selectedUser?.id === user.id) setSelectedUser(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const loadPendingServices = async () => {
    setPendingServicesLoading(true);
    try {
      const data = await adminServicesApi.getPendingServices();
      setPendingServices(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Ошибка загрузки услуг на модерации", {
        description: e instanceof Error ? e.message : undefined,
      });
      setPendingServices([]);
    } finally {
      setPendingServicesLoading(false);
    }
  };

  const loadAllServices = async () => {
    setServicesLoading(true);
    try {
      const data = await adminServicesApi.getAllServices({
        page: servicesPage,
        size: 10,
        sortBy: "createdAt",
        sortDirection: "DESC",
      });
      setAllServicesData({
        content: data.content || [],
        totalPages: data.totalPages ?? 0,
        totalElements: data.totalElements ?? 0,
      });
    } catch (e) {
      toast.error("Ошибка загрузки услуг", {
        description: e instanceof Error ? e.message : undefined,
      });
      setAllServicesData({ content: [], totalPages: 0, totalElements: 0 });
    } finally {
      setServicesLoading(false);
    }
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await adminCategoriesApi.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки категорий");
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "categories" || activeSection === "attributes") loadCategories();
  }, [activeSection]);

  const loadAttributes = async () => {
    setAttributesLoading(true);
    try {
      const data = await attributesApi.getAdminAttributes({
        search: attributesSearch.trim() || undefined,
        page: attributesPage,
        size: 20,
      });
      setAttributesData({
        content: data.content || [],
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 0,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки атрибутов");
      setAttributesData({ content: [], totalElements: 0, totalPages: 0 });
    } finally {
      setAttributesLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "attributes") loadAttributes();
  }, [activeSection, attributesPage, attributesSearch]);

  const loadCategoryBindings = async (categoryId: string) => {
    if (!categoryId) {
      setCategoryBindings([]);
      return;
    }
    setBindingsLoading(true);
    try {
      const rows = await attributesApi.getCategoryAttributes(categoryId);
      setCategoryBindings(rows || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки привязок");
      setCategoryBindings([]);
    } finally {
      setBindingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection !== "attributes") return;
    if (selectedCategoryForBindings) {
      void loadCategoryBindings(selectedCategoryForBindings);
    }
  }, [activeSection, selectedCategoryForBindings]);

  const handleCreateAttribute = async () => {
    if (!attributeCreateForm.key.trim() || !attributeCreateForm.labelRu.trim()) {
      toast.error("Заполните key и labelRu");
      return;
    }
    if (attributeCreateForm.matchStrategy === "RANGE_CONTAINS") {
      if (!attributeCreateForm.storageKeys.min || !attributeCreateForm.storageKeys.max) {
        toast.error("Для RANGE_CONTAINS укажите storageKeys.min и storageKeys.max");
        return;
      }
    } else if (!attributeCreateForm.storageKeys.value) {
      toast.error("Укажите storageKeys.value");
      return;
    }
    setAttributeCreateSubmitting(true);
    try {
      await attributesApi.createAdminAttribute({
        ...attributeCreateForm,
        key: attributeCreateForm.key.trim(),
        labelRu: attributeCreateForm.labelRu.trim(),
        labelKk: attributeCreateForm.labelKk?.trim() || undefined,
        unit: attributeCreateForm.unit?.trim() || undefined,
      });
      toast.success("Атрибут создан");
      setAttributeCreateOpen(false);
      setAttributeCreateForm({
        key: "",
        type: "STRING",
        matchStrategy: "SINGLE_EQ",
        storageKeys: { value: "" },
        labelRu: "",
        labelKk: "",
        unit: "",
        validationRules: null,
      });
      await loadAttributes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать атрибут");
    } finally {
      setAttributeCreateSubmitting(false);
    }
  };

  const handleDeleteAttribute = async () => {
    if (!attributeDeleteTarget) return;
    setAttributeDeleteSubmitting(true);
    try {
      await attributesApi.deleteAdminAttribute(attributeDeleteTarget.id);
      toast.success("Атрибут удалён");
      setAttributeDeleteTarget(null);
      await loadAttributes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось удалить атрибут");
    } finally {
      setAttributeDeleteSubmitting(false);
    }
  };

  const handleUpdateAttribute = async () => {
    if (!attributeEditTarget) return;
    if (!attributeEditForm.labelRu.trim()) {
      toast.error("Укажите labelRu");
      return;
    }
    setAttributeEditSubmitting(true);
    try {
      await attributesApi.updateAdminAttribute(attributeEditTarget.id, {
        labelRu: attributeEditForm.labelRu.trim(),
        labelKk: attributeEditForm.labelKk.trim() || undefined,
        unit: attributeEditForm.unit.trim() || undefined,
      });
      toast.success("Атрибут обновлён");
      setAttributeEditTarget(null);
      await loadAttributes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось обновить атрибут");
    } finally {
      setAttributeEditSubmitting(false);
    }
  };

  const handleBindAttribute = async () => {
    if (!selectedCategoryForBindings || !bindingForm.attributeId) {
      toast.error("Выберите категорию и атрибут");
      return;
    }
    try {
      await attributesApi.bindAttributeToCategory(selectedCategoryForBindings, bindingForm);
      toast.success("Атрибут привязан к категории");
      await loadCategoryBindings(selectedCategoryForBindings);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось привязать атрибут");
    }
  };

  const handleUpdateBinding = async (row: CategoryAttributeBinding) => {
    if (!selectedCategoryForBindings) return;
    try {
      await attributesApi.updateCategoryAttributeBinding(selectedCategoryForBindings, row.attributeId, {
        isRequired: row.isRequired,
        isFilterable: row.isFilterable,
        sortOrder: row.sortOrder,
      });
      toast.success("Привязка обновлена");
      await loadCategoryBindings(selectedCategoryForBindings);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось обновить привязку");
    }
  };

  const handleUnbindAttribute = async (attributeId: string) => {
    if (!selectedCategoryForBindings) return;
    try {
      await attributesApi.unbindAttributeFromCategory(selectedCategoryForBindings, attributeId);
      toast.success("Атрибут отвязан");
      await loadCategoryBindings(selectedCategoryForBindings);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось отвязать атрибут");
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryCreateForm.nameRu?.trim() || !categoryCreateForm.slug?.trim()) {
      toast.error("Заполните название (RU) и slug");
      return;
    }
    setCategoryCreateSubmitting(true);
    try {
      await adminCategoriesApi.createCategory({
        ...categoryCreateForm,
        nameKz: categoryCreateForm.nameKz || categoryCreateForm.nameRu,
      });
      toast.success("Категория создана");
      setCategoryCreateOpen(false);
      setCategoryCreateForm({ nameRu: "", nameKz: "", slug: "", description: "", icon: "", displayOrder: 0 });
      loadCategories();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка создания");
    } finally {
      setCategoryCreateSubmitting(false);
    }
  };

  const openEditCategory = (cat: AdminCategory) => {
    setCategoryEditTarget(cat);
    setCategoryEditForm({
      nameRu: cat.nameRu,
      nameKz: cat.nameKz,
      slug: cat.slug,
      description: cat.description || "",
      icon: cat.icon || "",
      displayOrder: 0,
      isActive: true,
    });
  };

  const saveEditCategory = async () => {
    if (!categoryEditTarget) return;
    if (!categoryEditForm.nameRu?.trim() || !categoryEditForm.slug?.trim()) {
      toast.error("Заполните название (RU) и slug");
      return;
    }
    setCategoryEditSubmitting(true);
    try {
      await adminCategoriesApi.updateCategory(categoryEditTarget.id, categoryEditForm);
      toast.success("Категория обновлена");
      setCategoryEditTarget(null);
      loadCategories();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка обновления");
    } finally {
      setCategoryEditSubmitting(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryDeleteTarget) return;
    setCategoryDeleteSubmitting(true);
    try {
      await adminCategoriesApi.deleteCategory(categoryDeleteTarget.id);
      toast.success("Категория удалена");
      setCategoryDeleteTarget(null);
      loadCategories();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка удаления");
    } finally {
      setCategoryDeleteSubmitting(false);
    }
  };

  useEffect(() => {
    if (activeSection === "services" && servicesTab === "pending") loadPendingServices();
  }, [activeSection, servicesTab]);

  useEffect(() => {
    if (activeSection === "services" && servicesTab === "all") loadAllServices();
  }, [activeSection, servicesTab, servicesPage]);

  useEffect(() => {
    if (activeSection !== "notifications-test" || !user?.email) return;
    setTestNotifRecipientEmail((prev) => (prev.trim() === "" ? user.email! : prev));
  }, [activeSection, user?.email]);

  const openServiceDetail = async (id: string) => {
    setServiceDetailLoading(true);
    setServiceDetailOpen(true);
    setServiceDetail(null);
    try {
      const service = await adminServicesApi.getServiceById(id);
      setServiceDetail(service);
    } catch (e) {
      toast.error("Не удалось загрузить услугу", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setServiceDetailLoading(false);
    }
  };

  const handleServiceApproval = async () => {
    if (!serviceApprovalTarget) return;
    setServiceApprovalSubmitting(true);
    try {
      await adminServicesApi.setApprovalStatus(serviceApprovalTarget.service.id, {
        isApproved: serviceApprovalTarget.isApproved,
        rejectionReason: !serviceApprovalTarget.isApproved ? serviceRejectionReason || undefined : undefined,
      });
      toast.success(
        serviceApprovalTarget.isApproved ? "Услуга одобрена" : "Услуга отклонена",
        { description: serviceApprovalTarget.isApproved ? "Она отображается в каталоге." : serviceRejectionReason || undefined }
      );
      setServiceApprovalTarget(null);
      setServiceRejectionReason("");
      loadPendingServices();
      if (serviceDetailOpen && serviceDetail?.id === serviceApprovalTarget.service.id) {
        const updated = await adminServicesApi.getServiceById(serviceApprovalTarget.service.id);
        setServiceDetail(updated);
      }
      if (servicesTab === "all") loadAllServices();
    } catch (e) {
      toast.error("Ошибка", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setServiceApprovalSubmitting(false);
    }
  };

  const handleServiceActiveToggle = async (service: AdminServiceItem, isActive: boolean) => {
    try {
      await adminServicesApi.setActiveStatus(service.id, { isActive });
      toast.success(isActive ? "Услуга активирована" : "Услуга деактивирована");
      loadAllServices();
      if (serviceDetail?.id === service.id) setServiceDetail({ ...serviceDetail, isActive } as AdminServiceItem);
    } catch (e) {
      toast.error("Ошибка смены статуса", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const handleSendTestNotification = async () => {
    const email = testNotifRecipientEmail.trim();
    if (!email) {
      toast.error("Укажите email получателя");
      return;
    }
    if (!testNotifTitle.trim()) {
      toast.error("Укажите заголовок");
      return;
    }
    setTestNotifSubmitting(true);
    try {
      const payload: AdminTestNotificationRequest = {
        title: testNotifTitle.trim(),
        message: testNotifMessage.trim() || " ",
        recipientEmail: email,
        push: testNotifPush,
        email: testNotifEmailChannel,
        sms: testNotifSms,
      };
      const res = await adminApi.sendTestNotification(payload);
      toast.success(res.message || "Тестовое уведомление отправлено");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setTestNotifSubmitting(false);
    }
  };

  const isReviewPubliclyVisible = (r: AdminReviewRow) => {
    if (r.isVisible === false || r.visible === false) return false;
    return true;
  };

  const loadAdminReviews = useCallback(async () => {
    setAdminReviewsLoading(true);
    setAdminReviewsError(null);
    try {
      const data = await adminReviewsApi.getAdminReviews({ page: adminReviewsPage, size: adminReviewsSize });
      setAdminReviewsData(data);
    } catch (e) {
      setAdminReviewsData(null);
      setAdminReviewsError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setAdminReviewsLoading(false);
    }
  }, [adminReviewsPage, adminReviewsSize]);

  useEffect(() => {
    if (activeSection !== "reviews-moderation") return;
    void loadAdminReviews();
  }, [activeSection, loadAdminReviews]);

  const confirmDeleteReview = async () => {
    if (!reviewDeleteTarget) return;
    setReviewDeleteSubmitting(true);
    try {
      const res = await adminReviewsApi.deleteReview(reviewDeleteTarget.id);
      toast.success(res.message || "Отзыв удалён");
      setReviewDeleteTarget(null);
      await loadAdminReviews();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось удалить");
    } finally {
      setReviewDeleteSubmitting(false);
    }
  };

  const handleHideReview = async (r: AdminReviewRow) => {
    setReviewActionId(r.id);
    try {
      const res = await adminReviewsApi.hideReview(r.id);
      toast.success(res.message || "Отзыв скрыт");
      await loadAdminReviews();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setReviewActionId(null);
    }
  };

  const handleShowReview = async (r: AdminReviewRow) => {
    setReviewActionId(r.id);
    try {
      const res = await adminReviewsApi.showReview(r.id);
      toast.success(res.message || "Отзыв снова виден");
      await loadAdminReviews();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setReviewActionId(null);
    }
  };

  const isSubscriptionPlanActive = (status: string) => (status || "").toUpperCase() === "ACTIVE";

  const loadSubscriptionPlans = useCallback(async () => {
    setSubscriptionPlansLoading(true);
    setSubscriptionPlansError(null);
    try {
      const list = await adminSubscriptionPlansApi.listPlans();
      setSubscriptionPlans(list);
    } catch (e) {
      setSubscriptionPlans([]);
      setSubscriptionPlansError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setSubscriptionPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection !== "subscription-plans") return;
    void loadSubscriptionPlans();
  }, [activeSection, loadSubscriptionPlans]);

  const handleCreateSubscriptionPlan = async () => {
    if (!planCreateForm.name.trim() || !planCreateForm.slug.trim()) {
      toast.error("Укажите название и slug");
      return;
    }
    setPlanCreateSubmitting(true);
    try {
      await adminSubscriptionPlansApi.createPlan({
        ...planCreateForm,
        name: planCreateForm.name.trim(),
        slug: planCreateForm.slug.trim(),
        description: planCreateForm.description.trim(),
        price: Number(planCreateForm.price) || 0,
        durationDays: Math.max(1, Math.floor(Number(planCreateForm.durationDays)) || 1),
        displayOrder: Math.floor(Number(planCreateForm.displayOrder)) || 0,
      });
      toast.success("Тариф создан");
      setPlanCreateOpen(false);
      setPlanCreateForm({
        name: "",
        slug: "",
        description: "",
        price: 0,
        durationDays: 30,
        isFree: false,
        displayOrder: 0,
      });
      await loadSubscriptionPlans();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка создания");
    } finally {
      setPlanCreateSubmitting(false);
    }
  };

  const openEditSubscriptionPlan = (p: SubscriptionPlan) => {
    setPlanEditTarget(p);
    setPlanEditForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      durationDays: p.durationDays,
      isFree: p.isFree,
      displayOrder: p.displayOrder,
    });
  };

  const saveEditSubscriptionPlan = async () => {
    if (!planEditTarget) return;
    if (!planEditForm.name.trim()) {
      toast.error("Укажите название");
      return;
    }
    setPlanEditSubmitting(true);
    try {
      await adminSubscriptionPlansApi.updatePlan(planEditTarget.id, {
        ...planEditForm,
        name: planEditForm.name.trim(),
        description: planEditForm.description.trim(),
        price: Number(planEditForm.price) || 0,
        durationDays: Math.max(1, Math.floor(Number(planEditForm.durationDays)) || 1),
        displayOrder: Math.floor(Number(planEditForm.displayOrder)) || 0,
      });
      toast.success("Тариф обновлён");
      setPlanEditTarget(null);
      await loadSubscriptionPlans();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setPlanEditSubmitting(false);
    }
  };

  const handleActivatePlan = async (p: SubscriptionPlan) => {
    setPlanActionId(p.id);
    try {
      const res = await adminSubscriptionPlansApi.activatePlan(p.id);
      toast.success(res.message || "Тариф активирован");
      await loadSubscriptionPlans();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPlanActionId(null);
    }
  };

  const confirmDeactivatePlan = async () => {
    if (!planDeactivateTarget) return;
    setPlanDeactivateSubmitting(true);
    try {
      const res = await adminSubscriptionPlansApi.deactivatePlan(planDeactivateTarget.id);
      toast.success(res.message || "Тариф скрыт из каталога");
      setPlanDeactivateTarget(null);
      await loadSubscriptionPlans();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPlanDeactivateSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00AFAE] to-[#FFD700] rounded-xl flex items-center justify-center">
                <span className="text-white">TŽ</span>
              </div>
              <div>
                <h3 className="text-[#222222]">Админ-панель</h3>
                <p className="text-gray-500">Toi Zhyry</p>
              </div>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection("applications")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeSection === "applications"
                    ? "bg-[#00AFAE]/10 text-[#00AFAE]"
                    : "text-gray-600 hover:bg-[#F9F9F9]"
                }`}
              >
                <FileCheck className="w-5 h-5" />
                <span>Заявки на сотрудничество</span>
              </button>
              <button
                onClick={() => setActiveSection("partners")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeSection === "partners"
                    ? "bg-[#00AFAE]/10 text-[#00AFAE]"
                    : "text-gray-600 hover:bg-[#F9F9F9]"
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span>Партнёры</span>
              </button>
              <button
                onClick={() => setActiveSection("users")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeSection === "users"
                    ? "bg-[#00AFAE]/10 text-[#00AFAE]"
                    : "text-gray-600 hover:bg-[#F9F9F9]"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Пользователи</span>
              </button>
              <button
                onClick={() => setActiveSection("services")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeSection === "services"
                    ? "bg-[#00AFAE]/10 text-[#00AFAE]"
                    : "text-gray-600 hover:bg-[#F9F9F9]"
                }`}
              >
                <Package className="w-5 h-5" />
                <span>Услуги</span>
              </button>
              <button
                onClick={() => setActiveSection("reviews-moderation")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeSection === "reviews-moderation"
                    ? "bg-[#00AFAE]/10 text-[#00AFAE]"
                    : "text-gray-600 hover:bg-[#F9F9F9]"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Отзывы</span>
              </button>
              <button
                onClick={() => setActiveSection("categories")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeSection === "categories"
                    ? "bg-[#00AFAE]/10 text-[#00AFAE]"
                    : "text-gray-600 hover:bg-[#F9F9F9]"
                }`}
              >
                <FolderTree className="w-5 h-5" />
                <span>Категории</span>
              </button>
              <button
                onClick={() => setActiveSection("attributes")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeSection === "attributes"
                    ? "bg-[#00AFAE]/10 text-[#00AFAE]"
                    : "text-gray-600 hover:bg-[#F9F9F9]"
                }`}
              >
                <FolderTree className="w-5 h-5" />
                <span>Атрибуты</span>
              </button>
              <button
                onClick={() => setActiveSection("subscription-plans")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeSection === "subscription-plans"
                    ? "bg-[#00AFAE]/10 text-[#00AFAE]"
                    : "text-gray-600 hover:bg-[#F9F9F9]"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Тарифы</span>
              </button>
              <button
                onClick={() => setActiveSection("stories")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeSection === "stories"
                    ? "bg-[#00AFAE]/10 text-[#00AFAE]"
                    : "text-gray-600 hover:bg-[#F9F9F9]"
                }`}
              >
                <Eye className="w-5 h-5" />
                <span>Сторис</span>
              </button>
              <button
                onClick={() => setActiveSection("notifications-test")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeSection === "notifications-test"
                    ? "bg-[#00AFAE]/10 text-[#00AFAE]"
                    : "text-gray-600 hover:bg-[#F9F9F9]"
                }`}
              >
                <Bell className="w-5 h-5" />
                <span>Тест уведомлений</span>
              </button>
            </nav>
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <Button
              variant="outline"
              onClick={() => onNavigate("home")}
              className="w-full rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              На главную
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-[#222222] mb-6 text-2xl">
              {activeSection === "applications" && "Заявки на сотрудничество"}
              {activeSection === "partners" && "Справочник партнёров"}
              {activeSection === "users" && "Пользователи"}
              {activeSection === "services" && "Управление услугами"}
              {activeSection === "reviews-moderation" && "Модерация отзывов"}
              {activeSection === "categories" && "Категории услуг"}
              {activeSection === "attributes" && "Атрибуты и привязки"}
              {activeSection === "subscription-plans" && "Тарифные планы"}
              {activeSection === "stories" && "Модерация сторис"}
              {activeSection === "notifications-test" && "Тест уведомлений"}
            </h1>

            {/* Заявки на сотрудничество */}
            {activeSection === "applications" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Label className="text-sm text-gray-600">Статус:</Label>
                  <Select
                    value={applicationsStatusFilter}
                    onValueChange={(v) => setApplicationsStatusFilter(v as PartnerApplicationStatus)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">На рассмотрении</SelectItem>
                      <SelectItem value="APPROVED">Одобрено</SelectItem>
                      <SelectItem value="REJECTED">Отклонено</SelectItem>
                      <SelectItem value="INACTIVE">Неактивно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {applicationsError && (
                  <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
                    {applicationsError}
                  </div>
                )}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    {applicationsLoading ? (
                      <div className="p-12 text-center text-gray-500">Загрузка...</div>
                    ) : applications.length === 0 ? (
                      <div className="p-12 text-center text-gray-500">Нет заявок с выбранным статусом</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Заявитель</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>БИН</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Дата</TableHead>
                            <TableHead className="w-[100px]">Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {applications.map((app) => (
                            <TableRow key={app.id}>
                              <TableCell className="font-medium text-[#222222]">
                                {app.userFullName || "—"}
                              </TableCell>
                              <TableCell>{app.userEmail}</TableCell>
                              <TableCell>{app.bin}</TableCell>
                              <TableCell>
                                <Badge className={STATUS_COLORS[app.status] || "bg-gray-100"}>
                                  {STATUS_LABELS[app.status] || app.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {formatDate(app.createdAt)}
                              </TableCell>
                              <TableCell>
                                {app.status === "PENDING" && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 border-green-600 hover:bg-green-50"
                                      onClick={() => {
                                        setSelectedApplication(app);
                                        setApproveValue(true);
                                        setRejectionReason("");
                                        setApproveModalOpen(true);
                                      }}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-600 hover:bg-red-50"
                                      onClick={() => {
                                        setSelectedApplication(app);
                                        setApproveValue(false);
                                        setRejectionReason("");
                                        setApproveModalOpen(true);
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Партнёры */}
            {activeSection === "partners" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Поиск по названию компании"
                      className="pl-10"
                      value={partnersSearch}
                      onChange={(e) => setPartnersSearch(e.target.value)}
                    />
                  </div>
                  <Input
                    placeholder="Город"
                    className="w-[160px]"
                    value={partnersCity}
                    onChange={(e) => setPartnersCity(e.target.value)}
                  />
                  <Select value={partnersStatus || "all"} onValueChange={(v) => setPartnersStatus(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="PENDING">На рассмотрении</SelectItem>
                      <SelectItem value="APPROVED">Одобрено</SelectItem>
                      <SelectItem value="REJECTED">Отклонено</SelectItem>
                      <SelectItem value="INACTIVE">Неактивно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {partnersError && (
                  <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
                    {partnersError}
                  </div>
                )}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    {partnersLoading ? (
                      <div className="p-12 text-center text-gray-500">Загрузка...</div>
                    ) : !partnerDirectory ? (
                      <div className="p-12 text-center text-gray-500">Нет данных</div>
                    ) : partnerDirectory.empty ? (
                      <div className="p-12 text-center text-gray-500">Партнёры не найдены</div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Компания</TableHead>
                              <TableHead>БИН</TableHead>
                              <TableHead>Город</TableHead>
                              <TableHead>Статус</TableHead>
                              <TableHead>Рейтинг</TableHead>
                              <TableHead>Услуг</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {partnerDirectory.content.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="font-medium text-[#222222]">
                                  {p.companyName}
                                </TableCell>
                                <TableCell>{p.bin}</TableCell>
                                <TableCell>{p.city}</TableCell>
                                <TableCell>
                                  <Badge className={STATUS_COLORS[p.status] || "bg-gray-100"}>
                                    {STATUS_LABELS[p.status] || p.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{p.averageRating?.toFixed(1) ?? "—"}</TableCell>
                                <TableCell>{p.totalServices ?? 0}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openPartnerDetail(p.id)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {partnerDirectory.totalPages > 1 && (
                          <div className="flex items-center justify-between p-4 border-t">
                            <span className="text-sm text-gray-600">
                              Всего: {partnerDirectory.totalElements}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={partnersPage === 0}
                                onClick={() => setPartnersPage((p) => Math.max(0, p - 1))}
                              >
                                Назад
                              </Button>
                              <span className="flex items-center px-2 text-sm">
                                {partnersPage + 1} / {partnerDirectory.totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={partnersPage >= partnerDirectory.totalPages - 1}
                                onClick={() => setPartnersPage((p) => p + 1)}
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
            )}

            {/* Услуги: на модерации + все услуги */}
            {activeSection === "services" && (
              <Card className="border-0 shadow-sm">
                <Tabs value={servicesTab} onValueChange={(v) => setServicesTab(v as "pending" | "all")} className="w-full">
                  <TabsList className="bg-white p-1 rounded-xl mb-4">
                    <TabsTrigger value="pending" className="rounded-lg">
                      На модерации
                      {pendingServices.length > 0 && (
                        <Badge className="ml-2 bg-amber-100 text-amber-800">{pendingServices.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="all" className="rounded-lg">
                      Все услуги
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending" className="mt-0">
                    <CardContent className="p-0">
                      {pendingServicesLoading ? (
                        <div className="p-12 text-center text-gray-500">Загрузка...</div>
                      ) : pendingServices.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">Нет услуг на модерации</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Услуга</TableHead>
                              <TableHead>Партнёр</TableHead>
                              <TableHead>Категория</TableHead>
                              <TableHead>Город</TableHead>
                              <TableHead className="w-[160px]">Действия</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingServices.map((s) => (
                              <TableRow key={s.id}>
                                <TableCell>
                                  <button
                                    type="button"
                                    className="font-medium text-[#222222] hover:text-[#00AFAE] text-left"
                                    onClick={() => openServiceDetail(s.id)}
                                  >
                                    {s.name}
                                  </button>
                                </TableCell>
                                <TableCell>{s.partnerName || "—"}</TableCell>
                                <TableCell>{s.categoryName || "—"}</TableCell>
                                <TableCell>{s.city || "—"}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 border-green-600 hover:bg-green-50"
                                      onClick={() => setServiceApprovalTarget({ service: s, isApproved: true })}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-600 hover:bg-red-50"
                                      onClick={() => {
                                        setServiceApprovalTarget({ service: s, isApproved: false });
                                        setServiceRejectionReason("");
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => openServiceDetail(s.id)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </TabsContent>
                  <TabsContent value="all" className="mt-0">
                    <CardContent className="p-0">
                      {servicesLoading ? (
                        <div className="p-12 text-center text-gray-500">Загрузка...</div>
                      ) : !allServicesData ? (
                        <div className="p-12 text-center text-gray-500">Нет данных</div>
                      ) : allServicesData.content.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">Услуг пока нет</div>
                      ) : (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Услуга</TableHead>
                                <TableHead>Партнёр</TableHead>
                                <TableHead>Категория</TableHead>
                                <TableHead>Рейтинг</TableHead>
                                <TableHead>Просмотры</TableHead>
                                <TableHead>Активна</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allServicesData.content.map((s) => (
                                <TableRow key={s.id}>
                                  <TableCell>
                                    <button
                                      type="button"
                                      className="font-medium text-[#222222] hover:text-[#00AFAE] text-left"
                                      onClick={() => openServiceDetail(s.id)}
                                    >
                                      {s.name}
                                    </button>
                                  </TableCell>
                                  <TableCell>{s.partnerName || "—"}</TableCell>
                                  <TableCell>{s.categoryName || "—"}</TableCell>
                                  <TableCell>
                                    <span className="inline-flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                                      {(s.rating ?? 0).toFixed(1)}
                                    </span>
                                  </TableCell>
                                  <TableCell>{s.viewsCount ?? 0}</TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={s.isActive !== false}
                                      onCheckedChange={(checked) => handleServiceActiveToggle(s, checked)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button size="sm" variant="outline" onClick={() => openServiceDetail(s.id)}>
                                      <Eye className="w-4 h-4 mr-1" />
                                      Подробнее
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {allServicesData.totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 border-t">
                              <span className="text-sm text-gray-600">Всего: {allServicesData.totalElements}</span>
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
                                  {servicesPage + 1} / {allServicesData.totalPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={servicesPage >= allServicesData.totalPages - 1}
                                  onClick={() => setServicesPage((p) => p + 1)}
                                >
                                  Вперёд
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </TabsContent>
                </Tabs>
              </Card>
            )}

            {/* Модерация отзывов */}
            {activeSection === "reviews-moderation" && (
              <div className="space-y-4">
                {adminReviewsError && (
                  <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{adminReviewsError}</div>
                )}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    {adminReviewsLoading ? (
                      <div className="p-12 text-center text-gray-500">Загрузка...</div>
                    ) : !adminReviewsData || adminReviewsData.empty ? (
                      <div className="p-12 text-center text-gray-500">Отзывов нет</div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Услуга</TableHead>
                              <TableHead>Автор</TableHead>
                              <TableHead>Оценка</TableHead>
                              <TableHead>Комментарий</TableHead>
                              <TableHead>Дата</TableHead>
                              <TableHead>Виден</TableHead>
                              <TableHead className="w-[220px]">Действия</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(adminReviewsData.content || []).map((r) => {
                              const visible = isReviewPubliclyVisible(r);
                              const busy = reviewActionId === r.id;
                              return (
                                <TableRow key={r.id}>
                                  <TableCell className="font-medium text-[#222222] max-w-[160px] truncate">
                                    {r.serviceName || "—"}
                                  </TableCell>
                                  <TableCell className="max-w-[120px] truncate">{r.userFullName || "—"}</TableCell>
                                  <TableCell>{Number(r.rating) || 0}</TableCell>
                                  <TableCell className="max-w-[200px] truncate text-gray-600">{r.comment || "—"}</TableCell>
                                  <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("ru-RU") : "—"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={visible ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                                      {visible ? "Да" : "Скрыт"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {visible ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={busy}
                                          onClick={() => void handleHideReview(r)}
                                        >
                                          Скрыть
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={busy}
                                          onClick={() => void handleShowReview(r)}
                                        >
                                          Показать
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        disabled={busy}
                                        onClick={() => setReviewDeleteTarget(r)}
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Удалить
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        {adminReviewsData.totalPages > 1 && (
                          <div className="flex items-center justify-between p-4 border-t">
                            <span className="text-sm text-gray-600">Всего: {adminReviewsData.totalElements}</span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={adminReviewsPage === 0}
                                onClick={() => setAdminReviewsPage((p) => Math.max(0, p - 1))}
                              >
                                Назад
                              </Button>
                              <span className="flex items-center px-2 text-sm">
                                {adminReviewsPage + 1} / {adminReviewsData.totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={adminReviewsPage >= adminReviewsData.totalPages - 1}
                                onClick={() => setAdminReviewsPage((p) => p + 1)}
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
            )}

            {activeSection === "attributes" && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <Input
                    placeholder="Поиск атрибутов по key или label"
                    value={attributesSearch}
                    onChange={(e) => {
                      setAttributesPage(0);
                      setAttributesSearch(e.target.value);
                    }}
                    className="md:max-w-md"
                  />
                  <Button onClick={() => setAttributeCreateOpen(true)} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
                    Создать атрибут
                  </Button>
                </div>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    {attributesLoading ? (
                      <div className="p-10 text-center text-gray-500">Загрузка...</div>
                    ) : (attributesData?.content?.length || 0) === 0 ? (
                      <div className="p-10 text-center text-gray-500">Атрибутов пока нет</div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Key</TableHead>
                              <TableHead>Тип</TableHead>
                              <TableHead>Стратегия</TableHead>
                              <TableHead>Label RU</TableHead>
                              <TableHead>Storage keys</TableHead>
                              <TableHead className="w-[120px]">Действия</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(attributesData?.content as Array<Record<string, unknown>>).map((attr) => (
                              <TableRow key={String(attr.attributeId || attr.id || "")}>
                                <TableCell className="font-mono text-xs">{String(attr.key || "—")}</TableCell>
                                <TableCell>{String(attr.type || "—")}</TableCell>
                                <TableCell>{String(attr.matchStrategy || "—")}</TableCell>
                                <TableCell>{String(attr.labelRu || "—")}</TableCell>
                                <TableCell className="font-mono text-xs">
                                  {JSON.stringify(attr.storageKeys || {})}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setAttributeEditTarget({
                                          id: String(attr.attributeId || attr.id || ""),
                                          key: String(attr.key || ""),
                                        });
                                        setAttributeEditForm({
                                          labelRu: String(attr.labelRu || ""),
                                          labelKk: String(attr.labelKk || ""),
                                          unit: String(attr.unit || ""),
                                        });
                                      }}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() =>
                                        setAttributeDeleteTarget({
                                          id: String(attr.attributeId || attr.id || ""),
                                          key: String(attr.key || ""),
                                        })
                                      }
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {(attributesData?.totalPages || 0) > 1 && (
                          <div className="flex items-center justify-between p-4 border-t">
                            <span className="text-sm text-gray-600">Всего: {attributesData?.totalElements || 0}</span>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" disabled={attributesPage === 0} onClick={() => setAttributesPage((p) => Math.max(0, p - 1))}>
                                Назад
                              </Button>
                              <span className="flex items-center px-2 text-sm">
                                {attributesPage + 1} / {attributesData?.totalPages || 1}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={attributesPage >= (attributesData?.totalPages || 1) - 1}
                                onClick={() => setAttributesPage((p) => p + 1)}
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

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[#222222]">Привязки атрибутов к категориям</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Категория</Label>
                        <Select value={selectedCategoryForBindings} onValueChange={setSelectedCategoryForBindings}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.nameRu || cat.slug}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Атрибут</Label>
                        <Select value={bindingForm.attributeId} onValueChange={(v) => setBindingForm((prev) => ({ ...prev, attributeId: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите атрибут" />
                          </SelectTrigger>
                          <SelectContent>
                            {(attributesData?.content as Array<Record<string, unknown>> || []).map((attr) => (
                              <SelectItem key={String(attr.attributeId || attr.id || "")} value={String(attr.attributeId || attr.id || "")}>
                                {String(attr.key || "")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Порядок</Label>
                        <Input
                          type="number"
                          min={1}
                          value={bindingForm.sortOrder}
                          onChange={(e) => setBindingForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 1 }))}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={bindingForm.isRequired}
                          onChange={(e) => setBindingForm((prev) => ({ ...prev, isRequired: e.target.checked }))}
                        />
                        Обязательный
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={bindingForm.isFilterable}
                          onChange={(e) => setBindingForm((prev) => ({ ...prev, isFilterable: e.target.checked }))}
                        />
                        Фильтруемый
                      </label>
                      <Button onClick={() => void handleBindAttribute()} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
                        Привязать
                      </Button>
                    </div>

                    {bindingsLoading ? (
                      <p className="text-sm text-gray-500">Загрузка привязок...</p>
                    ) : categoryBindings.length === 0 ? (
                      <p className="text-sm text-gray-500">Для выбранной категории привязок пока нет.</p>
                    ) : (
                      <div className="space-y-2">
                        {categoryBindings.map((row) => (
                          <div key={row.attributeId} className="border border-gray-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="font-medium text-[#222222]">{row.attribute?.key || row.attributeId}</p>
                              <p className="text-xs text-gray-600">
                                required: {row.isRequired ? "true" : "false"} · filterable: {row.isFilterable ? "true" : "false"} · order: {row.sortOrder}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={row.isRequired}
                                  onChange={(e) =>
                                    setCategoryBindings((prev) =>
                                      prev.map((item) =>
                                        item.attributeId === row.attributeId ? { ...item, isRequired: e.target.checked } : item
                                      )
                                    )
                                  }
                                />
                                req
                              </label>
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={row.isFilterable}
                                  onChange={(e) =>
                                    setCategoryBindings((prev) =>
                                      prev.map((item) =>
                                        item.attributeId === row.attributeId ? { ...item, isFilterable: e.target.checked } : item
                                      )
                                    )
                                  }
                                />
                                filter
                              </label>
                              <Input
                                className="w-20 h-8"
                                type="number"
                                min={1}
                                value={row.sortOrder}
                                onChange={(e) =>
                                  setCategoryBindings((prev) =>
                                    prev.map((item) =>
                                      item.attributeId === row.attributeId
                                        ? { ...item, sortOrder: Number(e.target.value) || 1 }
                                        : item
                                    )
                                  )
                                }
                              />
                              <Button size="sm" variant="outline" onClick={() => void handleUpdateBinding(row)}>
                                Сохранить
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => void handleUnbindAttribute(row.attributeId)}
                              >
                                Убрать
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Категории */}
            {activeSection === "categories" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setCategoryCreateOpen(true)} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
                    Создать категорию
                  </Button>
                </div>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    {categoriesLoading ? (
                      <div className="p-12 text-center text-gray-500">Загрузка...</div>
                    ) : categories.length === 0 ? (
                      <div className="p-12 text-center text-gray-500">Категорий пока нет</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Название (RU)</TableHead>
                            <TableHead>Название (KZ)</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Описание</TableHead>
                            <TableHead className="w-[120px]">Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categories.map((cat) => (
                            <TableRow key={cat.id}>
                              <TableCell className="font-medium text-[#222222]">{cat.nameRu}</TableCell>
                              <TableCell>{cat.nameKz || "—"}</TableCell>
                              <TableCell className="font-mono text-sm">{cat.slug}</TableCell>
                              <TableCell className="max-w-[200px] truncate text-gray-600">{cat.description || "—"}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => openEditCategory(cat)}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => setCategoryDeleteTarget(cat)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Тарифные планы (подписки партнёров) */}
            {activeSection === "subscription-plans" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setPlanCreateOpen(true)} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
                    Создать тариф
                  </Button>
                </div>
                {subscriptionPlansError && (
                  <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
                    {subscriptionPlansError}
                  </div>
                )}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    {subscriptionPlansLoading ? (
                      <div className="p-12 text-center text-gray-500">Загрузка...</div>
                    ) : subscriptionPlans.length === 0 ? (
                      <div className="p-12 text-center text-gray-500">Тарифов пока нет</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Название</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Цена</TableHead>
                            <TableHead>Дней</TableHead>
                            <TableHead>Бесплатно</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Порядок</TableHead>
                            <TableHead className="w-[240px]">Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscriptionPlans.map((p) => {
                            const active = isSubscriptionPlanActive(p.status);
                            const busy = planActionId === p.id;
                            return (
                              <TableRow key={p.id}>
                                <TableCell className="font-medium text-[#222222]">{p.name}</TableCell>
                                <TableCell className="font-mono text-sm">{p.slug}</TableCell>
                                <TableCell>{p.isFree ? "—" : p.price}</TableCell>
                                <TableCell>{p.durationDays}</TableCell>
                                <TableCell>{p.isFree ? "Да" : "Нет"}</TableCell>
                                <TableCell>
                                  <Badge className={active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                                    {p.status || "—"}
                                  </Badge>
                                </TableCell>
                                <TableCell>{p.displayOrder}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    <Button size="sm" variant="outline" onClick={() => openEditSubscriptionPlan(p)}>
                                      <Pencil className="w-4 h-4 mr-1" />
                                      Изменить
                                    </Button>
                                    {active ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-amber-700 border-amber-200"
                                        disabled={busy}
                                        onClick={() => setPlanDeactivateTarget(p)}
                                      >
                                        Деактивировать
                                      </Button>
                                    ) : (
                                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void handleActivatePlan(p)}>
                                        Активировать
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "stories" && <AdminStoriesSection />}

            {/* Тест уведомлений (admin) */}
            {activeSection === "notifications-test" && (
              <div className="space-y-4 max-w-xl">
                <p className="text-sm text-gray-600">
                  Отправка тестового сообщения текущему администратору через выбранные каналы (push, email, sms). Укажите
                  email получателя — как в Swagger.
                </p>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="test-notif-title">Заголовок</Label>
                      <Input
                        id="test-notif-title"
                        value={testNotifTitle}
                        onChange={(e) => setTestNotifTitle(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="test-notif-message">Текст</Label>
                      <Textarea
                        id="test-notif-message"
                        value={testNotifMessage}
                        onChange={(e) => setTestNotifMessage(e.target.value)}
                        rows={3}
                        className="rounded-xl resize-y min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="test-notif-email">Email получателя</Label>
                      <Input
                        id="test-notif-email"
                        type="email"
                        autoComplete="email"
                        placeholder="user@example.com"
                        value={testNotifRecipientEmail}
                        onChange={(e) => setTestNotifRecipientEmail(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase">Каналы</p>
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="test-notif-push" className="cursor-pointer">
                          Push
                        </Label>
                        <Switch
                          id="test-notif-push"
                          checked={testNotifPush}
                          onCheckedChange={setTestNotifPush}
                          className="data-[state=checked]:bg-[#00AFAE]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="test-notif-email-ch" className="cursor-pointer">
                          Email
                        </Label>
                        <Switch
                          id="test-notif-email-ch"
                          checked={testNotifEmailChannel}
                          onCheckedChange={setTestNotifEmailChannel}
                          className="data-[state=checked]:bg-[#00AFAE]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="test-notif-sms" className="cursor-pointer">
                          SMS
                        </Label>
                        <Switch
                          id="test-notif-sms"
                          checked={testNotifSms}
                          onCheckedChange={setTestNotifSms}
                          className="data-[state=checked]:bg-[#00AFAE]"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full rounded-full bg-[#00AFAE] hover:bg-[#00AFAE]/90"
                      disabled={testNotifSubmitting}
                      onClick={() => void handleSendTestNotification()}
                    >
                      {testNotifSubmitting ? "Отправка…" : "Отправить тест"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Пользователи + История входов */}
            {activeSection === "users" && (
              <div className="space-y-6">
                {/* Статистика пользователей */}
                {usersStatisticsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {[...Array(8)].map((_, i) => (
                      <Card key={i} className="border-0 shadow-sm p-4 animate-pulse bg-gray-100" />
                    ))}
                  </div>
                ) : usersStatistics ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    <Card className="border-0 shadow-sm p-4">
                      <p className="text-xs text-gray-500 uppercase">Всего</p>
                      <p className="text-xl font-semibold text-[#222222]">{usersStatistics.totalUsers}</p>
                    </Card>
                    <Card className="border-0 shadow-sm p-4">
                      <p className="text-xs text-gray-500 uppercase">USER</p>
                      <p className="text-xl font-semibold text-[#222222]">{usersStatistics.userRoleCount}</p>
                    </Card>
                    <Card className="border-0 shadow-sm p-4">
                      <p className="text-xs text-gray-500 uppercase">PARTNER</p>
                      <p className="text-xl font-semibold text-[#222222]">{usersStatistics.partnerRoleCount}</p>
                    </Card>
                    <Card className="border-0 shadow-sm p-4">
                      <p className="text-xs text-gray-500 uppercase">ADMIN</p>
                      <p className="text-xl font-semibold text-[#222222]">{usersStatistics.adminRoleCount}</p>
                    </Card>
                    <Card className="border-0 shadow-sm p-4">
                      <p className="text-xs text-gray-500 uppercase">Email вериф.</p>
                      <p className="text-xl font-semibold text-[#222222]">{usersStatistics.verifiedEmailCount}</p>
                    </Card>
                    <Card className="border-0 shadow-sm p-4">
                      <p className="text-xs text-gray-500 uppercase">Не вериф.</p>
                      <p className="text-xl font-semibold text-[#222222]">{usersStatistics.unverifiedEmailCount}</p>
                    </Card>
                    <Card className="border-0 shadow-sm p-4">
                      <p className="text-xs text-gray-500 uppercase">Активные</p>
                      <p className="text-xl font-semibold text-green-600">{usersStatistics.activeUsersCount}</p>
                    </Card>
                    <Card className="border-0 shadow-sm p-4">
                      <p className="text-xs text-gray-500 uppercase">Неактивные</p>
                      <p className="text-xl font-semibold text-gray-600">{usersStatistics.inactiveUsersCount}</p>
                    </Card>
                  </div>
                ) : null}

                <Card className="border-0 shadow-sm">
                  <Tabs value={usersTab} onValueChange={(v) => { setUsersTab(v as "list" | "login-history"); if (v === "login-history") loadLoginHistoryUsers(); }} className="w-full">
                    <TabsList className="bg-white p-1 rounded-xl mb-4">
                      <TabsTrigger value="list" className="rounded-lg">
                        Пользователи
                      </TabsTrigger>
                      <TabsTrigger value="login-history" className="rounded-lg">
                        История входов
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="list" className="mt-0">
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Поиск по email, имени..."
                            value={usersSearch}
                            onChange={(e) => setUsersSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Select value={usersRole || "all"} onValueChange={(v) => setUsersRole(v === "all" ? "" : v)}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Роль" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Все роли</SelectItem>
                            <SelectItem value="USER">USER</SelectItem>
                            <SelectItem value="PARTNER">PARTNER</SelectItem>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={usersEmailVerified === undefined ? "all" : usersEmailVerified ? "yes" : "no"}
                          onValueChange={(v) => setUsersEmailVerified(v === "all" ? undefined : v === "yes")}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Верификация" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Любая</SelectItem>
                            <SelectItem value="yes">Подтверждён</SelectItem>
                            <SelectItem value="no">Не подтверждён</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={() => setCreateUserOpen(true)} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
                          Создать пользователя
                        </Button>
                      </div>
                      {usersError && <p className="text-red-600 text-sm mb-4">{usersError}</p>}
                      {usersLoading ? (
                        <p className="text-gray-500 py-8">Загрузка...</p>
                      ) : usersData ? (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Email / Имя</TableHead>
                                <TableHead>Роль</TableHead>
                                <TableHead>Город</TableHead>
                                <TableHead>Верификация</TableHead>
                                <TableHead>Активен</TableHead>
                                <TableHead>Создан</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {usersData.content.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                    Пользователей не найдено
                                  </TableCell>
                                </TableRow>
                              ) : (
                                usersData.content.map((u) => (
                                  <TableRow key={u.id}>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium text-[#222222]">{u.email}</p>
                                        <p className="text-sm text-gray-500">{u.firstName} {u.lastName}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                                    <TableCell>{u.city || "—"}</TableCell>
                                    <TableCell>
                                      <Switch
                                        checked={u.emailVerified}
                                        onCheckedChange={(checked) => handleSetEmailVerification(u, checked)}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Switch
                                        checked={u.isActive}
                                        onCheckedChange={(checked) => handleSetActiveStatus(u, checked)}
                                      />
                                    </TableCell>
                                    <TableCell className="text-gray-500 text-sm">{formatDate(u.createdAt)}</TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">Действия</Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => openUserDetail(u.id)}>
                                            <Eye className="w-4 h-4 mr-2" /> Просмотр
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => openEditUser(u)}>Редактировать</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => { setRoleUserTarget(u); setRoleUserNewRole((u.role as "USER" | "PARTNER" | "ADMIN") || "USER"); }}>
                                            Изменить роль
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setResetPasswordTarget(u)}>
                                            Сбросить пароль
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => setDeleteUserTarget(u)}
                                          >
                                            Удалить
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                          {usersData.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                              <p className="text-sm text-gray-500">
                                Всего: {usersData.totalElements}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={usersData.first}
                                  onClick={() => setUsersPage((p) => Math.max(0, p - 1))}
                                >
                                  Назад
                                </Button>
                                <span className="text-sm text-gray-600 self-center">
                                  {usersData.number + 1} / {usersData.totalPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={usersData.last}
                                  onClick={() => setUsersPage((p) => p + 1)}
                                >
                                  Далее
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : null}
                    </CardContent>
                  </TabsContent>
                  <TabsContent value="login-history" className="mt-0">
                    <CardContent>
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <LogIn className="w-5 h-5" />
                        <span>История входов пользователя</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="flex-1 min-w-[200px]">
                          <Label className="text-sm text-gray-600">Пользователь</Label>
                          <Select
                            value={loginHistoryUserId || "_"}
                            onValueChange={(v) => {
                              setLoginHistoryUserId(v === "_" ? "" : v);
                              setLoginHistoryPage(0);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите пользователя" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_">— Выберите пользователя —</SelectItem>
                              {loginHistoryUsers.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.email} ({u.firstName} {u.lastName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {loginHistoryUserId && (
                        <>
                          {loginHistoryStats && (
                            <div className="mb-4 p-4 bg-[#00AFAE]/5 rounded-xl">
                              <p className="text-sm text-gray-600">Успешных входов: <strong className="text-[#222222]">{loginHistoryStats.totalSuccessfulLogins}</strong></p>
                            </div>
                          )}
                          {loginHistoryLoading ? (
                            <p className="text-gray-500 py-8">Загрузка истории...</p>
                          ) : loginHistoryData ? (
                            <>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Дата</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>IP</TableHead>
                                    <TableHead>Тип</TableHead>
                                    <TableHead>Успех</TableHead>
                                    <TableHead>Причина ошибки</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {loginHistoryData.content.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                        Записей нет
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    loginHistoryData.content.map((item: LoginHistoryItem) => (
                                      <TableRow key={item.id}>
                                        <TableCell className="text-sm text-gray-600">{formatDate(item.createdAt)}</TableCell>
                                        <TableCell>{item.email}</TableCell>
                                        <TableCell className="font-mono text-xs">{item.ipAddress || "—"}</TableCell>
                                        <TableCell>{item.loginType || "—"}</TableCell>
                                        <TableCell>
                                          {item.success ? (
                                            <Badge className="bg-green-100 text-green-800">Да</Badge>
                                          ) : (
                                            <Badge className="bg-red-100 text-red-800">Нет</Badge>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 max-w-[200px] truncate" title={item.failureReason}>{item.failureReason || "—"}</TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                              {loginHistoryData.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                  <p className="text-sm text-gray-500">
                                    Всего записей: {loginHistoryData.totalElements}
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={loginHistoryPage === 0}
                                      onClick={() => setLoginHistoryPage((p) => Math.max(0, p - 1))}
                                    >
                                      Назад
                                    </Button>
                                    <span className="text-sm text-gray-600 self-center">
                                      {loginHistoryPage + 1} / {loginHistoryData.totalPages}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={loginHistoryPage >= loginHistoryData.totalPages - 1}
                                      onClick={() => setLoginHistoryPage((p) => p + 1)}
                                    >
                                      Вперёд
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : null}
                        </>
                      )}
                      {!loginHistoryUserId && (
                        <p className="text-gray-500 py-6">Выберите пользователя, чтобы увидеть историю входов.</p>
                      )}
                    </CardContent>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
            )}
          </div>
        </main>
      </div>

      {/* Модалка одобрить/отклонить */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approveValue ? "Одобрить заявку?" : "Отклонить заявку?"}
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>{selectedApplication.userFullName}</strong> — {selectedApplication.userEmail}
              </p>
              {!approveValue && (
                <div className="space-y-2">
                  <Label>Причина отклонения (необязательно)</Label>
                  <Textarea
                    placeholder="Укажите причину отклонения"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleApproveReject}
              disabled={approveSubmitting}
              className={approveValue ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {approveSubmitting ? "Сохранение..." : approveValue ? "Одобрить" : "Отклонить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модалка одобрение/отклонение услуги */}
      <Dialog
        open={!!serviceApprovalTarget}
        onOpenChange={(open) => !open && setServiceApprovalTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {serviceApprovalTarget?.isApproved ? "Одобрить услугу?" : "Отклонить услугу?"}
            </DialogTitle>
          </DialogHeader>
          {serviceApprovalTarget && (
            <>
              <p className="text-sm text-gray-600">
                <strong>{serviceApprovalTarget.service.name}</strong>
                {serviceApprovalTarget.service.partnerName && (
                  <> — {serviceApprovalTarget.service.partnerName}</>
                )}
              </p>
              {!serviceApprovalTarget.isApproved && (
                <div className="space-y-2">
                  <Label>Причина отклонения (необязательно)</Label>
                  <Textarea
                    placeholder="Укажите причину"
                    value={serviceRejectionReason}
                    onChange={(e) => setServiceRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceApprovalTarget(null)}>
              Отмена
            </Button>
            <Button
              onClick={handleServiceApproval}
              disabled={serviceApprovalSubmitting}
              className={
                serviceApprovalTarget?.isApproved
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {serviceApprovalSubmitting
                ? "Сохранение..."
                : serviceApprovalTarget?.isApproved
                  ? "Одобрить"
                  : "Отклонить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Страница конкретной услуги (красивый вывод) */}
      <Dialog open={serviceDetailOpen} onOpenChange={setServiceDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {serviceDetailLoading ? (
            <div className="p-12 text-center text-gray-500">Загрузка...</div>
          ) : serviceDetail ? (
            <div className="rounded-xl overflow-hidden">
              {/* Обложка */}
              <div className="relative h-48 bg-gray-100">
                <ImageWithFallback
                  src={getImageUrl(serviceDetail.thumbnail || serviceDetail.images?.[0] || "")}
                  alt={serviceDetail.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-xl font-bold text-white drop-shadow">{serviceDetail.name}</h2>
                  {serviceDetail.categoryName && (
                    <Badge className="mt-2 bg-white/90 text-[#222222]">{serviceDetail.categoryName}</Badge>
                  )}
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Партнёр</span>
                    <p className="font-medium text-[#222222]">{serviceDetail.partnerName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Город</span>
                    <p>{serviceDetail.city || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Адрес</span>
                    <p>{serviceDetail.address || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Цена</span>
                    <p>
                      {serviceDetail.priceFrom != null && serviceDetail.priceTo != null
                        ? `${serviceDetail.priceFrom} – ${serviceDetail.priceTo} ₸`
                        : serviceDetail.priceFrom != null
                          ? `от ${serviceDetail.priceFrom} ₸`
                          : "—"}
                      {serviceDetail.priceType && getPriceTypeLabel(serviceDetail.priceType) && ` (${getPriceTypeLabel(serviceDetail.priceType)})`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Рейтинг / Просмотры</span>
                    <p className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                      {(serviceDetail.rating ?? 0).toFixed(1)} · {serviceDetail.viewsCount ?? 0} просмотров
                    </p>
                  </div>
                </div>
                {serviceDetail.shortDescription && (
                  <div>
                    <span className="text-gray-500 text-sm">Краткое описание</span>
                    <p className="mt-1 text-[#222222]">{serviceDetail.shortDescription}</p>
                  </div>
                )}
                {serviceDetail.fullDescription && (
                  <div>
                    <span className="text-gray-500 text-sm">Описание</span>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap">{serviceDetail.fullDescription}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Switch
                    checked={serviceDetail.isActive !== false}
                    onCheckedChange={(checked) => handleServiceActiveToggle(serviceDetail, checked)}
                  />
                  <span className="text-sm text-gray-600 self-center">Активна</span>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      setServiceDetailOpen(false);
                      setServiceApprovalTarget({ service: serviceDetail, isApproved: true });
                    }}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Одобрить
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => {
                      setServiceDetailOpen(false);
                      setServiceApprovalTarget({ service: serviceDetail, isApproved: false });
                      setServiceRejectionReason("");
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Отклонить
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">Не удалось загрузить услугу</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Модалка профиль партнёра */}
      <Dialog open={partnerDetailOpen} onOpenChange={setPartnerDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Профиль партнёра</DialogTitle>
          </DialogHeader>
          {partnerDetailLoading ? (
            <div className="py-8 text-center text-gray-500">Загрузка...</div>
          ) : selectedPartner ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Компания</span>
                  <p className="font-medium text-[#222222]">{selectedPartner.companyName}</p>
                </div>
                <div>
                  <span className="text-gray-500">БИН</span>
                  <p>{selectedPartner.bin}</p>
                </div>
                <div>
                  <span className="text-gray-500">Город / Регион</span>
                  <p>{[selectedPartner.city, selectedPartner.region].filter(Boolean).join(", ")}</p>
                </div>
                <div>
                  <span className="text-gray-500">Статус</span>
                  <p>
                    <Badge className={STATUS_COLORS[selectedPartner.status] || "bg-gray-100"}>
                      {STATUS_LABELS[selectedPartner.status] || selectedPartner.status}
                    </Badge>
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Адрес</span>
                  <p>{selectedPartner.address || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Телефон</span>
                  <p>{selectedPartner.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email</span>
                  <p>{selectedPartner.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">WhatsApp</span>
                  <p>{selectedPartner.whatsapp || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Владелец</span>
                  <p>{selectedPartner.ownerFullName || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Рейтинг / Отзывов</span>
                  <p>
                    {selectedPartner.averageRating?.toFixed(1) ?? "—"} /{" "}
                    {selectedPartner.totalReviews ?? 0}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Услуг (активных)</span>
                  <p>
                    {selectedPartner.activeServices ?? 0} / {selectedPartner.totalServices ?? 0}
                  </p>
                </div>
              </div>
              {selectedPartner.description && (
                <div>
                  <span className="text-gray-500">О компании</span>
                  <p className="mt-1">{selectedPartner.description}</p>
                </div>
              )}
              {(selectedPartner.website || selectedPartner.instagram || selectedPartner.telegram) && (
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.website && (
                    <a
                      href={selectedPartner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00AFAE] hover:underline"
                    >
                      Сайт
                    </a>
                  )}
                  {selectedPartner.instagram && <span>Instagram: {selectedPartner.instagram}</span>}
                  {selectedPartner.telegram && <span>Telegram: {selectedPartner.telegram}</span>}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Не удалось загрузить данные</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Модалка создания пользователя */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Создать пользователя</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Пароль *</Label>
              <Input
                type="password"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Пароль"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Имя *</Label>
                <Input
                  value={createUserForm.firstName}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Фамилия *</Label>
                <Input
                  value={createUserForm.lastName}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Телефон</Label>
              <Input
                value={createUserForm.phone}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, phone: formatKzPhoneInput(e.target.value) }))}
                placeholder="+7 (777) 123-45-67"
              />
            </div>
            <div className="grid gap-2">
              <Label>Город</Label>
              <Select
                value={createUserForm.city || ""}
                onValueChange={(v) => setCreateUserForm((f) => ({ ...f, city: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent>
                  {KZ_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Роль</Label>
              <Select
                value={createUserForm.role}
                onValueChange={(v) => setCreateUserForm((f) => ({ ...f, role: v as "USER" | "PARTNER" | "ADMIN" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="PARTNER">PARTNER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={createUserForm.emailVerified ?? false}
                onCheckedChange={(c) => setCreateUserForm((f) => ({ ...f, emailVerified: c }))}
              />
              <Label>Email подтверждён</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserOpen(false)}>Отмена</Button>
            <Button onClick={handleCreateUser} disabled={createUserSubmitting} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
              {createUserSubmitting ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модалка редактирования пользователя */}
      <Dialog open={!!editUserTarget} onOpenChange={(open) => !open && setEditUserTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
          </DialogHeader>
          {editUserTarget && (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Имя</Label>
                    <Input
                      value={editUserForm.firstName}
                      onChange={(e) => setEditUserForm((f) => ({ ...f, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Фамилия</Label>
                    <Input
                      value={editUserForm.lastName}
                      onChange={(e) => setEditUserForm((f) => ({ ...f, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Телефон</Label>
                  <Input
                    value={editUserForm.phone}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, phone: formatKzPhoneInput(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Город</Label>
                  <Select
                    value={editUserForm.city || ""}
                    onValueChange={(v) => setEditUserForm((f) => ({ ...f, city: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите город" />
                    </SelectTrigger>
                    <SelectContent>
                      {KZ_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUserTarget(null)}>Отмена</Button>
                <Button onClick={saveEditUser} disabled={editUserSubmitting} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
                  {editUserSubmitting ? "Сохранение..." : "Сохранить"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Модалка просмотра пользователя */}
      <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Пользователь</DialogTitle>
          </DialogHeader>
          {userDetailLoading ? (
            <div className="py-8 text-center text-gray-500">Загрузка...</div>
          ) : selectedUser ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500">Email</span><p className="font-medium">{selectedUser.email}</p></div>
                <div><span className="text-gray-500">Имя</span><p>{selectedUser.firstName} {selectedUser.lastName}</p></div>
                <div><span className="text-gray-500">Телефон</span><p>{formatKzPhoneInput(selectedUser.phone || "") || "—"}</p></div>
                <div><span className="text-gray-500">Город</span><p>{selectedUser.city || "—"}</p></div>
                <div><span className="text-gray-500">Роль</span><p><Badge variant="outline">{selectedUser.role}</Badge></p></div>
                <div><span className="text-gray-500">Email подтверждён</span><p>{selectedUser.emailVerified ? "Да" : "Нет"}</p></div>
                <div><span className="text-gray-500">Активен</span><p>{selectedUser.isActive ? "Да" : "Нет"}</p></div>
                <div><span className="text-gray-500">Последний вход</span><p>{selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : "—"}</p></div>
                <div><span className="text-gray-500">Создан</span><p>{formatDate(selectedUser.createdAt)}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button size="sm" variant="outline" onClick={() => { setUserDetailOpen(false); openEditUser(selectedUser); }}>Редактировать</Button>
                <Button size="sm" variant="outline" onClick={() => { setRoleUserTarget(selectedUser); setRoleUserNewRole((selectedUser.role as "USER" | "PARTNER" | "ADMIN") || "USER"); }}>Изменить роль</Button>
                <Button size="sm" variant="outline" onClick={() => setResetPasswordTarget(selectedUser)}>Сбросить пароль</Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setUserDetailOpen(false); setDeleteUserTarget(selectedUser); }}>Удалить</Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Не удалось загрузить данные</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Модалка смена роли */}
      <Dialog open={!!roleUserTarget} onOpenChange={(open) => !open && setRoleUserTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить роль</DialogTitle>
          </DialogHeader>
          {roleUserTarget && (
            <>
              <p className="text-sm text-gray-600">
                Пользователь: {roleUserTarget.email} ({roleUserTarget.firstName} {roleUserTarget.lastName})
              </p>
              <div className="grid gap-2 py-2">
                <Label>Новая роль</Label>
                <Select value={roleUserNewRole} onValueChange={(v) => setRoleUserNewRole(v as "USER" | "PARTNER" | "ADMIN")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="PARTNER">PARTNER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRoleUserTarget(null)}>Отмена</Button>
                <Button onClick={handleSetRole} disabled={roleUserSubmitting} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
                  {roleUserSubmitting ? "Сохранение..." : "Сохранить"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Модалка сброс пароля */}
      <Dialog open={!!resetPasswordTarget} onOpenChange={(open) => !open && (setResetPasswordTarget(null), setResetPasswordValue(""))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сбросить пароль</DialogTitle>
          </DialogHeader>
          {resetPasswordTarget && (
            <>
              <p className="text-sm text-gray-600 mb-2">
                Пользователь: {resetPasswordTarget.email}
              </p>
              <div className="grid gap-2">
                <Label>Новый пароль</Label>
                <Input
                  type="password"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Введите новый пароль"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setResetPasswordTarget(null); setResetPasswordValue(""); }}>Отмена</Button>
                <Button onClick={handleResetPassword} disabled={resetPasswordSubmitting || !resetPasswordValue.trim()} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
                  {resetPasswordSubmitting ? "Сохранение..." : "Сбросить"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Подтверждение удаления пользователя */}
      <AlertDialog open={!!deleteUserTarget} onOpenChange={(open) => !open && setDeleteUserTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteUserTarget && (
                <>Полное удаление пользователя <strong>{deleteUserTarget.email}</strong> из системы (hard delete). Это действие нельзя отменить.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={deleteUserSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserSubmitting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={attributeCreateOpen} onOpenChange={setAttributeCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Создать атрибут</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Key *</Label>
              <Input
                value={attributeCreateForm.key}
                onChange={(e) => setAttributeCreateForm((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="capacity"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select
                  value={attributeCreateForm.type}
                  onValueChange={(value) =>
                    setAttributeCreateForm((prev) => ({
                      ...prev,
                      type: value as CreateAdminAttributeRequest["type"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTEGER">INTEGER</SelectItem>
                    <SelectItem value="STRING">STRING</SelectItem>
                    <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                    <SelectItem value="STRING_ARRAY">STRING_ARRAY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Match strategy *</Label>
                <Select
                  value={attributeCreateForm.matchStrategy}
                  onValueChange={(value) =>
                    setAttributeCreateForm((prev) => ({
                      ...prev,
                      matchStrategy: value as CreateAdminAttributeRequest["matchStrategy"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE_EQ">SINGLE_EQ</SelectItem>
                    <SelectItem value="SINGLE_GTE">SINGLE_GTE</SelectItem>
                    <SelectItem value="SINGLE_LTE">SINGLE_LTE</SelectItem>
                    <SelectItem value="RANGE_CONTAINS">RANGE_CONTAINS</SelectItem>
                    <SelectItem value="BOOLEAN_MATCH">BOOLEAN_MATCH</SelectItem>
                    <SelectItem value="ARRAY_CONTAINS">ARRAY_CONTAINS</SelectItem>
                    <SelectItem value="ARRAY_INTERSECTS">ARRAY_INTERSECTS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {attributeCreateForm.matchStrategy === "RANGE_CONTAINS" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>storageKeys.min *</Label>
                  <Input
                    value={attributeCreateForm.storageKeys.min || ""}
                    onChange={(e) =>
                      setAttributeCreateForm((prev) => ({
                        ...prev,
                        storageKeys: { ...prev.storageKeys, min: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>storageKeys.max *</Label>
                  <Input
                    value={attributeCreateForm.storageKeys.max || ""}
                    onChange={(e) =>
                      setAttributeCreateForm((prev) => ({
                        ...prev,
                        storageKeys: { ...prev.storageKeys, max: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>storageKeys.value *</Label>
                <Input
                  value={attributeCreateForm.storageKeys.value || ""}
                  onChange={(e) =>
                    setAttributeCreateForm((prev) => ({
                      ...prev,
                      storageKeys: { ...prev.storageKeys, value: e.target.value },
                    }))
                  }
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Label RU *</Label>
              <Input
                value={attributeCreateForm.labelRu}
                onChange={(e) => setAttributeCreateForm((prev) => ({ ...prev, labelRu: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Label KZ</Label>
              <Input
                value={attributeCreateForm.labelKk || ""}
                onChange={(e) => setAttributeCreateForm((prev) => ({ ...prev, labelKk: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Unit</Label>
              <Input
                value={attributeCreateForm.unit || ""}
                onChange={(e) => setAttributeCreateForm((prev) => ({ ...prev, unit: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttributeCreateOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => void handleCreateAttribute()} disabled={attributeCreateSubmitting} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
              {attributeCreateSubmitting ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!attributeDeleteTarget} onOpenChange={(open) => !open && setAttributeDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить атрибут?</AlertDialogTitle>
            <AlertDialogDescription>
              {attributeDeleteTarget ? `Атрибут "${attributeDeleteTarget.key}" будет удалён, если он не используется.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteAttribute();
              }}
              disabled={attributeDeleteSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {attributeDeleteSubmitting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!attributeEditTarget} onOpenChange={(open) => !open && setAttributeEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать атрибут</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Label RU *</Label>
              <Input
                value={attributeEditForm.labelRu}
                onChange={(e) => setAttributeEditForm((prev) => ({ ...prev, labelRu: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Label KZ</Label>
              <Input
                value={attributeEditForm.labelKk}
                onChange={(e) => setAttributeEditForm((prev) => ({ ...prev, labelKk: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Unit</Label>
              <Input
                value={attributeEditForm.unit}
                onChange={(e) => setAttributeEditForm((prev) => ({ ...prev, unit: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttributeEditTarget(null)}>
              Отмена
            </Button>
            <Button
              onClick={() => void handleUpdateAttribute()}
              disabled={attributeEditSubmitting}
              className="bg-[#00AFAE] hover:bg-[#00AFAE]/90"
            >
              {attributeEditSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Создание категории */}
      <Dialog open={categoryCreateOpen} onOpenChange={setCategoryCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Создать категорию</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Название (RU) *</Label>
              <Input
                value={categoryCreateForm.nameRu}
                onChange={(e) => setCategoryCreateForm((f) => ({ ...f, nameRu: e.target.value }))}
                placeholder="Название на русском"
              />
            </div>
            <div className="grid gap-2">
              <Label>Название (KZ)</Label>
              <Input
                value={categoryCreateForm.nameKz}
                onChange={(e) => setCategoryCreateForm((f) => ({ ...f, nameKz: e.target.value }))}
                placeholder="Название на казахском"
              />
            </div>
            <div className="grid gap-2">
              <Label>Slug *</Label>
              <Input
                value={categoryCreateForm.slug}
                onChange={(e) => setCategoryCreateForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="url-slug"
              />
            </div>
            <div className="grid gap-2">
              <Label>Описание</Label>
              <Input
                value={categoryCreateForm.description || ""}
                onChange={(e) => setCategoryCreateForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Описание"
              />
            </div>
            <div className="grid gap-2">
              <Label>Иконка (URL)</Label>
              <Input
                value={categoryCreateForm.icon || ""}
                onChange={(e) => setCategoryCreateForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryCreateOpen(false)}>Отмена</Button>
            <Button onClick={handleCreateCategory} disabled={categoryCreateSubmitting} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
              {categoryCreateSubmitting ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Редактирование категории */}
      <Dialog open={!!categoryEditTarget} onOpenChange={(open) => !open && setCategoryEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
          </DialogHeader>
          {categoryEditTarget && (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Название (RU) *</Label>
                  <Input
                    value={categoryEditForm.nameRu}
                    onChange={(e) => setCategoryEditForm((f) => ({ ...f, nameRu: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Название (KZ)</Label>
                  <Input
                    value={categoryEditForm.nameKz}
                    onChange={(e) => setCategoryEditForm((f) => ({ ...f, nameKz: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Slug *</Label>
                  <Input
                    value={categoryEditForm.slug}
                    onChange={(e) => setCategoryEditForm((f) => ({ ...f, slug: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Описание</Label>
                  <Input
                    value={categoryEditForm.description || ""}
                    onChange={(e) => setCategoryEditForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Иконка (URL)</Label>
                  <Input
                    value={categoryEditForm.icon || ""}
                    onChange={(e) => setCategoryEditForm((f) => ({ ...f, icon: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={categoryEditForm.isActive !== false}
                    onCheckedChange={(c) => setCategoryEditForm((f) => ({ ...f, isActive: c }))}
                  />
                  <Label>Активна</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCategoryEditTarget(null)}>Отмена</Button>
                <Button onClick={saveEditCategory} disabled={categoryEditSubmitting} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
                  {categoryEditSubmitting ? "Сохранение..." : "Сохранить"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Создание тарифного плана */}
      <Dialog open={planCreateOpen} onOpenChange={setPlanCreateOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать тариф</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Название *</Label>
              <Input
                value={planCreateForm.name}
                onChange={(e) => setPlanCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Например, Базовый"
              />
            </div>
            <div className="grid gap-2">
              <Label>Slug *</Label>
              <Input
                value={planCreateForm.slug}
                onChange={(e) => setPlanCreateForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="basic"
              />
            </div>
            <div className="grid gap-2">
              <Label>Описание</Label>
              <Textarea
                value={planCreateForm.description}
                onChange={(e) => setPlanCreateForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="resize-y min-h-[72px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Цена</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={planCreateForm.price}
                  onChange={(e) => setPlanCreateForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  disabled={planCreateForm.isFree}
                />
              </div>
              <div className="grid gap-2">
                <Label>Срок (дней) *</Label>
                <Input
                  type="number"
                  min={1}
                  value={planCreateForm.durationDays}
                  onChange={(e) => setPlanCreateForm((f) => ({ ...f, durationDays: Math.max(1, Number(e.target.value) || 1) }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Порядок отображения</Label>
              <Input
                type="number"
                value={planCreateForm.displayOrder}
                onChange={(e) => setPlanCreateForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={planCreateForm.isFree}
                onCheckedChange={(c) => setPlanCreateForm((f) => ({ ...f, isFree: c }))}
                className="data-[state=checked]:bg-[#00AFAE]"
              />
              <Label>Бесплатный тариф</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanCreateOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => void handleCreateSubscriptionPlan()}
              disabled={planCreateSubmitting}
              className="bg-[#00AFAE] hover:bg-[#00AFAE]/90"
            >
              {planCreateSubmitting ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Редактирование тарифного плана */}
      <Dialog open={!!planEditTarget} onOpenChange={(open) => !open && setPlanEditTarget(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Изменить тариф</DialogTitle>
          </DialogHeader>
          {planEditTarget && (
            <>
              <div className="grid gap-4 py-4">
                <p className="text-xs text-gray-500">
                  Slug: <span className="font-mono">{planEditTarget.slug}</span> (меняется только при создании)
                </p>
                <div className="grid gap-2">
                  <Label>Название *</Label>
                  <Input
                    value={planEditForm.name}
                    onChange={(e) => setPlanEditForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Описание</Label>
                  <Textarea
                    value={planEditForm.description}
                    onChange={(e) => setPlanEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="resize-y min-h-[72px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Цена</Label>
                    <Input
                      type="number"
                      min={0}
                      value={planEditForm.price}
                      onChange={(e) => setPlanEditForm((f) => ({ ...f, price: Number(e.target.value) }))}
                      disabled={planEditForm.isFree}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Срок (дней) *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={planEditForm.durationDays}
                      onChange={(e) => setPlanEditForm((f) => ({ ...f, durationDays: Math.max(1, Number(e.target.value) || 1) }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Порядок отображения</Label>
                  <Input
                    type="number"
                    value={planEditForm.displayOrder}
                    onChange={(e) => setPlanEditForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planEditForm.isFree}
                    onCheckedChange={(c) => setPlanEditForm((f) => ({ ...f, isFree: c }))}
                    className="data-[state=checked]:bg-[#00AFAE]"
                  />
                  <Label>Бесплатный тариф</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPlanEditTarget(null)}>
                  Отмена
                </Button>
                <Button
                  onClick={() => void saveEditSubscriptionPlan()}
                  disabled={planEditSubmitting}
                  className="bg-[#00AFAE] hover:bg-[#00AFAE]/90"
                >
                  {planEditSubmitting ? "Сохранение..." : "Сохранить"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Деактивация тарифа (скрыть из каталога) */}
      <AlertDialog open={!!planDeactivateTarget} onOpenChange={(open) => !open && setPlanDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Деактивировать тариф?</AlertDialogTitle>
            <AlertDialogDescription>
              {planDeactivateTarget && (
                <>
                  Тариф <strong>{planDeactivateTarget.name}</strong> будет скрыт из каталога для покупки. Запись в базе
                  останется, при необходимости можно снова активировать.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDeactivatePlan()}
              disabled={planDeactivateSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {planDeactivateSubmitting ? "Сохранение..." : "Да, скрыть"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Подтверждение удаления отзыва (необратимо) */}
      <AlertDialog open={!!reviewDeleteTarget} onOpenChange={(open) => !open && setReviewDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить отзыв?</AlertDialogTitle>
            <AlertDialogDescription>
              {reviewDeleteTarget && (
                <>
                  Отзыв будет <strong>полностью удалён из базы</strong>. Действие необратимо, рейтинг услуги
                  пересчитается.
                  <br />
                  <br />
                  Услуга: {reviewDeleteTarget.serviceName || "—"}
                  <br />
                  Автор: {reviewDeleteTarget.userFullName || "—"}
                  <br />
                  Оценка: {Number(reviewDeleteTarget.rating) || 0} / 5
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDeleteReview()}
              disabled={reviewDeleteSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {reviewDeleteSubmitting ? "Удаление..." : "Да, удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Подтверждение удаления категории */}
      <AlertDialog open={!!categoryDeleteTarget} onOpenChange={(open) => !open && setCategoryDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryDeleteTarget && (
                <>
                  <strong>Удаление категории (будьте осторожны, удаляются и все связанные услуги).</strong>
                  <br />
                  Точно удалить категорию &laquo;{categoryDeleteTarget.nameRu}&raquo;?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
              disabled={categoryDeleteSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {categoryDeleteSubmitting ? "Удаление..." : "Да, удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
