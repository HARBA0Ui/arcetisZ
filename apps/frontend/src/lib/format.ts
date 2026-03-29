type DateValue = string | Date | null | undefined;

const numberFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function getNumberFormatter(options?: Intl.NumberFormatOptions) {
  const key = JSON.stringify(options ?? {});
  const cached = numberFormatters.get(key);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.NumberFormat("en-US", options);
  numberFormatters.set(key, formatter);
  return formatter;
}

function getDateFormatter(options: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify(options);
  const cached = dateFormatters.get(key);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    ...options
  });
  dateFormatters.set(key, formatter);
  return formatter;
}

function toValidDate(value: DateValue) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return getNumberFormatter(options).format(value);
}

export function formatCompactNumber(value: number) {
  return formatNumber(value, {
    notation: "compact",
    maximumFractionDigits: 1
  }).replace("K", "k");
}

export function formatDate(value: DateValue, fallback = "-") {
  const date = toValidDate(value);
  if (!date) {
    return fallback;
  }

  return getDateFormatter({
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function formatDateTime(value: DateValue, fallback = "-") {
  const date = toValidDate(value);
  if (!date) {
    return fallback;
  }

  return getDateFormatter({
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatShortDateTime(value: DateValue, fallback = "-") {
  const date = toValidDate(value);
  if (!date) {
    return fallback;
  }

  return getDateFormatter({
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatMonthDay(value: DateValue, fallback = "-") {
  const date = toValidDate(value);
  if (!date) {
    return fallback;
  }

  return getDateFormatter({
    month: "short",
    day: "numeric"
  }).format(date);
}
