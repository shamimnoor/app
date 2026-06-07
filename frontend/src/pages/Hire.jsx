import React, { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const BUDGETS = ["< $5K", "$5K – $15K", "$15K – $50K", "$50K+"];
const TIMELINES = ["This month", "Next 60 days", "Q2 2026", "Flexible"];

export default function Hire() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", company: "", budget: BUDGETS[1], timeline: TIMELINES[1], message: "" });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true);
    try {
      await api.post("/leads", { ...form, source: "hire" });
      setDone(true);
      toast.success("Project request received.");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-6 sm:px-12 py-32 text-center" data-testid="hire-success">
        <div className="w-14 h-14 mx-auto rounded-full bg-[hsl(var(--accent))]/15 flex items-center justify-center mb-6">
          <Check className="w-6 h-6 text-[hsl(var(--accent))]" />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tighter">Thanks, {form.name.split(" ")[0]}.</h1>
        <p className="text-muted-foreground mt-4 max-w-md mx-auto">
          I review every project request personally. Expect a reply within 24 hours with next steps or a calendar link.
        </p>
      </div>
    );
  }

  const canNext0 = form.name.trim() && form.email.trim();
  const canNext1 = form.budget && form.timeline;
  const canSubmit = form.message.trim().length > 10;

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-20" data-testid="hire-page">
      <div className="label-mono">Hire Shamim</div>
      <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter mt-3 leading-[0.95]">
        Tell me about the project.
      </h1>
      <p className="mt-5 text-muted-foreground max-w-xl">
        Three quick steps. No marketing fluff. I'll reply within 24 hours.
      </p>

      <div className="mt-10 flex items-center gap-2 label-mono">
        {[0, 1, 2].map((s) => (
          <div key={s} className={`h-1 rounded-full flex-1 ${s <= step ? "bg-foreground" : "bg-secondary"}`} />
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-7 sm:p-9 space-y-5">
        {step === 0 && (
          <>
            <div>
              <Label>Your name</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" data-testid="hire-name-input" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" data-testid="hire-email-input" />
            </div>
            <div>
              <Label>Company (optional)</Label>
              <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme Inc." />
            </div>
            <Button disabled={!canNext0} onClick={() => setStep(1)} className="w-full" size="lg" data-testid="hire-next-1">
              Continue <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <Label>Budget range</Label>
              <RadioGroup value={form.budget} onValueChange={(v) => set("budget", v)} className="grid grid-cols-2 gap-2 mt-2">
                {BUDGETS.map((b) => (
                  <label key={b} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm ${form.budget === b ? "border-foreground bg-secondary" : "border-border"}`}>
                    <RadioGroupItem value={b} data-testid={`hire-budget-${b}`} />
                    {b}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label>Timeline</Label>
              <RadioGroup value={form.timeline} onValueChange={(v) => set("timeline", v)} className="grid grid-cols-2 gap-2 mt-2">
                {TIMELINES.map((t) => (
                  <label key={t} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm ${form.timeline === t ? "border-foreground bg-secondary" : "border-border"}`}>
                    <RadioGroupItem value={t} data-testid={`hire-timeline-${t}`} />
                    {t}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
              <Button disabled={!canNext1} onClick={() => setStep(2)} className="flex-1" data-testid="hire-next-2">
                Continue <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <Label>What are you trying to solve?</Label>
              <Textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="The more context, the better." className="min-h-[160px]" data-testid="hire-message-input" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button disabled={!canSubmit || busy} onClick={submit} className="flex-1" size="lg" data-testid="hire-submit">
                {busy ? "Sending…" : "Send project request"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
