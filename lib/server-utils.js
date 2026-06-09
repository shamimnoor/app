import { supabase } from "./supabaseServer";

export async function getProfile(req, res) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;

  const { data: user, error } = await supabase.auth.api.getUser(token);
  if (error) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
