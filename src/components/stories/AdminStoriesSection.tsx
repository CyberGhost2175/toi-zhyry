import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { AdminStoriesApi } from "../../data/api/AdminStoriesApi";
import type { StoryResponse, StoryStatus } from "../../data/api/StoriesApi";

const STATUS_OPTIONS: Array<{ value: StoryStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Все статусы" },
  { value: "ACTIVE", label: "Активные" },
  { value: "EXPIRED", label: "Истёкшие" },
  { value: "REMOVED_BY_PARTNER", label: "Удалены партнёром" },
  { value: "REMOVED_BY_ADMIN", label: "Сняты админом" },
];

export function AdminStoriesSection() {
  const api = useMemo(() => new AdminStoriesApi(), []);
  const [stories, setStories] = useState<StoryResponse[]>([]);
  const [status, setStatus] = useState<StoryStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadStories = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await api.getStories({
        page: targetPage,
        size: 20,
        status: status === "ALL" ? undefined : status,
      });
      setStories(res.content || []);
      setPage(res.number || targetPage);
      setTotalPages(res.totalPages || 0);
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
  }, [status]);

  const handleRemove = async (storyId: string) => {
    setActionId(storyId);
    try {
      await api.removeStory(storyId);
      toast.success("Сторис снята с публикации");
      await loadStories(page);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось снять сторис");
    } finally {
      setActionId(null);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="space-y-3">
        <CardTitle className="text-[#222222]">Сторис</CardTitle>
        <div className="w-64">
          <Select value={status} onValueChange={(v) => setStatus(v as StoryStatus | "ALL")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Загрузка...</div>
        ) : stories.length === 0 ? (
          <div className="py-10 text-center text-gray-500">Сторис не найдены.</div>
        ) : (
          stories.map((story) => (
            <div key={story.id} className="rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[#222222] truncate">{story.serviceName}</p>
                <p className="text-sm text-gray-500 truncate">{story.partnerCompanyName}</p>
                <p className="text-xs text-gray-500">{story.status} · {story.viewsCount} просмотров</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={actionId === story.id || story.status === "REMOVED_BY_ADMIN"}
                onClick={() => void handleRemove(story.id)}
              >
                Снять
              </Button>
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
  );
}
