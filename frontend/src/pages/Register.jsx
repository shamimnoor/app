import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth() || {};
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await register(form.name, form.email, form.password);
      toast.success(`Welcome, ${u.name}`);
      navigate(u.role === "founder" ? "/dashboard" : "/community");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not register");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20" data-testid="register-page">
      <div className="font-display font-bold text-2xl">Create your account</div>
      <p className="text-sm text-muted-foreground mt-1">Comment, bookmark and chat with Shamim.</p>

      <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-7 space-y-5" data-testid="register-form">
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required data-testid="register-name-input" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required data-testid="register-email-input" />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={6} data-testid="register-password-input" />
        </div>
        <Button type="submit" disabled={busy} className="w-full" size="lg" data-testid="register-submit-button">
          {busy ? "Creating account…" : "Create account"}
        </Button>
        <div className="text-sm text-center text-muted-foreground">
          Already have one? <Link to="/login" className="underline text-foreground">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
