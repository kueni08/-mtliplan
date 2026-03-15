import type { AppData } from "./types";
import { v4 as uuidv4 } from "uuid";

export function getDefaultData(): AppData {
  // Next Friday from today as default custody weekend placeholder
  const nextFriday = getNextFriday();

  return {
    version: 1,
    settings: {
      children: [
        {
          id: "child-1",
          name: "Nils",
          avatar: "🦊",
          color: "purple",
          characterTheme: "evoli" as const,
        },
        {
          id: "child-2",
          name: "Lou",
          avatar: "🐴",
          color: "orange",
          characterTheme: "shire" as const,
        },
      ],
      custodySchedule: {
        nextOurWeekend: nextFriday,
      },
    },
    chores: [
      {
        id: uuidv4(),
        title: "Tisch decken",
        xp: 10,
        category: "küche",
        emoji: "🍽️",
        active: true,
      },
      {
        id: uuidv4(),
        title: "Abwasch machen",
        xp: 15,
        category: "küche",
        emoji: "🫧",
        active: true,
      },
      {
        id: uuidv4(),
        title: "Zimmer aufräumen",
        xp: 20,
        category: "zimmer",
        emoji: "🛏️",
        active: true,
      },
      {
        id: uuidv4(),
        title: "Müll rausbringen",
        xp: 15,
        category: "haus",
        emoji: "🗑️",
        active: true,
      },
      {
        id: uuidv4(),
        title: "Staubsaugen",
        xp: 25,
        category: "haus",
        emoji: "🧹",
        active: false,
      },
    ],
    rewards: [
      {
        id: uuidv4(),
        title: "Wunsch-Film-Abend",
        cost: 80,
        emoji: "🎬",
        active: true,
      },
      {
        id: uuidv4(),
        title: "Lieblings-Essen",
        cost: 100,
        emoji: "🍕",
        active: true,
      },
      {
        id: uuidv4(),
        title: "Ausschlafen (ohne Aufstehzeit)",
        cost: 120,
        emoji: "😴",
        active: true,
      },
      {
        id: uuidv4(),
        title: "Spielzeit +1 Stunde",
        cost: 60,
        emoji: "🎮",
        active: true,
      },
    ],
    completions: [],
    redemptions: [],
  };
}

function getNextFriday(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilFriday);
  return d.toISOString().split("T")[0];
}
