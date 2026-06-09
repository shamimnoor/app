
import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FOUNDER } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

const PUBLIC_NAV = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/projects", label: "Projects" },
  { to: "/case-studies", label: "Case Studies" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
  { to: "/community", label: "Community" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, isFounder, logout } = useAuth() || {};
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="public-navbar"
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? "glass border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="navbar-logo">
          <img
            src={FOUNDER.avatar}
            alt="Shamim Noor"
            className="w-8 h-8 rounded-full object-cover border border-border"
          />
          <span className="font-display text-base font-bold tracking-tight">Shamim Noor</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {PUBLIC_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            data-testid="navbar-theme-toggle"
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <>
              {isFounder && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  data-testid="navbar-dashboard-button"
                  className="hidden md:inline-flex"
                >
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Button>
              )}
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                data-testid="navbar-logout-button"
                className="hidden md:flex p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate("/login")}
              data-testid="navbar-login-button"
              className="hidden md:inline-flex"
            >
              <LogIn className="w-4 h-4 mr-1.5" />
              Sign in
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => navigate("/hire")}
            data-testid="navbar-hire-button"
            className="hidden sm:inline-flex"
          >
            Hire Shamim
          </Button>

          <button
            className="lg:hidden p-2 rounded-md hover:bg-secondary"
            onClick={() => setOpen((o) => !o)}
            data-testid="navbar-mobile-toggle"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden glass border-t border-border" data-testid="navbar-mobile-menu">
          <div className="px-5 py-4 flex flex-col gap-1">
            {PUBLIC_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-md text-sm ${
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/resources" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm text-muted-foreground">
              Resources
            </NavLink>
            <NavLink to="/contact" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm text-muted-foreground">
              Contact
            </NavLink>
            <Button onClick={() => { setOpen(false); navigate("/hire"); }} className="mt-2" data-testid="navbar-mobile-hire-button">
              Hire Shamim
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
