import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Settings() {
  const { user, profile, updateProfile, changePassword } = useAuth() || {};
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setAvatar(profile.avatar || "");
    }
  }, [profile]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ name, bio, avatar });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err?.message || "Update failed");
    } finally { setBusy(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw !== pw2) return toast.error("Passwords don't match");
    if (pw.length < 6) return toast.error("Min 6 characters");
    setPwBusy(true);
    try {
      await changePassword(pw);
      setPw(""); setPw2("");
      toast.success("Password changed.");
    } catch (err) {
      toast.error(err?.message || "Could not change password");
    } finally { setPwBusy(false); }
  };

  return (
    <div className="space-y-8 max-w-2xl" data-testid="settings-page">
      <div>
        <div className="label-mono">Settings</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">Profile & security</h1>
        <p className="text-sm text-muted-foreground mt-1">Signed in as <span className="font-mono">{user?.email}</span></p>
      </div>

      <form onSubmit={saveProfile} className="rounded-2xl border border-border bg-card p-6 space-y-5" data-testid="settings-profile-form">
        <h2 className="font-display text-xl font-semibold">Profile</h2>
        <div className="flex items-center gap-4">
          <img src={avatar || "https://api.dicebear.com/9.x/initials/svg?seed=" + (name || "U")} className="w-16 h-16 rounded-full object-cover border border-border bg-secondary" alt="" />
          <div className="flex-1">
            <Label>Avatar URL</Label>
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" data-testid="settings-avatar-input" />
          </div>
        </div>
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="settings-name-input" />
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio…" className="min-h-[100px]" data-testid="settings-bio-input" />
        </div>
        <Button type="submit" disabled={busy} data-testid="settings-save-profile">
          {busy ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <form onSubmit={savePassword} className="rounded-2xl border border-border bg-card p-6 space-y-5" data-testid="settings-password-form">
        <div>
          <h2 className="font-display text-xl font-semibold">Change password</h2>
          <p className="text-xs text-muted-foreground mt-1">For Google-signed-in accounts, password is managed by Google.</p>
        </div>
        <div>
          <Label>New password</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} data-testid="settings-password-input" />
        </div>
        <div>
          <Label>Confirm</Label>
          <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={6} data-testid="settings-password-confirm" />
        </div>
        <Button type="submit" disabled={pwBusy || !pw} data-testid="settings-save-password">
          {pwBusy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
