import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { PartnerStoriesApi, type CreateStoryRequest } from "../../data/api/PartnerStoriesApi";
import type { PartnerServiceItem } from "../../data/api/PartnerServicesApi";
import { FilesApi, parseUploadResponse } from "../../data/api/FilesApi";
import type { StoryAnalyticsResponse, StoryResponse } from "../../data/api/StoriesApi";

interface PartnerStoriesSectionProps {
  services: PartnerServiceItem[];
}

const STORIES_PAGE_SIZE = 20;

function formatLeftTime(expiresAt: string): string {
  const msLeft = new Date(expiresAt).getTime() - Date.now();
  const safe = Math.max(0, msLeft);
  const hours = Math.floor(safe / 36e5);
  const minutes = Math.floor((safe % 36e5) / 6e4);
  return `${hours}ч ${minutes}м`;
}

export function PartnerStoriesSection({ services }: PartnerStoriesSectionProps) {
  const storiesApi = useMemo(() => new PartnerStoriesApi(), []);
  const filesApi = useMemo(() => new FilesApi(), []);

  const [stories, setStories] = useState<StoryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analyticsLoadingId, setAnalyticsLoadingId] = useState<string | null>(null);
  const [analyticsByStoryId, setAnalyticsByStoryId] = useState<Record<string, StoryAnalyticsResponse>>({});
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const [storyForm, setStoryForm] = useState<CreateStoryRequest>({
    serviceId: "",
    mediaUrl: "",
    mediaType: "IMAGE",
    caption: "",
    paymentMethod: "KASPI",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadStories = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await storiesApi.getMyStories({ page: targetPage, size: STORIES_PAGE_SIZE });
      setStories(res.content || []);
      setTotalPages(res.totalPages || 0);
      setPage(res.number || targetPage);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить сторис");
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStories(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!storyForm.serviceId) {
      toast.error("Выберите услугу");
      return;
    }
    if (!storyForm.mediaUrl && !selectedFile) {
      toast.error("Добавьте медиафайл или ссылку");
      return;
    }
    setSubmitting(true);
    try {
      let mediaUrl = storyForm.mediaUrl.trim();
      if (selectedFile) {
        if (storyForm.mediaType === "VIDEO") {
          throw new Error("Загрузка видео через форму пока не поддерживается. Укажите URL видео.");
        }
        const uploaded = await filesApi.upload(selectedFile);
        const urls = parseUploadResponse(uploaded);
        mediaUrl = urls[0] || "";
      }
      const created = await storiesApi.createStory({
        ...storyForm,
        mediaUrl,
        caption: storyForm.caption?.trim() || undefined,
      });
      toast.success(`Сторис опубликована. Активна ещё ${formatLeftTime(created.expiresAt)}`);
      setStoryForm((prev) => ({ ...prev, mediaUrl: "", caption: "" }));
      setSelectedFile(null);
      await loadStories(0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать сторис");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadAnalytics = async (storyId: string) => {
    setAnalyticsLoadingId(storyId);
    try {
      const data = await storiesApi.getStoryAnalytics(storyId);
      setAnalyticsByStoryId((prev) => ({ ...prev, [storyId]: data }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить аналитику");
    } finally {
      setAnalyticsLoadingId(null);
    }
  };

  const handleDelete = async (storyId: string) => {
    setDeleteLoadingId(storyId);
    try {
      await storiesApi.deleteStory(storyId);
      toast.success("Сторис удалена");
      await loadStories(page);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось удалить сторис");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const activeStories = stories.filter((story) => story.status === "ACTIVE");
  const archivedStories = stories.filter((story) => story.status !== "ACTIVE");

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#222222]">Опубликовать сторис (1500 ₸)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Услуга</Label>
              <Select value={storyForm.serviceId || undefined} onValueChange={(v) => setStoryForm((p) => ({ ...p, serviceId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите услугу" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Тип медиа</Label>
              <Select value={storyForm.mediaType} onValueChange={(v) => setStoryForm((p) => ({ ...p, mediaType: v as "IMAGE" | "VIDEO" }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMAGE">Изображение</SelectItem>
                  <SelectItem value="VIDEO">Видео</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Загрузить файл</Label>
              <Input
                type="file"
                accept={storyForm.mediaType === "VIDEO" ? "video/*" : "image/*"}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Или URL медиа</Label>
              <Input
                value={storyForm.mediaUrl}
                onChange={(e) => setStoryForm((p) => ({ ...p, mediaUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Подпись (до 200 символов)</Label>
              <Textarea
                value={storyForm.caption || ""}
                maxLength={200}
                onChange={(e) => setStoryForm((p) => ({ ...p, caption: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Способ оплаты</Label>
              <Select value={storyForm.paymentMethod} onValueChange={(v) => setStoryForm((p) => ({ ...p, paymentMethod: v as CreateStoryRequest["paymentMethod"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KASPI">Kaspi</SelectItem>
                  <SelectItem value="BANK_CARD">Банковская карта</SelectItem>
                  <SelectItem value="GOOGLE_PAY">Google Pay</SelectItem>
                  <SelectItem value="APPLE_PAY">Apple Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="bg-[#00AFAE] hover:bg-[#00AFAE]/90 text-white" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? "Публикуем..." : "Опубликовать сторис"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#222222]">Активные ({activeStories.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="py-8 text-center text-gray-500"><Loader2 className="w-5 h-5 mx-auto animate-spin" /></div>
          ) : activeStories.length === 0 ? (
            <p className="text-gray-600 text-sm">Активных сторис пока нет.</p>
          ) : (
            activeStories.map((story) => (
              <div key={story.id} className="rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[#222222] truncate">{story.serviceName}</p>
                  <p className="text-sm text-gray-500 truncate">{story.caption || "Без подписи"}</p>
                  <p className="text-xs text-gray-500">Осталось: {formatLeftTime(story.expiresAt)}</p>
                  <p className="text-xs text-gray-500">
                    Просмотры: {analyticsByStoryId[story.id]?.viewsCount ?? story.viewsCount}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={analyticsLoadingId === story.id} onClick={() => void handleLoadAnalytics(story.id)}>
                    Аналитика
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={deleteLoadingId === story.id}
                    onClick={() => void handleDelete(story.id)}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#222222]">Архив ({archivedStories.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {archivedStories.length === 0 ? (
            <p className="text-gray-600 text-sm">Архив пуст.</p>
          ) : (
            archivedStories.map((story) => (
              <div key={story.id} className="rounded-xl border border-gray-200 p-3">
                <p className="text-[#222222]">{story.serviceName}</p>
                <p className="text-sm text-gray-500">{story.status}</p>
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => void loadStories(Math.max(0, page - 1))}>
                Назад
              </Button>
              <span className="text-sm text-gray-600">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => void loadStories(page + 1)}>
                Далее
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
