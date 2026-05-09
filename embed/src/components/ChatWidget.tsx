import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import {
  fetchConfig,
  fetchChatSession,
  fetchChatSessions,
  sendFeedback,
  type ChatbotConfig,
  type ChatSessionSummary,
} from "../services/api";
import {
  downloadChatSession,
  streamChat,
  type ChatMessage,
} from "../services/chat";
import { getContrastColor } from "../utils";
import { ChatBubbleButton } from "./ChatBubbleButton";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatSessions } from "./ChatSessions";

interface Props {
  embedKey: string;
  apiBase: string;
  mode: "widget" | "iframe";
  // Stable identifier for this end user. Used for both chat-send (so the
  // backend can attach an EndUser row to each session) and the recent-chats
  // lookup. Always present — `resolveEndUserIdentifier` falls back to a
  // generated anon UUID when nothing else is known.
  endUserIdentifier: string;
}

export function ChatWidget({
  embedKey,
  apiBase,
  mode,
  endUserIdentifier,
}: Props) {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [open, setOpen] = useState(mode === "iframe");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [chatView, setChatView] = useState<"session" | "recent">("session");
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[] | null>(null);
  const [chatSessionsLoading, setChatSessionsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Track streaming content with a ref to avoid stale closures
  const streamContentRef = useRef("");
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped whenever the active session changes (load-by-id, reset). In-flight
  // stream callbacks and session fetches check this before writing state, so a
  // stale operation can't clobber the new view.
  const sessionEpochRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const showError = useCallback((msg: string) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 3000);
  }, []);

  // Fetch config on mount
  useEffect(() => {
    fetchConfig(apiBase, embedKey)
      .then((c) => {
        if (!mountedRef.current) return;
        setConfig(c);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setError("Failed to load chatbot");
      });
  }, [apiBase, embedKey]);

  // Autoshow popup after delay
  useEffect(() => {
    if (!config || mode !== "widget" || !config.autoshowInitialPopup) return;
    const delay = (config.autoshowDelaySeconds ?? 3) * 1000;
    const timer = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(timer);
  }, [config, mode]);

  const handleSend = useCallback(
    async (messageText?: string) => {
      const text = (messageText || input).trim();
      if (!text || streaming) return;

      setInput("");

      // Add user message
      const userMsg: ChatMessage = {
        role: "user",
        content: text,
        isAction: false,
        actionType: null,
        actionMeta: null,
      };
      // Add placeholder assistant message
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "",
        isAction: false,
        actionType: null,
        actionMeta: null,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      setStreaming(true);
      streamContentRef.current = "";
      const epoch = sessionEpochRef.current;
      const isCurrent = () =>
        mountedRef.current && sessionEpochRef.current === epoch;

      try {
        await streamChat(apiBase, embedKey, text, sessionId, endUserIdentifier, {
          onSessionId: (id) => {
            if (!isCurrent()) return;
            setSessionId(id);
          },
          onToken: (token) => {
            streamContentRef.current += token;
            if (!isCurrent()) return;
            const content = streamContentRef.current;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content,
              };
              return updated;
            });
          },
          onDone: (finalMsg) => {
            if (!isCurrent()) return;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = finalMsg;
              return updated;
            });
            setStreaming(false);
          },
          onError: (errMsg) => {
            if (!isCurrent()) return;
            setMessages((prev) => prev.slice(0, -1));
            showError(errMsg);
            setStreaming(false);
          },
        });
      } catch {
        if (!isCurrent()) return;
        setMessages((prev) => prev.slice(0, -1));
        showError("Connection failed");
        setStreaming(false);
      }
    },
    [input, streaming, apiBase, embedKey, sessionId, endUserIdentifier, showError],
  );

  const handleFeedback = useCallback(
    (messageId: string, type: "like" | "dislike") => {
      if (!sessionId) return;
      // Toggle: if same feedback, remove it
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, feedback: m.feedback === type ? null : type }
            : m,
        ),
      );
      const msg = messages.find((m) => m.id === messageId);
      const newFeedback = msg?.feedback === type ? null : type;
      sendFeedback(apiBase, embedKey, sessionId, messageId, newFeedback).catch(
        () => {},
      );
    },
    [apiBase, embedKey, sessionId, messages],
  );

  const handleCopy = useCallback((_messageId: string, content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
  }, []);

  const handleReset = useCallback(() => {
    sessionEpochRef.current++;
    setMessages([]);
    setSessionId(null);
    setStreaming(false);
    setMessagesLoading(false);
    setChatView("session");
  }, []);

  const handleViewRecent = useCallback(async () => {
    setChatView("recent");
    setChatSessionsLoading(true);
    const epoch = sessionEpochRef.current;
    try {
      const sessions = await fetchChatSessions(
        apiBase,
        embedKey,
        endUserIdentifier,
      );
      if (!mountedRef.current || sessionEpochRef.current !== epoch) return;
      setChatSessions(sessions);
    } catch {
      if (!mountedRef.current || sessionEpochRef.current !== epoch) return;
      setChatSessions([]);
      showError("Failed to load chats");
    } finally {
      if (mountedRef.current && sessionEpochRef.current === epoch) {
        setChatSessionsLoading(false);
      }
    }
  }, [apiBase, embedKey, endUserIdentifier, showError]);

  const handleBack = useCallback(() => {
    setChatView("session");
  }, []);

  const handleSelectChatSession = useCallback(
    async (id: string) => {
      const epoch = ++sessionEpochRef.current;
      setChatView("session");
      setSessionId(id);
      setMessages([]);
      setStreaming(false);
      setMessagesLoading(true);
      try {
        const session = await fetchChatSession(apiBase, embedKey, id);
        if (!mountedRef.current || sessionEpochRef.current !== epoch) return;
        const mapped: ChatMessage[] = (session.messages ?? []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          feedback: m.feedback ?? null,
          isAction: m.isAction ?? false,
          actionType: m.actionType ?? null,
          actionMeta: m.actionMeta ?? null,
        }));
        setMessages(mapped);
      } catch {
        if (!mountedRef.current || sessionEpochRef.current !== epoch) return;
        showError("Failed to load chat");
      } finally {
        if (mountedRef.current && sessionEpochRef.current === epoch) {
          setMessagesLoading(false);
        }
      }
    },
    [apiBase, embedKey, showError],
  );

  const handleDownload = useCallback(async () => {
    if (!sessionId) {
      showError("Send a message first to start a chat");
      return;
    }
    try {
      const blob = await downloadChatSession(apiBase, embedKey, sessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showError("Failed to download chat");
    }
  }, [apiBase, embedKey, sessionId, showError]);

  const handleActionSelect = useCallback(
    (actionType: string, value: string) => {
      if (
        actionType === "booking" ||
        actionType === "confirm_date" ||
        actionType === "confirm_time"
      ) {
        handleSend(value);
      }
    },
    [handleSend],
  );

  const handleActionCancel = useCallback(
    (actionType: string) => {
      if (
        actionType === "booking" ||
        actionType === "confirm_date" ||
        actionType === "confirm_time"
      ) {
        handleSend("cancel booking");
      }
    },
    [handleSend],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend],
  );

  // Loading state
  if (!config) {
    if (error) return null; // Silently fail — don't break host page
    return null; // Still loading
  }

  const isDark = config.appearance === "dark";
  const { contrastHex } = getContrastColor(config.brandColor);
  const headerTextColor = config.brandColorForHeader
    ? contrastHex
    : isDark
      ? "#ffffff"
      : "#18181b";

  const chatWindow = (
    <div
      className={`cbw-window ${isDark ? "cbw-window--dark" : ""} ${mode === "iframe" ? "cbw-window--iframe" : ""} ${config.chatBubbleButtonPosition === "left" ? "cbw-window--left" : ""}`}
    >
      <ChatHeader
        name={config.name}
        profilePicture={config.profilePicture}
        brandColor={config.brandColor}
        brandColorForHeader={config.brandColorForHeader}
        headerTextColor={headerTextColor}
        canDownload={messages.length > 0 && !!sessionId}
        chatView={chatView}
        onReset={handleReset}
        onDownloadChat={handleDownload}
        onHandleView={handleViewRecent}
        onBack={handleBack}
        onClose={mode === "widget" ? () => setOpen(false) : undefined}
      />
      <div className="cbw-body">
        {chatView === "recent" ? (
          <ChatSessions
            appearance={config.appearance}
            chatSessions={chatSessions}
            loading={chatSessionsLoading}
            brandColor={config.brandColor}
            buttonTextColor={contrastHex}
            onSelectSession={handleSelectChatSession}
            onStartNewChat={handleReset}
          />
        ) : (
          <>
        {messagesLoading ? (
          <div className="cbw-messages-loading">
            <div className={`cbw-spinner${isDark ? " cbw-spinner--light" : ""}`} />
          </div>
        ) : (
        <ChatMessages
          name={config.name}
          profilePicture={config.profilePicture}
          appearance={config.appearance}
          brandColor={config.brandColor}
          initialMessages={config.initialMessages}
          suggestedMessages={config.suggestedMessages}
          showSuggestedAfterFirst={config.showSuggestedAfterFirst}
          messages={messages}
          contrastColor={contrastHex}
          generating={streaming}
          onSuggestionClick={handleSuggestionClick}
          onFeedback={handleFeedback}
          onCopy={handleCopy}
          onActionSelect={handleActionSelect}
          onActionCancel={handleActionCancel}
        />
        )}
        <ChatInput
          appearance={config.appearance}
          messagePlaceholder={config.messagePlaceholder}
          dismissibleNotice={config.dismissibleNotice}
          footer={config.footer}
          value={input}
          onChange={setInput}
          onSubmit={() => handleSend()}
          disabled={(() => {
            if (streaming) return true;
            const last = messages[messages.length - 1];
            if (!last?.isAction) return false;
            if (last.actionType === "booking") {
              return (
                ((last.actionMeta as { dates?: unknown[] } | null)?.dates
                  ?.length ?? 0) > 0
              );
            }
            if (last.actionType === "confirm_date") {
              return (
                ((last.actionMeta as { timeslots?: unknown[] } | null)
                  ?.timeslots?.length ?? 0) > 0
              );
            }
            if (last.actionType === "confirm_time") return true;
            return false;
          })()}
        />
          </>
        )}
      </div>
      {error && <div className="cbw-error">{error}</div>}
    </div>
  );

  // Iframe mode — just the chat window, no bubble
  if (mode === "iframe") {
    return (
      <div className={`cbw-root ${isDark ? "cbw-dark" : ""}`}>{chatWindow}</div>
    );
  }

  // Widget mode — bubble + expandable window
  return (
    <div className={`cbw-root ${isDark ? "cbw-dark" : ""}`}>
      {open && chatWindow}
      <ChatBubbleButton
        color={config.chatBubbleButtonColor || config.brandColor}
        icon={config.chatIcon}
        isOpen={open}
        onClick={() => setOpen((prev) => !prev)}
        position={config.chatBubbleButtonPosition}
      />
    </div>
  );
}
