import axios from "axios";

function getResponseHeader(error: unknown, name: string) {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const headers = error.response?.headers;
  if (!headers) {
    return null;
  }

  if (typeof headers.get === "function") {
    return headers.get(name) ?? headers.get(name.toLowerCase()) ?? null;
  }

  const headerRecord = headers as Record<string, string | string[] | undefined>;
  const value = headerRecord[name] ?? headerRecord[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function isArcetisSessionError(error: unknown, options?: { includeNotFound?: boolean }) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (getResponseHeader(error, "x-arcetis-session-error") === "1") {
    return true;
  }

  const status = error.response?.status ?? 0;
  return options?.includeNotFound === true && status === 404;
}
