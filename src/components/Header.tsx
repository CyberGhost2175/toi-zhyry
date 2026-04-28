import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, User, Heart, LogOut, LayoutDashboard, ShoppingCart, Calendar, MessageSquare, Bell, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuth } from "../contexts/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { NotificationsBell } from "./notifications/NotificationsBell";
import { PartnerApi } from "../data/api/PartnerApi";

interface HeaderProps {
    onNavigate: (page: string) => void;
    currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
    const { isAuthenticated, user, logout } = useAuth();
    const routerNavigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isAdmin = user?.role?.toUpperCase() === "ADMIN";
    const isPartner = user?.role?.toUpperCase() === "PARTNER";
    const [hasApprovedPartnerApplication, setHasApprovedPartnerApplication] = useState(false);
    const hasPartnerCabinetAccess = isPartner || isAdmin || hasApprovedPartnerApplication;

    useEffect(() => {
        if (!isAuthenticated) {
            setHasApprovedPartnerApplication(false);
            return;
        }

        if (isPartner || isAdmin) {
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
    }, [isAuthenticated, isPartner, isAdmin]);

    const handleLogout = async () => {
        await logout();
        onNavigate('home');
        setMobileMenuOpen(false);
    };

    const navTo = (page: string) => {
        onNavigate(page);
        setMobileMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => onNavigate('home')}
                    >
                        <div className="w-10  flex items-center justify-center">
                            <img src="/site-logo.svg" alt="logo" />
                        </div>
                        <span className="text-[#222222] font-semibold">Toi Zhyry</span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <button
                            onClick={() => onNavigate('catalog')}
                            className={`hover:text-[#00AFAE] transition-colors ${
                                currentPage === 'catalog' ? 'text-[#00AFAE]' : 'text-[#222222]'
                            }`}
                        >
                            Каталог
                        </button>
                        <button
                            onClick={() => onNavigate('about')}
                            className={`hover:text-[#00AFAE] transition-colors ${
                                currentPage === 'about' ? 'text-[#00AFAE]' : 'text-[#222222]'
                            }`}
                        >
                            О нас
                        </button>
                        {user?.role?.toUpperCase() !== 'ADMIN' && (
                            <button
                                onClick={() =>
                                    onNavigate(
                                        hasPartnerCabinetAccess
                                            ? 'partner-dashboard'
                                            : 'partners-info'
                                    )
                                }
                                className={`hover:text-[#00AFAE] transition-colors ${
                                    currentPage === 'partner-dashboard' || currentPage === 'partners-info'
                                        ? 'text-[#00AFAE]'
                                        : 'text-[#222222]'
                                }`}
                            >
                                {hasPartnerCabinetAccess
                                    ? 'Личный кабинет'
                                    : 'Для партнёров'}
                            </button>
                        )}
                    </nav>

                    {/* Right Side - Desktop */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Search */}
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Поиск услуг..."
                                className="pl-10 rounded-full border-gray-200"
                            />
                        </div>

                        {/* Админ-панель — только для роли ADMIN */}
                        {isAuthenticated && user?.role?.toUpperCase() === 'ADMIN' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onNavigate('admin-dashboard')}
                                className={`rounded-full gap-2 ${
                                    currentPage === 'admin-dashboard'
                                        ? 'bg-[#00AFAE]/10 text-[#00AFAE]'
                                        : 'text-[#222222] hover:bg-[#00AFAE]/10 hover:text-[#00AFAE]'
                                }`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span className="hidden sm:inline">Админ-панель</span>
                            </Button>
                        )}

