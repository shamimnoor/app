/**
 * Data access layer — wraps Supabase calls in a stable API shape so existing
 * page code keeps working with minimal changes. Returns plain arrays / objects.
 */
import { supabase, anonFingerprint } from "./supabase";

// Re-export FOUNDER constant for legacy imports from "@/lib/api"
export { FOUNDER, N8N_EMBED_URL } from "./supabase";

// ---- Public content ---------------------------------------------------------
export const db = {
  // Services / solutions / industries / resources --------------------------
  async listServices() {
    const { data } = await supabase.from("services").select("*").order("sort_order");
    return data || [];
  },
  async listSolutions() {
    const { data } = await supabase.from("solutions").select("*").order("sort_order");
    return data || [];
  },
  async listIndustries() {
    const { data } = await supabase.from("industries").select("*").order("sort_order");
    return data || [];
  },
  async listResources() {
    const { data } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    return data || [];
  },

  // Projects --------------------------------------------------------------
  async listProjects() {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    return data || [];
  },
  async getProject(slug) {
    const { data } = await supabase.from("projects").select("*").eq("slug", slug).maybeSingle();
    if (data) await supabase.rpc("increment_project_views", { p_slug: slug });
    return data;
  },

  // Case studies ----------------------------------------------------------
  async listCaseStudies() {
    const { data } = await supabase.from("case_studies").select("*").order("created_at", { ascending: false });
    return data || [];
  },
  async getCaseStudy(slug) {
    const { data } = await supabase.from("case_studies").select("*").eq("slug", slug).maybeSingle();
    if (data) await supabase.rpc("increment_case_study_views", { p_slug: slug });
    return data;
  },

  // Blog ------------------------------------------------------------------
  async listBlog() {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    return data || [];
  },
  async getBlog(slug) {
    const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
    if (data) await supabase.rpc("increment_blog_views", { p_slug: slug });
    return data;
  },

  // Leads (anonymous) -----------------------------------------------------
  async createLead(lead) {
    const { data, error } = await supabase.from("leads").insert(lead).select().single();
    if (error) throw error;
    return data;
  },

  // Social: likes / bookmarks / comments ---------------------------------
  async getSocialStats(content_type, content_id, userId) {
    const fp = anonFingerprint();
    const [{ count: likes }, { count: comments }] = await Promise.all([
      supabase.from("likes").select("*", { count: "exact", head: true }).eq("content_type", content_type).eq("content_id", content_id),
      supabase.from("comments").select("*", { count: "exact", head: true }).eq("content_type", content_type).eq("content_id", content_id),
    ]);
    let liked = false;
    let bookmarked = false;
    if (userId) {
      const [{ data: l }, { data: b }] = await Promise.all([
        supabase.from("likes").select("id").eq("content_type", content_type).eq("content_id", content_id).eq("user_id", userId).maybeSingle(),
        supabase.from("bookmarks").select("id").eq("content_type", content_type).eq("content_id", content_id).eq("user_id", userId).maybeSingle(),
      ]);
      liked = !!l;
      bookmarked = !!b;
    } else {
      const { data: l } = await supabase
        .from("likes")
        .select("id")
        .eq("content_type", content_type)
        .eq("content_id", content_id)
        .eq("anon_fingerprint", fp)
        .maybeSingle();
      liked = !!l;
    }
    return { likes: likes || 0, comments: comments || 0, liked, bookmarked };
  },

  async toggleLike(content_type, content_id, userId) {
    const fp = anonFingerprint();
    const match = userId
      ? { content_type, content_id, user_id: userId }
      : { content_type, content_id, anon_fingerprint: fp };
    const { data: existing } = await supabase.from("likes").select("id").match(match).maybeSingle();
    if (existing) {
      await supabase.from("likes").delete().eq("id", existing.id);
    } else {
      const insertRow = userId
        ? { content_type, content_id, user_id: userId }
        : { content_type, content_id, anon_fingerprint: fp };
      await supabase.from("likes").insert(insertRow);
    }
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("content_type", content_type)
      .eq("content_id", content_id);
    return { liked: !existing, count: count || 0 };
  },

  async toggleBookmark(content_type, content_id, userId, title = "") {
    if (!userId) throw new Error("Sign in to bookmark");
    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("content_type", content_type)
      .eq("content_id", content_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      await supabase.from("bookmarks").delete().eq("id", existing.id);
      return { bookmarked: false };
    }
    await supabase.from("bookmarks").insert({ content_type, content_id, user_id: userId, title });
    return { bookmarked: true };
  },

  async listComments(content_type, content_id) {
    const { data } = await supabase
      .from("comments")
      .select("id, body, created_at, user_id, profiles:profiles(name, avatar)")
      .eq("content_type", content_type)
      .eq("content_id", content_id)
      .order("created_at", { ascending: false });
    return (data || []).map((c) => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      user: { id: c.user_id, name: c.profiles?.name || "User", avatar: c.profiles?.avatar || "" },
    }));
  },
  async addComment(content_type, content_id, body, userId) {
    const { data, error } = await supabase
      .from("comments")
      .insert({ content_type, content_id, body, user_id: userId })
      .select("id, body, created_at, user_id, profiles:profiles(name, avatar)")
      .single();
    if (error) throw error;
    return {
      id: data.id,
      body: data.body,
      created_at: data.created_at,
      user: { id: data.user_id, name: data.profiles?.name || "You", avatar: data.profiles?.avatar || "" },
    };
  },

  // Messages --------------------------------------------------------------
  async listMyMessages(userId) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_user_id", userId)
      .order("created_at", { ascending: true });
    return data || [];
  },
  async sendMessage(userId, body, asFounder = false, threadUserId = null) {
    const tid = asFounder ? threadUserId : userId;
    const { data, error } = await supabase
      .from("messages")
      .insert({ thread_user_id: tid, from_id: userId, body })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async listAllThreads() {
    // Founder-only — returns grouped threads via RLS (founder sees all)
    const { data } = await supabase
      .from("messages")
      .select("*, profiles:profiles!messages_from_id_fkey(name, avatar)")
      .order("created_at", { ascending: true });
    const threads = {};
    (data || []).forEach((m) => {
      const tid = m.thread_user_id;
      if (!threads[tid]) {
        threads[tid] = {
          thread_user_id: tid,
          messages: [],
          user_name: "User",
          user_avatar: "",
          last: null,
        };
      }
      threads[tid].messages.push(m);
      threads[tid].last = m.created_at;
      if (m.from_id === tid) {
        threads[tid].user_name = m.profiles?.name || "User";
        threads[tid].user_avatar = m.profiles?.avatar || "";
      }
    });
    return Object.values(threads);
  },
  async listThreadMessages(threadUserId) {
    const { data } = await supabase
      .from("messages")
      .select("*, profiles:profiles!messages_from_id_fkey(name, avatar)")
      .eq("thread_user_id", threadUserId)
      .order("created_at", { ascending: true });
    return data || [];
  },

  // Community -------------------------------------------------------------
  async listCommunity() {
    const { data } = await supabase
      .from("community_posts")
      .select("*, profiles:profiles(name, avatar)")
      .order("created_at", { ascending: false });
    return (data || []).map((p) => ({
      id: p.id,
      body: p.body,
      created_at: p.created_at,
      user: { id: p.user_id, name: p.profiles?.name || "User", avatar: p.profiles?.avatar || "" },
    }));
  },
  async createCommunityPost(body, userId) {
    const { data, error } = await supabase
      .from("community_posts")
      .insert({ body, user_id: userId })
      .select("*, profiles:profiles(name, avatar)")
      .single();
    if (error) throw error;
    return {
      id: data.id,
      body: data.body,
      created_at: data.created_at,
      user: { id: data.user_id, name: data.profiles?.name || "You", avatar: data.profiles?.avatar || "" },
    };
  },

  // Founder: leads / overview / blog / projects --------------------------
  async listLeads() {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    return data || [];
  },
  async updateLead(id, patch) {
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) throw error;
  },

  async overviewKPIs() {
    const counts = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("blog_posts").select("*", { count: "exact", head: true }),
      supabase.from("messages").select("*", { count: "exact", head: true }),
      supabase.from("comments").select("*", { count: "exact", head: true }),
      supabase.from("likes").select("*", { count: "exact", head: true }),
    ]);
    const [users, leads, newLeads, projects, posts, messages, comments, likes] = counts.map((r) => r.count || 0);
    const [{ data: postsV }, { data: projectsV }] = await Promise.all([
      supabase.from("blog_posts").select("title, slug, views").order("views", { ascending: false }).limit(5),
      supabase.from("projects").select("title, slug, views").order("views", { ascending: false }).limit(5),
    ]);
    const views = (postsV || []).reduce((s, p) => s + (p.views || 0), 0) + (projectsV || []).reduce((s, p) => s + (p.views || 0), 0);
    return {
      kpis: {
        users,
        leads,
        new_leads: newLeads,
        projects,
        posts,
        messages,
        comments,
        likes,
        views,
        revenue: leads * 1850,
      },
      top_posts: postsV || [],
      top_projects: projectsV || [],
    };
  },

  async createBlog(payload) {
    const slug = slugify(payload.title);
    const read_time = Math.max(2, Math.floor((payload.body || "").split(/\s+/).length / 200) + 2);
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        ...payload,
        slug,
        read_time,
        published_at: payload.status === "published" ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteBlog(id) {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) throw error;
  },
  async listAllBlog() {
    // Founder sees drafts + published via RLS
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    return data || [];
  },

  async createProject(payload) {
    const slug = slugify(payload.title);
    const { data, error } = await supabase.from("projects").insert({ ...payload, slug }).select().single();
    if (error) throw error;
    return data;
  },
  async deleteProject(id) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
  },

  // Analytics: synthesise 14-day series from real tables ----------------
  async analytics14d() {
    const today = new Date();
    const startDate = new Date(today.getTime() - 13 * 86400000);
    startDate.setHours(0, 0, 0, 0);
    const fromIso = startDate.toISOString();

    const [{ data: leads }, { data: messages }, { data: comments }, { data: likes }] = await Promise.all([
      supabase.from("leads").select("created_at").gte("created_at", fromIso),
      supabase.from("messages").select("created_at").gte("created_at", fromIso),
      supabase.from("comments").select("created_at").gte("created_at", fromIso),
      supabase.from("likes").select("created_at").gte("created_at", fromIso),
    ]);

    const series = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(startDate.getTime() + i * 86400000);
      const next = new Date(startDate.getTime() + (i + 1) * 86400000);
      const dayStr = d.toISOString().slice(0, 10);
      const inRange = (arr) => (arr || []).filter((x) => new Date(x.created_at) >= d && new Date(x.created_at) < next).length;
      const l = inRange(leads);
      const m = inRange(messages);
      const c = inRange(comments);
      const lk = inRange(likes);
      series.push({ date: dayStr, leads: l, messages: m, comments: c, likes: lk, visits: l * 14 + m * 6 + c * 4 + lk * 2 + 12 });
    }
    const sources = [
      { name: "Direct", value: 38 },
      { name: "LinkedIn", value: 22 },
      { name: "X / Twitter", value: 14 },
      { name: "YouTube", value: 11 },
      { name: "Newsletter", value: 9 },
      { name: "Referral", value: 6 },
    ];
    return { series, sources };
  },
};

export function slugify(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80) || Math.random().toString(36).slice(2, 10);
}

// Copilot endpoint — works in both Vercel (/api/copilot) and Emergent preview
// (REACT_APP_BACKEND_URL/api/copilot). Leave REACT_APP_BACKEND_URL blank in
// Vercel; set the full preview URL in Emergent .env.
export const COPILOT_URL = `${process.env.REACT_APP_BACKEND_URL || ""}/api/copilot`;
