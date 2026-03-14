/**
 * Custody schedule logic.
 * Kids are present:
 *   1. Every Tuesday 18:00 – Wednesday 18:00
 *   2. Every other weekend: Friday 18:00 – Sunday 18:00
 */

export function isKidPresentNow(nextOurWeekend: string): boolean {
  return isKidPresentAt(new Date(), nextOurWeekend);
}

export function isKidPresentAt(date: Date, nextOurWeekend: string): boolean {
  const day = date.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const hour = date.getHours();

  // Tuesday 18:00 – Wednesday 18:00 (every week)
  if (day === 2 && hour >= 18) return true;
  if (day === 3 && hour < 18) return true;

  // Our weekend: Friday 18:00 – Sunday 18:00 (every other week)
  return isOurWeekend(date, nextOurWeekend);
}

function isOurWeekend(date: Date, nextOurWeekend: string): boolean {
  const day = date.getDay();
  const hour = date.getHours();

  // Only relevant on Friday (evening), Saturday, Sunday (until 18:00)
  if (day === 1 || day === 2 || day === 3 || day === 4) return false;
  if (day === 0 && hour >= 18) return false; // Sunday after 18:00

  // Find the Friday of the current weekend
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const currentWeekFriday = new Date(d);
  if (day === 0) {
    currentWeekFriday.setDate(d.getDate() - 2); // Sunday → back 2 to Friday
  } else if (day === 6) {
    currentWeekFriday.setDate(d.getDate() - 1); // Saturday → back 1 to Friday
  }
  // day === 5 (Friday) stays as is

  // Check if this Friday is one of "our" weekends
  const anchor = new Date(nextOurWeekend);
  anchor.setHours(0, 0, 0, 0);

  const diffMs = currentWeekFriday.getTime() - anchor.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // "Our" weekends repeat every 14 days from the anchor
  return diffDays % 14 === 0;
}

/**
 * Returns the next N presence periods (for display in calendar)
 */
export interface PresencePeriod {
  type: "weekday" | "weekend";
  start: Date;
  end: Date;
  label: string;
}

export function getUpcomingPresencePeriods(
  from: Date,
  count: number,
  nextOurWeekend: string
): PresencePeriod[] {
  const periods: PresencePeriod[] = [];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);

  // Look ahead 180 days max
  const limit = new Date(d);
  limit.setDate(limit.getDate() + 180);

  while (d < limit && periods.length < count) {
    const day = d.getDay();

    // Tuesday → Wednesday stay
    if (day === 2) {
      const start = new Date(d);
      start.setHours(18, 0, 0, 0);
      const end = new Date(d);
      end.setDate(end.getDate() + 1);
      end.setHours(18, 0, 0, 0);
      if (end > from) {
        periods.push({
          type: "weekday",
          start,
          end,
          label: `Di–Mi ${formatDate(start)}`,
        });
      }
    }

    // Friday of our weekend
    if (day === 5) {
      const friday = new Date(d);
      friday.setHours(0, 0, 0, 0);
      if (isOurWeekend(friday, nextOurWeekend)) {
        const start = new Date(d);
        start.setHours(18, 0, 0, 0);
        const end = new Date(d);
        end.setDate(end.getDate() + 2); // Sunday
        end.setHours(18, 0, 0, 0);
        if (end > from) {
          periods.push({
            type: "weekend",
            start,
            end,
            label: `WE ${formatDate(start)}–${formatDate(end)}`,
          });
        }
      }
    }

    d.setDate(d.getDate() + 1);
  }

  return periods;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" });
}

/**
 * Auto-advance nextOurWeekend if it's in the past
 */
export function getEffectiveNextWeekend(nextOurWeekend: string): string {
  const anchor = new Date(nextOurWeekend);
  anchor.setHours(18, 0, 0, 0);
  const now = new Date();

  // The weekend ends Sunday 18:00 (anchor + 9 days)
  const weekendEnd = new Date(anchor);
  weekendEnd.setDate(weekendEnd.getDate() + 9);

  if (now > weekendEnd) {
    // Advance by 14-day increments until in the future
    while (now > weekendEnd) {
      anchor.setDate(anchor.getDate() + 14);
      weekendEnd.setDate(weekendEnd.getDate() + 14);
    }
    return anchor.toISOString().split("T")[0];
  }

  return nextOurWeekend;
}
