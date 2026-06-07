import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.error(
    "[supabase] Missing env vars. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY (or VITE_ prefixed) in your .env file."
  );
}

export const supabase = createClient(SUPABASE_URL || "https://invalid.supabase.co", SUPABASE_ANON_KEY || "anon", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const FOUNDER_EMAIL = (process.env.REACT_APP_FOUNDER_EMAIL || "abdullahmuhammadshamimreza@gmail.com").toLowerCase();
export const N8N_EMBED_URL = process.env.REACT_APP_N8N_EMBED_URL || "https://your-n8n.example.com";

export const FOUNDER = {
  name: "Shamim Noor",
  email: "shamimnoorofficial@gmail.com",
  avatar:
    "https://customer-assets.emergentagent.com/job_2cbfbaf5-49b3-4e72-aa18-4e9dcb61b843/artifacts/extptqfd_profile-pic.jpg",
  socials: {
    github: "https://github.com/shamimnoor",
    linkedin: "https://www.linkedin.com/in/shamimnoor",
    youtube: "https://www.youtube.com/@shamimnoorofficial",
    reddit: "https://www.reddit.com/u/shamimnoor",
    twitter: "https://x.com/shamimnoorfly",
  },
};

// Stable anonymous fingerprint stored in localStorage for like-toggle
export function anonFingerprint() {
  try {
    let fp = localStorage.getItem("anon_fp");
    if (!fp) {
      fp = `anon_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
      localStorage.setItem("anon_fp", fp);
    }
    return fp;
  } catch {
    return "anon_unknown";
  }
}
