interface Props {
  name: string
  profilePicture: string | null
  brandColor: string
  brandColorForHeader: boolean
  headerTextColor: string
  onReset: () => void
  onClose?: () => void
}

export function ChatHeader({
  name,
  profilePicture,
  brandColor,
  brandColorForHeader,
  headerTextColor,
  onReset,
  onClose,
}: Props) {
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
        {profilePicture && (
          <img src={profilePicture} alt="Chatbot" className="cbw-header-avatar" />
        )}
        <span className="cbw-header-name" style={{ color: headerTextColor }}>
          {name}
        </span>
      </div>
      <div className="cbw-header-actions">
        <button
          className="cbw-header-btn"
          title="Reset conversation"
          style={{ color: headerTextColor }}
          onClick={onReset}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        {onClose && (
          <button
            className="cbw-header-btn"
            title="Close"
            style={{ color: headerTextColor }}
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
