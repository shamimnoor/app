import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function Comment({ comment, onDelete }) {
  const { user, isFounder } = useAuth() || {};
  return (
    <div className="flex items-start gap-3">
      <Avatar className="w-8 h-8 border">
        <AvatarImage src={comment.profiles.avatar} />
        <AvatarFallback>{comment.profiles.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="font-bold text-sm">{comment.profiles.name}</div>
          <div className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</div>
        </div>
        <p className="text-sm mt-1">{comment.body}</p>
        {(user?.id === comment.user_id || isFounder) && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => onDelete(comment.id)}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Comments({ contentType, contentId }) {
  const { user } = useAuth() || {};
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const loadComments = async () => {
    const res = await api.get("/comments", { params: { content_type: contentType, content_id: contentId } });
    setComments(res.data);
  };

  useEffect(() => {
    loadComments();
  }, [contentType, contentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post("/comments", { content_type: contentType, content_id: contentId, body: newComment });
      setNewComment("");
      loadComments();
    } catch (error) {
      toast.error("Failed to post comment");
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      loadComments();
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div id="comments">
      <h3 className="text-xl font-bold mb-4">Comments ({comments.length})</h3>
      <div className="space-y-6">
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} onDelete={handleDelete} />
        ))}
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="mt-8">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="mb-2"
          />
          <Button type="submit">Post Comment</Button>
        </form>
      )}
    </div>
  );
}
