import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  BookOpen,
  MessageSquare,
  BarChart3,
  Terminal,
  Sun,
  Moon,
  LogOut,
  Home,
  Sparkles,
  Plus,
  Zap,
  Settings as SettingsIcon,
} from "lucide-react";
import { FOUNDER } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import CommandPalette from "@/components/widgets/CommandPalette";

const NAV = [
  { to: "/dashboard", end: true, label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/crm", label: "CRM", icon: Users },
  { to: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { to: "/dashboard/blog", label: "Blog CMS", icon: BookOpen },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/automation", label: "Automation", icon: Zap },
  { to: "/dashboard/command", label: "Command Center", icon: Terminal },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

const DOCK = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/command", icon: Sparkles, label: "Command" },
  { to: "/dashboard/blog", icon: Plus, label: "New post" },
  { to: "/dashboard/messages", icon: MessageSquare, label: "Messages" },
  { to: "/", icon: Home, label: "Visit site" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth() || {};
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex w-[260px] flex-col border-r border-border bg-card/40 sticky top-0 h-screen" data-testid="dashboard-sidebar">
        <div className="px-5 py-5 border-b border-border flex items-center gap-3">
          <img src={FOUNDER.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-sm truncate">{user?.name || FOUNDER.name}</div>
            <div className="label-mono">Founder OS</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                data-testid={`dash-nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {n.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-border space-y-1">
          <button onClick={() => setCmdOpen(true)} className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md border border-border bg-secondary/40 hover:bg-secondary" data-testid="dash-command-button">
            <span className="text-muted-foreground">Command</span>
            <span className="font-mono">⌘K</span>
          </button>
          <div className="flex items-center gap-1">
            <button onClick={toggle} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-secondary text-muted-foreground" data-testid="dash-theme-toggle">
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <button onClick={() => { logout(); navigate("/"); }} className="px-3 py-2 text-xs rounded-md hover:bg-secondary text-muted-foreground" data-testid="dash-logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 glass border-b border-border px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={FOUNDER.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
            <div className="font-display font-bold">Founder OS</div>
          </div>
          <button onClick={() => setCmdOpen(true)} className="px-2.5 py-1.5 text-xs rounded-md border border-border font-mono">⌘K</button>
        </header>
        <div className="lg:hidden flex overflow-x-auto gap-2 px-4 py-3 border-b border-border">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs rounded-full border whitespace-nowrap ${isActive ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </div>

        <main className="px-6 sm:px-10 py-8 pb-32" data-testid="dashboard-main">
          <Outlet />
        </main>
      </div>

      {/* macOS-style floating dock */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-1 glass rounded-2xl border border-border px-2 py-2 shadow-2xl" data-testid="dashboard-dock">
        {DOCK.map((d) => {
          const Icon = d.icon;
          return (
            <button
              key={d.label}
              onClick={() => (d.to.startsWith("/dashboard") ? navigate(d.to) : navigate(d.to))}
              className="dock-item w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary"
              title={d.label}
              data-testid={`dock-${d.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
