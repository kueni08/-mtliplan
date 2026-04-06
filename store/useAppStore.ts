"use client";

import { create } from "zustand";
import { readAppData, writeAppData } from "@/lib/drive";
import type { AppData, Completion, Redemption, Chore, Reward, HouseholdMember, LevelConfig, PresenceSchedule, ChoreAssignment, SkinUnlockConfig } from "@/lib/types";
import { migrateData } from "@/lib/driveUtils";
import { v4 as uuidv4 } from "uuid";

// ── localStorage helpers (SSR-safe) ──────────────────────────────────────────

const LS_DATA_KEY    = "amtliplan-data";
const LS_PENDING_KEY = "amtliplan-pending";

function lsWrite(data: AppData): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_DATA_KEY, JSON.stringify(data)); } catch { /* quota */ }
}

function lsRead(): AppData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_DATA_KEY);
    if (!raw) return null;
    return migrateData(JSON.parse(raw) as AppData);
  } catch { return null; }
}

function lsSetPending(v: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (v) localStorage.setItem(LS_PENDING_KEY, "1");
    else   localStorage.removeItem(LS_PENDING_KEY);
  } catch { /* silent */ }
}

function lsIsPending(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(LS_PENDING_KEY) === "1"; } catch { return false; }
}

interface AppStore {
  data: AppData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Sync / offline state
  syncStatus: "idle" | "synced" | "pending" | "syncing" | "error";
  lastSyncedAt: string | null;
  isOnline: boolean;

  _save: (data: AppData) => Promise<void>;
  syncToDrive: () => Promise<void>;
  setOnline: (isOnline: boolean) => void;

  loadData: () => Promise<void>;

  // Chore completions
  markChoreComplete: (choreId: string, childId: string, forceApprove?: boolean) => Promise<void>;
  suggestAdHocTask: (childId: string, note: string, suggestedXp: number) => Promise<void>;
  approveCompletion: (completionId: string) => Promise<void>;
  approveCompletionWithXp: (completionId: string, xp: number) => Promise<void>;
  rejectCompletion: (completionId: string) => Promise<void>;

  // Rewards
  redeemReward: (rewardId: string, childId: string) => Promise<void>;

  // Household member management
  updateChild: (childId: string, updates: Partial<HouseholdMember>) => Promise<void>;
  addHouseholdMember: (member: Omit<HouseholdMember, "id">) => Promise<void>;
  removeHouseholdMember: (memberId: string) => Promise<void>;

  // Chore management
  addChore: (chore: Omit<Chore, "id">) => Promise<void>;
  updateChore: (choreId: string, updates: Partial<Chore>) => Promise<void>;
  deleteChore: (choreId: string) => Promise<void>;

  // Reward management
  addReward: (reward: Omit<Reward, "id">) => Promise<void>;
  updateReward: (rewardId: string, updates: Partial<Reward>) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;

  // Schedule
  updateNextOurWeekend: (date: string) => Promise<void>;

  // Level config
  updateLevelConfig: (config: LevelConfig[]) => Promise<void>;
  resetLevelConfig: () => Promise<void>;

  // Presence schedule & assignments
  updatePresenceSchedule: (schedule: PresenceSchedule) => Promise<void>;
  updateSkinUnlockConfig: (config: SkinUnlockConfig) => Promise<void>;
  toggleFavoriteChore: (memberId: string, choreId: string) => Promise<void>;
  saveAssignments: (assignments: ChoreAssignment[]) => Promise<void>;
  removeAssignment: (id: string) => Promise<void>;
  reassignChore: (assignmentId: string, newChildId: string) => Promise<void>;

  // Member credentials
  setMemberPassword: (memberId: string, passwordHash: string) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  data: null,
  loading: false,
  saving: false,
  error: null,
  syncStatus: "idle",
  lastSyncedAt: null,
  isOnline: typeof window !== "undefined" ? navigator.onLine : true,

