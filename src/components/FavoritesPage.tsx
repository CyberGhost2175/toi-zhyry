import { useState, useEffect, useCallback } from "react";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { FavoritesApi } from "../data/api/FavoritesApi";
import { ServiceCard } from "./ServiceCard";
import type { CatalogService } from "../domain/entities/Service";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

interface FavoritesPageProps {
  onNavigate: (page: string, state?: { serviceId?: string }) => void;
}

export function FavoritesPage({ onNavigate }: FavoritesPageProps) {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const favoritesApi = new FavoritesApi();

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await favoritesApi.getFavorites({ page: 0, size: 100 });
      setFavorites(res.content || []);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadFavorites();
    else setLoading(false);
  }, [isAuthenticated, loadFavorites]);

  const handleToggleFavorite = useCallback(async (serviceId: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await favoritesApi.removeFromFavorites(serviceId);
        toast.success("Удалено из избранного");
        setFavorites((prev) => prev.filter((s) => s.id !== serviceId));
      } else {
        await favoritesApi.addToFavorites(serviceId);
        toast.success("Добавлено в избранное");
        loadFavorites();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  }, [loadFavorites]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" onClick={() => onNavigate("home")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Button>
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-[#222222] mb-2">Избранное</h2>
            <p className="text-gray-600 mb-6">Войдите в аккаунт, чтобы сохранять понравившиеся услуги.</p>
            <Button onClick={() => onNavigate("login")} className="bg-[#00AFAE] hover:bg-[#00AFAE]/90">
              Войти
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => onNavigate("catalog")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          В каталог
        </Button>
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-[#222222] mb-6 flex items-center gap-2">
            <Heart className="w-7 h-7 fill-red-500 text-red-500" />
            Избранное
          </h1>
          {loading ? (
            <p className="text-gray-500">Загрузка...</p>
          ) : favorites.length === 0 ? (
            <p className="text-gray-500">В избранном пока ничего нет. Добавляйте услуги из каталога — нажимайте на сердечко.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={{ ...service, isFavorite: true }}
                  onNavigate={(id) => onNavigate("service-detail", { serviceId: id })}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
