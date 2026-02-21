import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { ChatMessage } from "../services/chat";

interface Props {
  name: string;
  profilePicture: string | null;
  appearance: string;
  brandColor: string;
  initialMessages: string[];
  suggestedMessages: string[];
  showSuggestedAfterFirst: boolean;
  messages: ChatMessage[];
  contrastColor: string;
  generating: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onFeedback: (messageId: string, type: "like" | "dislike") => void;
  onCopy: (messageId: string, content: string) => void;
}

export function ChatMessages({
  name,
  profilePicture,
  appearance,
  brandColor,
  initialMessages,
  suggestedMessages,
  showSuggestedAfterFirst,
  messages,
  contrastColor,
  generating,
  onSuggestionClick,
  onFeedback,
  onCopy,
}: Props) {
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const isDark = appearance === "dark";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 50);
      }
      rafRef.current = 0;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(t);
  }, [messages, scrollToBottom]);

  const showSuggestions =
    suggestedMessages.length > 0 &&
    (showSuggestedAfterFirst || messages.length === 0);

  return (
    <div className="cbw-messages-wrapper">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`cbw-messages ${isDark ? "cbw-messages--dark" : ""}`}
      >
        {/* Initial messages */}
        {initialMessages.length > 0 && (
          <div className="cbw-initial-group">
            {initialMessages.map((msg, i) => {
              const radiusClass =
                i === 0
                  ? "cbw-init-first"
                  : i === initialMessages.length - 1
                    ? "cbw-init-last"
                    : "cbw-init-mid";
              return (
                <div
                  key={i}
                  className={`cbw-msg cbw-msg--assistant ${isDark ? "cbw-msg--dark" : ""} ${radiusClass}`}
                >
                  {i === 0 && (
                    <div className="cbw-msg-sender">
                      {profilePicture && (
                        <img
                          src={profilePicture}
                          alt=""
                          className="cbw-msg-avatar"
                        />
                      )}
                      <span
                        className={`cbw-msg-name ${isDark ? "cbw-msg-name--dark" : ""}`}
                      >
                        {name}
                      </span>
                    </div>
                  )}
                  <div className="cbw-msg-text">{msg}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Chat messages */}
        {messages.length > 0 && (
          <div className="cbw-chat-list">
            {messages.map((chat, index) => {
              const isStreaming =
                chat.role === "assistant" &&
                index === messages.length - 1 &&
                generating;
              const isUser = chat.role === "user";

              return (
                <div
                  key={chat.id || index}
                  className={`cbw-msg-row ${isUser ? "cbw-msg-row--user" : ""}`}
                >
                  <div
                    className={`cbw-msg ${isUser ? "cbw-msg--user" : `cbw-msg--assistant ${isDark ? "cbw-msg--dark" : ""}`} ${isStreaming && !chat.content ? "cbw-msg--loading" : ""}`}
                    style={
                      isUser
                        ? { backgroundColor: brandColor, color: contrastColor }
                        : undefined
                    }
                  >
                    {/* Assistant name + avatar */}
                    {!isUser && !(isStreaming && !chat.content) && (
                      <div className="cbw-msg-sender">
                        {profilePicture && (
                          <img
                            src={profilePicture}
                            alt=""
                            className="cbw-msg-avatar"
                          />
                        )}
                        <span
                          className={`cbw-msg-name ${isDark ? "cbw-msg-name--dark" : ""}`}
                        >
                          {name}
                        </span>
                      </div>
                    )}

                    {/* Typing dots */}
                    {isStreaming && !chat.content && (
                      <div
                        className={`cbw-typing ${isDark ? "cbw-typing--dark" : ""}`}
                      >
                        <span
                          className="cbw-dot"
                          style={{ animationDelay: "0s" }}
                        />
                        <span
                          className="cbw-dot"
                          style={{ animationDelay: "0.15s" }}
                        />
                        <span
                          className="cbw-dot"
                          style={{ animationDelay: "0.3s" }}
                        />
                      </div>
                    )}

                    {/* Message content */}
                    {!(isStreaming && !chat.content) && (
                      <div className="cbw-msg-text">{chat.content}</div>
                    )}
                  </div>

                  {/* Action buttons for assistant messages */}
                  {!isUser && !isStreaming && chat.id && (
                    <div className="cbw-msg-actions">
                      <button
                        className={`cbw-action-btn ${isDark ? "cbw-action-btn--dark" : ""}`}
                        title="Copy"
                        onClick={() => onCopy(chat.id!, chat.content)}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      <button
                        className={`cbw-action-btn ${isDark ? "cbw-action-btn--dark" : ""} ${chat.feedback === "like" ? "cbw-action-btn--active" : ""}`}
                        title="Good response"
                        onClick={() => onFeedback(chat.id!, "like")}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill={
                            chat.feedback === "like" ? "currentColor" : "none"
                          }
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                      </button>
                      <button
                        className={`cbw-action-btn ${isDark ? "cbw-action-btn--dark" : ""} ${chat.feedback === "dislike" ? "cbw-action-btn--active" : ""}`}
                        title="Bad response"
                        onClick={() => onFeedback(chat.id!, "dislike")}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill={
                            chat.feedback === "dislike"
                              ? "currentColor"
                              : "none"
                          }
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="cbw-spacer" />

        {/* Suggested messages */}
        {showSuggestions && (
          <div className="cbw-suggestions">
            {suggestedMessages.map((s, i) => (
              <button
                key={i}
                className={`cbw-suggestion ${isDark ? "cbw-suggestion--dark" : ""}`}
                style={
                  {
                    "--cbw-hover-bg": brandColor,
                    "--cbw-hover-text": contrastColor,
                  } as any
                }
                onClick={() => onSuggestionClick(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className={`cbw-scroll-btn ${isDark ? "cbw-scroll-btn--dark" : ""}`}
          title="Scroll to bottom"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
}
