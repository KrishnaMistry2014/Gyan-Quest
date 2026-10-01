/**
 * Utility functions for streak calculations, calendar day differences,
 * and weekly activity tracking.
 */

export interface WeekDayItem {
  dateStr: string;
  dayLabel: string;
  fullDayName: string;
  dayNumber: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isActive: boolean;
}

/**
 * Returns YYYY-MM-DD in user's local timezone.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates calendar day difference (d2 - d1) in local time.
 */
export function getDateDiffInDays(d1Str: string, d2Str: string): number {
  if (!d1Str || !d2Str) return 999;
  const [y1, m1, day1] = d1Str.split('-').map(Number);
  const [y2, m2, day2] = d2Str.split('-').map(Number);
  if (isNaN(y1) || isNaN(m1) || isNaN(day1) || isNaN(y2) || isNaN(m2) || isNaN(day2)) {
    return 999;
  }
  const date1 = new Date(y1, m1 - 1, day1);
  const date2 = new Date(y2, m2 - 1, day2);
  const diffTime = date2.getTime() - date1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates 7 days of the current week (Monday through Sunday)
 * indicating whether each day is today, past, future, and active.
 */
export function getCurrentWeekDays(activeDays: string[] = []): WeekDayItem[] {
  const now = new Date();
  const todayStr = getLocalDateString(now);

  // Determine Monday of current week
  // getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  const currentDayOfWeek = now.getDay();
  const distanceToMonday = (currentDayOfWeek + 6) % 7; // Monday = 0, Sunday = 6

  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const week: WeekDayItem[] = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateStr = getLocalDateString(dayDate);
    const diff = getDateDiffInDays(dateStr, todayStr);

    const isToday = dateStr === todayStr;
    const isPast = diff > 0;
    const isFuture = diff < 0;
    const isActive = activeDays.includes(dateStr);

    week.push({
      dateStr,
      dayLabel: dayLabels[i],
      fullDayName: dayNames[i],
      dayNumber: dayDate.getDate(),
      isToday,
      isPast,
      isFuture,
      isActive,
    });
  }

  return week;
}
