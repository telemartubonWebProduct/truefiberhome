const MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_ONLY_RE = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/;

export type DailyPerformanceLike = {
  lineLeads: number;
  phoneLeads: number;
  facebookLeads: number;
  salesSuccess: number;
  installSuccess: number;
  pendingInstall: number;
  installFailed: number;
  waitingDocuments: number;
};

export type DailyPerformanceSummary = {
  totalLineLeads: number;
  totalPhoneLeads: number;
  totalFacebookLeads: number;
  totalLeads: number;
  totalSalesSuccess: number;
  totalInstallSuccess: number;
  totalPendingInstall: number;
  totalInstallFailed: number;
  totalWaitingDocuments: number;
};

function getBangkokNowParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value || "1970";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const day = parts.find((part) => part.type === "day")?.value || "01";

  return { year, month, day };
}

export function getCurrentMonthKey(date = new Date()) {
  const { year, month } = getBangkokNowParts(date);
  return `${year}-${month}`;
}

export function getTodayInputValue(date = new Date()) {
  const { year, month, day } = getBangkokNowParts(date);
  return `${year}-${month}-${day}`;
}

export function normalizeMonthKey(value: string | null | undefined) {
  if (value && MONTH_KEY_RE.test(value)) {
    return value;
  }

  return getCurrentMonthKey();
}

export function monthKeyToThaiLabel(monthKey: string) {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return monthKey;
  }

  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getMonthDateRange(monthKey: string) {
  const normalizedMonth = normalizeMonthKey(monthKey);
  const [yearText, monthText] = normalizedMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  return { startDate, endDate };
}

export function parseDateOnlyInput(value: unknown): Date | null {
  if (typeof value !== "string" || !DATE_ONLY_RE.test(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  const isValidDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isValidDate ? date : null;
}

export function dateToInputValue(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export function coerceNonNegativeInt(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.trunc(parsed));
    }
  }

  return 0;
}

export function summarizeDailyPerformance(rows: DailyPerformanceLike[]): DailyPerformanceSummary {
  return rows.reduce<DailyPerformanceSummary>(
    (acc, row) => {
      acc.totalLineLeads += coerceNonNegativeInt(row.lineLeads);
      acc.totalPhoneLeads += coerceNonNegativeInt(row.phoneLeads);
      acc.totalFacebookLeads += coerceNonNegativeInt(row.facebookLeads);
      acc.totalSalesSuccess += coerceNonNegativeInt(row.salesSuccess);
      acc.totalInstallSuccess += coerceNonNegativeInt(row.installSuccess);
      acc.totalPendingInstall += coerceNonNegativeInt(row.pendingInstall);
      acc.totalInstallFailed += coerceNonNegativeInt(row.installFailed);
      acc.totalWaitingDocuments += coerceNonNegativeInt(row.waitingDocuments);

      acc.totalLeads = acc.totalLineLeads + acc.totalPhoneLeads + acc.totalFacebookLeads;

      return acc;
    },
    {
      totalLineLeads: 0,
      totalPhoneLeads: 0,
      totalFacebookLeads: 0,
      totalLeads: 0,
      totalSalesSuccess: 0,
      totalInstallSuccess: 0,
      totalPendingInstall: 0,
      totalInstallFailed: 0,
      totalWaitingDocuments: 0,
    }
  );
}
