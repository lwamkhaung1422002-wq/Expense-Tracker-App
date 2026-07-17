import { DateTime } from "luxon";
import { ApiError } from "./apiError.js";

export function normalizeTimezone(timezone) {
  const zone = timezone || "UTC";
  if (!DateTime.now().setZone(zone).isValid) {
    throw new ApiError(400, "timezone must be a valid IANA timezone");
  }
  return zone;
}

export function monthRange(month, timezone) {
  if (!/^\d{4}-\d{2}$/.test(month || "")) throw new ApiError(400, "month must be YYYY-MM");
  const zone = normalizeTimezone(timezone);
  const start = DateTime.fromISO(`${month}-01`, { zone }).startOf("day");
  if (!start.isValid) throw new ApiError(400, "month must be YYYY-MM");
  return {
    start: start.toUTC().toJSDate(),
    end: start.plus({ months: 1 }).toUTC().toJSDate(),
    timezone: zone,
  };
}

export function yearRange(year, timezone, spanYears = 1) {
  const zone = normalizeTimezone(timezone);
  const start = DateTime.fromObject({ year, month: 1, day: 1 }, { zone }).startOf("day");
  if (!start.isValid) throw new ApiError(400, "year must be valid");
  return {
    start: start.toUTC().toJSDate(),
    end: start.plus({ years: spanYears }).toUTC().toJSDate(),
    timezone: zone,
  };
}

export function parseOptionalTimestamp(value, { required = false, allowFutureDays = 1 } = {}) {
  if (value == null || value === "") {
    if (required) throw new ApiError(400, "date is required");
    return undefined;
  }
  if (value instanceof Date) return validateTimestamp(value, allowFutureDays);
  if (typeof value !== "string") throw new ApiError(400, "date must be an ISO timestamp");

  const parsed = DateTime.fromISO(value, { setZone: true });
  if (!parsed.isValid) throw new ApiError(400, "date must be a valid ISO timestamp");
  return validateTimestamp(parsed.toUTC().toJSDate(), allowFutureDays);
}

export function localDateKey(date, timezone) {
  return DateTime.fromJSDate(date, { zone: "utc" }).setZone(normalizeTimezone(timezone)).toISODate();
}

export function reportBucketKey(period, date, timezone) {
  const local = DateTime.fromJSDate(date, { zone: "utc" }).setZone(normalizeTimezone(timezone));
  if (period === "daily") return local.toISODate();
  if (period === "weekly") return `${local.toFormat("yyyy-MM")}-W${Math.min(5, Math.floor((local.day - 1) / 7) + 1)}`;
  if (period === "yearly") return String(local.year);
  return local.toFormat("yyyy-MM");
}

export function buildReportSeries(period, year, month, start, end, timezone) {
  const zone = normalizeTimezone(timezone);
  const startLocal = DateTime.fromJSDate(start, { zone: "utc" }).setZone(zone);
  const endLocal = DateTime.fromJSDate(end, { zone: "utc" }).setZone(zone);

  if (period === "daily") {
    const days = Math.round(endLocal.diff(startLocal, "days").days);
    return Array.from({ length: days }, (_, index) => {
      const date = startLocal.plus({ days: index });
      return makeBucket(date.toISODate(), String(date.day));
    });
  }

  if (period === "weekly") {
    return Array.from({ length: 5 }, (_, index) => makeBucket(`${month}-W${index + 1}`, `Week ${index + 1}`));
  }

  if (period === "yearly") {
    return Array.from({ length: 5 }, (_, index) => {
      const itemYear = year - 4 + index;
      return makeBucket(String(itemYear), String(itemYear));
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const date = DateTime.fromObject({ year, month: index + 1, day: 1 }, { zone });
    return makeBucket(date.toFormat("yyyy-MM"), date.toFormat("LLL"));
  });
}

function makeBucket(key, label) {
  return { key, label, incomeCents: 0, expenseCents: 0 };
}

function validateTimestamp(date, allowFutureDays) {
  if (Number.isNaN(date.getTime())) throw new ApiError(400, "date must be a valid ISO timestamp");
  const maxFuture = DateTime.utc().plus({ days: allowFutureDays }).toJSDate();
  if (date > maxFuture) throw new ApiError(400, "date cannot be more than 24 hours in the future");
  return date;
}
