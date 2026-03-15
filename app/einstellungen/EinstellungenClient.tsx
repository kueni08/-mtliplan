"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/store/useAppStore";
import { DEFAULT_LEVELS } from "@/lib/gamification";
import { generateAssignments, calcAssignmentXP, getCurrentMonday } from "@/lib/scheduler";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/solid";
import type { Chore, Reward, HouseholdMember, LevelConfig, PresenceType, ChoreFrequency, ChoreAssignment } from "@/lib/types";

const AVATARS = ["🦸", "🧙", "🦊", "🐉", "🦁", "🐺", "🦄", "🤖", "👾", "🎮", "🐼", "🐨"];

const THEME_OPTIONS = [
  [undefined,     "🎲 Keiner"],
  ["evoli",       "🦊 Evoli"],
  ["shire",       "🐴 Shire"],
  ["pikachu",     "⚡ Pikachu"],
  ["charmander",  "🔥 Glumanda"],
  ["togepi",      "🥚 Togepi"],
  ["jigglypuff",  "🎤 Pummeluff"],
  ["squirtle",    "💦 Schiggy"],
] as const;

const THEME_LABELS: Record<string, string> = Object.fromEntries(
  THEME_OPTIONS.filter(([t]) => t !== undefined).map(([t, l]) => [t, l])
);
const CHORE_EMOJIS  = ["🍽️","🫧","🛏️","🗑️","🧹","🪣","🌿","🧺","🚿","🪟","🧽","🫙"];
const REWARD_EMOJIS = ["🎬","🍕","😴","🎮","🍦","🎁","🏆","🎯","🎨","🎵","🎲","🎪"];
const CATEGORIES = ["küche","zimmer","haus","sonstiges"] as const;

type Tab = "haushalt" | "aufgaben" | "belohnungen" | "stufen" | "wochenplan";

