import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, FOUNDER_EMAIL } from "./supabase";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data || null);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      loadProfile(data.session?.user?.id).finally(() => setLoading(false));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      loadProfile(s?.user?.id);
    });
    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // pull profile right away so caller can decide where to redirect
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();
    setProfile(prof || null);
    return {
      id: data.user.id,
      email: data.user.email,
      name: prof?.name || data.user.user_metadata?.name || email.split("@")[0],
      role: prof?.role || "user",
      avatar: prof?.avatar || "",
    };
  };

  const register = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    // If email confirmation is enabled, session will be null until the user clicks the email link.
    const role = email.toLowerCase() === FOUNDER_EMAIL ? "founder" : "user";
    return {
      id: data.user?.id,
      email,
      name,
      role,
      needsEmailConfirmation: !data.session,
    };
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const changePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const updateProfile = async (updates) => {
    if (!session?.user?.id) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", session.user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  const requestPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  // Convenience derived state — keep .name and .avatar so existing components still work
  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: profile?.name || session.user.user_metadata?.name || session.user.email?.split("@")[0],
        avatar: profile?.avatar || session.user.user_metadata?.avatar_url || "",
        role: profile?.role || "user",
        bio: profile?.bio || "",
      }
    : null;

  const isFounder =
    user?.role === "founder" || (user?.email && user.email.toLowerCase() === FOUNDER_EMAIL);

  return (
    <AuthCtx.Provider
      value={{
        session,
        user,
        profile,
        loading,
        isFounder,
        login,
        register,
        loginWithGoogle,
        logout,
        changePassword,
        updateProfile,
        requestPasswordReset,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
