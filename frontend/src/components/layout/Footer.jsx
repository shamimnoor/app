import React from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, Youtube, Twitter, Mail } from "lucide-react";
import { FOUNDER } from "@/lib/api";

const FOOT_LINKS = [
  {
    title: "Navigate",
    items: [
      { to: "/", label: "Home" },
      { to: "/about", label: "About" },
      { to: "/services", label: "Services" },
      { to: "/projects", label: "Projects" },
      { to: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Connect",
    items: [
      { to: "/contact", label: "Contact" },
      { to: "/login", label: "Sign In" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border bg-background mt-24" data-testid="public-footer">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={FOUNDER.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-border" />
              <div>
                <div className="font-display font-bold text-lg">Shamim Noor</div>
                <div className="label-mono">Business Systems Builder</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              A founder operating system to build and run your business, delivered as a unified product experience.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <a href={FOUNDER.socials.github} target="_blank" rel="noreferrer" className="p-2 rounded-md hover:bg-secondary" data-testid="footer-github" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
              <a href={FOUNDER.socials.linkedin} target="_blank" rel="noreferrer" className="p-2 rounded-md hover:bg-secondary" data-testid="footer-linkedin" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href={FOUNDER.socials.youtube} target="_blank" rel="noreferrer" className="p-2 rounded-md hover:bg-secondary" data-testid="footer-youtube" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
              <a href={FOUNDER.socials.twitter} target="_blank" rel="noreferrer" className="p-2 rounded-md hover:bg-secondary" data-testid="footer-twitter" aria-label="Twitter / X">
                <Twitter className="w-4 h-4" />
              </a>
              <a href={`mailto:${FOUNDER.email}`} className="p-2 rounded-md hover:bg-secondary" data-testid="footer-email" aria-label="Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-10">
            {FOOT_LINKS.map((col) => (
              <div key={col.title}>
                <div className="label-mono mb-4">{col.title}</div>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item.to}>
                      <Link to={item.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-border flex justify-center">
          <div className="text-xs text-muted-foreground font-mono">
            © {new Date().getFullYear()} Shamim Noor. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
