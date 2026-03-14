"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/store/useAppStore";
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import type { Chore, Reward } from "@/lib/types";

const AVATARS = ["🦸", "🧙", "🦊", "🐉", "🦁", "🐺", "🦄", "🤖", "👾", "🎮"];
const CHORE_EMOJIS = ["🍽️", "🫧", "🛏️", "🗑️", "🧹", "🪣", "🌿", "🧺", "🚿", "🪟"];
const REWARD_EMOJIS = ["🎬", "🍕", "😴", "🎮", "🍦", "🎁", "🏆", "🎯", "🎨", "🎵"];
const CATEGORIES = ["küche", "zimmer", "haus", "sonstiges"] as const;

export default function EinstellungenClient() {
  const { data, updateChild, addChore, updateChore, deleteChore, addReward, updateReward, deleteReward, updateNextOurWeekend } = useAppStore();
  const [tab, setTab] = useState<"kinder" | "aufgaben" | "belohnungen" | "kalender">("kinder");
  const [editingChore, setEditingChore] = useState<string | null>(null);
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [newChore, setNewChore] = useState<Partial<Chore>>({});
  const [newReward, setNewReward] = useState<Partial<Reward>>({});
  const [showAddChore, setShowAddChore] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);

  if (!data) return null;

  const tabs = [
    { id: "kinder" as const, label: "Kinder", emoji: "👧👦" },
    { id: "aufgaben" as const, label: "Aufgaben", emoji: "📋" },
    { id: "belohnungen" as const, label: "Belohnungen", emoji: "🎁" },
    { id: "kalender" as const, label: "Kalender", emoji: "📅" },
  ];

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">⚙️ Einstellungen</h1>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1 glass rounded-2xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-2 px-1 rounded-xl text-xs font-medium transition-all ${
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

        {/* Kinder */}
        {tab === "kinder" && (
          <div className="space-y-4">
            {data.settings.children.map((child) => (
              <div key={child.id} className="glass rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{child.avatar}</span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={child.name}
                      onChange={(e) => updateChild(child.id, { name: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-purple-400"
                      placeholder="Name"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-2">Avatar wählen:</p>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => updateChild(child.id, { avatar: emoji })}
                        className={`text-2xl p-1.5 rounded-lg transition-all ${
                          child.avatar === emoji
                            ? "bg-purple-600 scale-110"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-2">Farbe:</p>
                  <div className="flex gap-2">
                    {(["purple", "orange"] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => updateChild(child.id, { color })}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          child.color === color
                            ? color === "orange"
                              ? "bg-orange-500 text-white"
                              : "bg-purple-600 text-white"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {color === "orange" ? "🟠 Orange" : "🟣 Lila"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aufgaben */}
        {tab === "aufgaben" && (
          <div className="space-y-3">
            {data.chores.map((chore) => {
              if (editingChore === chore.id) {
                return (
                  <ChoreEditForm
                    key={chore.id}
                    chore={chore}
                    onSave={(updates) => { updateChore(chore.id, updates); setEditingChore(null); }}
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
                  <button
                    onClick={() => setEditingChore(chore.id)}
                    className="text-white/40 hover:text-white/80 p-1"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteChore(chore.id)}
                    className="text-red-400/60 hover:text-red-400 p-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {showAddChore ? (
              <ChoreAddForm
                onSave={(chore) => { addChore(chore); setShowAddChore(false); }}
                onCancel={() => setShowAddChore(false)}
              />
            ) : (
              <button
                onClick={() => setShowAddChore(true)}
                className="w-full glass rounded-2xl p-3 flex items-center justify-center gap-2 text-purple-300 hover:text-white border-dashed border border-purple-500/30 hover:border-purple-400/50 transition-all"
              >
                <PlusIcon className="w-5 h-5" />
                Aufgabe hinzufügen
              </button>
            )}
          </div>
        )}

        {/* Belohnungen */}
        {tab === "belohnungen" && (
          <div className="space-y-3">
            {data.rewards.map((reward) => {
              if (editingReward === reward.id) {
                return (
                  <RewardEditForm
                    key={reward.id}
                    reward={reward}
                    onSave={(updates) => { updateReward(reward.id, updates); setEditingReward(null); }}
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
                  <button
                    onClick={() => setEditingReward(reward.id)}
                    className="text-white/40 hover:text-white/80 p-1"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteReward(reward.id)}
                    className="text-red-400/60 hover:text-red-400 p-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {showAddReward ? (
              <RewardAddForm
                onSave={(reward) => { addReward(reward); setShowAddReward(false); }}
                onCancel={() => setShowAddReward(false)}
              />
            ) : (
              <button
                onClick={() => setShowAddReward(true)}
                className="w-full glass rounded-2xl p-3 flex items-center justify-center gap-2 text-orange-300 hover:text-white border-dashed border border-orange-500/30 hover:border-orange-400/50 transition-all"
              >
                <PlusIcon className="w-5 h-5" />
                Belohnung hinzufügen
              </button>
            )}
          </div>
        )}

        {/* Kalender */}
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
    </AppShell>
  );
}

// --- Sub-forms ---

function ChoreEditForm({ chore, onSave, onCancel }: { chore: Chore; onSave: (u: Partial<Chore>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(chore.title);
  const [xp, setXp] = useState(chore.xp);
  const [emoji, setEmoji] = useState(chore.emoji);
  const [category, setCategory] = useState(chore.category);

  return (
    <div className="glass rounded-2xl p-4 space-y-3 border border-purple-500/40">
      <div className="flex gap-2">
        <select value={emoji} onChange={(e) => setEmoji(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-2 py-2 text-white text-xl focus:outline-none">
          {["🍽️","🫧","🛏️","🗑️","🧹","🪣","🌿","🧺","🚿","🪟","🧽","🫙"].map(e => <option key={e} value={e}>{e}</option>)}
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
        <button onClick={onCancel}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function ChoreAddForm({ onSave, onCancel }: { onSave: (c: Omit<Chore, "id">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [xp, setXp] = useState(10);
  const [emoji, setEmoji] = useState("🧹");
  const [category, setCategory] = useState<Chore["category"]>("haus");

  return (
    <div className="glass rounded-2xl p-4 space-y-3 border border-purple-500/40">
      <p className="text-white font-medium text-sm">Neue Aufgabe</p>
      <div className="flex gap-2">
        <select value={emoji} onChange={(e) => setEmoji(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-2 py-2 text-white text-xl focus:outline-none">
          {["🍽️","🫧","🛏️","🗑️","🧹","🪣","🌿","🧺","🚿","🪟","🧽","🫙"].map(e => <option key={e} value={e}>{e}</option>)}
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
        <button onClick={onCancel}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function RewardEditForm({ reward, onSave, onCancel }: { reward: Reward; onSave: (u: Partial<Reward>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(reward.title);
  const [cost, setCost] = useState(reward.cost);
  const [emoji, setEmoji] = useState(reward.emoji);

  return (
    <div className="glass rounded-2xl p-4 space-y-3 border border-orange-500/40">
      <div className="flex gap-2">
        <select value={emoji} onChange={(e) => setEmoji(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-2 py-2 text-white text-xl focus:outline-none">
          {["🎬","🍕","😴","🎮","🍦","🎁","🏆","🎯","🎨","🎵","🎲","🎪"].map(e => <option key={e} value={e}>{e}</option>)}
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
        <button onClick={onCancel}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function RewardAddForm({ onSave, onCancel }: { onSave: (r: Omit<Reward, "id">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState(80);
  const [emoji, setEmoji] = useState("🎁");

  return (
    <div className="glass rounded-2xl p-4 space-y-3 border border-orange-500/40">
      <p className="text-white font-medium text-sm">Neue Belohnung</p>
      <div className="flex gap-2">
        <select value={emoji} onChange={(e) => setEmoji(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-2 py-2 text-white text-xl focus:outline-none">
          {["🎬","🍕","😴","🎮","🍦","🎁","🏆","🎯","🎨","🎵","🎲","🎪"].map(e => <option key={e} value={e}>{e}</option>)}
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
        <button onClick={onCancel}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all">
          Abbrechen
        </button>
      </div>
    </div>
  );
}
