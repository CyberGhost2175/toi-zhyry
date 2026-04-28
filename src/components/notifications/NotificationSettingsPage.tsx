import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import {
  NotificationsApi,
  type NotificationSettings,
  type NotificationSettingsPatch,
} from "../../data/api/NotificationsApi";

const api = new NotificationsApi();

const CHANNEL_ROWS: { key: keyof NotificationSettings; label: string; description: string }[] = [
  { key: "pushEnabled", label: "Push", description: "Уведомления в браузере или приложении" },
  { key: "emailEnabled", label: "Email", description: "Письма на указанную почту" },
  { key: "smsEnabled", label: "SMS", description: "Текстовые сообщения на телефон" },
];

const CATEGORY_ROWS: { key: keyof NotificationSettings; label: string; description: string }[] = [
  { key: "bookingUpdates", label: "Бронирования", description: "Изменения статуса и напоминания по брони" },
  { key: "newBookings", label: "Новые брони", description: "Партнёрам: новая заявка на услугу" },
  { key: "chatMessages", label: "Сообщения в чате", description: "Новые сообщения по заказу" },
  { key: "eventReminders", label: "Напоминания о событии", description: "Дата мероприятия приближается" },
  { key: "promotions", label: "Акции и новости", description: "Спецпредложения и рассылка сервиса" },
];

export function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<keyof NotificationSettings | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getNotificationSettings();
      setSettings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (key: keyof NotificationSettings, checked: boolean) => {
    if (!settings) return;
    setError(null);
    const prev = settings[key];
    setSettings((s) => (s ? { ...s, [key]: checked } : s));
    setPendingKey(key);
    const patch: NotificationSettingsPatch = { [key]: checked };
    try {
      const updated = await api.updateNotificationSettings(patch);
      setSettings(updated);
    } catch {
      setSettings((s) => (s ? { ...s, [key]: prev } : s));
      setError("Не удалось сохранить. Попробуйте ещё раз.");
    } finally {
      setPendingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <Button variant="outline" className="rounded-full" onClick={() => void load()}>
          Повторить
        </Button>
      </div>
    );
  }

  if (!settings) return null;

  const row = (
    def: (typeof CHANNEL_ROWS)[0],
    disabled: boolean
  ) => (
    <div
      key={def.key}
      className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-0"
    >
      <div className="min-w-0">
        <Label htmlFor={def.key} className="text-[#222222] font-medium cursor-pointer">
          {def.label}
        </Label>
        <p className="text-xs text-gray-500 mt-0.5">{def.description}</p>
      </div>
      <Switch
        id={def.key}
        checked={Boolean(settings[def.key])}
        disabled={disabled}
        onCheckedChange={(checked) => void toggle(def.key, checked)}
        className="data-[state=checked]:bg-[#00AFAE] shrink-0"
      />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" className="text-gray-600 -ml-2" asChild>
          <Link to="/profile/notifications">← К списку</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold text-[#222222] mb-2">Настройки уведомлений</h1>
      <p className="text-sm text-gray-600 mb-8">
        Управляйте каналами и темами. Изменения сохраняются сразу после переключения.
      </p>

      {error && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide pt-5 pb-1">Каналы</h2>
        {CHANNEL_ROWS.map((def) => row(def, pendingKey === def.key))}
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide pt-5 pb-1">Темы</h2>
        {CATEGORY_ROWS.map((def) => row(def, pendingKey === def.key))}
      </section>
    </div>
  );
}
