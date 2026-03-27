import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { CartApi, CartItem, CartResponse } from "../data/api/CartApi";
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../utils/imageUrl";
import { formatPriceByType } from "../utils/priceType";
import { toast } from "sonner";

interface CartPageProps {
  onNavigate: (page: string, state?: { serviceId?: string }) => void;
}

function formatPrice(value: number): string {
  return value.toLocaleString("ru-KZ") + " ₸";
}

function formatItemPrice(item: CartItem): string {
  const type = (item.service.priceType || "").toUpperCase();
  if (type === "NEGOTIABLE") return "Цена договорная";
  return formatPriceByType(
    item.service.priceFrom ?? 0,
    item.service.priceTo ?? 0,
    item.service.priceType
  );
}

export function CartPage({ onNavigate }: CartPageProps) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const cartApi = new CartApi();

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch {
      setCart({ items: [], totalItems: 0, totalPrice: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadCart();
    else setLoading(false);
  }, [isAuthenticated, loadCart]);

  const handleRemove = async (serviceId: string) => {
    try {
      await cartApi.removeFromCart(serviceId);
      toast.success("Удалено из корзины");
      loadCart();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleClear = async () => {
    try {
      await cartApi.clearCart();
      toast.success("Корзина очищена");
      loadCart();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" onClick={() => onNavigate("home")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Button>
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-[#222222] mb-2">Корзина</h2>
            <p className="text-gray-600 mb-6">Войдите в аккаунт, чтобы добавлять услуги в корзину.</p>
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
            <ShoppingCart className="w-7 h-7 text-[#00AFAE]" />
            Корзина
          </h1>
          {loading ? (
            <p className="text-gray-500">Загрузка...</p>
          ) : !cart || cart.items.length === 0 ? (
            <p className="text-gray-500">Корзина пуста. Добавляйте услуги из каталога.</p>
          ) : (
            <>
              <ul className="space-y-4 divide-y divide-gray-100">
                {cart.items.map((item: CartItem) => (
                  <li key={item.cartItemId} className="flex flex-col sm:flex-row gap-4 py-4 first:pt-0">
                    <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={getImageUrl(item.service.thumbnail || item.service.images?.[0])}
                        alt={item.service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        className="font-medium text-[#222222] hover:text-[#00AFAE] text-left"
                        onClick={() => onNavigate("service-detail", { serviceId: item.service.id })}
                      >
                        {item.service.name}
                      </button>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.service.partnerName && `${item.service.partnerName} · `}
                        {item.quantity} чел.
                        {item.eventDate && ` · ${new Date(item.eventDate).toLocaleDateString("ru-RU")}`}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-1">Заметка: {item.notes}</p>
                      )}
                      <p className="text-[#00AFAE] font-semibold mt-2">
                        {formatItemPrice(item)}
                        {item.service.priceType?.toUpperCase() !== "NEGOTIABLE" && item.quantity > 1 && (
                          <span className="text-gray-500 font-normal text-sm ml-1">
                            × {item.quantity} = {formatPrice(item.itemTotal)}
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 self-start sm:self-center"
                      onClick={() => handleRemove(item.service.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Удалить
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-lg font-semibold text-[#222222]">
                  Итого: <span className="text-[#00AFAE]">{formatPrice(cart.totalPrice)}</span>
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleClear}>
                    Очистить корзину
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
