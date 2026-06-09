
import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import PublicLayout from "@/components/layout/PublicLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminLayout from "@/components/layout/AdminLayout";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Contact from "@/pages/Contact";
import Community from "@/pages/Community";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/Profile"; 
import Settings from "@/pages/Settings";


import Overview from "@/pages/dashboard/Overview";
import CRM from "@/pages/dashboard/CRM";
import ProjectsAdmin from "@/pages/dashboard/ProjectsAdmin";
import BlogAdmin from "@/pages/dashboard/BlogAdmin";
import MessagesAdmin from "@/pages/dashboard/MessagesAdmin";
import Analytics from "@/pages/dashboard/Analytics";
import CommandCenter from "@/pages/dashboard/CommandCenter";

import AdminOverview from "@/pages/admin/Overview";
import AdminUsers from "@/pages/admin/Users";
import AdminLeads from "@/pages/admin/Leads";
import AdminMessages from "@/pages/admin/Messages";
import AdminBlog from "@/pages/admin/Blog";
import AdminProjects from "@/pages/admin/Projects";
import AdminComments from "@/pages/admin/Comments";
import AdminAnalytics from "@/pages/admin/Analytics";

function UserGuard({ children }) {
  const { user, loading } = useAuth() || {};
  if (loading) return <div className=\"min-h-screen flex items-center justify-center text-sm text-muted-foreground\">Loading…</div>;
  if (!user) return <Navigate to=\"/login\" replace />;
  return children;
}

function AdminGuard({ children }) {
  const { user, loading, isFounder } = useAuth() || {};
  if (loading) return <div className=\"min-h-screen flex items-center justify-center text-sm text-muted-foreground\">Loading…</div>;
  if (!user) return <Navigate to=\"/login\" replace />;
  if (!isFounder) return <Navigate to=\"/dashboard\" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path=\"/\" element={<Home />} />
              <Route path=\"/about\" element={<About />} />
              <Route path=\"/services\" element={<Services />} />
              <Route path=\"/projects\" element={<Projects />} />
              <Route path=\"/projects/:slug\" element={<ProjectDetail />} />
              <Route path=\"/blog\" element={<Blog />} />
              <Route path=\"/blog/:slug\" element={<BlogPost />} />
              <Route path=\"/contact\" element={<Contact />} />
              <Route path=\"/community\" element={<Community />} />
              <Route path=\"/login\" element={<Login />} />
              <Route path=\"/auth/callback\" element={<AuthCallback />} />
              <Route path=\"/profile\" element={<UserGuard><Profile /></UserGuard>} />
              <Route path=\"/settings\" element={<UserGuard><Settings /></UserGuard>} />
              <Route path=\"*\" element={<NotFound />} />
            </Route>

            <Route
              path=\"/dashboard\"
              element={
                <UserGuard>
                  <DashboardLayout />
                </UserGuard>
              }
            >
              <Route index element={<Overview />} />
              <Route path=\"crm\" element={<CRM />} />
              <Route path=\"projects\" element={<ProjectsAdmin />} />
              <Route path=\"blog\" element={<BlogAdmin />} />
              <Route path=\"messages\" element={<MessagesAdmin />} />
              <Route path=\"analytics\" element={<Analytics />} />
              <Route path=\"command\" element={<CommandCenter />} />
            </Route>

            <Route
              path=\"/admin\"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path=\"users\" element={<AdminUsers />} />
              <Route path=\"leads\" element={<AdminLeads />} />
              <Route path=\"messages\" element={<AdminMessages />} />
              <Route path=\"blog\" element={<AdminBlog />} />
              <Route path=\"projects\" element={<AdminProjects />} />
              <Route path=\"comments\" element={<AdminComments />} />
              <Route path=\"analytics\" element={<AdminAnalytics />} />
            </Route>
          </Routes>
          <Toaster position=\"top-right\" richColors closeButton />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
