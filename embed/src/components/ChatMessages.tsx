import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import snarkdown from "snarkdown";
import type { ChatMessage } from "../services/chat";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ordinalSuffix = (n: number): string => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const parseBookingPayload = (
  content: string,
): { date?: string; time?: string; name?: string; email?: string } | null => {
  if (!content || content[0] !== "{") return null;
  try {
    const parsed = JSON.parse(content);
    const date =
      typeof parsed?.booking_confirm_date === "string"
        ? parsed.booking_confirm_date
        : undefined;
    const time =
      typeof parsed?.booking_confirm_time === "string"
        ? parsed.booking_confirm_time
        : undefined;
    const name = typeof parsed?.name === "string" ? parsed.name : undefined;
    const email = typeof parsed?.email === "string" ? parsed.email : undefined;
    if (date || time || name || email) return { date, time, name, email };
  } catch {
    /* not JSON */
  }
  return null;
};

const formatBookingDate = (dateStr: string): string => {
  const [yStr, mStr, dStr] = dateStr.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  const month = MONTH_NAMES[m - 1] ?? "";
  const weekday = WEEKDAY_NAMES[dt.getDay()] ?? "";
  return `${d}${ordinalSuffix(d)} ${month} ${y}, ${weekday}`;
};

const formatBookingTime = (time: string): string => {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  if (Number.isNaN(h) || !mStr) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${String(hour12).padStart(2, "0")}:${mStr} ${period}`;
};

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
  onActionSelect?: (actionType: string, value: string) => void;
  onActionCancel?: (actionType: string) => void;
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ConfirmTimeForm = ({
  meta,
  isLast,
  isDark,
  content,
  onSubmit,
  onCancel,
}: {
  meta: { date: string; timeslot: string } | null;
  isLast: boolean;
  isDark: boolean;
  content: string;
  onSubmit: (payload: string) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const trimmedEmail = email.trim();
  const isEmailValid = EMAIL_REGEX.test(trimmedEmail);
  const canSubmit = !!name.trim() && isEmailValid && !!meta;
  const showEmailError = emailTouched && !!trimmedEmail && !isEmailValid;

  const handleSubmit = () => {
    if (!canSubmit || !meta) return;
    onSubmit(
      JSON.stringify({
        booking_confirm_date: meta.date,
        booking_confirm_time: meta.timeslot,
        name: name.trim(),
        email: trimmedEmail,
      }),
    );
  };

  const lockedActionStyle = !isLast
    ? { pointerEvents: "none" as const, opacity: 0.8 }
    : undefined;

  return (
    <div
      className="cbw-booking cbw-animate-message-in"
      style={lockedActionStyle}
    >
      <p
        className={`cbw-booking-label${isDark ? " cbw-booking-label--dark" : ""}`}
      >
        {content}
      </p>
      <div className="cbw-booking-fields">
        <input
          className={`cbw-booking-input${isDark ? " cbw-booking-input--dark" : ""}`}
          type="text"
          placeholder="Name"
          value={name}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
        />
        <input
          className={`cbw-booking-input${isDark ? " cbw-booking-input--dark" : ""}${showEmailError ? " cbw-booking-input--error" : ""}`}
          type="email"
          placeholder="Email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          onBlur={() => setEmailTouched(true)}
        />
        {showEmailError && (
          <p className="cbw-booking-error">Please enter a valid email</p>
        )}
      </div>
      <div className="cbw-booking-dates">
        <div
          className={`cbw-booking-date${isDark ? " cbw-booking-date--dark" : ""}${!canSubmit ? " cbw-booking-date--disabled" : ""}`}
          onClick={canSubmit ? handleSubmit : undefined}
        >
          Confirm Appointment
        </div>
        <div
          className="cbw-booking-date cbw-booking-date--cancel"
          onClick={onCancel}
        >
          Cancel Appointment
        </div>
      </div>
    </div>
  );
};

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
  onActionSelect,
  onActionCancel,
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
              const isLast = index === messages.length - 1;
              const lockedActionStyle = !isLast
                ? { pointerEvents: "none" as const, opacity: 0.8 }
                : undefined;

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
                      {!(isGenerating && !chat.content) &&
                        (chat.isAction && chat.actionType === "booking" ? (
                          <div
                            className="cbw-booking cbw-animate-message-in"
                            style={lockedActionStyle}
                          >
                            <p
                              className={`cbw-booking-label${isDark ? " cbw-booking-label--dark" : ""}`}
                            >
                              Here are the available dates for booking, please
                              select one
                            </p>
                            <div className="cbw-booking-dates">
                              {(
                                chat.actionMeta as {
                                  dates: { value: string; label: string }[];
                                }
                              )?.dates?.map((date) => (
                                <div
                                  key={date.value}
                                  className={`cbw-booking-date${isDark ? " cbw-booking-date--dark" : ""}`}
                                  onClick={() =>
                                    onActionSelect?.(
                                      chat.actionType!,
                                      JSON.stringify({
                                        booking_confirm_date: date.value,
                                      }),
                                    )
                                  }
                                >
                                  {date.label}
                                </div>
                              ))}
                              <div
                                className="cbw-booking-date cbw-booking-date--cancel"
                                onClick={() =>
                                  onActionCancel?.(chat.actionType!)
                                }
                              >
                                Cancel Appointment
                              </div>
                            </div>
                          </div>
                        ) : chat.isAction &&
                          chat.actionType === "confirm_time" ? (
                          <ConfirmTimeForm
                            meta={
                              chat.actionMeta as {
                                date: string;
                                timeslot: string;
                              } | null
                            }
                            isLast={isLast}
                            isDark={isDark}
                            content={chat.content}
                            onSubmit={(payload) =>
                              onActionSelect?.(chat.actionType!, payload)
                            }
                            onCancel={() => onActionCancel?.(chat.actionType!)}
                          />
                        ) : chat.isAction &&
                          chat.actionType === "confirm_date" ? (
                          <div
                            className="cbw-booking cbw-animate-message-in"
                            style={lockedActionStyle}
                          >
                            <p
                              className={`cbw-booking-label${isDark ? " cbw-booking-label--dark" : ""}`}
                            >
                              Here are the available time slots, please select
                              one
                            </p>
                            <div className="cbw-booking-dates">
                              {(() => {
                                const meta = chat.actionMeta as {
                                  date: string;
                                  timeslots: { value: string; label: string }[];
                                } | null;
                                return meta?.timeslots?.map((slot) => (
                                  <div
                                    key={slot.value}
                                    className={`cbw-booking-date${isDark ? " cbw-booking-date--dark" : ""}`}
                                    onClick={() =>
                                      onActionSelect?.(
                                        chat.actionType!,
                                        JSON.stringify({
                                          booking_confirm_date: meta.date,
                                          booking_confirm_time: slot.value,
                                        }),
                                      )
                                    }
                                  >
                                    {slot.label}
                                  </div>
                                ));
                              })()}
                              <div
                                className="cbw-booking-date cbw-booking-date--cancel"
                                onClick={() =>
                                  onActionCancel?.(chat.actionType!)
                                }
                              >
                                Cancel Appointment
                              </div>
                            </div>
                          </div>
                        ) : (
                          (() => {
                            if (chat.role === "user") {
                              const payload = parseBookingPayload(chat.content);
                              if (payload?.name && payload?.email) {
                                return (
                                  <div className="cbw-msg-text cbw-animate-message-in cbw-booking-summary">
                                    <span>Name: {payload.name}</span>
                                    <span>Email: {payload.email}</span>
                                  </div>
                                );
                              }
                              if (payload?.time) {
                                return (
                                  <div className="cbw-msg-text cbw-animate-message-in">
                                    {formatBookingTime(payload.time)}
                                  </div>
                                );
                              }
                              if (payload?.date) {
                                return (
                                  <div className="cbw-msg-text cbw-animate-message-in">
                                    {formatBookingDate(payload.date)}
                                  </div>
                                );
                              }
                            }
                            return (
                              <div
                                className="cbw-msg-text cbw-animate-message-in"
                                dangerouslySetInnerHTML={{
                                  __html: snarkdown(
                                    chat.content || "dummy content",
                                  ),
                                }}
                              />
                            );
                          })()
                        ))}
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
