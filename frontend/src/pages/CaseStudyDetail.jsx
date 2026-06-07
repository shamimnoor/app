import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import SocialActions from "@/components/widgets/SocialActions";
import Comments from "@/components/widgets/Comments";

export default function CaseStudyDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api.get(`/case-studies/${slug}`).then((r) => setItem(r.data)).catch(() => setItem(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="max-w-3xl mx-auto px-6 sm:px-12 py-20 text-muted-foreground">Loading…</div>;
  if (!item) return <div className="max-w-3xl mx-auto px-6 sm:px-12 py-20">Not found. <Link to="/case-studies" className="underline">All case studies</Link></div>;

  return (
    <article className="max-w-3xl mx-auto px-6 sm:px-12 py-20" data-testid="case-study-detail-page">
      <Link to="/case-studies" className="label-mono hover:text-foreground">← All case studies</Link>
      <div className="mt-5 label-mono">Case study</div>
      <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tighter mt-2 leading-[1]">{item.title}</h1>
      <p className="mt-4 text-muted-foreground text-lg">{item.summary}</p>

      <div className="mt-8 rounded-2xl overflow-hidden border border-border">
        <img src={item.cover} alt={item.title} className="w-full object-cover" />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="grid grid-cols-3 gap-3 flex-1">
          {item.metrics?.map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="label-mono">{m.label}</div>
              <div className="font-display font-bold text-xl mt-1">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <SocialActions contentType="case_study" contentId={item.id} title={item.title} views={item.views} />
      </div>

      <section className="mt-10 space-y-8">
        <div>
          <h2 className="font-display text-2xl font-bold">Problem</h2>
          <p className="text-muted-foreground mt-2 leading-relaxed">{item.problem}</p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Solution</h2>
          <p className="text-muted-foreground mt-2 leading-relaxed">{item.solution}</p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Result</h2>
          <p className="text-muted-foreground mt-2 leading-relaxed">{item.result}</p>
        </div>
      </section>

      <Comments contentType="case_study" contentId={item.id} />
    </article>
  );
}
