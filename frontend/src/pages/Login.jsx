import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FOUNDER } from "@/lib/api";

export default function Login() {
  const { login } = useAuth() || {};
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}`);
      navigate(u.role === "founder" ? "/dashboard" : "/");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20" data-testid="login-page">
      <div className="flex items-center gap-3 mb-8">
        <img src={FOUNDER.avatar} className="w-10 h-10 rounded-full" alt="" />
        <div>
          <div className="font-display font-bold">Sign in</div>
          <div className="label-mono">Welcome back to the OS</div>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-7 space-y-5" data-testid="login-form">
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="login-email-input" />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="login-password-input" />
        </div>
        <Button type="submit" disabled={busy} className="w-full" size="lg" data-testid="login-submit-button">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <div className="text-sm text-center text-muted-foreground">
          New here? <Link to="/register" className="underline text-foreground">Create an account</Link>
        </div>
      </form>
    </div>
  );
}