  loadData: async () => {
    set({ loading: true, error: null });

    // Phase 1: instant local hydration
    const local = lsRead();
    if (local) {
      set({ data: local, syncStatus: lsIsPending() ? "pending" : "synced" });
    }

    // Phase 2: network sync
    const { isOnline } = get();
    if (!isOnline) {
      set({ loading: false, syncStatus: lsIsPending() ? "pending" : (local ? "synced" : "idle") });
      return;
    }

    try {
      set({ syncStatus: "syncing" });

      if (lsIsPending() && local) {
        // Push local changes → Drive
        await writeAppData(local);
        lsSetPending(false);
        set({ loading: false, syncStatus: "synced", lastSyncedAt: new Date().toISOString(), error: null });
      } else {
        // Pull Drive → local
        const driveData = await readAppData();
        // Guard: a save may have occurred while we were pulling
        if (lsIsPending()) {
          set({ loading: false, syncStatus: "pending" });
          return;
        }
        lsWrite(driveData);
        set({ loading: false, data: driveData, syncStatus: "synced", lastSyncedAt: new Date().toISOString(), error: null });
      }
    } catch (e) {
      if (local) {
        // Drive failed but local data is fine — don't show full error screen
        set({ loading: false, syncStatus: "error", error: String(e) });
      } else {
        set({ loading: false, error: String(e), syncStatus: "error" });
      }
    }
  },

  markChoreComplete: async (choreId, childId, forceApprove = false) => {
    const { data } = get();
    if (!data) return;
    const chore = data.chores.find((c) => c.id === choreId);
    if (!chore) return;

    // Adults are auto-approved only if forceApprove (admin) or no other adult exists
    const memberRole = data.settings.children.find((m) => m.id === childId)?.role;
    const otherAdultsExist = data.settings.children.some((m) => m.id !== childId && m.role === "adult");
    const autoApprove = forceApprove || (memberRole === "adult" && !otherAdultsExist);

    const completion: Completion = {
      id: uuidv4(),
      choreId,
      childId,
      date: new Date().toISOString().split("T")[0],
      xp: chore.xp,
      approved: autoApprove,
      approvedAt: autoApprove ? new Date().toISOString() : undefined,
    };

    await get()._save({ ...data, completions: [...data.completions, completion] });
  },

  suggestAdHocTask: async (childId, note, suggestedXp) => {
    const { data } = get();
    if (!data) return;
    const memberRole = data.settings.children.find((m) => m.id === childId)?.role;
    const otherAdultsExist2 = data.settings.children.some((m) => m.id !== childId && m.role === "adult");
    const autoApprove = memberRole === "adult" && !otherAdultsExist2;
    const completion: Completion = {
      id: uuidv4(),
      choreId: null,
      childId,
      date: new Date().toISOString().split("T")[0],
      xp: suggestedXp,
      note,
      approved: autoApprove,
      approvedAt: autoApprove ? new Date().toISOString() : undefined,
    };
    await get()._save({ ...data, completions: [...data.completions, completion] });
  },

