"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const LS_KEY = "amtliplan_household_code";

export default function ChildLoginForm() {
  const [username, setUsername]           = useState("");
  const [password, setPassword]           = useState("");
  const [householdCode, setHouseholdCode] = useState("");
  const [codeInput, setCodeInput]         = useState("");
  // null = not yet checked localStorage (SSR/hydration), true/false = result
  const [showCodeSetup, setShowCodeSetup] = useState<boolean | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);
  const [failCount, setFailCount]         = useState(0);
  const router = useRouter();

  // Load stored household code from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      setHouseholdCode(stored);
      setShowCodeSetup(false);
    } else {
      setShowCodeSetup(true);
    }
  }, []);

  const saveCode = () => {
    const trimmed = codeInput.trim();
    if (!trimmed) return;
    localStorage.setItem(LS_KEY, trimmed);
    setHouseholdCode(trimmed);
    setShowCodeSetup(false);
    setCodeInput("");
    setError(null);
  };

  const resetCode = () => {
    localStorage.removeItem(LS_KEY);
    setHouseholdCode("");
    setShowCodeSetup(true);
    setCodeInput("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username,
        password,
        householdCode,
        redirect: false,
      });
      if (result?.error) {
        const newCount = failCount + 1;
        setFailCount(newCount);
        setError(
          newCount >= 2
            ? "Anmeldung fehlgeschlagen. Falls Name und Passwort stimmen, könnte der Haushalt-Code ungültig sein — bitte neu eingeben."
            : "Benutzername oder Passwort falsch."
        );
      } else {
        router.push("/kind/me");
      }
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte nochmals versuchen.");
    } finally {
      setLoading(false);
    }
  };

  // Still determining whether household code exists (avoid SSR flash)
  if (showCodeSetup === null) {
    return <div className="h-32" />;
  }

  return (
    <div className="space-y-4">
      {/* Household code setup */}
      {showCodeSetup ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 space-y-3">
          <p className="text-yellow-300 text-sm font-medium">
            🏠 Haushalt verbinden
          </p>
          <p className="text-white/60 text-xs">
            Gib den Haushalt-Code ein, den dein Admin in den Einstellungen anzeigt.
            Du musst das nur einmal tun.
          </p>
          <textarea
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Haushalt-Code hier einfügen…"
            rows={3}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 text-xs font-mono resize-none"
          />
          <button
            type="button"
            onClick={saveCode}
            disabled={!codeInput.trim()}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-gray-900 font-semibold py-2 px-4 rounded-xl text-sm transition-colors"
          >
            Code speichern ✓
          </button>
        </div>
      ) : (
        <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${
          failCount >= 2
            ? "bg-yellow-500/10 border border-yellow-500/30"
            : "bg-green-500/10 border border-green-500/20"
        }`}>
          <span className={`text-xs ${failCount >= 2 ? "text-yellow-300" : "text-green-400"}`}>
            {failCount >= 2 ? "⚠️ Haushalt-Code evtl. abgelaufen" : "✓ Haushalt verbunden"}
          </span>
          <button
            type="button"
            onClick={resetCode}
            className={`text-xs transition-colors ${
              failCount >= 2
                ? "text-yellow-300 hover:text-yellow-100 underline"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            {failCount >= 2 ? "Neu eingeben" : "ändern"}
          </button>
        </div>
      )}

      {/* Login form (only shown when household code is set) */}
      {!showCodeSetup && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Dein Name (z.B. Nils)"
            autoComplete="username"
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 text-lg"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            autoComplete="current-password"
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 text-lg"
            required
          />
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg active:scale-95 transition-all duration-150 text-lg"
          >
            {loading ? "Anmelden…" : "Einloggen 🎮"}
          </button>
        </form>
      )}
    </div>
  );
}
