import type { AppData, ChoreAssignment, PresenceType } from "./types";
import { v4 as uuidv4 } from "uuid";

const CAPACITY: Record<PresenceType, number> = {
  ganztag: 3,
  halbtag: 1,
  absent:  0,
};

/**
 * Generate a suggested chore assignment plan for the given date range.
 * Distributes chores across children to equalise total XP earned.
 * Returns the assignments without saving — caller must persist via saveAssignments().
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

  const assignments: ChoreAssignment[] = [];

  // Running XP balance per child (for equalization)
  const xpBalance: Record<string, number> = {};
  children.forEach((c) => (xpBalance[c.id] = 0));

  // For weekly chores: track which 7-day block each child has already been assigned it
  // weeklyDone[choreId][childId][weekBlockIndex] = true
  const weeklyDone: Record<string, Record<string, Set<number>>> = {};
  activeChores
    .filter((c) => c.frequency === "weekly")
    .forEach((c) => {
      weeklyDone[c.id] = {};
      children.forEach((ch) => (weeklyDone[c.id][ch.id] = new Set()));
    });

  const msPerDay = 1000 * 60 * 60 * 24;

  const current = new Date(from);
  while (current <= to) {
    const dateStr = current.toISOString().split("T")[0];

    // Which day in the 2-week cycle is this?
    const daysSince = Math.round((current.getTime() - cycleStart.getTime()) / msPerDay);
    const dayIndex  = ((daysSince % 14) + 14) % 14; // 0–13
    const weekBlock = Math.floor(daysSince / 7);     // absolute 7-day block index

    // Capacity remaining per child today
    const remaining: Record<string, number> = {};
    children.forEach((c) => {
      const pattern = presenceSchedule.patterns.find((p) => p.childId === c.id);
      const type: PresenceType = pattern?.days[dayIndex] ?? "absent";
      remaining[c.id] = CAPACITY[type];
    });

    // Chores eligible today (sorted by XP descending for best equalization)
    const eligibleChores = activeChores
      .filter((chore) => {
        if (chore.frequency === "weekly") {
          // Include only if at least one child hasn't done it in this week-block yet
          return children.some((c) => !weeklyDone[chore.id]?.[c.id]?.has(weekBlock));
        }
        return true; // daily / multiple_daily
      })
      .sort((a, b) => b.xp - a.xp);

    for (const chore of eligibleChores) {
      // Children who still have capacity today
      let candidates = children.filter((c) => remaining[c.id] > 0);

      // For weekly chores, additionally exclude children who already had it this block
      if (chore.frequency === "weekly") {
        candidates = candidates.filter(
          (c) => !weeklyDone[chore.id]?.[c.id]?.has(weekBlock)
        );
      }

      if (candidates.length === 0) continue;

      // Pick the candidate with the lowest accumulated XP (equalization)
      candidates.sort((a, b) => xpBalance[a.id] - xpBalance[b.id]);
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
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}
