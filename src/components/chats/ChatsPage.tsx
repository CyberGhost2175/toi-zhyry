import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, MessageCircle } from "lucide-react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useAuth } from "../../contexts/AuthContext";
import { ChatMessageResponse, ChatResponse, ChatsApi } from "../../data/api/ChatsApi";
import { AUTH_TOKENS_UPDATED_EVENT, getApiBaseUrl } from "../../utils/authorizedFetch";

const chatsApi = new ChatsApi();

function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [loadingChats, setLoadingChats] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatResponse[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const myId = (user?.id || "").trim();
  const role = user?.role?.toUpperCase();
  const asPartner = role === "PARTNER";
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [topicSubscription, setTopicSubscription] = useState<StompSubscription | null>(null);
  const requestedChatId = searchParams.get("chatId");

  const upsertMessage = (incoming: ChatMessageResponse) => {
    setMessages((prev) => {
      const index = prev.findIndex((item) => item.id === incoming.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], ...incoming };
        return next;
      }
      return [...prev, incoming];
    });
  };

  const parseMessage = (frame: IMessage): ChatMessageResponse | null => {
    try {
      return JSON.parse(frame.body) as ChatMessageResponse;
    } catch {
      return null;
    }
  };

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? null,
    [chats, activeChatId]
  );
  const getChatTitle = (chat: ChatResponse): string =>
    asPartner ? chat.userFullName || "Клиент" : chat.partnerCompanyName || "Партнер";

  const loadChats = async () => {
    try {
      setLoadingChats(true);
      setChatError(null);
      const response = await chatsApi.getMyChats(asPartner, { page: 0, size: 50 });
      const list = response.content || [];
      setChats(list);
      setActiveChatId((prev) => {
        if (requestedChatId && list.some((chat) => chat.id === requestedChatId)) return requestedChatId;
        return prev ?? list[0]?.id ?? null;
      });
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Не удалось загрузить чаты");
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      setLoadingMessages(true);
      setMessagesError(null);
      const response = await chatsApi.getMessages(chatId, { page: 0, size: 100 });
      const unique = new Map<string, ChatMessageResponse>();
      [...(response.content || [])].reverse().forEach((message) => {
        unique.set(message.id, message);
      });
      setMessages(Array.from(unique.values()));
      await chatsApi.markAsRead(chatId).catch(() => {});
      setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat)));
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : "Не удалось загрузить сообщения");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, [asPartner]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const base =
      process.env.NODE_ENV === "development"
        ? process.env.REACT_APP_API_URL || "http://localhost:8080"
        : getApiBaseUrl();
    const wsUrl = `${base}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setWsConnected(true);

        client.subscribe("/user/queue/chat-ack", (frame) => {
          const ack = parseMessage(frame);
          if (!ack) return;
          upsertMessage(ack);
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === ack.chatId
                ? {
                    ...chat,
                    lastMessageAt: ack.createdAt,
                    lastMessageContent: ack.content,
                    lastMessageSenderId: ack.senderId,
                  }
                : chat
            )
          );
        });

        client.subscribe("/user/queue/chat-read", (frame) => {
          try {
            const event = JSON.parse(frame.body) as { chatId: string; readAt: string };
            setMessages((prev) =>
              prev.map((message) =>
                message.chatId === event.chatId && message.senderId === myId && !message.isRead
                  ? { ...message, isRead: true, readAt: event.readAt }
                  : message
              )
            );
          } catch {
            // ignore malformed payload
          }
        });
      },
      onWebSocketClose: () => {
        setWsConnected(false);
      },
      onStompError: () => {
        setWsConnected(false);
      },
    });

    client.activate();
    setStompClient(client);

    const reconnectOnTokenUpdate = () => {
      client.deactivate();
      const refreshedToken = localStorage.getItem("authToken");
      if (!refreshedToken) return;
      client.configure({
        connectHeaders: {
          Authorization: `Bearer ${refreshedToken}`,
        },
      });
      client.activate();
    };

    window.addEventListener(AUTH_TOKENS_UPDATED_EVENT, reconnectOnTokenUpdate);

    return () => {
      window.removeEventListener(AUTH_TOKENS_UPDATED_EVENT, reconnectOnTokenUpdate);
      setTopicSubscription((current) => {
        current?.unsubscribe();
        return null;
      });
      client.deactivate();
      setWsConnected(false);
      setStompClient(null);
    };
  }, [isAuthenticated, myId]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    if (requestedChatId !== activeChatId) {
      setSearchParams((params) => {
        const next = new URLSearchParams(params);
        next.set("chatId", activeChatId);
        return next;
      });
    }
    loadMessages(activeChatId);
  }, [activeChatId, requestedChatId, setSearchParams]);

  useEffect(() => {
    if (!stompClient || !wsConnected || !activeChatId) return;

    setTopicSubscription((current) => {
      current?.unsubscribe();
      return stompClient.subscribe(`/topic/chats/${activeChatId}`, (frame) => {
        const incoming = parseMessage(frame);
        if (!incoming) return;

        upsertMessage(incoming);
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === incoming.chatId
              ? {
                  ...chat,
                  lastMessageAt: incoming.createdAt,
                  lastMessageContent: incoming.content,
                  lastMessageSenderId: incoming.senderId,
                  unreadCount:
                    incoming.chatId === activeChatId
                      ? 0
                      : incoming.senderId === myId
                      ? chat.unreadCount
                      : chat.unreadCount + 1,
                }
              : chat
          )
        );
      });
    });

    return () => {
      setTopicSubscription((current) => {
        current?.unsubscribe();
        return null;
      });
    };
  }, [stompClient, wsConnected, activeChatId, myId]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeChatId || !draft.trim()) return;
    const content = draft.trim();
    try {
      setIsSending(true);

      if (stompClient && wsConnected) {
        stompClient.publish({
          destination: `/app/chat.send/${activeChatId}`,
          body: JSON.stringify({ content, attachmentUrls: null }),
        });
      } else {
        const sent = await chatsApi.sendMessage(activeChatId, { content, attachmentUrls: null });
        upsertMessage(sent);
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  lastMessageAt: sent.createdAt,
                  lastMessageContent: sent.content,
                  lastMessageSenderId: sent.senderId,
                }
              : chat
          )
        );
      }

      setDraft("");
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : "Не удалось отправить сообщение");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[70vh] grid grid-cols-1 md:grid-cols-[320px_1fr]">
        <aside className="border-r border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#222222]">Чаты</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${wsConnected ? "bg-green-500" : "bg-gray-300"}`} />
              <Button variant="outline" size="sm" onClick={loadChats}>
                Обновить
              </Button>
            </div>
          </div>
          {loadingChats ? (
            <div className="p-6 text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Загрузка...
            </div>
          ) : chatError ? (
            <div className="p-4 text-sm text-red-600">{chatError}</div>
          ) : chats.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">У вас пока нет диалогов.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    activeChatId === chat.id ? "bg-[#00AFAE]/10" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm text-[#222222] truncate">{getChatTitle(chat)}</p>
                    <span className="text-xs text-gray-500">{formatDate(chat.lastMessageAt || chat.createdAt)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500 truncate">{chat.lastMessageContent || "Нет сообщений"}</p>
                    {chat.unreadCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00AFAE] text-white">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-[#222222]">
              {activeChat ? getChatTitle(activeChat) : "Выберите чат"}
            </h3>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-[#F9F9F9]">
            {loadingMessages ? (
              <div className="text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Загрузка сообщений...
              </div>
            ) : messagesError ? (
              <div className="text-sm text-red-600">{messagesError}</div>
            ) : !activeChatId ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                  Выберите диалог слева
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">Сообщений пока нет.</div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const own = !!myId && message.senderId === myId;
                  return (
                    <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          own ? "bg-[#00AFAE] text-white" : "bg-white border border-gray-200 text-[#222222]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content || "Вложение"}</p>
                        <p className={`text-[11px] mt-1 ${own ? "text-white/80" : "text-gray-500"}`}>
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white">
            <div className="flex gap-3 items-end">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={activeChatId ? "Введите сообщение..." : "Сначала выберите чат"}
                disabled={!activeChatId || isSending}
                className="min-h-[42px] max-h-36"
              />
              <Button type="submit" disabled={!activeChatId || isSending || !draft.trim()} className="text-white bg-[#00AFAE] hover:bg-[#00AFAE]/90">
                {isSending ? "..." : "Отправить"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
