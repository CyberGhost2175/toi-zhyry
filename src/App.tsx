import { useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./components/HomePage";
import { CatalogPage } from "./components/CatalogPage";
import { ServiceDetailPage } from "./components/ServiceDetailPage";
import { ClientDashboard } from "./components/ClientDashboard";
import { PartnerDashboard } from "./components/PartnerDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";

type Page = 'home' | 'catalog' | 'service-detail' | 'client-dashboard' | 'partner-dashboard' | 'admin-dashboard' | 'login' | 'register' | 'forgot-password';

export default function App() {
    const [currentPage, setCurrentPage] = useState<Page>('home');

    const handleNavigate = (page: string) => {
        setCurrentPage(page as Page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage onNavigate={handleNavigate} />;
            case 'catalog':
                return <CatalogPage onNavigate={handleNavigate} />;
            case 'service-detail':
                return <ServiceDetailPage onNavigate={handleNavigate} />;
            case 'client-dashboard':
                return <ClientDashboard onNavigate={handleNavigate} />;
            case 'partner-dashboard':
                return <PartnerDashboard onNavigate={handleNavigate} />;
            case 'admin-dashboard':
                return <AdminDashboard onNavigate={handleNavigate} />;
            case 'login':
                return <LoginPage onNavigate={handleNavigate} />;
            case 'register':
                return <RegisterPage onNavigate={handleNavigate} />;
            case 'forgot-password':
                return <ForgotPasswordPage onNavigate={handleNavigate} />;
            default:
                return <HomePage onNavigate={handleNavigate} />;
        }
    };

    // Don't show header/footer on admin dashboard and auth pages
    const showHeaderFooter = currentPage !== 'admin-dashboard' &&
        currentPage !== 'login' &&
        currentPage !== 'register' &&
        currentPage !== 'forgot-password';

    return (
        <div className="min-h-screen bg-[#F9F9F9] font-['Inter',_sans-serif]">
            {showHeaderFooter && <Header onNavigate={handleNavigate} currentPage={currentPage} />}
            {renderPage()}
            {showHeaderFooter && <Footer />}
        </div>
    );
}