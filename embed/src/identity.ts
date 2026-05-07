export type EndUserKind = "EMAIL" | "PHONE" | "ANONYMOUS";

export interface EndUserIdentity {
  identifier: string;
  identifierKind: EndUserKind;
}

const STORAGE_PREFIX = "cbw-anon-";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function detectKind(v: string): EndUserKind {
  if (v.includes("@")) return "EMAIL";
  if (/^\+?\d[\d\s\-()]{6,}$/.test(v)) return "PHONE";
  return "ANONYMOUS";
}

function getOrCreateAnon(embedKey: string): string {
  const key = STORAGE_PREFIX + embedKey;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const { uuid, lastUsed } = JSON.parse(raw);
      if (uuid && Date.now() - lastUsed < TTL_MS) {
        localStorage.setItem(key, JSON.stringify({ uuid, lastUsed: Date.now() }));
        return uuid;
      }
    }
    const fresh = crypto.randomUUID();
    localStorage.setItem(key, JSON.stringify({ uuid: fresh, lastUsed: Date.now() }));
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

export function resolveIdentity(
  embedKey: string,
  identifier?: string | null,
): EndUserIdentity {
  const id = identifier?.trim();
  // Treat the deploy-snippet placeholder as "no identifier" so unforgetful
  // embedders don't accidentally collapse all visitors into one EndUser row.
  if (id && !id.startsWith("REPLACE_WITH_")) {
    return { identifier: id, identifierKind: detectKind(id) };
  }
  return { identifier: getOrCreateAnon(embedKey), identifierKind: "ANONYMOUS" };
}
