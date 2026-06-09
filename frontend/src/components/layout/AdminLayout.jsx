
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

const navLinks = [
  { name: "Overview", href: "/admin" },
  { name: "Users", href: "/admin/users" },
  { name: "Leads", href: "/admin/leads" },
  { name: "Messages", href: "/admin/messages" },
  { name: "Blog", href: "/admin/blog" },
  { name: "Projects", href: "/admin/projects" },
  { name: "Comments", href: "/admin/comments" },
  { name: "Analytics", href: "/admin/analytics" },
  { name: "Automation", href: "/admin/automation" },
];

export default function AdminLayout() {

  return (
    <div className="min-h-screen flex">
      <Sidebar navLinks={navLinks} />
      <div className="flex-1 lg:pl-64">
        <MobileNav navLinks={navLinks} />
        <main className="py-16 sm:py-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
