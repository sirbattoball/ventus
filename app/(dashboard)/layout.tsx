"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Zap,
  Users,
  Briefcase,
  Calendar,
  ChevronRight,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/dispatch", label: "Dispatch Engine", icon: Zap },
  { href: "/dashboard/technicians", label: "Technicians", icon: Users },
  { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/schedules", label: "Schedules", icon: Calendar },
  { href: "/dashboard/leads", label: "Lead Pipeline", icon: Target, badge: "GTM" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border flex flex-col flex-shrink-0 bg-card">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="w-7 h-7 bg-amber-500 rounded-sm flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">Ventus</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">VENTUS DISPATCH</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all group",
                  active
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                <span className="flex-1">{item.label}</span>
                {"badge" in item && item.badge && (
                  <span className="text-[9px] font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
                {active && !("badge" in item && item.badge) && <ChevronRight className="w-3 h-3 text-amber-500/50" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-border p-4 flex items-center gap-3">
          <UserButton
            appearance={{
              variables: { colorPrimary: "#f59e0b" },
            }}
          />
          <div className="text-xs text-zinc-500 truncate">Account Settings</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
