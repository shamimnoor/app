import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function AuthCallback() {
  const { session, loading, isFounder } = useAuth() || {};
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (session) navigate(isFounder ? "/dashboard" : "/", { replace: true });
    else navigate("/login", { replace: true });
  }, [session, loading, isFounder, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground" data-testid="auth-callback-page">
      Completing sign in…
    </div>
  );
}
