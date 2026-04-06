"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { HomeIcon, Cog6ToothIcon, ChartBarIcon } from "@heroicons/react/24/solid";
import type { Child } from "@/lib/types";
import { COLOR_MAP } from "@/lib/colors";

interface NavigationProps {
  children: Child[];
}

export default function Navigation({ children }: NavigationProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role     = session?.role;
  const memberId = session?.memberId;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const childMembers = children.filter((c) => c.role === "child" || !c.role);
  const ownMember    = memberId ? children.find((c) => c.id === memberId) : null;

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

          {/* Own adult tab (if logged in as adult/admin with a member) */}
          {ownMember && (ownMember.role === "adult") && (
            <Link
              key={ownMember.id}
              href={`/kind/${ownMember.id}`}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                isActive(`/kind/${ownMember.id}`)
                  ? `${COLOR_MAP[ownMember.color ?? "purple"].bg}/50 text-white`
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <span className="text-2xl leading-none">{ownMember.avatar}</span>
              <span className="text-xs truncate max-w-[60px]">{ownMember.name}</span>
            </Link>
          )}

          {/* Child tabs */}
          {childMembers.map((child) => (
            <Link
              key={child.id}
              href={`/kind/${child.id}`}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                isActive(`/kind/${child.id}`)
                  ? `${COLOR_MAP[child.color ?? "purple"].bg}/50 text-white`
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <span className="text-2xl leading-none">{child.avatar}</span>
              <span className="text-xs truncate max-w-[60px]">{child.name}</span>
            </Link>
          ))}

          {/* Statistik – visible to all */}
          <Link
            href="/statistik"
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              isActive("/statistik")
                ? "bg-purple-600/50 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <ChartBarIcon className="w-6 h-6" />
            <span className="text-xs">Statistik</span>
          </Link>

          {/* Settings – only for admin/adult */}
          {(role === "admin" || role === "adult") && (
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
          )}
        </div>
      </div>
    </nav>
  );
}
