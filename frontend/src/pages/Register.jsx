import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Register() {
  const { register, loginWithGoogle } = useAuth() || {};
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await register(form.name, form.email, form.password);
      if (u.needsEmailConfirmation) {
        setSent(form.email);
        toast.success("Check your inbox to confirm your email.");
      } else {
        toast.success(`Welcome, ${u.name}`);
        navigate(u.role === "founder" ? "/dashboard" : "/community");
      }
    } catch (err) {
      toast.error(err?.message || "Could not register");
    } finally { setBusy(false); }
  };

  const onGoogle = async () => {
    try { await loginWithGoogle(); }
    catch (err) { toast.error(err?.message || "Google sign-in failed"); }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-6 py-32 text-center" data-testid="register-confirm-email">
        <div className="font-display text-3xl font-bold">Check your inbox.</div>
        <p className="text-muted-foreground mt-3">
          We sent a confirmation link to <span className="font-mono">{sent}</span>. Click it to finish setting up your account.
        </p>
        <Link to="/login" className="mt-6 inline-block underline">Back to sign in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20" data-testid="register-page">
      <div className="font-display font-bold text-2xl">Create your account</div>
      <p className="text-sm text-muted-foreground mt-1">Comment, bookmark and chat with Shamim.</p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-7 space-y-5">
        <Button type="button" variant="outline" onClick={onGoogle} className="w-full" data-testid="register-google-button">
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground label-mono">Or with email</span></div>
        </div>

        <form onSubmit={submit} className="space-y-5" data-testid="register-form">
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
        </form>

        <div className="text-sm text-center text-muted-foreground">
          Already have one? <Link to="/login" className="underline text-foreground">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
