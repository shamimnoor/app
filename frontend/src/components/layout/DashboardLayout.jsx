
import React from "react";
import { Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  BookOpen,
  MessageSquare,
  BarChart3,
  Terminal,
  Zap,
  Database,
  Plug,
  Brain,
  Bot,
  Workflow,
  Settings as SettingsIcon,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

const NAV = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "CRM", href: "/dashboard/crm", icon: Users },
  { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { name: "Blog CMS", href: "/dashboard/blog", icon: BookOpen },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Command Center", href: "/dashboard/command", icon: Terminal },
  { name: "AI Brain", href: "/dashboard/ai-brain", icon: Brain },
  { name: "Agents", href: "/dashboard/agents", icon: Bot },
  { name: "Workflows", href: "/dashboard/workflows", icon: Workflow },
  { name: "Automation", href: "/dashboard/automation", icon: Zap },
  { name: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { name: "Database", href: "/dashboard/database", icon: Database },
  { name: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
];

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex">
      <Sidebar navLinks={NAV} />
      <div className="flex-1 lg:pl-64">
        <MobileNav navLinks={NAV} />
        <main className="py-16 sm:py-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
