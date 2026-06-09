import { supabase } from "@/lib/supabaseServer";
import { getProfile } from "@/lib/server-utils";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "DELETE") {
    const profile = await getProfile(req, res);
    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("*, profiles(*)")
      .eq("id", id)
      .single();

    if (commentError) return res.status(500).json({ error: commentError.message });
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const isOwner = comment.user_id === profile.id;
    const isFounder = profile.role === 'founder';

    if (!isOwner && !isFounder) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader("Allow", ["DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
