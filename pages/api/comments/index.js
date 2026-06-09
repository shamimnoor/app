import { supabase } from "@/lib/supabaseServer";
import { getProfile } from "@/lib/server-utils";

export default async function handler(req, res) {
  const { content_type, content_id, body } = req.body;

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles(*)")
      .eq("content_type", req.query.content_type)
      .eq("content_id", req.query.content_id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const profile = await getProfile(req, res);
    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabase
      .from("comments")
      .insert({ content_type, content_id, body, user_id: profile.id });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
