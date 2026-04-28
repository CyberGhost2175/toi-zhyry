import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./components/HomePage";
import { CatalogPage } from "./components/CatalogPage";
import { ServiceDetailPage } from "./components/ServiceDetailPage";
import { UserProfile } from "./components/ClientDashboard";
import { ClientProfileLayout } from "./components/profile/ClientProfileLayout";
import { BookingsLayout } from "./components/bookings/BookingsLayout";
import { BookingsListPage } from "./components/bookings/BookingsListPage";
import { BookingsHistoryPage } from "./components/bookings/BookingsHistoryPage";
import { BookingDetailPage } from "./components/bookings/BookingDetailPage";
import { MyReviewsPage } from "./components/reviews/MyReviewsPage";
import { NotificationsPage } from "./components/notifications/NotificationsPage";
import { NotificationSettingsPage } from "./components/notifications/NotificationSettingsPage";
import { PartnerDashboard } from "./components/PartnerDashboard";
import { BecomePartnerPage } from "./components/BecomePartnerPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { EmailVerificationPage } from "./components/auth/EmailVerificationPage";
import { CompleteProfilePage } from "./components/auth/CompleteProfilePage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FavoritesPage } from "./components/FavoritesPage";
import { CartPage } from "./components/CartPage";
import { AboutPage } from "./components/info/AboutPage";
import { PartnersMarketingPage } from "./components/info/PartnersMarketingPage";
import { HelpPage } from "./components/info/HelpPage";
import { PrivacyPage } from "./components/info/PrivacyPage";
import { TermsPage } from "./components/info/TermsPage";
import { FaqPage } from "./components/info/FaqPage";
import { PartnerApi } from "./data/api/PartnerApi";
import { ChatsPage } from "./components/chats/ChatsPage";
import { Toaster, toast } from "sonner";
import {
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";

type Page =
    | "home"
    | "catalog"
    | "service-detail"
    | "client-dashboard"
    | "client-bookings"
    | "client-reviews"
    | "chats"
    | "partner-dashboard"
    | "admin-dashboard"
    | "favorites"
    | "cart"
    | "login"
    | "register"
    | "verify-email"
    | "complete-profile"
    | "forgot-password"
    | "about"
    | "partners-info"
    | "help"
    | "privacy"
    | "terms"
    | "faq";

type NavigationState = { serviceId?: string; categoryName?: string; searchQuery?: string };

function getCurrentPage(pathname: string): Page {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/about")) return "about";
    if (pathname.startsWith("/partners")) return "partners-info";
    if (pathname.startsWith("/help")) return "help";
    if (pathname.startsWith("/privacy")) return "privacy";
    if (pathname.startsWith("/terms")) return "terms";
    if (pathname.startsWith("/faq")) return "faq";
    if (pathname.startsWith("/catalog")) return "catalog";
    if (pathname.startsWith("/services")) return "service-detail";
    if (pathname.startsWith("/profile/bookings")) return "client-bookings";
    if (pathname.startsWith("/profile/reviews")) return "client-reviews";
    if (pathname.startsWith("/profile/chats")) return "chats";
    if (pathname.startsWith("/profile/notifications")) return "client-dashboard";
    if (pathname.startsWith("/profile")) return "client-dashboard";
    if (pathname.startsWith("/partner/dashboard")) return "partner-dashboard";
    if (pathname.startsWith("/admin/dashboard")) return "admin-dashboard";
    if (pathname.startsWith("/favorites")) return "favorites";
    if (pathname.startsWith("/cart")) return "cart";
    if (pathname.startsWith("/login")) return "login";
    if (pathname.startsWith("/register")) return "register";
    if (pathname.startsWith("/verify-email")) return "verify-email";
    if (pathname.startsWith("/complete-profile")) return "complete-profile";
    return "forgot-password";
}

function AppContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated, sessionExpiredMessage, clearSessionExpiredMessage } = useAuth();
    const currentPage = getCurrentPage(location.pathname);
    const [hasApprovedPartnerApplication, setHasApprovedPartnerApplication] = useState(false);
    const role = user?.role?.toUpperCase();
    const isPartnerOrAdminByRole = role === "PARTNER" || role === "ADMIN";
    const hasPartnerCabinetAccess = isPartnerOrAdminByRole || hasApprovedPartnerApplication;

    useEffect(() => {
        if (sessionExpiredMessage) {
            toast.error(sessionExpiredMessage);
            clearSessionExpiredMessage();
            navigate("/login");
        }
    }, [sessionExpiredMessage, clearSessionExpiredMessage, navigate]);

    useEffect(() => {
        if (!isAuthenticated) {
            setHasApprovedPartnerApplication(false);
            return;
        }

        if (isPartnerOrAdminByRole) {
            setHasApprovedPartnerApplication(true);
            return;
        }

        const partnerApi = new PartnerApi();
        let cancelled = false;

        partnerApi
            .getMyApplication()
            .then((application) => {
                if (cancelled) return;
                const status = application?.status?.toUpperCase();
                setHasApprovedPartnerApplication(status === "APPROVED" || status === "ОДОБРЕНО");
            })
            .catch(() => {
                if (!cancelled) setHasApprovedPartnerApplication(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, isPartnerOrAdminByRole]);

    const handleNavigate = (page: string, state?: NavigationState) => {
        switch (page) {
            case "home":
                navigate("/");
                break;
            case "about":
                navigate("/about");
                break;
            case "partners-info":
                navigate("/partners");
                break;
            case "help":
                navigate("/help");
                break;
            case "privacy":
                navigate("/privacy");
                break;
            case "terms":
                navigate("/terms");
                break;
            case "faq":
                navigate("/faq");
                break;
            case "catalog": {
                const params = new URLSearchParams();
                if (state?.categoryName) params.set("category", state.categoryName);
                if (state?.searchQuery) params.set("q", state.searchQuery);
                const query = params.toString();
                navigate(query ? `/catalog?${query}` : "/catalog");
                break;
            }
            case "service-detail":
                if (state?.serviceId) navigate(`/services/${state.serviceId}`);
                else navigate("/services");
                break;
            case "client-dashboard":
                navigate("/profile");
                break;
            case "client-bookings":
                if (hasPartnerCabinetAccess) {
                    navigate("/partner/dashboard?tab=bookings");
                } else {
                    navigate("/profile/bookings");
                }
                break;
            case "client-reviews":
                if (hasPartnerCabinetAccess) {
                    navigate("/partner/dashboard?tab=reviews");
                } else {
                    navigate("/profile/reviews");
                }
                break;
            case "chats":
                navigate("/profile/chats");
                break;
            case "partner-dashboard":
                navigate("/partner/dashboard");
                break;
            case "admin-dashboard":
                navigate("/admin/dashboard");
                break;
            case "favorites":
                navigate("/favorites");
                break;
            case "cart":
                navigate("/cart");
                break;
            case "login":
                navigate("/login");
                break;
            case "register":
                navigate("/register");
                break;
            case "forgot-password":
                navigate("/forgot-password");
                break;
            case "complete-profile":
                navigate("/complete-profile");
                break;
            default:
                navigate("/");
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Don't show header/footer on auth pages (admin dashboard and favorites show header)
    const showHeaderFooter =
        currentPage !== 'login' &&
        currentPage !== 'register' &&
        currentPage !== 'verify-email' &&
        currentPage !== 'complete-profile' &&
        currentPage !== 'forgot-password';

    return (
        <div className="min-h-screen bg-[#F9F9F9] font-['Inter',_sans-serif]">
            {showHeaderFooter && <Header onNavigate={handleNavigate} currentPage={currentPage} />}
            <Routes>
                <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
                <Route path="/about" element={<AboutPage onNavigate={handleNavigate} />} />
                <Route path="/partners" element={<PartnersMarketingPage onNavigate={handleNavigate} />} />
                <Route path="/help" element={<HelpPage onNavigate={handleNavigate} />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route
                    path="/catalog"
                    element={
                        <CatalogPage
                            onNavigate={handleNavigate}
                            initialCategoryName={searchParams.get("category") ?? undefined}
                            initialSearchQuery={searchParams.get("q") ?? undefined}
                        />
                    }
                />
                <Route path="/services/:serviceId" element={<ServiceRoute onNavigate={handleNavigate} />} />
                <Route path="/services" element={<ServiceDetailPage onNavigate={handleNavigate} />} />
                <Route path="/profile" element={<ClientProfileLayout />}>
                    <Route index element={<UserProfile onNavigate={handleNavigate} />} />
                    <Route path="bookings" element={<BookingsLayout />}>
                        <Route index element={<BookingsListPage />} />
                        <Route path="history" element={<BookingsHistoryPage />} />
                        <Route path=":bookingId" element={<BookingDetailPage />} />
                    </Route>
                    <Route path="reviews" element={<MyReviewsPage />} />
                    <Route path="chats" element={<ChatsPage />} />
                    <Route path="notifications/settings" element={<NotificationSettingsPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                </Route>
                <Route path="/favorites" element={<FavoritesPage onNavigate={handleNavigate} />} />
                <Route path="/cart" element={<CartPage onNavigate={handleNavigate} />} />
                <Route
                    path="/partner/dashboard"
                    element={
                        hasPartnerCabinetAccess ? (
                            <PartnerDashboard onNavigate={handleNavigate} />
                        ) : (
                            <BecomePartnerPage onNavigate={handleNavigate} />
                        )
                    }
                />
                <Route path="/admin/dashboard" element={<AdminDashboard onNavigate={handleNavigate} />} />
                <Route path="/login" element={<LoginPage onNavigate={handleNavigate} />} />
                <Route path="/register" element={<RegisterPage onNavigate={handleNavigate} />} />
                <Route path="/verify-email" element={<EmailVerificationPage onNavigate={handleNavigate} />} />
                <Route path="/complete-profile" element={<CompleteProfilePage onNavigate={handleNavigate} />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage onNavigate={handleNavigate} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {showHeaderFooter && <Footer />}
            <Toaster position="top-center" richColors closeButton />
        </div>
    );
}

function ServiceRoute({ onNavigate }: { onNavigate: (page: string, state?: NavigationState) => void }) {
    const { serviceId } = useParams<{ serviceId: string }>();
    return <ServiceDetailPage onNavigate={onNavigate} serviceId={serviceId} />;
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}