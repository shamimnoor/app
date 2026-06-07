import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth() || {};
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      toast.success("Reset link sent — check your inbox.");
    } catch (err) {
      toast.error(err?.message || "Could not send reset email");
    } finally { setBusy(false); }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-6 py-32 text-center" data-testid="forgot-sent">
        <div className="font-display text-3xl font-bold">Reset link sent.</div>
        <p className="text-muted-foreground mt-3">Open the email we just sent to <span className="font-mono">{email}</span> to set a new password.</p>
        <Link to="/login" className="mt-6 inline-block underline">Back to sign in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20" data-testid="forgot-page">
      <div className="font-display font-bold text-2xl">Reset your password</div>
      <p className="text-sm text-muted-foreground mt-1">Enter the email tied to your account. We'll send a secure reset link.</p>
      <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-7 space-y-5" data-testid="forgot-form">
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="forgot-email-input" />
        </div>
        <Button type="submit" disabled={busy} className="w-full" size="lg" data-testid="forgot-submit-button">
          {busy ? "Sending…" : "Send reset link"}
        </Button>
        <div className="text-sm text-center text-muted-foreground">
          Remembered it? <Link to="/login" className="underline text-foreground">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
