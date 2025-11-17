import { Search, Menu, User, Heart, LogOut } from "lucide-react";
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

interface HeaderProps {
    onNavigate: (page: string) => void;
    currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
    const { isAuthenticated, user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        onNavigate('home');
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
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00AFAE] to-[#FFD700] rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold">TŽ</span>
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
                            onClick={() => onNavigate('home')}
                            className="text-[#222222] hover:text-[#00AFAE] transition-colors"
                        >
                            О нас
                        </button>
                        <button
                            onClick={() => onNavigate('partner-dashboard')}
                            className={`hover:text-[#00AFAE] transition-colors ${
                                currentPage === 'partner-dashboard' ? 'text-[#00AFAE]' : 'text-[#222222]'
                            }`}
                        >
                            Для партнёров
                        </button>
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

                        {/* Favorites */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onNavigate('client-dashboard')}
                            className="rounded-full"
                        >
                            <Heart className="w-5 h-5" />
                        </Button>

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
                                    <DropdownMenuItem onClick={() => onNavigate('client-dashboard')}>
                                        <Heart className="mr-2 h-4 w-4" />
                                        <span>Избранное</span>
                                    </DropdownMenuItem>
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

                    {/* Mobile Menu Button */}
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        </header>
    );
}