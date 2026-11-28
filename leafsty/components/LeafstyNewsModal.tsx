"use client";

import React, { useEffect, useState } from "react";
import {
  Newspaper,
  Plus,
  Heart,
  Trash2,
  X,
  Loader2,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { isLeafstyAdmin } from "../utils/adminCommands";

export interface NewsPost {
  id: string;
  title: string;
  tag: string;
  body: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
}

export default function LeafstyNewsModal({
  isOpen,
  onClose,
  currentUserId,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [draft, setDraft] = useState({
    title: "",
    tag: "Update",
    body: "",
    imageUrl: "",
  });

  const canPost = isLeafstyAdmin(currentUserId);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/news", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      setPosts(Array.isArray(data?.posts) ? data.posts : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setShowComposer(false);
      setErrorMsg("");
      loadPosts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.body.trim() || publishing) return;
    setPublishing(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          userId: currentUserId,
          ...draft,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data?.error || "Could not publish post.");
      } else {
        setDraft({ title: "", tag: "Update", body: "", imageUrl: "" });
        setShowComposer(false);
        await loadPosts();
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleLike = async (post: NewsPost) => {
    const uid = currentUserId.toLowerCase();
    const alreadyLiked = post.likedBy.includes(uid);

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              likes: Math.max(0, p.likes + (alreadyLiked ? -1 : 1)),
              likedBy: alreadyLiked
                ? p.likedBy.filter((id) => id !== uid)
                : [...p.likedBy, uid],
            }
          : p
      )
    );

    await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "like",
        userId: uid,
        postId: post.id,
        liked: alreadyLiked,
      }),
    }).catch(() => {});
  };

  const handleDeletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        userId: currentUserId,
        postId,
      }),
    }).catch(() => {});
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[86vh] flex flex-col rounded-3xl bg-[#081914] border border-emerald-500/30 text-emerald-50 shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 bg-[#061410] border-b border-emerald-500/15 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 flex items-center justify-center">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>Leafsty News</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Global Feed
                </span>
              </h2>
              <p className="text-[11px] text-emerald-300/65">
                Official announcements, updates & community highlights
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canPost && (
              <button
                type="button"
                onClick={() => setShowComposer((v) => !v)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showComposer ? "Cancel" : "New Post"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-emerald-300/70 hover:text-white hover:bg-emerald-500/15 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {canPost && showComposer && (
          <form
            onSubmit={handlePublish}
            className="p-4 bg-[#061410] border-b border-emerald-500/20 space-y-3 shrink-0"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={draft.title}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Post headline..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
              />
              <select
                value={draft.tag}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, tag: e.target.value }))
                }
                className="px-3 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-100 focus:outline-none"
              >
                <option value="Update">Update</option>
                <option value="Announcement">Announcement</option>
                <option value="Patch Notes">Patch Notes</option>
                <option value="Event">Event</option>
              </select>
            </div>

            <textarea
              rows={3}
              value={draft.body}
              onChange={(e) =>
                setDraft((p) => ({ ...p, body: e.target.value }))
              }
              placeholder="Write what's new on Leafsty..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400 resize-none"
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={draft.imageUrl}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, imageUrl: e.target.value }))
                  }
                  placeholder="Optional image URL (https://...)"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/40 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={publishing || !draft.title.trim() || !draft.body.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{publishing ? "Publishing..." : "Publish Globally"}</span>
              </button>
            </div>

            {errorMsg && (
              <div className="text-xs font-semibold text-red-400">{errorMsg}</div>
            )}
          </form>
        )}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-xs text-emerald-300/70">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Loading Leafsty News...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-bold text-emerald-100">
                No news posts yet
              </p>
              <p className="text-xs text-emerald-300/65">
                {canPost
                  ? 'Click "New Post" above to publish the first global Leafsty announcement!'
                  : "Check back soon for official updates from the Leafsty team."}
              </p>
            </div>
          ) : (
            posts.map((post) => {
              const isLiked = post.likedBy.includes(currentUserId.toLowerCase());
              const dateLabel = new Date(post.createdAt).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric", year: "numeric" }
              );
              return (
                <article
                  key={post.id}
                  className="rounded-2xl bg-[#0b211a] border border-emerald-500/20 p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center overflow-hidden shrink-0">
                        {post.authorImage ? (
                          <img
                            src={post.authorImage}
                            alt={post.authorName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          post.authorName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white truncate flex items-center gap-1.5">
                          <span>{post.authorName}</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            Admin
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-300/60">
                          {dateLabel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-extrabold text-emerald-300">
                        {post.tag}
                      </span>
                      {canPost && (
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          title="Delete Post"
                          className="p-1.5 rounded-lg text-red-300/70 hover:text-red-200 hover:bg-red-500/20 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base font-extrabold text-white">
                      {post.title}
                    </h3>
                    <p className="text-xs text-emerald-100/90 whitespace-pre-wrap leading-relaxed">
                      {post.body}
                    </p>
                  </div>

                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full max-h-72 object-cover rounded-xl border border-emerald-500/20"
                    />
                  )}

                  <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                        isLiked
                          ? "bg-rose-500/20 border-rose-400/40 text-rose-200"
                          : "bg-[#081914] border-emerald-500/20 text-emerald-200/80 hover:border-emerald-400/40"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isLiked ? "fill-rose-400 text-rose-400" : ""
                        }`}
                      />
                      <span>{post.likes}</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
