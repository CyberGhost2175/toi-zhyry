import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { NotificationsApi, type AppNotification } from "../../data/api/NotificationsApi";
import { useAuth } from "../../contexts/AuthContext";
import { navigateFromNotification } from "./notificationNavigation";

const api = new NotificationsApi();
const PAGE_SIZE = 20;

export function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AppNotification[]>([]);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetcher = tab === "unread" ? api.getUnreadNotifications.bind(api) : api.getNotifications.bind(api);
      const res = await fetcher({ page, size: PAGE_SIZE });
      setRows(res.content || []);
      setLast(res.last);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
      setRows([]);
      setLast(true);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRowClick = async (n: AppNotification) => {
    try {
      if (!n.isRead) await api.markAsRead(n.id);
    } catch {
      /* ignore */
    }
    navigateFromNotification(n, navigate, user?.role);
  };

  const onMarkAll = async () => {
    try {
      await api.markAllAsRead();
      void load();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-[#222222]">Уведомления</h1>
          <Button variant="outline" size="sm" className="rounded-full shrink-0" asChild>
            <Link to="/profile/notifications/settings">Настройки</Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 p-0.5 bg-white">
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                tab === "all" ? "bg-[#00AFAE] text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => {
                setTab("all");
                setPage(0);
              }}
            >
              Все
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                tab === "unread" ? "bg-[#00AFAE] text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => {
                setTab("unread");
                setPage(0);
              }}
            >
              Непрочитанные
            </button>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => void onMarkAll()}>
            Прочитать все
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 text-sm">Пока нет уведомлений.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={`w-full text-left rounded-xl border p-4 transition-colors hover:border-[#00AFAE]/40 ${
                  !n.isRead ? "border-[#00AFAE]/30 bg-[#00AFAE]/5" : "border-gray-100 bg-white"
                }`}
                onClick={() => void onRowClick(n)}
              >
                <p className="font-medium text-[#222222]">{n.title}</p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString("ru-RU") : ""}
                  {n.type ? ` · ${n.type}` : ""}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            className="rounded-full"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={last}
            className="rounded-full"
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      )}
    </div>
  );
}