  approveCompletion: async (completionId) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      completions: data.completions.map((c) =>
        c.id === completionId
          ? { ...c, approved: true, approvedAt: new Date().toISOString() }
          : c
      ),
    });
  },

  approveCompletionWithXp: async (completionId, xp) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      completions: data.completions.map((c) =>
        c.id === completionId
          ? { ...c, xp, approved: true, approvedAt: new Date().toISOString() }
          : c
      ),
    });
  },

  rejectCompletion: async (completionId) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      completions: data.completions.filter((c) => c.id !== completionId),
    });
  },

  redeemReward: async (rewardId, childId) => {
    const { data } = get();
    if (!data) return;
    const reward = data.rewards.find((r) => r.id === rewardId);
    if (!reward) return;

    const redemption: Redemption = {
      id: uuidv4(),
      rewardId,
      childId,
      date: new Date().toISOString().split("T")[0],
      cost: reward.cost,
    };

    await get()._save({ ...data, redemptions: [...data.redemptions, redemption] });
  },

  updateChild: async (childId, updates) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      settings: {
        ...data.settings,
        children: data.settings.children.map((c) =>
          c.id === childId ? { ...c, ...updates } : c
        ),
      },
    });
  },

  addHouseholdMember: async (member) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      settings: {
        ...data.settings,
        children: [...data.settings.children, { ...member, id: uuidv4() }],
      },
    });
  },

  removeHouseholdMember: async (memberId) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      settings: {
        ...data.settings,
        children: data.settings.children.filter((c) => c.id !== memberId),
      },
    });
  },

  addChore: async (chore) => {
    const { data } = get();
    if (!data) return;
    await get()._save({ ...data, chores: [...data.chores, { ...chore, id: uuidv4() }] });
  },

  updateChore: async (choreId, updates) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      chores: data.chores.map((c) => (c.id === choreId ? { ...c, ...updates } : c)),
    });
  },

  deleteChore: async (choreId) => {
    const { data } = get();
    if (!data) return;
    await get()._save({ ...data, chores: data.chores.filter((c) => c.id !== choreId) });
  },

  addReward: async (reward) => {
    const { data } = get();
    if (!data) return;
    await get()._save({ ...data, rewards: [...data.rewards, { ...reward, id: uuidv4() }] });
  },

  updateReward: async (rewardId, updates) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      rewards: data.rewards.map((r) => (r.id === rewardId ? { ...r, ...updates } : r)),
    });
  },

  deleteReward: async (rewardId) => {
    const { data } = get();
    if (!data) return;
    await get()._save({ ...data, rewards: data.rewards.filter((r) => r.id !== rewardId) });
  },

  updateNextOurWeekend: async (date) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      settings: {
        ...data.settings,
        custodySchedule: { nextOurWeekend: date },
      },
    });
  },

  updateLevelConfig: async (config) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      settings: { ...data.settings, levelConfig: config },
    });
  },

  resetLevelConfig: async () => {
    const { data } = get();
    if (!data) return;
    const { levelConfig: _removed, ...settingsWithoutConfig } = data.settings;
    await get()._save({ ...data, settings: settingsWithoutConfig });
  },

  updatePresenceSchedule: async (schedule) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      settings: { ...data.settings, presenceSchedule: schedule },
    });
  },

  updateSkinUnlockConfig: async (config) => {
    const { data } = get();
    if (!data) return;
    await get()._save({ ...data, settings: { ...data.settings, skinUnlockConfig: config } });
  },

  toggleFavoriteChore: async (memberId, choreId) => {
    const { data } = get();
    if (!data) return;
    const member = data.settings.children.find((m) => m.id === memberId);
    if (!member) return;
    const favs = member.favoriteChoreIds ?? [];
    const updated = favs.includes(choreId)
      ? favs.filter((id) => id !== choreId)
      : [...favs, choreId];
    await get().updateChild(memberId, { favoriteChoreIds: updated });
  },

  saveAssignments: async (assignments) => {
    const { data } = get();
    if (!data) return;
    // Replace suggested assignments, keep manual ones
    const manual = (data.assignments ?? []).filter((a) => a.source === "manual");
    const suggested = assignments.filter((a) => a.source === "suggested");
    await get()._save({ ...data, assignments: [...manual, ...suggested] });
  },

  removeAssignment: async (id) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      assignments: (data.assignments ?? []).filter((a) => a.id !== id),
    });
  },

  reassignChore: async (assignmentId, newChildId) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      assignments: (data.assignments ?? []).map((a) =>
        a.id === assignmentId ? { ...a, childId: newChildId, source: "manual" as const } : a
      ),
    });
  },

  setMemberPassword: async (memberId, passwordHash) => {
    const { data } = get();
    if (!data) return;
    await get()._save({
      ...data,
      settings: {
        ...data.settings,
        children: data.settings.children.map((c) =>
          c.id === memberId ? { ...c, passwordHash } : c
        ),
      },
    });
  },

  _save: async (updated: AppData) => {
    // 1. Update in-memory + localStorage immediately
    set({ saving: true, data: updated });
    lsWrite(updated);
    lsSetPending(true);
    set({ syncStatus: "pending" });

    // 2. Attempt Drive write if online
    const { isOnline } = get();
    if (!isOnline) {
      set({ saving: false });
      return;
    }

    try {
      set({ syncStatus: "syncing" });
      await writeAppData(updated);
      lsSetPending(false);
      set({ saving: false, syncStatus: "synced", lastSyncedAt: new Date().toISOString(), error: null });
    } catch (e) {
      // Local is safe; surface error in status bar only (no full-screen error)
      set({ saving: false, syncStatus: "error", error: String(e) });
    }
  },

  syncToDrive: async () => {
    const { data, syncStatus } = get();
    if (!data || syncStatus === "syncing") return;
    set({ syncStatus: "syncing", error: null });
    try {
      await writeAppData(data);
      lsSetPending(false);
      set({ syncStatus: "synced", lastSyncedAt: new Date().toISOString() });
    } catch (e) {
      set({ syncStatus: "error", error: String(e) });
    }
  },

  setOnline: (isOnline: boolean) => {
    set({ isOnline });
    if (isOnline && lsIsPending()) {
      get().syncToDrive();
    }
  },
}));
