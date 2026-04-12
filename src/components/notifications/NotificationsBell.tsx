import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { NotificationsApi, type AppNotification } from "../../data/api/NotificationsApi";
import { useAuth } from "../../contexts/AuthContext";
import { navigateFromNotification } from "./notificationNavigation";

const api = new NotificationsApi();

export function NotificationsBell() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const refreshCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { count } = await api.getUnreadCount();
      setUnreadCount(typeof count === "number" ? count : 0);
    } catch {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setItems([]);
      return;
    }
    void refreshCount();
    const t = window.setInterval(refreshCount, 60_000);
    const onFocus = () => void refreshCount();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, refreshCount]);

  const loadPreview = useCallback(async () => {
    setLoadingOpen(true);
    try {
      const res = await api.getNotifications({ page: 0, size: 12 });
      setItems(res.content || []);
    } catch {
      setItems([]);
    } finally {
      setLoadingOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open && isAuthenticated) void loadPreview();
  }, [open, isAuthenticated, loadPreview]);

  const handleMarkAll = async () => {
    try {
      await api.markAllAsRead();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* toast optional */
    }
  };

  const handleItemClick = async (n: AppNotification) => {
    try {
      if (!n.isRead) {
        const updated = await api.markAsRead(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, ...updated } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      /* ignore */
    }
    setOpen(false);
    navigateFromNotification(n, navigate);
  };

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Уведомления">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-0.5 flex items-center justify-center rounded-full bg-[#00AFAE] text-white text-[10px] font-semibold leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 max-h-[min(70vh,420px)] flex flex-col p-0">
        <DropdownMenuLabel className="px-3 py-2 border-b border-gray-100 flex items-center justify-between gap-2">
          <span>Уведомления</span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs font-normal text-[#00AFAE] hover:underline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleMarkAll();
              }}
            >
              Прочитать все
            </button>
          )}
        </DropdownMenuLabel>
        <div className="overflow-y-auto flex-1 py-1">
          {loadingOpen ? (
            <div className="flex justify-center py-8 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-gray-500 text-center">Нет уведомлений</p>
          ) : (
            items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={`flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer rounded-none ${
                  !n.isRead ? "bg-[#00AFAE]/5" : ""
                }`}
                onSelect={(e) => {
                  e.preventDefault();
                  void handleItemClick(n);
                }}
              >
                <span className="text-sm font-medium text-[#222222] line-clamp-2">{n.title}</span>
                <span className="text-xs text-gray-600 line-clamp-2">{n.message}</span>
                <span className="text-[10px] text-gray-400 mt-0.5">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString("ru-RU") : ""}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem
          className="cursor-pointer justify-center text-[#00AFAE] rounded-none"
          onSelect={(e) => {
            e.preventDefault();
            setOpen(false);
            navigate("/profile/notifications");
          }}
        >
          Все уведомления
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
