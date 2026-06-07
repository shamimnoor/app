import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const { changePassword } = useAuth() || {};
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 6) return toast.error("Min 6 characters");
    setBusy(true);
    try {
      await changePassword(password);
      toast.success("Password updated.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.message || "Reset failed — open the latest reset email from us and click again.");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20" data-testid="reset-page">
      <div className="font-display font-bold text-2xl">Set a new password</div>
      <p className="text-sm text-muted-foreground mt-1">Pick something memorable (min 6 characters).</p>
      <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-7 space-y-5" data-testid="reset-form">
        <div>
          <Label>New password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} data-testid="reset-password-input" />
        </div>
        <div>
          <Label>Confirm</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} data-testid="reset-confirm-input" />
        </div>
        <Button type="submit" disabled={busy} className="w-full" size="lg" data-testid="reset-submit-button">
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
