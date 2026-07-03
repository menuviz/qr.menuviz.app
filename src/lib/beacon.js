export const CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
export const CODE_LENGTH = 6;

export function makeCodeId() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export function normalizeDestination(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function formatDate(value) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function truncateUrl(value, max = 44) {
  if (!value) {
    return "Unassigned";
  }

  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

export function lastNDays(count) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - 1 - index));
    return date;
  });
}
