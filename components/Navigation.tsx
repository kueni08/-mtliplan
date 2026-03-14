"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";
import type { Child } from "@/lib/types";

interface NavigationProps {
  children: Child[];
}

export default function Navigation({ children }: NavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-bottom z-50">
      <div className="glass border-t border-white/10 px-2 py-2">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              pathname === "/dashboard"
                ? "bg-purple-600/50 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs">Übersicht</span>
          </Link>

          {/* Child tabs */}
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/kind/${child.id}`}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                isActive(`/kind/${child.id}`)
                  ? child.color === "orange"
                    ? "bg-orange-600/50 text-white"
                    : "bg-purple-600/50 text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <span className="text-2xl leading-none">{child.avatar}</span>
              <span className="text-xs truncate max-w-[60px]">{child.name}</span>
            </Link>
          ))}

          {/* Settings */}
          <Link
            href="/einstellungen"
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              isActive("/einstellungen")
                ? "bg-purple-600/50 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <Cog6ToothIcon className="w-6 h-6" />
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
