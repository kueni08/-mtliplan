import type { AppData, ChoreAssignment, PresenceType } from "./types";
import { v4 as uuidv4 } from "uuid";

const CAPACITY: Record<PresenceType, number> = {
  ganztag: 3,
  halbtag: 1,
  absent:  0,
};

/**
 * Generate a suggested chore assignment plan for the given date range.
 *
 * Improvements over the previous version:
 * - Weekly chores are deferred to "ganztag" days when possible within the same 7-day block.
 * - Task rotation: each chore alternates between children based on historical completion counts.
 * - XP equalization: used as a tiebreaker when rotation counts are equal; XP gap > threshold
 *   overrides rotation to keep balance within ~10-15%.
 */
export function generateAssignments(
  data: AppData,
  fromDate: string,
  toDate: string
): ChoreAssignment[] {
  const { presenceSchedule } = data.settings;
  if (!presenceSchedule) return [];

  const children = data.settings.children.filter((c) => c.role === "child" || !c.role);
  if (children.length === 0) return [];

  const activeChores = data.chores.filter(
    (c) => c.active && c.frequency !== "manual"
  );
  if (activeChores.length === 0) return [];

  const cycleStart = new Date(presenceSchedule.cycleStartDate + "T00:00:00");
  const from = new Date(fromDate + "T00:00:00");
  const to   = new Date(toDate   + "T00:00:00");
  const toMs = to.getTime();
  const msPerDay = 1000 * 60 * 60 * 24;

  // Pre-index presence patterns by childId for O(1) lookup
  const patternByChild = new Map(presenceSchedule.patterns.map((p) => [p.childId, p]));

  const assignments: ChoreAssignment[] = [];

  // Running XP balance per child (for equalization)
  const xpBalance: Record<string, number> = {};
  children.forEach((c) => (xpBalance[c.id] = 0));

  // Per-chore assignment count — seeded with historical approved completions,
  // then incremented as we generate new assignments (ensures rotation within the plan too).
  const choreCount: Record<string, Record<string, number>> = {};
  activeChores.forEach((c) => {
    choreCount[c.id] = {};
    children.forEach((ch) => (choreCount[c.id][ch.id] = 0));
  });
  for (const comp of data.completions.filter((c) => c.approved)) {
    if (choreCount[comp.choreId]?.[comp.childId] !== undefined) {
      choreCount[comp.choreId][comp.childId]++;
    }
  }

  // For weekly chores: track which 7-day block each child has already been assigned it
  const weeklyDone: Record<string, Record<string, Set<number>>> = {};
  activeChores
    .filter((c) => c.frequency === "weekly")
    .forEach((c) => {
      weeklyDone[c.id] = {};
      children.forEach((ch) => (weeklyDone[c.id][ch.id] = new Set()));
    });

  /**
   * Returns true if the given child has a "ganztag" day remaining in the same
   * 7-day block after `daysSince`, within the planning range (toDate).
   * Used to defer weekly chores to their best day.
   */
  const hasGanztachDayComingInBlock = (
    childId: string,
    daysSince: number,
    weekBlock: number
  ): boolean => {
    const pattern = patternByChild.get(childId);
    if (!pattern) return false;
    const blockEnd = (weekBlock + 1) * 7 - 1;
    const cycleStartMs = cycleStart.getTime();
    for (let d = daysSince + 1; d <= blockEnd; d++) {
      if (cycleStartMs + d * msPerDay > toMs) break;
      const futureIdx = ((d % 14) + 14) % 14;
      if (pattern.days[futureIdx] === "ganztag") return true;
    }
    return false;
  };

  const current = new Date(from);
  while (current <= to) {
    const dateStr  = current.toISOString().split("T")[0];
    const daysSince = Math.round((current.getTime() - cycleStart.getTime()) / msPerDay);
    const dayIndex  = ((daysSince % 14) + 14) % 14;
    const weekBlock = Math.floor(daysSince / 7);

    // Base capacity for each child today
    const remaining: Record<string, number> = {};
    children.forEach((c) => {
      const type: PresenceType = patternByChild.get(c.id)?.days[dayIndex] ?? "absent";
      remaining[c.id] = CAPACITY[type];
    });

    // Track which chores have already been assigned today (one child per chore per day)
    const assignedChoreToday = new Set<string>();

    // XP threshold for equalization override — computed once per day (stable enough)
    const totalXP = Object.values(xpBalance).reduce((s, v) => s + v, 0);
    const xpThreshold = Math.max(30, totalXP * 0.15);

    // Eligible chores today — sorted by XP descending (higher-value chores assigned first)
    const eligibleChores = activeChores
      .filter((chore) => {
        if (chore.frequency === "weekly") {
          return children.some((c) => !weeklyDone[chore.id]?.[c.id]?.has(weekBlock));
        }
        return true;
      })
      .sort((a, b) => b.xp - a.xp);

    for (const chore of eligibleChores) {
      if (chore.frequency !== "multiple_daily" && assignedChoreToday.has(chore.id)) continue;

      // Children with capacity remaining today
      let candidates = children.filter((c) => remaining[c.id] > 0);

      if (chore.frequency === "weekly") {
        // Exclude children who already had this chore this week-block
        candidates = candidates.filter(
          (c) => !weeklyDone[chore.id]?.[c.id]?.has(weekBlock)
        );
        // Defer weekly chores to ganztag days:
        // Exclude a child from today's candidates if they have a ganztag day coming
        // in this block AND today is not ganztag for them.
        candidates = candidates.filter((c) => {
          const todayType: PresenceType = patternByChild.get(c.id)?.days[dayIndex] ?? "absent";
          if (todayType === "ganztag") return true;           // best day → include
          return !hasGanztachDayComingInBlock(c.id, daysSince, weekBlock); // no better day coming → include
        });
      }

      if (candidates.length === 0) continue;

      // Pick the best candidate combining rotation + XP equalization:
      // - Primary: prefer the child who has done THIS chore fewer times (rotation).
      // - Override: if XP gap is large (> ~15% of total assigned XP) prioritize lower-XP child.
      candidates.sort((a, b) => {
        const xpA    = xpBalance[a.id];
        const xpB    = xpBalance[b.id];
        const countA = choreCount[chore.id]?.[a.id] ?? 0;
        const countB = choreCount[chore.id]?.[b.id] ?? 0;

        // If XP gap is large, equalize first regardless of rotation
        if (Math.abs(xpA - xpB) > xpThreshold) return xpA - xpB;
        // Otherwise rotate this specific task
        if (countA !== countB) return countA - countB;
        // Final tiebreak: XP balance
        return xpA - xpB;
      });

      const chosen = candidates[0];

      assignments.push({
        id: uuidv4(),
        choreId: chore.id,
        childId: chosen.id,
        date: dateStr,
        source: "suggested",
      });

      xpBalance[chosen.id] += chore.xp;
      remaining[chosen.id]--;
      if (choreCount[chore.id]) choreCount[chore.id][chosen.id]++;

      if (chore.frequency !== "multiple_daily") {
        assignedChoreToday.add(chore.id);
      }
      if (chore.frequency === "weekly") {
        weeklyDone[chore.id][chosen.id].add(weekBlock);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return assignments;
}

/** Returns the XP totals per child for a set of assignments (for preview). */
export function calcAssignmentXP(
  assignments: ChoreAssignment[],
  data: AppData
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const a of assignments) {
    const chore = data.chores.find((c) => c.id === a.choreId);
    if (!chore) continue;
    totals[a.childId] = (totals[a.childId] ?? 0) + chore.xp;
  }
  return totals;
}

/** Get the Monday of the current week as ISO date string. */
export function getCurrentMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}
