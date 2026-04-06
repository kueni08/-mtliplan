"use client";

import { useAppStore } from "@/store/useAppStore";

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const diffMs  = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `vor ${diffH} Std.`;
  return `vor ${Math.floor(diffH / 24)} Tag(en)`;
}

export default function SyncStatusBar() {
  const { syncStatus, lastSyncedAt, isOnline, syncToDrive } = useAppStore();

  let label: string;
  let colorClasses: string;
  let clickable = false;

  if (!isOnline && (syncStatus === "pending" || syncStatus === "error")) {
    label        = "📴 Offline · Änderungen ausstehend";
    colorClasses = "bg-gray-700/80 text-gray-200 border-gray-600/50";
  } else if (!isOnline) {
    label        = "📴 Offline";
    colorClasses = "bg-gray-700/80 text-gray-200 border-gray-600/50";
  } else if (syncStatus === "syncing") {
    label        = "Synchronisiert...";
    colorClasses = "bg-blue-700/80 text-blue-100 border-blue-500/50";
  } else if (syncStatus === "pending") {
    label        = "💾 Lokal gespeichert · synchronisiert...";
    colorClasses = "bg-yellow-700/80 text-yellow-100 border-yellow-500/50";
  } else if (syncStatus === "error") {
    label        = "⚠️ Drive-Fehler · Tippen zum Wiederholen";
    colorClasses = "bg-red-700/80 text-red-100 border-red-500/50 cursor-pointer active:scale-95";
    clickable    = true;
  } else if (syncStatus === "synced") {
    const ts = formatRelativeTime(lastSyncedAt);
    label        = `✓ Gespeichert${ts ? " · " + ts : ""}`;
    colorClasses = "bg-green-700/80 text-green-100 border-green-500/50";
  } else {
    return null; // "idle" — nothing to show yet
  }

  return (
    <div
      className={`fixed top-3 right-3 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md select-none transition-all duration-300 ${colorClasses}`}
      onClick={clickable ? () => syncToDrive() : undefined}
      role={clickable ? "button" : undefined}
      aria-label={clickable ? "Synchronisation erneut versuchen" : undefined}
    >
      {syncStatus === "syncing" && (
        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {label}
    </div>
  );
}
