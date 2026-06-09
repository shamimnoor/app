import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

const AuthCtx = createContext(null);

const FOUNDER_EMAIL = "abdullahmuhammadshamimreza@gmail.com";

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
    user?.role === "founder" || (user?.email && user.email.toLowerCase() === FOUNDER_EMAIL.toLowerCase());

  return (
    <AuthCtx.Provider
      value={{
        session,
        user,
        profile,
        loading,
        isFounder,
        loginWithGoogle,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
