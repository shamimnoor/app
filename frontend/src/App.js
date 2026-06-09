
import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import PublicLayout from "@/components/layout/PublicLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminLayout from "@/components/layout/AdminLayout";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Solutions from "@/pages/Solutions";
import Industries from "@/pages/Industries";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import CaseStudies from "@/pages/CaseStudies";
import CaseStudyDetail from "@/pages/CaseStudyDetail";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Resources from "@/pages/Resources";
import Contact from "@/pages/Contact";
import Hire from "@/pages/Hire";
import Community from "@/pages/Community";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AuthCallback from "@/pages/AuthCallback";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/Profile"; 
import Setup from "@/pages/Setup";

import Overview from "@/pages/dashboard/Overview";
import CRM from "@/pages/dashboard/CRM";
import ProjectsAdmin from "@/pages/dashboard/ProjectsAdmin";
import BlogAdmin from "@/pages/dashboard/BlogAdmin";
import MessagesAdmin from "@/pages/dashboard/MessagesAdmin";
import Analytics from "@/pages/dashboard/Analytics";
import CommandCenter from "@/pages/dashboard/CommandCenter";
import Settings from "@/pages/dashboard/Settings";
import Automation from "@/pages/dashboard/Automation";
import DatabaseAdmin from "@/pages/dashboard/Database";
import Integrations from "@/pages/dashboard/Integrations";
import AIBrain from "@/pages/dashboard/AIBrain";
import Agents from "@/pages/dashboard/Agents";
import Workflows from "@/pages/dashboard/Workflows";

import AdminOverview from "@/pages/admin/Overview";
import AdminUsers from "@/pages/admin/Users";
import AdminLeads from "@/pages/admin/Leads";
import AdminMessages from "@/pages/admin/Messages";
import AdminBlog from "@/pages/admin/Blog";
import AdminProjects from "@/pages/admin/Projects";
import AdminComments from "@/pages/admin/Comments";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminAutomation from "@/pages/admin/Automation";

function UserGuard({ children }) {
  const { user, loading } = useAuth() || {};
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminGuard({ children }) {
  const { user, loading, isFounder } = useAuth() || {};
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isFounder) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/industries" element={<Industries />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:slug" element={<ProjectDetail />} />
              <Route path="/case-studies" element={<CaseStudies />} />
              <Route path="/case-studies/:slug" element={<CaseStudyDetail />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/hire" element={<Hire />} />
              <Route path="/community" element={<Community />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/profile" element={<UserGuard><Profile /></UserGuard>} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route
              path="/dashboard"
              element={
                <UserGuard>
                  <DashboardLayout />
                </UserGuard>
              }
            >
              <Route index element={<Overview />} />
              <Route path="crm" element={<CRM />} />
              <Route path="projects" element={<ProjectsAdmin />} />
              <Route path="blog" element={<BlogAdmin />} />
              <Route path="messages" element={<MessagesAdmin />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="command" element={<CommandCenter />} />
              <Route path="ai-brain" element={<AIBrain />} />
              <Route path="agents" element={<Agents />} />
              <Route path="workflows" element={<Workflows />} />
              <Route path="automation" element={<Automation />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="database" element={<DatabaseAdmin />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="comments" element={<AdminComments />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="automation" element={<AdminAutomation />} />
            </Route>
          </Routes>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
