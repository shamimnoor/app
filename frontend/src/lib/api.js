import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
