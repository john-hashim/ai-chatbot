import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import snarkdown from "snarkdown";
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

const CopyIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ThumbUpIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const ThumbDownIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const ActionButton = ({
  label,
  icon,
  onClick,
  isDark,
}: {
  label: string;
  icon: preact.ComponentChildren;
  onClick?: () => void;
  isDark: boolean;
}) => (
  <button
    className={`cbw-action-btn${isDark ? " cbw-action-btn--dark" : ""}`}
    title={label}
    onClick={onClick}
  >
    {icon}
  </button>
);

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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [loaderContainerHeight, setLoaderContainerHeight] = useState<number>(0);

  const isDark = appearance === "dark";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const rafRef = useRef(0);

  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          scrollContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setShowScrollButton(!isAtBottom);
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
    const messageBubbles =
      scrollContainerRef.current?.querySelectorAll("[data-message]");
    if (
      messageBubbles &&
      messageBubbles.length >= 2 &&
      scrollContainerRef.current?.clientHeight
    ) {
      const secondLast = messageBubbles[messageBubbles.length - 2];
      const bubbleHeight = secondLast.getBoundingClientRect().height;
      setLoaderContainerHeight(
        scrollContainerRef.current.clientHeight - (bubbleHeight + 70),
      );
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      });
      return () => clearTimeout(timeoutId);
    }
  }, [messages, scrollToBottom]);

  return (
    <div className="cbw-messages-wrapper">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`cbw-messages${isDark ? " cbw-messages--dark" : ""}`}
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
                  className={`cbw-msg cbw-msg--assistant${isDark ? " cbw-msg--dark" : ""} ${radiusClass}`}
                >
                  {i === 0 && (
                    <div className="cbw-msg-sender">
                      {profilePicture && (
                        <img
                          src={profilePicture}
                          alt="Chatbot Avatar"
                          className="cbw-msg-avatar"
                        />
                      )}
                      <span
                        className={`cbw-msg-name${isDark ? " cbw-msg-name--dark" : ""}`}
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
              const isGenerating =
                chat.role === "assistant" &&
                index === messages.length - 1 &&
                generating;
              const isUser = chat.role === "user";

              return (
                <div
                  key={index}
                  data-message
                  className={`cbw-msg-row${isUser ? " cbw-msg-row--user" : ""}`}
                >
                  <div
                    className={`cbw-msg${
                      isUser
                        ? " cbw-msg--user"
                        : chat.role === "assistant" &&
                            !(isGenerating && !chat.content)
                          ? ` cbw-msg--assistant${isDark ? " cbw-msg--dark" : ""}`
                          : ""
                    }`}
                    style={
                      isUser
                        ? { backgroundColor: brandColor, color: contrastColor }
                        : undefined
                    }
                  >
                    <div
                      className="cbw-msg-content"
                      style={
                        isGenerating && !chat.content
                          ? { minHeight: `${loaderContainerHeight}px` }
                          : undefined
                      }
                    >
                      {/* Avatar + name */}
                      {chat.role === "assistant" &&
                        !(isGenerating && !chat.content) && (
                          <div className="cbw-msg-sender">
                            {profilePicture && (
                              <img
                                src={profilePicture}
                                alt="Chatbot Avatar"
                                className="cbw-msg-avatar"
                              />
                            )}
                            <span
                              className={`cbw-msg-name${isDark ? " cbw-msg-name--dark" : ""}`}
                            >
                              {name}
                            </span>
                          </div>
                        )}

                      {/* Typing dots */}
                      {isGenerating && !chat.content && (
                        <div
                          className={`cbw-typing${isDark ? " cbw-typing--dark" : ""}`}
                        >
                          <span className="cbw-dots">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="cbw-dot"
                                style={{
                                  animationDelay: `${-0.15 * (2 - i)}s`,
                                }}
                              />
                            ))}
                          </span>
                        </div>
                      )}

                      {/* Message content */}
                      {!(isGenerating && !chat.content) && (
                        chat.isAction && chat.actionType === "booking"
                          ? (
                            <div className="cbw-booking cbw-animate-message-in">
                              <p className={`cbw-booking-label${isDark ? " cbw-booking-label--dark" : ""}`}>
                                Here are the available dates for booking, please select one
                              </p>
                              <div className="cbw-booking-dates">
                                {(chat.actionMeta as { dates: { value: string; label: string }[] })?.dates?.map((date) => (
                                  <div
                                    key={date.value}
                                    className={`cbw-booking-date${isDark ? " cbw-booking-date--dark" : ""}`}
                                  >
                                    {date.label}
                                  </div>
                                ))}
                                <div className="cbw-booking-date cbw-booking-date--cancel">
                                  Cancel Appointment
                                </div>
                              </div>
                            </div>
                          )
                          : (
                            <div
                              className="cbw-msg-text cbw-animate-message-in"
                              dangerouslySetInnerHTML={{
                                __html: snarkdown(chat.content || "dummy content"),
                              }}
                            />
                          )
                      )}
                    </div>
                  </div>

                  {/* Action buttons (assistant only, not generating) */}
                  {chat.role === "assistant" && !isGenerating && (
                    <div className="cbw-msg-actions">
                      <ActionButton
                        isDark={isDark}
                        label="Copy"
                        icon={<CopyIcon />}
                        onClick={() => onCopy(chat.id!, chat.content)}
                      />
                      <ActionButton
                        isDark={isDark}
                        label="Good response"
                        icon={<ThumbUpIcon filled={chat.feedback === "like"} />}
                        onClick={() => onFeedback(chat.id!, "like")}
                      />
                      <ActionButton
                        isDark={isDark}
                        label="Bad response"
                        icon={
                          <ThumbDownIcon filled={chat.feedback === "dislike"} />
                        }
                        onClick={() => onFeedback(chat.id!, "dislike")}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="cbw-spacer" />

        {/* Suggested messages */}
        {suggestedMessages.length > 0 &&
          (showSuggestedAfterFirst || messages.length === 0) && (
            <div className="cbw-suggestions">
              {suggestedMessages.map((s, i) => (
                <div
                  key={i}
                  className={`cbw-suggestion${isDark ? " cbw-suggestion--dark" : ""}`}
                  style={
                    {
                      "--cbw-hover-bg": brandColor,
                      "--cbw-hover-text": contrastColor,
                    } as any
                  }
                  onClick={() => onSuggestionClick(s)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={`cbw-scroll-btn${isDark ? " cbw-scroll-btn--dark" : ""}`}
          title="Scroll to bottom"
        >
          <ArrowDownIcon />
        </button>
      )}
    </div>
  );
}
