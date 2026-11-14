import { addMonths, currentMonthDate, monthDate } from "@/shared/lib/date";

export const SERIES_GENERATION_MONTHS_AHEAD = 12;

export function getSeriesGenerationLimitMonth(now = new Date()) {
  return addMonths(
    currentMonthDate(now),
    SERIES_GENERATION_MONTHS_AHEAD,
  );
}

export function canGenerateSeriesForMonth(month: Date, now = new Date()) {
  return monthDate(month) <= monthDate(getSeriesGenerationLimitMonth(now));
}
