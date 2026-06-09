import { supabase } from "@/lib/supabaseServer";

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*, profiles(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });

  const feed = data.map(post => ({
    id: post.id,
    body: post.body,
    created_at: post.created_at,
    profiles: post.profiles,
    content_type: 'community-post',
    content_id: post.id,
  }));

  res.status(200).json(feed);
}
