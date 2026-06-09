
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function MobileNav({ navLinks }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="lg:hidden relative h-16 sm:h-20 px-6 sm:px-12 flex items-center justify-between border-b">
      <a href="/" className="text-lg font-bold">Dashboard</a>
      <button onClick={() => setOpen(true)} className="p-2">
        <Menu className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed right-0 top-0 h-full w-full max-w-xs bg-background border-l shadow-lg">
            <div className="h-16 sm:h-20 px-6 flex items-center justify-between border-b">
              <a href="/" className="text-lg font-bold">Dashboard</a>
              <button onClick={() => setOpen(false)} className="p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-6">
              <ul className="space-y-4">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <NavLink
                      to={link.href}
                      className={({ isActive }) =>
                        isActive ? "text-primary" : "text-muted-foreground"
                      }
                      onClick={() => setOpen(false)}
                    >
                      {link.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
