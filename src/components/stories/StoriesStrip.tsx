import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { StoriesApi, type StoryResponse } from "../../data/api/StoriesApi";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface StoriesStripProps {
  categoryId?: string;
  className?: string;
}

const STORY_DURATION_MS = 15_000;

function formatLeftTime(expiresAt: string): string {
  const msLeft = new Date(expiresAt).getTime() - Date.now();
  const safeMs = Math.max(0, msLeft);
  const hours = Math.floor(safeMs / 36e5);
  const minutes = Math.floor((safeMs % 36e5) / 6e4);
  return `${hours}ч ${minutes}м`;
}

export function StoriesStrip({ categoryId, className }: StoriesStripProps) {
  const storiesApi = useMemo(() => new StoriesApi(), []);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState<StoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeStory, setActiveStory] = useState<StoryResponse | null>(null);
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await storiesApi.getFeed(categoryId);
        if (!cancelled) setStories(data);
      } catch {
        if (!cancelled) setStories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storiesApi, categoryId]);

  useEffect(() => {
    if (!open || stories.length === 0) return;
    setProgressValue(100);
    const startTimer = window.setTimeout(() => setProgressValue(0), 30);
    const autoNextTimer = window.setTimeout(() => {
      if (activeIndex >= stories.length - 1) {
        setOpen(false);
        return;
      }
      setActiveIndex((prev) => Math.min(stories.length - 1, prev + 1));
    }, STORY_DURATION_MS);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(autoNextTimer);
    };
  }, [open, activeIndex, stories.length]);

  useEffect(() => {
    if (!open) return;
    const current = stories[activeIndex];
    if (!current) return;
    let cancelled = false;
    void (async () => {
      try {
        const details = await storiesApi.getStory(current.id);
        if (!cancelled) setActiveStory(details);
      } catch {
        if (!cancelled) setActiveStory(current);
      }
      if (isAuthenticated) {
        storiesApi.registerView(current.id).catch(() => {
          // Для истёкших/удалённых сторис backend может вернуть 400 — игнорируем.
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, activeIndex, stories, storiesApi, isAuthenticated]);

  const openStory = (index: number) => {
    setActiveIndex(index);
    setActiveStory(stories[index] || null);
    setProgressValue(100);
    setOpen(true);
  };

  if (loading || stories.length === 0) return null;

  const current = activeStory ?? stories[activeIndex] ?? null;

  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[#222222]">Сторис партнёров</h3>
        <Button
          variant="ghost"
          className="text-[#00AFAE]"
          onClick={async () => {
            try {
              const refreshed = await storiesApi.getFeed(categoryId);
              setStories(refreshed);
              setActiveIndex(0);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Не удалось обновить сторис");
            }
          }}
        >
          Обновить
        </Button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {stories.map((story, index) => (
          <button
            key={story.id}
            type="button"
            onClick={() => openStory(index)}
            className="shrink-0 w-32 rounded-2xl border border-gray-200 bg-white p-1.5 text-left"
          >
            <div className="h-44 rounded-xl overflow-hidden bg-gray-100 mb-2">
              {story.mediaType === "VIDEO" ? (
                <video src={story.mediaUrl} className="w-full h-full object-cover" muted />
              ) : (
                <img src={story.mediaUrl} alt={story.serviceName} className="w-full h-full object-cover" />
              )}
            </div>
            <p className="text-xs text-[#222222] line-clamp-2 px-1">{story.serviceName}</p>
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-none w-auto p-0 overflow-visible border-0 bg-transparent shadow-none [&>button]:hidden">
          {current && (
            <div className="relative h-[86vh] max-h-[860px] w-[min(92vw,430px)] overflow-hidden rounded-[28px] bg-black text-white ring-1 ring-white/20">
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 z-10 pointer-events-none" />
              <div className="absolute left-0 right-0 top-0 z-20 px-3 pt-3 pb-2">
                <div className="flex gap-1.5 mb-3">
                  {stories.map((story, index) => (
                    <div key={story.id} className="h-1 flex-1 rounded-full bg-white/35 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{
                          width:
                            index < activeIndex
                              ? "100%"
                              : index > activeIndex
                                ? "0%"
                                : `${progressValue}%`,
                          transition: index === activeIndex ? `width ${STORY_DURATION_MS}ms linear` : "none",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{current.partnerCompanyName}</p>
                    <p className="text-xs text-white/75">Осталось: {formatLeftTime(current.expiresAt)} · 15 сек</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-black/40 p-2 hover:bg-black/60 transition-colors"
                    aria-label="Закрыть"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="absolute inset-0">
                {current.mediaType === "VIDEO" ? (
                  <video
                    src={current.mediaUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                ) : (
                  <img src={current.mediaUrl} alt={current.serviceName} className="w-full h-full object-cover" />
                )}
              </div>

              <button
                type="button"
                aria-label="Предыдущая сторис"
                className="absolute left-0 top-0 z-20 h-full w-1/2"
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              />
              <button
                type="button"
                aria-label="Следующая сторис"
                className="absolute right-0 top-0 z-20 h-full w-1/2"
                onClick={() => setActiveIndex((prev) => Math.min(stories.length - 1, prev + 1))}
              />

              <div className="absolute left-0 right-0 bottom-0 z-20 p-3 space-y-3">
                <div className="space-y-1">
                  <p className="text-base font-semibold drop-shadow">{current.serviceName}</p>
                  <p className="text-sm text-white/90 drop-shadow line-clamp-3">
                    {current.caption || "Без подписи"}
                  </p>
                  <p className="text-xs text-white/70">Просмотры: {current.viewsCount ?? 0}</p>
                </div>
                <Button
                  className="w-full bg-white text-[#222222] hover:bg-white/90 rounded-xl"
                  onClick={() => {
                    setOpen(false);
                    navigate(`/services/${current.serviceId}`);
                  }}
                >
                  Перейти к услуге
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
