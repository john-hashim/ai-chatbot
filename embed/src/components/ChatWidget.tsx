import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import { fetchConfig, sendFeedback, type ChatbotConfig } from "../services/api";
import { streamChat, type ChatMessage } from "../services/chat";
import { getContrastColor } from "../utils";
import { ChatBubbleButton } from "./ChatBubbleButton";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

interface Props {
  embedKey: string;
  apiBase: string;
  mode: "widget" | "iframe";
}

export function ChatWidget({ embedKey, apiBase, mode }: Props) {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [open, setOpen] = useState(mode === "iframe");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Track streaming content with a ref to avoid stale closures
  const streamContentRef = useRef("");
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear error timer on unmount
  useEffect(() => {
    return () => {
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
      .then(setConfig)
      .catch(() => setError("Failed to load chatbot"));
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

      try {
        await streamChat(apiBase, embedKey, text, sessionId, {
          onSessionId: (id) => setSessionId(id),
          onToken: (token) => {
            streamContentRef.current += token;
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
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = finalMsg;
              return updated;
            });
            setStreaming(false);
          },
          onError: (errMsg) => {
            // Remove the empty assistant placeholder on error
            setMessages((prev) => prev.slice(0, -1));
            showError(errMsg);
            setStreaming(false);
          },
        });
      } catch {
        setMessages((prev) => prev.slice(0, -1));
        showError("Connection failed");
        setStreaming(false);
      }
    },
    [input, streaming, apiBase, embedKey, sessionId, showError],
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
    setMessages([]);
    setSessionId(null);
  }, []);

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
        onReset={handleReset}
        onClose={mode === "widget" ? () => setOpen(false) : undefined}
      />
      <div className="cbw-body">
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
        <ChatInput
          appearance={config.appearance}
          messagePlaceholder={config.messagePlaceholder}
          dismissibleNotice={config.dismissibleNotice}
          footer={config.footer}
          value={input}
          onChange={setInput}
          onSubmit={() => handleSend()}
          disabled={
            streaming ||
            messages[messages.length - 1]?.actionType === "booking" ||
            messages[messages.length - 1]?.actionType === "confirm_date" ||
            messages[messages.length - 1]?.actionType === "confirm_time"
          }
        />
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
