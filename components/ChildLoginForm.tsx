"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ChildLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Benutzername oder Passwort falsch.");
      } else {
        router.push(`/kind/me`);
        router.refresh();
      }
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte nochmals versuchen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Dein Name (z.B. Nils)"
          autoComplete="username"
          className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 text-lg"
          required
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          autoComplete="current-password"
          className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 text-lg"
          required
        />
      </div>
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
  );
}
