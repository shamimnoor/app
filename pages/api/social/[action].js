import { supabase } from "@/lib/supabaseServer";
import { getProfile } from "@/lib/server-utils";

export default async function handler(req, res) {
  const { action } = req.query;
  const { content_type, content_id, title } = req.body;

  if (!content_type || !content_id) {
    return res.status(400).json({ error: "Missing content_type or content_id" });
  }

  const profile = await getProfile(req, res);

  const actions = {
    stats: async () => {
      const { data: likes, error: likesError } = await supabase
        .from("likes")
        .select("id, user_id")
        .eq("content_type", content_type)
        .eq("content_id", content_id);

      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("id")
        .eq("content_type", content_type)
        .eq("content_id", content_id);

      let bookmarked = false;
      if (profile) {
        const { data: bookmarks, error: bookmarksError } = await supabase
          .from("bookmarks")
          .select("id")
          .eq("content_type", content_type)
          .eq("content_id", content_id)
          .eq("user_id", profile.id)
          .single();
        bookmarked = !!bookmarks;
      }

      res.status(200).json({
        likes: likes?.length || 0,
        liked: profile ? likes?.some((l) => l.user_id === profile.id) : false,
        comments: comments?.length || 0,
        bookmarked,
      });
    },
    like: async () => {
      if (!profile) return res.status(401).json({ error: "Unauthorized" });
      const { data: existing, error: existingError } = await supabase
        .from("likes")
        .select("id")
        .eq("content_type", content_type)
        .eq("content_id", content_id)
        .eq("user_id", profile.id)
        .single();

      if (existing) {
        await supabase.from("likes").delete().eq("id", existing.id);
      } else {
        await supabase.from("likes").insert({ content_type, content_id, user_id: profile.id });
      }

      const { count } = await supabase
        .from("likes")
        .select("id", { count: "exact" })
        .eq("content_type", content_type)
        .eq("content_id", content_id);

      res.status(200).json({ liked: !existing, count });
    },
    bookmark: async () => {
      if (!profile) return res.status(401).json({ error: "Unauthorized" });
      const { data: existing, error: existingError } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("content_type", content_type)
        .eq("content_id", content_id)
        .eq("user_id", profile.id)
        .single();

      if (existing) {
        await supabase.from("bookmarks").delete().eq("id", existing.id);
      } else {
        await supabase
          .from("bookmarks")
          .insert({ content_type, content_id, user_id: profile.id, title });
      }

      res.status(200).json({ bookmarked: !existing });
    },
  };

  if (actions[action]) {
    return actions[action]();
  } else {
    return res.status(404).json({ error: "Invalid action" });
  }
}
