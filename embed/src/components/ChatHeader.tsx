import { useEffect, useRef, useState } from "preact/hooks";

interface Props {
  name: string;
  profilePicture: string | null;
  brandColor: string;
  brandColorForHeader: boolean;
  headerTextColor: string;
  canDownload: boolean;
  chatView: "session" | "recent";
  onReset: () => void;
  onDownloadChat: () => void;
  onHandleView: () => void;
  onBack: () => void;
  onClose?: () => void;
}

export function ChatHeader({
  name,
  profilePicture,
  brandColor,
  brandColorForHeader,
  headerTextColor,
  canDownload,
  chatView,
  onReset,
  onDownloadChat,
  onHandleView,
  onBack,
  onClose,
}: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !e.composedPath().includes(popoverRef.current)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  const handleNewChat = () => {
    setPopoverOpen(false);
    onReset();
  };

  const handleDownload = () => {
    setPopoverOpen(false);
    onDownloadChat();
  };

  const handleViewRecent = () => {
    setPopoverOpen(false);
    onHandleView();
  };

  return (
    <header
      className="cbw-header"
      style={{
        background: brandColorForHeader
          ? `linear-gradient(0deg, rgba(255,255,255,0) 29.14%, rgba(255,255,255,0.16) 100%), ${brandColor}`
          : undefined,
      }}
    >
      <div className="cbw-header-info">
        {chatView === "recent" ? (
          <>
            <button
              type="button"
              className="cbw-header-btn cbw-back-btn"
              title="Back"
              style={{ color: headerTextColor }}
              onClick={onBack}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: headerTextColor }}
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
            <span className="cbw-header-name" style={{ color: headerTextColor }}>
              Recent Chats
            </span>
          </>
        ) : (
          <>
            {profilePicture && (
              <img
                src={profilePicture}
                alt="Chatbot"
                className="cbw-header-avatar"
              />
            )}
            <span className="cbw-header-name" style={{ color: headerTextColor }}>
              {name}
            </span>
          </>
        )}
      </div>
      <div className="cbw-header-actions">
        {chatView !== "recent" && (
        <div className="cbw-popover-wrapper" ref={popoverRef}>
          <button
            className="cbw-header-btn"
            title="More options"
            style={{ color: headerTextColor }}
            onClick={() => setPopoverOpen((o) => !o)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
          {popoverOpen && (
            <div className="cbw-popover">
              <button className="cbw-popover-item" onClick={handleNewChat}>
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
                New Chat
              </button>
              <button
                className={`cbw-popover-item ${!canDownload ? "cbw-popover-item--disabled" : ""}`}
                onClick={handleDownload}
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download this chat
              </button>
              <button
                className="cbw-popover-item"
                onClick={handleViewRecent}
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
                  <path d="M9 17l-5-5 5-5" />
                  <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                </svg>
                View Recent Chats
              </button>
            </div>
          )}
        </div>
        )}
        {onClose && (
          <button
            className="cbw-header-btn"
            title="Close"
            style={{ color: headerTextColor }}
            onClick={onClose}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
