import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FOUNDER } from "@/lib/api";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z" fill="#34A853"/>
      <path d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18A10.99 10.99 0 001 12c0 1.78.43 3.46 1.18 4.96l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/>
    </svg>
  );
}

export default function Login() {
  const { loginWithGoogle } = useAuth() || {};
  const [busy, setBusy] = useState(false);

  const onGoogle = async () => {
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      toast.error(err?.message || "Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20" data-testid="login-page">
      <div className="flex items-center gap-3 mb-8">
        <img src={FOUNDER.avatar} className="w-10 h-10 rounded-full" alt="" />
        <div>
          <div className="font-display font-bold">Sign in</div>
          <div className="label-mono">Welcome to the Founder OS</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-7 space-y-5">
        <Button type="button" variant="outline" onClick={onGoogle} className="w-full" data-testid="login-google-button" disabled={busy}>
          {busy ? "Redirecting..." : <><GoogleIcon /> <span className=\"ml-2\">Continue with Google</span></>}
        </Button>
      </div>
    </div>
  );
}
