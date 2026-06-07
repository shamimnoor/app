import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import SocialActions from "@/components/widgets/SocialActions";
import Comments from "@/components/widgets/Comments";

export default function ProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/projects/${slug}`).then((r) => setProject(r.data)).catch(() => setProject(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="max-w-3xl mx-auto px-6 sm:px-12 py-20 text-muted-foreground">Loading…</div>;
  if (!project) return <div className="max-w-3xl mx-auto px-6 sm:px-12 py-20">Not found. <Link to="/projects" className="underline">Back to projects</Link></div>;

  return (
    <article className="max-w-3xl mx-auto px-6 sm:px-12 py-20" data-testid="project-detail-page">
      <Link to="/projects" className="label-mono hover:text-foreground">← All projects</Link>
      <div className="mt-5 label-mono">{project.industry}</div>
      <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tighter mt-2 leading-[1]">{project.title}</h1>
      <p className="mt-4 text-muted-foreground text-lg">{project.summary}</p>

      <div className="mt-8 rounded-2xl overflow-hidden border border-border">
        <img src={project.cover} alt={project.title} className="w-full object-cover" />
      </div>

      <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          {project.tags?.map((t) => (
            <span key={t} className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-secondary/50">{t}</span>
          ))}
        </div>
        <SocialActions contentType="project" contentId={project.id} title={project.title} views={project.views} />
      </div>

      <div className="prose-noor mt-10 whitespace-pre-wrap">{project.body}</div>

      {project.client && (
        <div className="mt-10 rounded-xl border border-border bg-card p-5">
          <div className="label-mono">Client</div>
          <div className="font-display text-xl font-semibold mt-1">{project.client}</div>
        </div>
      )}

      <Comments contentType="project" contentId={project.id} />
    </article>
  );
}
