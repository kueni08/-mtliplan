"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import Navigation from "@/components/Navigation";
import SyncStatusBar from "@/components/SyncStatusBar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { data, loading, error, loadData, setOnline } = useAppStore();

  useEffect(() => {
    if (!data && !loading && !error) {
      loadData();
    }
  }, [data, loading, error, loadData]);

  // Track online/offline and auto-sync pending changes when back online
  useEffect(() => {
    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

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
      <SyncStatusBar />
      {children}
      <Navigation children={data.settings.children} />
    </div>
  );
}
