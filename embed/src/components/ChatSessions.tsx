import type { ChatSessionSummary } from "../services/api";
import { formatRelativeDate } from "../utils";

interface Props {
  appearance: string;
  chatSessions: ChatSessionSummary[] | null;
  loading: boolean;
  brandColor: string;
  buttonTextColor: string;
  onSelectSession: (sessionId: string) => void;
  onStartNewChat: () => void;
}

export function ChatSessions({
  appearance,
  chatSessions,
  loading,
  brandColor,
  buttonTextColor,
  onSelectSession,
  onStartNewChat,
}: Props) {
  const isDark = appearance === "dark";

  return (
    <div className={`cbw-sessions${isDark ? " cbw-sessions--dark" : ""}`}>
      <div className="cbw-sessions-list">
        {loading || !chatSessions ? (
          <div className="cbw-sessions-loading">
            <div className={`cbw-spinner${isDark ? " cbw-spinner--light" : ""}`} />
          </div>
        ) : chatSessions.length === 0 ? (
          <div className="cbw-sessions-empty">No chats recorded</div>
        ) : (
          chatSessions.map((chat) => {
            const assistantMsg = chat.messages?.find((m) => m.role === "assistant");
            const userMsg = chat.messages?.find((m) => m.role === "user");
            return (
              <button
                type="button"
                key={chat.id}
                className="cbw-session-item"
                onClick={() => onSelectSession(chat.id)}
              >
                <div className="cbw-session-row">
                  <span className="cbw-session-title">
                    {assistantMsg?.content ?? "No response yet"}
                  </span>
                  <span className="cbw-session-time">
                    {formatRelativeDate(chat.updatedAt)}
                  </span>
                </div>
                <div className="cbw-session-preview">
                  {userMsg?.content ?? "No message"}
                </div>
              </button>
            );
          })
        )}
      </div>
      <div className="cbw-sessions-footer">
        <button
          type="button"
          className="cbw-start-new-chat"
          onClick={onStartNewChat}
          style={{ backgroundColor: brandColor, color: buttonTextColor }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
          </svg>
          Start new chat
        </button>
      </div>
    </div>
  );
}
