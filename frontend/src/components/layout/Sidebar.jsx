
import React from "react";
import { NavLink } from "react-router-dom";
import { LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function Sidebar({ navLinks }) {
  const { user, logout } = useAuth() || {};
  const { theme, toggle } = useTheme();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r sticky top-0 h-screen">
      <div className="px-6 py-5 border-b flex items-center gap-3">
        <img src={user?.avatar} alt="" className="w-9 h-9 rounded-full object-cover border" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate">{user?.name}</div>
          <div className="text-xs text-muted-foreground">Administrator</div>
        </div>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {link.icon && <link.icon className="w-4 h-4" />}
            {link.name}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t space-y-1">
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-secondary text-muted-foreground">
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <button onClick={logout} className="px-3 py-2 text-xs rounded-md hover:bg-secondary text-muted-foreground">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
