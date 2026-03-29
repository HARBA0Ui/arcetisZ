export function getDisplayRequestCode(requestCode?: string | null, fallbackId?: string) {
  const normalizedRequestCode = requestCode?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (normalizedRequestCode) {
    return normalizedRequestCode.slice(-12);
  }

  if (!fallbackId) {
    return "";
  }

  return fallbackId.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-12);
}
