"use client";

import { create } from "zustand";
import { readAppData, writeAppData } from "@/lib/drive";
import type { AppData, Completion, Redemption, Chore, Reward, Child } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

interface AppStore {
  data: AppData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Internal helper
  _save: (data: AppData) => Promise<void>;

  // Data loading
  loadData: () => Promise<void>;

  // Chore completions
  markChoreComplete: (choreId: string, childId: string) => Promise<void>;
  approveCompletion: (completionId: string) => Promise<void>;
  rejectCompletion: (completionId: string) => Promise<void>;

  // Rewards
  redeemReward: (rewardId: string, childId: string) => Promise<void>;

  // Settings
  updateChild: (childId: string, updates: Partial<Child>) => Promise<void>;
  addChore: (chore: Omit<Chore, "id">) => Promise<void>;
  updateChore: (choreId: string, updates: Partial<Chore>) => Promise<void>;
  deleteChore: (choreId: string) => Promise<void>;
  addReward: (reward: Omit<Reward, "id">) => Promise<void>;
  updateReward: (rewardId: string, updates: Partial<Reward>) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;
  updateNextOurWeekend: (date: string) => Promise<void>;
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

    const updated: AppData = {
      ...data,
      completions: [...data.completions, completion],
    };
    await get()._save(updated);
  },

  approveCompletion: async (completionId) => {
    const { data } = get();
    if (!data) return;
    const updated: AppData = {
      ...data,
      completions: data.completions.map((c) =>
        c.id === completionId
          ? { ...c, approved: true, approvedAt: new Date().toISOString() }
          : c
      ),
    };
    await get()._save(updated);
  },

  rejectCompletion: async (completionId) => {
    const { data } = get();
    if (!data) return;
    const updated: AppData = {
      ...data,
      completions: data.completions.filter((c) => c.id !== completionId),
    };
    await get()._save(updated);
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

    const updated: AppData = {
      ...data,
      redemptions: [...data.redemptions, redemption],
    };
    await get()._save(updated);
  },

  updateChild: async (childId, updates) => {
    const { data } = get();
    if (!data) return;
    const updated: AppData = {
      ...data,
      settings: {
        ...data.settings,
        children: data.settings.children.map((c) =>
          c.id === childId ? { ...c, ...updates } : c
        ),
      },
    };
    await get()._save(updated);
  },

  addChore: async (chore) => {
    const { data } = get();
    if (!data) return;
    const updated: AppData = {
      ...data,
      chores: [...data.chores, { ...chore, id: uuidv4() }],
    };
    await get()._save(updated);
  },

  updateChore: async (choreId, updates) => {
    const { data } = get();
    if (!data) return;
    const updated: AppData = {
      ...data,
      chores: data.chores.map((c) =>
        c.id === choreId ? { ...c, ...updates } : c
      ),
    };
    await get()._save(updated);
  },

  deleteChore: async (choreId) => {
    const { data } = get();
    if (!data) return;
    const updated: AppData = {
      ...data,
      chores: data.chores.filter((c) => c.id !== choreId),
    };
    await get()._save(updated);
  },

  addReward: async (reward) => {
    const { data } = get();
    if (!data) return;
    const updated: AppData = {
      ...data,
      rewards: [...data.rewards, { ...reward, id: uuidv4() }],
    };
    await get()._save(updated);
  },

  updateReward: async (rewardId, updates) => {
    const { data } = get();
    if (!data) return;
    const updated: AppData = {
      ...data,
      rewards: data.rewards.map((r) =>
        r.id === rewardId ? { ...r, ...updates } : r
      ),
    };
    await get()._save(updated);
  },

  deleteReward: async (rewardId) => {
    const { data } = get();
    if (!data) return;
    const updated: AppData = {
      ...data,
      rewards: data.rewards.filter((r) => r.id !== rewardId),
    };
    await get()._save(updated);
  },

  updateNextOurWeekend: async (date) => {
    const { data } = get();
    if (!data) return;
    const updated: AppData = {
      ...data,
      settings: {
        ...data.settings,
        custodySchedule: { nextOurWeekend: date },
      },
    };
    await get()._save(updated);
  },

  // Internal save helper
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
