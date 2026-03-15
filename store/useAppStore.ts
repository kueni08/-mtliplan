"use client";

import { create } from "zustand";
import { readAppData, writeAppData } from "@/lib/drive";
import type { AppData, Completion, Redemption, Chore, Reward, HouseholdMember, LevelConfig } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

interface AppStore {
  data: AppData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  _save: (data: AppData) => Promise<void>;

  loadData: () => Promise<void>;

  // Chore completions
  markChoreComplete: (choreId: string, childId: string) => Promise<void>;
  approveCompletion: (completionId: string) => Promise<void>;
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
}

export const useAppStore = create<AppStore>((set, get) => ({
  data: null,
  loading: false,
  saving: false,
  error: null,

  loadData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await readAppData();
      set({ data, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  markChoreComplete: async (choreId, childId) => {
    const { data } = get();
    if (!data) return;
    const chore = data.chores.find((c) => c.id === choreId);
    if (!chore) return;

    const completion: Completion = {
      id: uuidv4(),
      choreId,
      childId,
      date: new Date().toISOString().split("T")[0],
      xp: chore.xp,
      approved: false,
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

  _save: async (updated: AppData) => {
    set({ saving: true, data: updated });
    try {
      await writeAppData(updated);
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ saving: false });
    }
  },
}));
