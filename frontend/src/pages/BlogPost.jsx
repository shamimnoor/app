import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, FOUNDER } from "@/lib/api";
import SocialActions from "@/components/widgets/SocialActions";
import Comments from "@/components/widgets/Comments";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api.get(`/blog/${slug}`).then((r) => setPost(r.data)).catch(() => setPost(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="max-w-3xl mx-auto px-6 sm:px-12 py-20 text-muted-foreground">Loading…</div>;
  if (!post) return <div className="max-w-3xl mx-auto px-6 sm:px-12 py-20">Not found. <Link to="/blog" className="underline">Back to blog</Link></div>;

  return (
    <article className="max-w-3xl mx-auto px-6 sm:px-12 py-20" data-testid="blog-post-page">
      <Link to="/blog" className="label-mono hover:text-foreground">← All posts</Link>
      <div className="mt-5 label-mono">{post.category} · {post.read_time} min read</div>
      <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tighter mt-2 leading-[1]">{post.title}</h1>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={post.author?.avatar || FOUNDER.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
          <div>
            <div className="text-sm font-medium">{post.author?.name || FOUNDER.name}</div>
            <div className="label-mono">{new Date(post.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <SocialActions contentType="blog" contentId={post.id} title={post.title} views={post.views} />
      </div>

      {post.cover && (
        <div className="mt-8 rounded-2xl overflow-hidden border border-border">
          <img src={post.cover} alt={post.title} className="w-full object-cover" />
        </div>
      )}

      <div className="prose-noor mt-10 whitespace-pre-wrap">{post.body}</div>

      <Comments contentType="blog" contentId={post.id} />
    </article>
  );
}
