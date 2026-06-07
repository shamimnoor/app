import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Workflow, Bot, LayoutDashboard, Users, Globe, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, FOUNDER } from "@/lib/api";
import Spotlight from "@/components/widgets/Spotlight";

const ICONS = { Workflow, Bot, LayoutDashboard, Users, Sparkles, Globe };

const LOGOS = [
  "Northwind", "Atlas Health", "Lumen", "Bowline", "Meridian", "Foundry",
  "Cypress", "Halcyon", "Vega", "Sable",
];

export default function Home() {
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data.items.slice(0, 6))).catch(() => {});
    api.get("/projects").then((r) => setProjects(r.data.items.slice(0, 3))).catch(() => {});
    api.get("/blog").then((r) => setPosts(r.data.items.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-ring pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-24 sm:pt-32 pb-20 sm:pb-28 relative">
          <div className="flex items-center gap-3 mb-8 animate-rise">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/40 text-xs label-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] pulse-dot" /> Booking Q1 2026
            </span>
            <span className="label-mono hidden sm:inline">Business Systems · Automation · AI</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] max-w-5xl animate-rise">
            The operating system <br className="hidden sm:block" />
            behind serious businesses.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-rise">
            I build the websites, CRMs, dashboards and automation that turn ambitious teams into
            quietly compounding machines. One unified founder OS — designed and run for you.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3 animate-rise">
            <Button asChild size="lg" data-testid="home-hire-button">
              <Link to="/hire">Start a project <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" data-testid="home-services-button">
              <Link to="/services">Explore services</Link>
            </Button>
            <Link to="/case-studies" className="ml-2 text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground">
              See case studies →
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 sm:grid-cols-6 gap-x-6 gap-y-3 text-xs label-mono opacity-70">
            {LOGOS.slice(0, 6).map((l) => (
              <div key={l} className="font-display font-semibold text-sm sm:text-base text-foreground/70">{l}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="label-mono">01 · Services</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-3 max-w-xl">
              Six ways I help founders move faster.
            </h2>
          </div>
          <Link to="/services" className="hidden sm:inline text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground">
            All services →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => {
            const Icon = ICONS[s.icon] || Sparkles;
            return (
              <Spotlight key={s.id} className="group rounded-2xl border border-border bg-card p-6 hover:-translate-y-1 transition-transform">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.tagline}</p>
                <div className="mt-5 flex items-center justify-between text-xs label-mono">
                  <span>{s.starting_price}</span>
                  <Link to="/services" className="text-foreground hover:opacity-70">Learn more →</Link>
                </div>
              </Spotlight>
            );
          })}
        </div>
      </section>

      {/* Projects */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-20 border-t border-border">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="label-mono">02 · Selected work</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-3 max-w-xl">
              Quiet systems. Loud outcomes.
            </h2>
          </div>
          <Link to="/projects" className="hidden sm:inline text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground">
            All projects →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {projects.map((p) => (
            <Link
              to={`/projects/${p.slug}`}
              key={p.id}
              className="group rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-1 transition-transform"
              data-testid={`home-project-${p.slug}`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-secondary">
                <img src={p.cover} alt={p.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
              </div>
              <div className="p-5">
                <div className="label-mono">{p.industry}</div>
                <h3 className="font-display text-lg font-semibold mt-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-5xl mx-auto px-6 sm:px-12 py-20 border-t border-border">
        <Quote className="w-8 h-8 text-[hsl(var(--accent))]" />
        <blockquote className="mt-5 font-display text-3xl sm:text-4xl font-medium tracking-tight leading-snug">
          “Shamim rebuilt the spine of our agency in six weeks. We ship faster, retain better,
          and finally have a dashboard our investors actually open.”
        </blockquote>
        <div className="mt-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-mono">JM</div>
          <div>
            <div className="text-sm font-medium">J. Martinez</div>
            <div className="label-mono">Founder, Northwind Creative</div>
          </div>
        </div>
      </section>

      {/* Blog teaser */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-20 border-t border-border">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="label-mono">03 · Writing</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-3 max-w-xl">
              Field notes from the build floor.
            </h2>
          </div>
          <Link to="/blog" className="hidden sm:inline text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground">
            All writing →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {posts.map((b) => (
            <Link to={`/blog/${b.slug}`} key={b.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-1 transition-transform" data-testid={`home-post-${b.slug}`}>
              <div className="aspect-video overflow-hidden bg-secondary">
                <img src={b.cover} alt={b.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
              </div>
              <div className="p-5">
                <Badge variant="secondary" className="font-mono text-[10px]">{b.category}</Badge>
                <h3 className="font-display text-lg font-semibold mt-2 line-clamp-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{b.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-24 border-t border-border">
        <div className="rounded-3xl border border-border bg-card p-10 sm:p-16 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[hsl(var(--accent))]/15 rounded-full blur-3xl" />
          <div className="label-mono">Let's build</div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-3 max-w-2xl">
            Bring me your hardest operational problem.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg">
            Free 20-minute consult. If I'm not the right fit, I'll point you to someone who is.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" data-testid="home-cta-hire-button">
              <Link to="/hire">Book a consult <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Send a message</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
