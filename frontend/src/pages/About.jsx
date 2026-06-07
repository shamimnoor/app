import React from "react";
import { FOUNDER } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TIMELINE = [
  { year: "2019", title: "First systems engagement", body: "Built a 60-step automation that ran an entire 7-person agency's billing and reporting." },
  { year: "2021", title: "Founded the studio", body: "Started taking on multi-month engagements designing operating systems for founders." },
  { year: "2023", title: "AI copilots", body: "Began shipping retrieval-grounded copilots tied into client knowledge bases." },
  { year: "2025", title: "Founder OS framework", body: "Codified a repeatable framework for unifying ops, content, sales and delivery." },
  { year: "2026", title: "The OS goes public", body: "Launching the Founder OS platform for select operators globally." },
];

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-12 py-20" data-testid="about-page">
      <div className="label-mono">About</div>
      <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter mt-3 leading-[0.95]">
        I build the unseen systems<br /> that power great businesses.
      </h1>

      <div className="mt-10 grid lg:grid-cols-[280px_1fr] gap-10">
        <div>
          <img src={FOUNDER.avatar} alt={FOUNDER.name} className="w-full rounded-2xl border border-border object-cover aspect-square" />
          <div className="mt-4 label-mono">Shamim Noor</div>
          <div className="text-sm text-muted-foreground mt-1">Business Systems Builder · Automation Architect · Agency Founder · Digital Solutions Consultant</div>
        </div>
        <div className="prose-noor">
          <p>
            I'm Shamim — an operator who has spent the last seven years building the quiet machinery behind ambitious companies.
            Clean dashboards, sharp CRMs, n8n flows that work at 3am, AI copilots that actually know the business.
          </p>
          <p>
            My work sits at the intersection of design, systems thinking and engineering. I care about founders who care about
            their craft — and I obsess over the operating layer that lets them ship faster, retain more, and sleep better.
          </p>
          <p>
            If you have a real ops problem and a real budget, I'd love to hear about it.
          </p>
          <div className="mt-6 flex gap-3 not-prose">
            <Button asChild data-testid="about-hire-button"><Link to="/hire">Hire me →</Link></Button>
            <Button asChild variant="outline"><Link to="/contact">Send a note</Link></Button>
          </div>
        </div>
      </div>

      <section className="mt-24">
        <div className="label-mono">Timeline</div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-3">A short history of the work.</h2>
        <div className="mt-10 space-y-8 border-l border-border pl-8 relative">
          {TIMELINE.map((t) => (
            <div key={t.year} className="relative">
              <div className="absolute -left-[37px] top-1 w-3 h-3 rounded-full bg-[hsl(var(--accent))]" />
              <div className="font-mono text-xs text-muted-foreground">{t.year}</div>
              <div className="font-display text-xl font-semibold mt-1">{t.title}</div>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">{t.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
