/**
 * Axios-shape compatibility layer.
 * Maps the old REST surface (api.get/post/patch/delete with "/foo" paths)
 * onto the Supabase-backed db layer. This means every existing page in
 * /src/pages/ keeps compiling unchanged.
 */
import { db, slugify } from "./db";
import { supabase, anonFingerprint, FOUNDER_EMAIL } from "./supabase";

export { db, slugify, supabase, anonFingerprint, FOUNDER_EMAIL };
export { FOUNDER, N8N_EMBED_URL, COPILOT_URL } from "./db";

const ok = (data) => ({ data });

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

function parts(path) {
  return path.split("?")[0].split("/").filter(Boolean);
}

export const api = {
  async get(path, opts = {}) {
    const [base, a, b] = parts(path);
    const params = opts.params || {};
    const userId = await currentUserId();

    switch (base) {
      case "services":   return ok({ items: await db.listServices() });
      case "solutions":  return ok({ items: await db.listSolutions() });
      case "industries": return ok({ items: await db.listIndustries() });
      case "resources":  return ok({ items: await db.listResources() });

      case "projects":
        if (a) return ok(await db.getProject(a));
        return ok({ items: await db.listProjects() });

      case "case-studies":
        if (a) return ok(await db.getCaseStudy(a));
        return ok({ items: await db.listCaseStudies() });

      case "blog":
        if (a) return ok(await db.getBlog(a));
        return ok({ items: await db.listBlog() });

      case "social":
        if (a === "stats")     return ok(await db.getSocialStats(params.content_type, params.content_id, userId));
        if (a === "comments")  return ok({ items: await db.listComments(params.content_type, params.content_id) });
        if (a === "bookmarks") return ok({ items: [] });
        break;

      case "messages":
        if (a === "thread" && b) return ok({ messages: await db.listThreadMessages(b) });
        if (!userId) return ok({ messages: [] });
        // Disambiguate by role
        {
          const { data: prof } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
          if (prof?.role === "founder") {
            return ok({ threads: await db.listAllThreads() });
          }
        }
        return ok({ messages: await db.listMyMessages(userId) });

      case "community":
        if (a === "posts") return ok({ items: await db.listCommunity() });
        break;

      case "auth":
        if (a === "me") {
          if (!userId) throw Object.assign(new Error("Unauthorized"), { response: { status: 401 } });
          const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
          return ok({ user: data });
        }
        break;

      case "admin":
        if (a === "overview")  return ok(await db.overviewKPIs());
        if (a === "leads")     return ok({ items: await db.listLeads() });
        if (a === "analytics") return ok(await db.analytics14d());
        break;

      default: break;
    }
    throw new Error(`api.get: unmapped path "${path}"`);
  },

  async post(path, body = {}) {
    const [base, a] = parts(path);
    const userId = await currentUserId();

    switch (base) {
      case "leads": {
        const lead = await db.createLead(body);
        return ok({ ok: true, lead });
      }
      case "social":
        if (a === "like") {
          const res = await db.toggleLike(body.content_type, body.content_id, userId);
          return ok(res);
        }
        if (a === "bookmark") {
          if (!userId) {
            const err = new Error("Sign in to bookmark");
            err.response = { status: 401, data: { detail: "Sign in to bookmark" } };
            throw err;
          }
          return ok(await db.toggleBookmark(body.content_type, body.content_id, userId, body.title));
        }
        if (a === "comments") {
          if (!userId) {
            const err = new Error("Sign in to comment");
            err.response = { status: 401, data: { detail: "Sign in to comment" } };
            throw err;
          }
          return ok(await db.addComment(body.content_type, body.content_id, body.body, userId));
        }
        break;

      case "messages": {
        if (!userId) throw new Error("Sign in");
        // founder reply if thread_user_id is provided & user is founder; otherwise self-thread
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
        const asFounder = prof?.role === "founder" && !!body.thread_user_id;
        const msg = await db.sendMessage(userId, body.body, asFounder, body.thread_user_id);
        return ok(msg);
      }

      case "community":
        if (a === "posts") {
          if (!userId) throw new Error("Sign in");
          return ok(await db.createCommunityPost(body.body, userId));
        }
        break;

      case "admin":
        if (a === "blog")     return ok(await db.createBlog(body));
        if (a === "projects") return ok(await db.createProject(body));
        if (a === "command") {
          // Light-weight intent router. For LLM responses use the AI Copilot.
          const p = (body.prompt || "").toLowerCase();
          if (p.includes("lead")) return ok({ intent: "list_leads", result: await db.listLeads() });
          if (p.includes("project")) return ok({ intent: "list_projects", result: await db.listProjects() });
          if (p.includes("analytics")) return ok({ intent: "analytics", result: await db.analytics14d() });
          return ok({ intent: "chat", result: "Open the AI Copilot widget for streaming GPT replies." });
        }
        break;

      // auth endpoints handled directly via supabase in the auth context
      default: break;
    }
    throw new Error(`api.post: unmapped path "${path}"`);
  },

  async patch(path, body = {}) {
    const [base, a, id] = parts(path);
    if (base === "admin" && a === "leads" && id) {
      await db.updateLead(id, body);
      return ok({ ok: true });
    }
    throw new Error(`api.patch: unmapped "${path}"`);
  },

  async delete(path) {
    const [base, a, id] = parts(path);
    if (base === "admin" && a === "blog" && id)     { await db.deleteBlog(id);    return ok({ ok: true }); }
    if (base === "admin" && a === "projects" && id) { await db.deleteProject(id); return ok({ ok: true }); }
    throw new Error(`api.delete: unmapped "${path}"`);
  },
};

export const API_BASE = ""; // legacy compat – no longer used