                        {!isAdmin && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onNavigate('favorites')}
                                    className="rounded-full"
                                    aria-label="Избранное"
                                >
                                    <Heart className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onNavigate('cart')}
                                    className="rounded-full"
                                    aria-label="Корзина"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                </Button>
                            </>
                        )}

                        {isAuthenticated && !isAdmin && <NotificationsBell />}

                        {/* Auth Section */}
                        {isAuthenticated ? (
                            // Если авторизован - показываем профиль
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-[#00AFAE] to-[#FFD700] rounded-full flex items-center justify-center text-white text-sm font-medium">
                                            {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {user?.firstName && user?.lastName
                                                    ? `${user.firstName} ${user.lastName}`
                                                    : 'Мой аккаунт'}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onNavigate('client-dashboard')}>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Профиль</span>
                                    </DropdownMenuItem>
                                    {hasPartnerCabinetAccess && (
                                        <DropdownMenuItem onClick={() => onNavigate('partner-dashboard')}>
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>Кабинет партнёра</span>
                                        </DropdownMenuItem>
                                    )}
                                    {!isAdmin && (
                                        <>
                                            <DropdownMenuItem onClick={() => onNavigate('client-bookings')}>
                                                <Calendar className="mr-2 h-4 w-4" />
                                                <span>Бронирования</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onNavigate('client-reviews')}>
                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                <span>{hasPartnerCabinetAccess ? "Отзывы по услугам" : "Мои отзывы"}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onNavigate('chats')}>
                                                <MessageCircle className="mr-2 h-4 w-4" />
                                                <span>Чат</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onNavigate('favorites')}>
                                                <Heart className="mr-2 h-4 w-4" />
                                                <span>Избранное</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Выйти</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            // Если не авторизован - показываем кнопку "Войти"
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onNavigate('login')}
                                    className="rounded-full"
                                >
                                    <User className="w-5 h-5" />
                                </Button>
                                <Button
                                    onClick={() => onNavigate('login')}
                                    className="bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white rounded-full"
                                >
                                    Войти
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile: колокольчик вынесен в профиль /profile/notifications, здесь только меню */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Открыть меню"
                    >
                        <Menu className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            {/* Mobile menu (бургер) */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b border-gray-200">
                        <SheetTitle className="text-left text-[#222222]">Меню</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Поиск */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Поиск услуг..."
                                className="pl-10 rounded-full border-gray-200"
                            />
                        </div>

                        {/* Навигация */}
                        <nav className="flex flex-col gap-1">
                            <button
                                onClick={() => navTo('catalog')}
                                className={`text-left px-4 py-3 rounded-xl transition-colors ${
                                    currentPage === 'catalog' ? 'bg-[#00AFAE]/10 text-[#00AFAE] font-medium' : 'text-[#222222] hover:bg-gray-100'
                                }`}
                            >
                                Каталог
                            </button>
                            <button
                                onClick={() => navTo('about')}
                                className={`text-left px-4 py-3 rounded-xl transition-colors ${
                                    currentPage === 'about' ? 'bg-[#00AFAE]/10 text-[#00AFAE] font-medium' : 'text-[#222222] hover:bg-gray-100'
                                }`}
                            >
                                О нас
                            </button>
                            {user?.role?.toUpperCase() !== 'ADMIN' && (
                                <button
                                    onClick={() =>
                                        navTo(
                                            hasPartnerCabinetAccess
                                                ? 'partner-dashboard'
                                                : 'partners-info'
                                        )
                                    }
                                    className={`text-left px-4 py-3 rounded-xl transition-colors ${
                                        currentPage === 'partner-dashboard' || currentPage === 'partners-info'
                                            ? 'bg-[#00AFAE]/10 text-[#00AFAE] font-medium'
                                            : 'text-[#222222] hover:bg-gray-100'
                                    }`}
                                >
                                    {hasPartnerCabinetAccess
                                        ? 'Личный кабинет'
                                        : 'Для партнёров'}
                                </button>
                            )}
                        </nav>

                        {/* Админ-панель (мобильная) */}
                        {isAuthenticated && user?.role?.toUpperCase() === 'ADMIN' && (
                            <button
                                onClick={() => navTo('admin-dashboard')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                                    currentPage === 'admin-dashboard' ? 'bg-[#00AFAE]/10 text-[#00AFAE] font-medium' : 'text-[#222222] hover:bg-gray-100'
                                }`}
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                <span>Админ-панель</span>
                            </button>
                        )}

                        {!isAdmin && (
                            <>
                                <button
                                    onClick={() => navTo('favorites')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#222222] hover:bg-gray-100 transition-colors"
                                >
                                    <Heart className="w-5 h-5" />
                                    <span>Избранное</span>
                                </button>
                                <button
                                    onClick={() => navTo('cart')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#222222] hover:bg-gray-100 transition-colors"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    <span>Корзина</span>
                                </button>
                            </>
                        )}

                        {/* Аккаунт */}
                        <div className="pt-4 border-t border-gray-200 space-y-1">
                            {isAuthenticated ? (
                                <>
                                    <div className="px-4 py-2">
                                        <p className="text-sm font-medium text-[#222222]">
                                            {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Мой аккаунт'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                    {!isAdmin && (
                                        <button
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                routerNavigate("/profile/notifications");
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#222222] hover:bg-gray-100 transition-colors"
                                        >
                                            <Bell className="w-5 h-5" />
                                            <span>Уведомления</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navTo('client-dashboard')}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#222222] hover:bg-gray-100 transition-colors"
                                    >
                                        <User className="w-5 h-5" />
                                        <span>Профиль</span>
                                    </button>
                                    {hasPartnerCabinetAccess && (
                                        <button
                                            onClick={() => navTo('partner-dashboard')}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#222222] hover:bg-gray-100 transition-colors"
                                        >
                                            <LayoutDashboard className="w-5 h-5" />
                                            <span>Кабинет партнёра</span>
                                        </button>
                                    )}
                                    {!isAdmin && (
                                        <>
                                            <button
                                                onClick={() => navTo('client-bookings')}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#222222] hover:bg-gray-100 transition-colors"
                                            >
                                                <Calendar className="w-5 h-5" />
                                                <span>Бронирования</span>
                                            </button>
                                            <button
                                                onClick={() => navTo('client-reviews')}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#222222] hover:bg-gray-100 transition-colors"
                                            >
                                                <MessageSquare className="w-5 h-5" />
                                                <span>{hasPartnerCabinetAccess ? "Отзывы по услугам" : "Мои отзывы"}</span>
                                            </button>
                                            <button
                                                onClick={() => navTo('chats')}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#222222] hover:bg-gray-100 transition-colors"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                                <span>Чат</span>
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span>Выйти</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => navTo('login')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white font-medium transition-colors"
                                >
                                    <User className="w-5 h-5" />
                                    Войти
                                </button>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </header>
    );
}