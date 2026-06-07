import React, { useState } from "react";
import { api, FOUNDER } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Github, Linkedin, Youtube, Twitter, Mail, Check } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/leads", { ...form, source: "contact" });
      setSent(true);
      toast.success("Thanks — message received. I'll reply within 24h.");
    } catch (err) {
      toast.error("Could not send. Try emailing me directly.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-20" data-testid="contact-page">
      <div className="grid lg:grid-cols-2 gap-16">
        <div>
          <div className="label-mono">Contact</div>
          <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter mt-3 leading-[0.95]">
            Tell me what you're building.
          </h1>
          <p className="mt-5 text-muted-foreground max-w-md">
            I read everything. I reply to most messages within 24 hours.
          </p>

          <div className="mt-10 space-y-3 text-sm">
            <a href={`mailto:${FOUNDER.email}`} className="flex items-center gap-3 hover:text-foreground"><Mail className="w-4 h-4" /> {FOUNDER.email}</a>
            <a href={FOUNDER.socials.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-foreground"><Linkedin className="w-4 h-4" /> linkedin.com/in/shamimnoor</a>
            <a href={FOUNDER.socials.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-foreground"><Twitter className="w-4 h-4" /> @shamimnoorfly</a>
            <a href={FOUNDER.socials.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-foreground"><Github className="w-4 h-4" /> github.com/shamimnoor</a>
            <a href={FOUNDER.socials.youtube} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-foreground"><Youtube className="w-4 h-4" /> youtube.com/@shamimnoorofficial</a>
          </div>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center" data-testid="contact-success">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--accent))]/15 flex items-center justify-center mb-5">
              <Check className="w-6 h-6 text-[hsl(var(--accent))]" />
            </div>
            <h2 className="font-display text-2xl font-bold">Message received.</h2>
            <p className="text-muted-foreground mt-2 max-w-sm">
              I'll get back to you within 24 hours. In the meantime, feel free to explore the case studies.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-7 sm:p-9 space-y-5" data-testid="contact-form">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={form.name} onChange={onChange("name")} placeholder="Your full name" data-testid="contact-name-input" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={onChange("email")} placeholder="you@company.com" data-testid="contact-email-input" />
            </div>
            <div>
              <Label htmlFor="company">Company (optional)</Label>
              <Input id="company" value={form.company} onChange={onChange("company")} placeholder="Acme Inc." data-testid="contact-company-input" />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" required value={form.message} onChange={onChange("message")} placeholder="Tell me about your project…" className="min-h-[140px]" data-testid="contact-message-input" />
            </div>
            <Button type="submit" disabled={busy} className="w-full" size="lg" data-testid="contact-submit-button">
              {busy ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
