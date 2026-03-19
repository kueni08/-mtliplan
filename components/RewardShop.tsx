"use client";

import { useState } from "react";
import type { Reward, MemberColor } from "@/lib/types";
import { COLOR_MAP } from "@/lib/colors";

interface RewardShopProps {
  rewards: Reward[];
  availableXP: number;
  onRedeem: (rewardId: string) => void;
  childColor?: MemberColor;
}

export default function RewardShop({
  rewards,
  availableXP,
  onRedeem,
  childColor = "purple",
}: RewardShopProps) {
  const [confirming, setConfirming] = useState<string | null>(null);

  const activeRewards = rewards.filter((r) => r.active);
  const { bg: btnColor, text: xpColor } = COLOR_MAP[childColor];

  if (activeRewards.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <span>🎁</span> Belohnungs-Shop
      </h3>
      <div className="grid gap-3">
        {activeRewards.map((reward) => {
          const canAfford = availableXP >= reward.cost;
          const isConfirming = confirming === reward.id;

          return (
            <div
              key={reward.id}
              className={`glass rounded-2xl p-4 transition-all ${
                canAfford ? "" : "opacity-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-3xl">{reward.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{reward.title}</p>
                    <p className={`text-sm font-bold ${xpColor}`}>{reward.cost} XP</p>
                  </div>
                </div>

                {isConfirming ? (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onRedeem(reward.id);
                        setConfirming(null);
                      }}
                      className="bg-green-500 hover:bg-green-400 text-white text-sm font-bold px-3 py-1.5 rounded-xl"
                    >
                      Ja!
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="bg-white/10 text-white text-sm px-3 py-1.5 rounded-xl"
                    >
                      Nein
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => canAfford && setConfirming(reward.id)}
                    disabled={!canAfford}
                    className={`${btnColor} disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl active:scale-90 transition-all shrink-0`}
                  >
                    Einlösen
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className={`text-center text-sm ${xpColor}`}>
        Verfügbare Punkte: <strong>{availableXP} XP</strong>
      </p>
    </div>
  );
}
