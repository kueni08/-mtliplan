"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/store/useAppStore";
import { DEFAULT_LEVELS } from "@/lib/gamification";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/solid";
import type { Chore, Reward, HouseholdMember, LevelConfig } from "@/lib/types";

const AVATARS = ["🦸", "🧙", "🦊", "🐉", "🦁", "🐺", "🦄", "🤖", "👾", "🎮", "🐼", "🐨"];
const CHORE_EMOJIS  = ["🍽️","🫧","🛏️","🗑️","🧹","🪣","🌿","🧺","🚿","🪟","🧽","🫙"];
const REWARD_EMOJIS = ["🎬","🍕","😴","🎮","🍦","🎁","🏆","🎯","🎨","🎵","🎲","🎪"];
const CATEGORIES = ["küche","zimmer","haus","sonstiges"] as const;

type Tab = "haushalt" | "aufgaben" | "belohnungen" | "stufen" | "kalender";

function EinstellungenContent() {
  const {
    data,
    updateChild, addHouseholdMember, removeHouseholdMember,
    addChore, updateChore, deleteChore,
    addReward, updateReward, deleteReward,
    updateNextOurWeekend,
    updateLevelConfig, resetLevelConfig,
  } = useAppStore();

  const [tab, setTab]                 = useState<Tab>("haushalt");
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingChore,  setEditingChore]  = useState<string | null>(null);
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [editingLevel,  setEditingLevel]  = useState<number | null>(null);
  const [newChore,  setNewChore]  = useState<Partial<Chore>>({});
  const [newReward, setNewReward] = useState<Partial<Reward>>({});
  const [showAddChore,  setShowAddChore]  = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);

  if (!data) return null;

  const effectiveLevels: LevelConfig[] = data.settings.levelConfig ?? DEFAULT_LEVELS;

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "haushalt",    label: "Haushalt",    emoji: "👨‍👩‍👧" },
    { id: "aufgaben",    label: "Aufgaben",    emoji: "📋" },
    { id: "belohnungen", label: "Belohnungen", emoji: "🎁" },
    { id: "stufen",      label: "Stufen",      emoji: "📊" },
    { id: "kalender",    label: "Kalender",    emoji: "📅" },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">⚙️ Einstellungen</h1>

      {/* Tab bar — horizontal scroll on small screens */}
      <div className="flex gap-1 overflow-x-auto glass rounded-2xl p-1 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
              tab === t.id
                ? "bg-purple-600 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <div>{t.emoji}</div>
            <div>{t.label}</div>
          </button>
        ))}
      </div>

      {/* ── HAUSHALT ── */}
      {tab === "haushalt" && (
        <div className="space-y-4">
          {/* Admin badge */}
          <div className="glass rounded-2xl p-4 border border-yellow-500/30 flex items-center gap-3">
            <span className="text-3xl">👑</span>
            <div>
              <p className="font-bold text-white">Du bist Admin dieses Haushalts</p>
              <p className="text-white/50 text-xs">Du kannst Mitglieder einladen und verwalten</p>
            </div>
          </div>

          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Mitglieder</h3>

          {data.settings.children.map((member) => {
            if (editingMember === member.id) {
              return (
                <MemberEditForm
                  key={member.id}
                  member={member}
                  onSave={(updates) => { updateChild(member.id, updates); setEditingMember(null); }}
                  onCancel={() => setEditingMember(null)}
                />
              );
            }
            return (
              <div key={member.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                <span className="text-3xl">{member.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{member.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      member.role === "adult"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-green-500/20 text-green-300"
                    }`}>
                      {member.role === "adult" ? "👤 Erwachsen" : "👧 Kind"}
                    </span>
                    {member.characterTheme && (
                      <span className="text-xs text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                        {member.characterTheme === "evoli" ? "🦊 Evoli" : "🐴 Shire"}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditingMember(member.id)}
                  className="text-white/40 hover:text-white/80 p-1.5"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeHouseholdMember(member.id)}
                  className="text-red-400/60 hover:text-red-400 p-1.5"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {showAddMember ? (
            <MemberAddForm
              onSave={(m) => { addHouseholdMember(m); setShowAddMember(false); }}
              onCancel={() => setShowAddMember(false)}
            />
          ) : (
            <button
              onClick={() => setShowAddMember(true)}
              className="w-full glass rounded-2xl p-3 flex items-center justify-center gap-2 text-purple-300 hover:text-white border-dashed border border-purple-500/30 hover:border-purple-400/50 transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              Mitglied hinzufügen
            </button>
          )}
        </div>
      )}

      {/* ── AUFGABEN ── */}
      {tab === "aufgaben" && (
        <div className="space-y-3">
          {data.chores.map((chore) => {
            if (editingChore === chore.id) {
              return (
                <ChoreEditForm
                  key={chore.id}
                  chore={chore}
                  onSave={(u) => { updateChore(chore.id, u); setEditingChore(null); }}
                  onCancel={() => setEditingChore(null)}
                />
              );
            }
            return (
              <div key={chore.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                <span className="text-2xl">{chore.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${chore.active ? "text-white" : "text-white/40 line-through"}`}>
                    {chore.title}
                  </p>
                  <p className="text-xs text-purple-300">+{chore.xp} XP · {chore.category}</p>
                </div>
                <button
                  onClick={() => updateChore(chore.id, { active: !chore.active })}
                  className={`text-xs px-2 py-1 rounded-lg transition-all ${
                    chore.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-500"
                  }`}
                >
                  {chore.active ? "AN" : "AUS"}
                </button>
                <button onClick={() => setEditingChore(chore.id)} className="text-white/40 hover:text-white/80 p-1">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => deleteChore(chore.id)} className="text-red-400/60 hover:text-red-400 p-1">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {showAddChore ? (
            <ChoreAddForm
              onSave={(c) => { addChore(c); setShowAddChore(false); }}
              onCancel={() => setShowAddChore(false)}
            />
          ) : (
            <button
              onClick={() => setShowAddChore(true)}
              className="w-full glass rounded-2xl p-3 flex items-center justify-center gap-2 text-purple-300 hover:text-white border-dashed border border-purple-500/30 hover:border-purple-400/50 transition-all"
            >
              <PlusIcon className="w-5 h-5" /> Aufgabe hinzufügen
            </button>
          )}
        </div>
      )}

      {/* ── BELOHNUNGEN ── */}
      {tab === "belohnungen" && (
        <div className="space-y-3">
          {data.rewards.map((reward) => {
            if (editingReward === reward.id) {
              return (
                <RewardEditForm
                  key={reward.id}
                  reward={reward}
                  onSave={(u) => { updateReward(reward.id, u); setEditingReward(null); }}
                  onCancel={() => setEditingReward(null)}
                />
              );
            }
            return (
              <div key={reward.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                <span className="text-2xl">{reward.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${reward.active ? "text-white" : "text-white/40 line-through"}`}>
                    {reward.title}
                  </p>
                  <p className="text-xs text-orange-300">{reward.cost} XP</p>
                </div>
                <button
                  onClick={() => updateReward(reward.id, { active: !reward.active })}
                  className={`text-xs px-2 py-1 rounded-lg transition-all ${
                    reward.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-500"
                  }`}
                >
                  {reward.active ? "AN" : "AUS"}
                </button>
                <button onClick={() => setEditingReward(reward.id)} className="text-white/40 hover:text-white/80 p-1">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => deleteReward(reward.id)} className="text-red-400/60 hover:text-red-400 p-1">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {showAddReward ? (
            <RewardAddForm
              onSave={(r) => { addReward(r); setShowAddReward(false); }}
              onCancel={() => setShowAddReward(false)}
            />
          ) : (
            <button
              onClick={() => setShowAddReward(true)}
              className="w-full glass rounded-2xl p-3 flex items-center justify-center gap-2 text-orange-300 hover:text-white border-dashed border border-orange-500/30 hover:border-orange-400/50 transition-all"
            >
              <PlusIcon className="w-5 h-5" /> Belohnung hinzufügen
            </button>
          )}
        </div>
      )}

      {/* ── STUFEN ── */}
      {tab === "stufen" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-4 space-y-1">
            <h3 className="font-bold text-white">📊 Entwicklungsstufen</h3>
            <p className="text-white/60 text-sm">
              Wie viele XP braucht ein Kind für jede Stufe? Passe die Schwellen an deine Kinder an.
            </p>
          </div>

          {effectiveLevels.map((lvl) => (
            <div key={lvl.level} className="glass rounded-2xl p-4 space-y-2">
              {editingLevel === lvl.level ? (
                <LevelEditForm
                  levelData={lvl}
                  onSave={(updated) => {
                    const newConfig = effectiveLevels.map((l) =>
                      l.level === lvl.level ? { ...l, ...updated } : l
                    );
                    updateLevelConfig(newConfig);
                    setEditingLevel(null);
                  }}
                  onCancel={() => setEditingLevel(null)}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{lvl.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-white">Stufe {lvl.level}: {lvl.label}</p>
                    <p className="text-purple-300 text-xs">ab {lvl.minXP} XP</p>
                  </div>
                  <button
                    onClick={() => setEditingLevel(lvl.level)}
                    className="text-white/40 hover:text-white/80 p-1.5"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {data.settings.levelConfig && (
            <button
              onClick={resetLevelConfig}
              className="w-full glass rounded-2xl p-3 text-white/50 hover:text-white text-sm transition-all"
            >
              🔄 Auf Standard zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* ── KALENDER ── */}
      {tab === "kalender" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-white">📅 Betreuungsplan</h3>
            <p className="text-white/60 text-sm">
              Die Kinder sind immer <strong className="text-white">Di. Abend bis Mi. Abend</strong> da.
              Dazu jedes zweite Wochenende (<strong className="text-white">Fr. Abend bis So. Abend</strong>).
            </p>
            <div>
              <label className="text-xs text-white/50 block mb-1">
                Nächstes Wochenende bei uns (Freitag-Datum):
              </label>
              <input
                type="date"
                value={data.settings.custodySchedule.nextOurWeekend}
                onChange={(e) => updateNextOurWeekend(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="glass rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-white text-sm">ℹ️ Info</h3>
            <ul className="text-white/60 text-sm space-y-1">
              <li>• Di 18:00 → Mi 18:00 (jede Woche)</li>
              <li>• Fr 18:00 → So 18:00 (jedes 2. WE)</li>
              <li>• Dashboard zeigt an, ob Kinder gerade da sind</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EinstellungenClient() {
  return (
    <AppShell>
      <EinstellungenContent />
    </AppShell>
  );
}

// ─── Sub-forms ────────────────────────────────────────────────────────────────

function MemberEditForm({
  member,
  onSave,
  onCancel,
}: {
  member: HouseholdMember;
  onSave: (u: Partial<HouseholdMember>) => void;
  onCancel: () => void;
}) {
  const [name, setName]   = useState(member.name);
  const [avatar, setAvatar] = useState(member.avatar);
  const [color, setColor]   = useState(member.color);
  const [role, setRole]     = useState<HouseholdMember["role"]>(member.role ?? "child");
  const [theme, setTheme]   = useState<HouseholdMember["characterTheme"]>(member.characterTheme);

  return (
    <div className="glass rounded-2xl p-4 space-y-4 border border-purple-500/40">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-purple-400"
          placeholder="Name"
        />
      </div>

      <div>
        <p className="text-xs text-white/50 mb-2">Avatar:</p>
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((e) => (
            <button
              key={e}
              onClick={() => setAvatar(e)}
              className={`text-2xl p-1.5 rounded-lg transition-all ${
                avatar === e ? "bg-purple-600 scale-110" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-white/50 mb-2">Farbe:</p>
        <div className="flex gap-2">
          {(["purple", "orange"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                color === c
                  ? c === "orange" ? "bg-orange-500 text-white" : "bg-purple-600 text-white"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {c === "orange" ? "🟠 Orange" : "🟣 Lila"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-white/50 mb-2">Rolle:</p>
        <div className="flex gap-2">
          {([["child", "👧 Kind"], ["adult", "👤 Erwachsen"]] as const).map(([r, label]) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                role === r ? "bg-blue-600 text-white" : "bg-white/10 text-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {role === "child" && (
        <div>
          <p className="text-xs text-white/50 mb-2">Charakter:</p>
          <div className="flex gap-2 flex-wrap">
            {([
              [undefined, "🎲 Keiner"],
              ["evoli",   "🦊 Evoli"],
              ["shire",   "🐴 Shire"],
            ] as const).map(([t, label]) => (
              <button
                key={String(t)}
                onClick={() => setTheme(t)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  theme === t ? "bg-purple-600 text-white" : "bg-white/10 text-white/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onSave({ name, avatar, color, role, characterTheme: role === "child" ? theme : undefined })}
          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl font-medium transition-all"
        >
          Speichern
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function MemberAddForm({
  onSave,
  onCancel,
}: {
  onSave: (m: Omit<HouseholdMember, "id">) => void;
  onCancel: () => void;
}) {
  const [name,   setName]   = useState("");
  const [avatar, setAvatar] = useState("🦸");
  const [color,  setColor]  = useState<HouseholdMember["color"]>("purple");
  const [role,   setRole]   = useState<HouseholdMember["role"]>("child");
  const [theme,  setTheme]  = useState<HouseholdMember["characterTheme"]>(undefined);

  return (
    <div className="glass rounded-2xl p-4 space-y-4 border border-purple-500/40">
      <p className="text-white font-medium">Neues Mitglied</p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-purple-400"
        placeholder="Name"
      />

      <div>
        <p className="text-xs text-white/50 mb-2">Avatar:</p>
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((e) => (
            <button
              key={e}
              onClick={() => setAvatar(e)}
              className={`text-2xl p-1.5 rounded-lg transition-all ${
                avatar === e ? "bg-purple-600 scale-110" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-white/50 mb-2">Rolle:</p>
        <div className="flex gap-2">
          {([["child", "👧 Kind"], ["adult", "👤 Erwachsen"]] as const).map(([r, label]) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                role === r ? "bg-blue-600 text-white" : "bg-white/10 text-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {role === "child" && (
        <div>
          <p className="text-xs text-white/50 mb-2">Charakter (optional):</p>
          <div className="flex gap-2">
            {([
              [undefined, "🎲 Keiner"],
              ["evoli",   "🦊 Evoli"],
              ["shire",   "🐴 Shire"],
            ] as const).map(([t, label]) => (
              <button
                key={String(t)}
                onClick={() => setTheme(t)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  theme === t ? "bg-purple-600 text-white" : "bg-white/10 text-white/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-white/50 mb-2">Farbe:</p>
        <div className="flex gap-2">
          {(["purple", "orange"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                color === c
                  ? c === "orange" ? "bg-orange-500 text-white" : "bg-purple-600 text-white"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {c === "orange" ? "🟠 Orange" : "🟣 Lila"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => name && onSave({ name, avatar, color, role, characterTheme: role === "child" ? theme : undefined })}
          disabled={!name}
          className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white py-2 rounded-xl font-medium transition-all"
        >
          Hinzufügen
        </button>
        <button onClick={onCancel} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function LevelEditForm({
  levelData,
  onSave,
  onCancel,
}: {
  levelData: LevelConfig;
  onSave: (u: Partial<LevelConfig>) => void;
  onCancel: () => void;
}) {
  const [label,  setLabel]  = useState(levelData.label);
  const [emoji,  setEmoji]  = useState(levelData.emoji);
  const [minXP,  setMinXP]  = useState(levelData.minXP);
  const LEVEL_EMOJIS = ["🌱","⭐","🔥","💎","👑","🌟","🏆","🦋","🌈","✨"];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <p className="text-white font-bold">Stufe {levelData.level}</p>
      </div>
      <div>
        <p className="text-xs text-white/50 mb-1">Emoji:</p>
        <div className="flex flex-wrap gap-2">
          {LEVEL_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`text-xl p-1.5 rounded-lg transition-all ${
                emoji === e ? "bg-purple-600 scale-110" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
          placeholder="Stufenname"
        />
        {levelData.level > 1 && (
          <input
            type="number"
            value={minXP}
            onChange={(e) => setMinXP(Number(e.target.value))}
            className="w-28 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none"
            placeholder="Min XP"
            min={0}
          />
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ label, emoji, minXP: levelData.level === 1 ? 0 : minXP })}
          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl font-medium transition-all"
        >
          Speichern
        </button>
        <button onClick={onCancel} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function ChoreEditForm({ chore, onSave, onCancel }: { chore: Chore; onSave: (u: Partial<Chore>) => void; onCancel: () => void }) {
  const [title, setTitle]       = useState(chore.title);
  const [xp, setXp]             = useState(chore.xp);
  const [emoji, setEmoji]       = useState(chore.emoji);
  const [category, setCategory] = useState(chore.category);
  return (
    <div className="glass rounded-2xl p-4 space-y-3 border border-purple-500/40">
      <div className="flex gap-2">
        <select value={emoji} onChange={(e) => setEmoji(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-2 py-2 text-white text-xl focus:outline-none">
          {CHORE_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
          placeholder="Aufgabe" />
      </div>
      <div className="flex gap-2">
        <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))}
          className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none"
          placeholder="XP" min={1} max={100} />
        <select value={category} onChange={(e) => setCategory(e.target.value as Chore["category"])}
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave({ title, xp, emoji, category })}
          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl font-medium transition-all">
          Speichern
        </button>
        <button onClick={onCancel} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function ChoreAddForm({ onSave, onCancel }: { onSave: (c: Omit<Chore, "id">) => void; onCancel: () => void }) {
  const [title, setTitle]       = useState("");
  const [xp, setXp]             = useState(10);
  const [emoji, setEmoji]       = useState("🧹");
  const [category, setCategory] = useState<Chore["category"]>("haus");
  return (
    <div className="glass rounded-2xl p-4 space-y-3 border border-purple-500/40">
      <p className="text-white font-medium text-sm">Neue Aufgabe</p>
      <div className="flex gap-2">
        <select value={emoji} onChange={(e) => setEmoji(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-2 py-2 text-white text-xl focus:outline-none">
          {CHORE_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
          placeholder="Aufgabe" />
      </div>
      <div className="flex gap-2">
        <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))}
          className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none"
          placeholder="XP" min={1} max={100} />
        <select value={category} onChange={(e) => setCategory(e.target.value as Chore["category"])}
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={() => title && onSave({ title, xp, emoji, category, active: true })}
          disabled={!title}
          className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white py-2 rounded-xl font-medium transition-all">
          Hinzufügen
        </button>
        <button onClick={onCancel} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function RewardEditForm({ reward, onSave, onCancel }: { reward: Reward; onSave: (u: Partial<Reward>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(reward.title);
  const [cost, setCost]   = useState(reward.cost);
  const [emoji, setEmoji] = useState(reward.emoji);
  return (
    <div className="glass rounded-2xl p-4 space-y-3 border border-orange-500/40">
      <div className="flex gap-2">
        <select value={emoji} onChange={(e) => setEmoji(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-2 py-2 text-white text-xl focus:outline-none">
          {REWARD_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-400"
          placeholder="Belohnung" />
      </div>
      <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none"
        placeholder="XP-Kosten" min={1} />
      <div className="flex gap-2">
        <button onClick={() => onSave({ title, cost, emoji })}
          className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2 rounded-xl font-medium transition-all">
          Speichern
        </button>
        <button onClick={onCancel} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function RewardAddForm({ onSave, onCancel }: { onSave: (r: Omit<Reward, "id">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [cost, setCost]   = useState(80);
  const [emoji, setEmoji] = useState("🎁");
  return (
    <div className="glass rounded-2xl p-4 space-y-3 border border-orange-500/40">
      <p className="text-white font-medium text-sm">Neue Belohnung</p>
      <div className="flex gap-2">
        <select value={emoji} onChange={(e) => setEmoji(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-2 py-2 text-white text-xl focus:outline-none">
          {REWARD_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-400"
          placeholder="Belohnung" />
      </div>
      <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none"
        placeholder="XP-Kosten" min={1} />
      <div className="flex gap-2">
        <button onClick={() => title && onSave({ title, cost, emoji, active: true })}
          disabled={!title}
          className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white py-2 rounded-xl font-medium transition-all">
          Hinzufügen
        </button>
        <button onClick={onCancel} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all">
          Abbrechen
        </button>
      </div>
    </div>
  );
}
