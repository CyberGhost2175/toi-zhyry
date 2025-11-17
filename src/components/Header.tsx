import { Search, Menu, User, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface HeaderProps {
    onNavigate: (page: string) => void;
    currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
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
                            <span className="text-white">TŽ</span>
                        </div>
                        <span className="text-[#222222]">Toi Zhyry</span>
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

                    {/* Search - Desktop */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Поиск услуг..."
                                className="pl-10 rounded-full border-gray-200"
                            />
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onNavigate('client-dashboard')}
                            className="rounded-full"
                        >
                            <Heart className="w-5 h-5" />
                        </Button>

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