import { useState, useEffect } from "react";
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
import { ImageWithFallback } from "./ImageWithFallback";
import { getImageUrl } from "../utils/imageUrl";
import { getPriceTypeLabel } from "../utils/priceType";
import { toast } from "sonner";
import { Switch } from "./ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

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
  const [activeSection, setActiveSection] = useState<"applications" | "partners" | "users" | "services" | "categories">("applications");
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

  const adminApi = new AdminApi();
  const adminServicesApi = new AdminServicesApi();
  const adminUsersApi = new AdminUsersApi();
  const adminCategoriesApi = new AdminCategoriesApi();

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
      await adminUsersApi.createUser(createUserForm);
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
      phone: user.phone || "",
      city: user.city || "",
    });
  };

  const saveEditUser = async () => {
    if (!editUserTarget) return;
    setEditUserSubmitting(true);
    try {
      await adminUsersApi.updateUser(editUserTarget.id, editUserForm);
      toast.success("Пользователь обновлён");
      setEditUserTarget(null);
      loadUsers();
      if (selectedUser?.id === editUserTarget.id) setSelectedUser({ ...selectedUser, ...editUserForm });
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
    if (activeSection === "categories") loadCategories();
  }, [activeSection]);

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
              {activeSection === "categories" && "Категории услуг"}
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
                              <TableHead className="w-[120px]">Действия</TableHead>
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
                onChange={(e) => setCreateUserForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+7..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Город</Label>
              <Input
                value={createUserForm.city}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, city: e.target.value }))}
              />
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
                    onChange={(e) => setEditUserForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Город</Label>
                  <Input
                    value={editUserForm.city}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, city: e.target.value }))}
                  />
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
                <div><span className="text-gray-500">Телефон</span><p>{selectedUser.phone || "—"}</p></div>
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
