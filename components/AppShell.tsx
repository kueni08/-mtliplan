"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import Navigation from "@/components/Navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { data, loading, loadData } = useAppStore();

  useEffect(() => {
    if (!data && !loading) {
      loadData();
    }
  }, [data, loading, loadData]);

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
