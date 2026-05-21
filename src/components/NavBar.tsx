"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Club", icon: "🏠" },
  { href: "/dashboard/squad", label: "Squad", icon: "👥" },
  { href: "/dashboard/match", label: "Match", icon: "⚽" },
  { href: "/dashboard/league", label: "League", icon: "🏆" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-[#13161f] border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/dashboard" className="text-white font-bold text-lg tracking-tight">
          Career Mode
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="ml-2 text-gray-500 hover:text-gray-300 text-sm px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
