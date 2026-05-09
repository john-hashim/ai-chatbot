export type EndUserKind = "EMAIL" | "PHONE" | "ANONYMOUS";

const STORAGE_KEY = "cbw-identifier";

export function detectKind(v: string): EndUserKind {
  if (v.includes("@")) return "EMAIL";
  if (/^\+?\d[\d\s\-()]{6,}$/.test(v)) return "PHONE";
  return "ANONYMOUS";
}

// `crypto.randomUUID` only exists in secure contexts (HTTPS / localhost).
// Embed scripts run on arbitrary customer sites, some on plain HTTP, so we
// fall back to a Math.random-based v4-style UUID. Not cryptographically
// strong, but adequate for an end-user identifier.
function safeRandomUUID(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to the manual generator.
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Single source of truth for the end-user identifier used by both the
// chat-send flow and the past-sessions lookup. Order:
//   1. `data-identifier` / `?identifier=` from the script or iframe.
//   2. localStorage["cbw-identifier"].
//   3. A fresh anon UUID, persisted to localStorage so the same visitor
//      keeps the same identity on return visits.
export function resolveEndUserIdentifier(
  providedIdentifier?: string | null,
): string {
  const fromAttr = providedIdentifier?.trim();
  // Treat the deploy-snippet placeholder as "no identifier".
  if (fromAttr && !fromAttr.startsWith("REPLACE_WITH_")) {
    return fromAttr;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)?.trim();
    if (stored) return stored;
    const fresh = safeRandomUUID();
    localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // localStorage unavailable (private mode, etc.) — return an ephemeral id.
    return safeRandomUUID();
  }
}
