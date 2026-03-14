"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import Navigation from "@/components/Navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { data, loading, error, loadData } = useAppStore();

  useEffect(() => {
    if (!data && !loading) {
      loadData();
    }
  }, [data, loading, loadData]);

  if (error && !loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <div className="text-5xl">⚠️</div>
          <p className="text-red-300 text-base">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-spin-slow">⭐</div>
          <p className="text-purple-300 text-lg">Lade Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {children}
      <Navigation children={data.settings.children} />
    </div>
  );
}
