export function getSafeRedirectPath(value: string | null | undefined, fallback = "/") {
  if (!value) {
    return fallback;
  }

  const candidate = value.trim();

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(candidate, "https://arcetis.local");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

const postAuthBlockedPaths = new Set([
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password"
]);

export function getPostAuthRedirectPath(value: string | null | undefined, fallback = "/") {
  const redirectPath = getSafeRedirectPath(value, fallback);

  try {
    const url = new URL(redirectPath, "https://arcetis.local");
    return postAuthBlockedPaths.has(url.pathname) ? fallback : redirectPath;
  } catch {
    return fallback;
  }
}

export function getSafeBackofficeRedirectPath(value: string | null | undefined, fallback = "/backoffice/dashboard") {
  const redirectPath = getSafeRedirectPath(value, fallback);
  return redirectPath.startsWith("/backoffice") ? redirectPath : fallback;
}
