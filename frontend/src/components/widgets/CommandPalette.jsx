import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Briefcase,
  Layers,
  FileText,
  BookOpen,
  Mail,
  Users,
  Sparkles,
  Sun,
  Moon,
  LogIn,
  LayoutDashboard,
  MessageCircle,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { toggle, theme } = useTheme();
  const { user, isFounder } = useAuth() || {};

  const go = (path) => {
    onOpenChange(false);
    setTimeout(() => navigate(path), 50);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" data-testid="command-palette-input" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/")} data-testid="cmd-home"><Home className="mr-2 w-4 h-4" />Home</CommandItem>
          <CommandItem onSelect={() => go("/services")}><Briefcase className="mr-2 w-4 h-4" />Services</CommandItem>
          <CommandItem onSelect={() => go("/solutions")}><Layers className="mr-2 w-4 h-4" />Solutions</CommandItem>
          <CommandItem onSelect={() => go("/projects")}><FileText className="mr-2 w-4 h-4" />Projects</CommandItem>
          <CommandItem onSelect={() => go("/case-studies")}><FileText className="mr-2 w-4 h-4" />Case Studies</CommandItem>
          <CommandItem onSelect={() => go("/blog")}><BookOpen className="mr-2 w-4 h-4" />Blog</CommandItem>
          <CommandItem onSelect={() => go("/community")}><Users className="mr-2 w-4 h-4" />Community</CommandItem>
          <CommandItem onSelect={() => go("/contact")}><Mail className="mr-2 w-4 h-4" />Contact</CommandItem>
          <CommandItem onSelect={() => go("/hire")}><Sparkles className="mr-2 w-4 h-4" />Hire Shamim</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={toggle} data-testid="cmd-theme-toggle">
            {theme === "dark" ? <Sun className="mr-2 w-4 h-4" /> : <Moon className="mr-2 w-4 h-4" />}
            Toggle theme
          </CommandItem>
          {!user && (
            <CommandItem onSelect={() => go("/login")}><LogIn className="mr-2 w-4 h-4" />Sign in</CommandItem>
          )}
          {user && (
            <CommandItem onSelect={() => go("/messages")}><MessageCircle className="mr-2 w-4 h-4" />My messages</CommandItem>
          )}
          {isFounder && (
            <CommandItem onSelect={() => go("/dashboard")} data-testid="cmd-dashboard">
              <LayoutDashboard className="mr-2 w-4 h-4" />Founder Dashboard
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