function EinstellungenContent() {
  const {
    data,
    updateChild, addHouseholdMember, removeHouseholdMember,
    addChore, updateChore, deleteChore,
    addReward, updateReward, deleteReward,
    updateNextOurWeekend,
    updateLevelConfig, resetLevelConfig,
    updatePresenceSchedule, saveAssignments, reassignChore, removeAssignment,
    setMemberPassword,
  } = useAppStore();

  const [tab, setTab]                 = useState<Tab>("haushalt");
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingChore,  setEditingChore]  = useState<string | null>(null);
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [editingLevel,  setEditingLevel]  = useState<number | null>(null);
  const [showAddChore,  setShowAddChore]  = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);

  // Wochenplan state
  const [cycleStart, setCycleStart] = useState(() => data?.settings.presenceSchedule?.cycleStartDate ?? getCurrentMonday());
  const [presenceDraft, setPresenceDraft] = useState<Record<string, PresenceType[]>>(() => {
    const patterns = data?.settings.presenceSchedule?.patterns ?? [];
    const init: Record<string, PresenceType[]> = {};
    (data?.settings.children ?? []).filter(c => c.role === "child" || !c.role).forEach(c => {
      const p = patterns.find(p => p.childId === c.id);
      init[c.id] = p?.days ?? Array(14).fill("absent" as PresenceType);
    });
    return init;
  });
  const [previewAssignments, setPreviewAssignments] = useState<ReturnType<typeof generateAssignments> | null>(null);

  if (!data) return null;

  const effectiveLevels: LevelConfig[] = data.settings.levelConfig ?? DEFAULT_LEVELS;

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "haushalt",    label: "Haushalt",    emoji: "👨‍👩‍👧" },
    { id: "aufgaben",    label: "Aufgaben",    emoji: "📋" },
    { id: "belohnungen", label: "Belohnungen", emoji: "🎁" },
    { id: "stufen",      label: "Stufen",      emoji: "📊" },
    { id: "wochenplan",  label: "Wochenplan",  emoji: "📆" },
  ];

  const children = data.settings.children.filter(c => c.role === "child" || !c.role);

  const PRESENCE_CYCLE: PresenceType[] = ["absent", "halbtag", "ganztag"];
  const togglePresence = (childId: string, dayIdx: number) => {
    setPresenceDraft(prev => {
      const days = [...(prev[childId] ?? Array(14).fill("absent" as PresenceType))];
      const cur = days[dayIdx] as PresenceType;
      days[dayIdx] = PRESENCE_CYCLE[(PRESENCE_CYCLE.indexOf(cur) + 1) % PRESENCE_CYCLE.length];
      return { ...prev, [childId]: days };
    });
  };

  const savePresence = async () => {
    const patterns = children.map(c => ({
      childId: c.id,
      days: presenceDraft[c.id] ?? Array(14).fill("absent" as PresenceType),
    }));
    await updatePresenceSchedule({ cycleStartDate: cycleStart, patterns });
  };

  const generatePreview = () => {
    if (!data) return;
    const from = new Date();
    const fromStr = from.toISOString().split("T")[0];
    const to = new Date(from);
    to.setDate(to.getDate() + 13);
    const toStr = to.toISOString().split("T")[0];
    // Use draft as temp data for preview
    const patterns = children.map(c => ({
      childId: c.id,
      days: presenceDraft[c.id] ?? Array(14).fill("absent" as PresenceType),
    }));
    const tempData = { ...data, settings: { ...data.settings, presenceSchedule: { cycleStartDate: cycleStart, patterns } } };
    const assignments = generateAssignments(tempData, fromStr, toStr);
    setPreviewAssignments(assignments);
  };

  const applyAssignments = async () => {
    if (!previewAssignments) return;
    await savePresence();
    await saveAssignments(previewAssignments);
    setPreviewAssignments(null);
  };

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
                  onSetPassword={(hash) => setMemberPassword(member.id, hash)}
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
                        {THEME_LABELS[member.characterTheme] ?? member.characterTheme}
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

          {/* Household token setup */}
          <div className="glass rounded-2xl p-4 space-y-2 border border-yellow-500/20">
            <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider">🔑 Kind-Login einrichten</h3>
            <p className="text-white/50 text-xs">
              Damit Kinder sich ohne Google-Konto einloggen können, muss einmalig der Haushalt-Token in Vercel gesetzt werden.
            </p>
            <ol className="text-white/50 text-xs space-y-1 list-decimal list-inside">
              <li>Öffne <a href="/api/household-token" target="_blank" className="text-purple-300 underline">/api/household-token</a> und kopiere den Token</li>
              <li>Füge ihn in Vercel → Settings → Environment Variables als <code className="bg-white/10 px-1 rounded">HOUSEHOLD_REFRESH_TOKEN</code> ein</li>
              <li>Setze für jedes Kind ein Passwort (Bearbeiten → Passwort setzen)</li>
            </ol>
          </div>
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
                  <p className="text-xs text-purple-300">+{chore.xp} XP · {chore.category} · {FREQUENCY_OPTIONS.find(f => f.value === (chore.frequency ?? "daily"))?.label ?? "Täglich"}</p>
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

      {/* ── WOCHENPLAN ── */}
      {tab === "wochenplan" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-white">📆 2-Wochen-Anwesenheitsplan</h3>
            <p className="text-white/60 text-xs">
              Lege fest, wann jedes Kind anwesend ist. Klicke auf die Zellen um zu wechseln.
            </p>
            <div>
              <label className="text-xs text-white/50 block mb-1">Zyklusstart (Montag):</label>
              <input
                type="date"
                value={cycleStart}
                onChange={(e) => setCycleStart(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs text-white/60 px-1">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/40 inline-block" />Ganztag</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500/40 inline-block" />Halbtag</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-600 inline-block" />Abwesend</span>
          </div>

          {/* Grid */}
          <div className="glass rounded-2xl p-3 overflow-x-auto">
            <table className="w-full min-w-[340px] text-xs">
              <thead>
                <tr>
                  <th className="text-left text-white/40 pb-2 pr-2 font-normal">Kind</th>
                  {["Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di","Mi","Do","Fr","Sa","So"].map((d, i) => (
                    <th key={i} className={`pb-2 font-normal text-center ${i < 7 ? "text-blue-300/70" : "text-purple-300/70"}`}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {children.map(child => (
                  <tr key={child.id}>
                    <td className="pr-2 py-1 text-white/70 whitespace-nowrap font-medium">{child.name}</td>
                    {Array.from({ length: 14 }, (_, i) => {
                      const type = (presenceDraft[child.id]?.[i] ?? "absent") as PresenceType;
                      return (
                        <td key={i} className="py-1 px-0.5">
                          <button
                            onClick={() => togglePresence(child.id, i)}
                            className={`w-7 h-7 rounded-lg text-center text-sm transition-all ${
                              type === "ganztag"  ? "bg-green-500/30 text-green-300 hover:bg-green-500/50" :
                              type === "halbtag"  ? "bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/50" :
                                                   "bg-gray-700/50 text-gray-500 hover:bg-gray-600/50"
                            }`}
                          >
                            {type === "ganztag" ? "●" : type === "halbtag" ? "½" : "–"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={savePresence}
            className="w-full glass rounded-2xl p-3 flex items-center justify-center gap-2 text-green-300 hover:text-white border border-green-500/30 hover:border-green-400/50 transition-all text-sm font-medium"
          >
            💾 Anwesenheitsplan speichern
          </button>

          <button
            onClick={generatePreview}
            className="w-full glass rounded-2xl p-3 flex items-center justify-center gap-2 text-blue-300 hover:text-white border-dashed border border-blue-500/30 hover:border-blue-400/50 transition-all text-sm font-medium"
          >
            📆 Vorschlag generieren (nächste 14 Tage)
          </button>

          {/* Existing assignments list */}
          {(data.assignments ?? []).length > 0 && !previewAssignments && (
            <AssignmentList
              assignments={data.assignments}
              chores={data.chores}
              children={children}
              onReassign={(id, newChildId) => reassignChore(id, newChildId)}
              onRemove={(id) => removeAssignment(id)}
            />
          )}

          {/* Preview */}
          {previewAssignments !== null && (() => {
            const xpTotals = calcAssignmentXP(previewAssignments, data);
            return (
              <div className="glass rounded-2xl p-4 space-y-3 border border-blue-500/30">
                <h3 className="font-bold text-white">Vorschau</h3>

                {/* XP balance */}
                <div className="flex gap-3">
                  {children.map(c => (
                    <div key={c.id} className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-white font-bold">{c.name}</p>
                      <p className="text-purple-300 text-lg font-black">{xpTotals[c.id] ?? 0} XP</p>
                    </div>
                  ))}
                </div>

                <p className="text-white/50 text-xs">{previewAssignments.length} Aufgaben-Zuteilungen</p>

                <div className="flex gap-2">
                  <button
                    onClick={applyAssignments}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-xl font-medium text-sm transition-all"
                  >
                    ✅ Übernehmen
                  </button>
                  <button
                    onClick={() => setPreviewAssignments(null)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm transition-all"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            );
          })()}
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
  onSetPassword,
}: {
  member: HouseholdMember;
  onSave: (u: Partial<HouseholdMember>) => void;
  onCancel: () => void;
  onSetPassword?: (hash: string) => void;
}) {
  const [name, setName]   = useState(member.name);
  const [avatar, setAvatar] = useState(member.avatar);
  const [color, setColor]   = useState(member.color);
  const [role, setRole]     = useState<HouseholdMember["role"]>(member.role ?? "child");
  const [theme, setTheme]   = useState<HouseholdMember["characterTheme"]>(member.characterTheme);
  const [newPassword, setNewPassword] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

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
            {THEME_OPTIONS.map(([t, label]) => (
              <button
                key={String(t)}
                onClick={() => setTheme(t as HouseholdMember["characterTheme"])}
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

      {/* Password setter for child accounts */}
      {onSetPassword && (
        <div className="border-t border-white/10 pt-3 space-y-2">
          <p className="text-xs text-white/50">🔑 Login-Passwort setzen:</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPwSaved(false); }}
              placeholder="Neues Passwort"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
            />
            <button
              type="button"
              disabled={newPassword.length < 3}
              onClick={async () => {
                const bcrypt = await import("bcryptjs");
                const hash = await bcrypt.hash(newPassword, 10);
                onSetPassword(hash);
                setNewPassword("");
                setPwSaved(true);
              }}
              className="px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white text-sm rounded-xl font-medium transition-all"
            >
              {pwSaved ? "✓" : "Setzen"}
            </button>
          </div>
          {member.passwordHash && !pwSaved && (
            <p className="text-xs text-green-400/70">✓ Passwort bereits gesetzt</p>
          )}
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
          <div className="flex gap-2 flex-wrap">
            {THEME_OPTIONS.map(([t, label]) => (
              <button
                key={String(t)}
                onClick={() => setTheme(t as HouseholdMember["characterTheme"])}
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

const FREQUENCY_OPTIONS: { value: ChoreFrequency; label: string }[] = [
  { value: "daily",          label: "Täglich" },
  { value: "weekly",         label: "Wöchentlich" },
  { value: "multiple_daily", label: "Mehrmals tägl." },
  { value: "manual",         label: "Manuell" },
];

function ChoreEditForm({ chore, onSave, onCancel }: { chore: Chore; onSave: (u: Partial<Chore>) => void; onCancel: () => void }) {
  const [title, setTitle]         = useState(chore.title);
  const [xp, setXp]               = useState(chore.xp);
  const [emoji, setEmoji]         = useState(chore.emoji);
  const [category, setCategory]   = useState(chore.category);
  const [frequency, setFrequency] = useState<ChoreFrequency>(chore.frequency ?? "daily");
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
      <select value={frequency} onChange={(e) => setFrequency(e.target.value as ChoreFrequency)}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none text-sm">
        {FREQUENCY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <div className="flex gap-2">
        <button onClick={() => onSave({ title, xp, emoji, category, frequency })}
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
  const [title, setTitle]         = useState("");
  const [xp, setXp]               = useState(10);
  const [emoji, setEmoji]         = useState("🧹");
  const [category, setCategory]   = useState<Chore["category"]>("haus");
  const [frequency, setFrequency] = useState<ChoreFrequency>("daily");
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
      <select value={frequency} onChange={(e) => setFrequency(e.target.value as ChoreFrequency)}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none text-sm">
        {FREQUENCY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <div className="flex gap-2">
        <button onClick={() => title && onSave({ title, xp, emoji, category, active: true, frequency })}
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

function AssignmentList({
  assignments,
  chores,
  children,
  onReassign,
  onRemove,
}: {
  assignments: ChoreAssignment[];
  chores: Chore[];
  children: HouseholdMember[];
  onReassign: (id: string, newChildId: string) => void;
  onRemove: (id: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 7);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const upcoming = assignments
    .filter((a) => a.date >= today && a.date <= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.choreId.localeCompare(b.choreId));

  if (upcoming.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 space-y-3 border border-white/10">
      <h3 className="font-bold text-white text-sm">📋 Zugeteilte Aufgaben — nächste 7 Tage</h3>
      <div className="space-y-2">
        {upcoming.map((a) => {
          const chore = chores.find((c) => c.id === a.choreId);
          if (!chore) return null;
          const d = new Date(a.date + "T00:00:00");
          const dayLabel = d.toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "numeric" });
          return (
            <div key={a.id} className="flex items-center gap-2 text-sm">
              <span className="text-white/40 w-20 shrink-0 text-xs">{dayLabel}</span>
              <span className="text-xl">{chore.emoji}</span>
              <span className="flex-1 text-white/80 truncate">{chore.title}</span>
              <select
                value={a.childId}
                onChange={(e) => onReassign(a.id, e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={() => onRemove(a.id)}
                className="text-red-400/50 hover:text-red-400 p-1 shrink-0"
              >
                <TrashIcon className="w-3 h-3" />
              </button>
            </div>
          );
        })}
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
