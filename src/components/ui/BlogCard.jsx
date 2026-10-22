import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { updateDocument, deleteDocument, toggleSavePost } from "../../firebase/methods";
import { useAuth } from "../../contexts/AuthContext";

const BlogCard = ({ blog, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const targetId = blog.documentId || blog.id || blog.sourceUrl;

  const isExternal = Boolean(
    blog.isExternal ||
    blog.sourceName ||
    blog.uid === "system_seeder" ||
    (blog.documentId && String(blog.documentId).startsWith("api_"))
  );

  const [isSaved, setIsSaved] = useState(() => {
    if (!user?.uid || !targetId) return false;
    try {
      const saved = JSON.parse(
        localStorage.getItem(`synthscroll_saved_${user.uid}`) || "[]"
      );
      return saved.some((item) => {
        if (!item) return false;
        if (typeof item === "string") return item === targetId;
        if (typeof item === "object") {
          return (
            item.documentId === targetId ||
            item.id === targetId ||
            (blog.sourceUrl && item.sourceUrl === blog.sourceUrl) ||
            (blog.title && item.title === blog.title)
          );
        }
        return false;
      });
    } catch {
      return false;
    }
  });

  const initialLiked = blog.likedBy?.includes(user?.uid) || false;
  const initialLikesCount = blog.likes ?? (blog.likedBy ? blog.likedBy.length : 0);

  const [likesState, setLikesState] = useState({
    count: initialLikesCount,
    isLiked: initialLiked,
    likedBy: blog.likedBy || [],
  });

  const isAuthor =
    (user?.uid && blog.uid && user.uid === blog.uid) ||
    (user?.email && blog.authorEmail && user.email === blog.authorEmail);

  const readUrl = `/blog/${blog.documentId || blog.uid}`;

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    const currentlyLiked = likesState.isLiked;
    const updatedLikedBy = currentlyLiked
      ? likesState.likedBy.filter((id) => id !== user.uid)
      : [...likesState.likedBy, user.uid];

    const updatedCount = updatedLikedBy.length;

    // Optimistic UI update
    setLikesState({
      count: updatedCount,
      isLiked: !currentlyLiked,
      likedBy: updatedLikedBy,
    });

    try {
      if (blog.documentId) {
        await updateDocument(
          { likes: updatedCount, likedBy: updatedLikedBy },
          blog.documentId,
          "blogs"
        );
      }
    } catch (err) {
      console.error("Error updating likes:", err);
      // Revert on failure
      setLikesState({
        count: initialLikesCount,
        isLiked: initialLiked,
        likedBy: blog.likedBy || [],
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!targetId) return;

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      if (isExternal) {
        // Save the ENTIRE external post object into user's savedPosts array in Firestore
        await toggleSavePost(user.uid, blog);
      } else {
        await toggleSavePost(user.uid, targetId);
      }
    } catch (err) {
      console.error("Save story error:", err);
      setIsSaved(!nextSaved);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    try {
      setIsDeleting(true);
      if (blog.documentId) {
        await deleteDocument(blog.documentId, "blogs");
      }
      if (onDelete) onDelete(blog.documentId);
    } catch (err) {
      console.error("Error deleting document:", err);
      setIsDeleting(false);
    }
  };

  // Format date helper
  const formattedDate = React.useMemo(() => {
    if (blog.createdAt?.seconds) {
      return new Date(blog.createdAt.seconds * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    if (blog.createdAtClient) {
      return new Date(blog.createdAtClient).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return "Recently";
  }, [blog]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-3xl bg-white/[0.06] hover:bg-white/[0.09] backdrop-blur-xl border border-white/10 hover:border-indigo-400/30 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-300"
    >
      <div>
        {/* Cover Image linking to dedicated reading page */}
        {blog.imageUrl && (
          <Link to={readUrl} className="block relative w-full h-48 overflow-hidden bg-slate-950/50">
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          </Link>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6">
          {/* Header Metadata */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 truncate">
              {blog.category || "Story"}
            </span>
            <span className="text-[11px] text-slate-400 shrink-0">{formattedDate}</span>
          </div>

          {/* Title linking to dedicated reading page */}
          <Link to={readUrl} className="block">
            <h3 className="text-lg sm:text-xl font-bold font-display text-white mb-2 sm:mb-2.5 group-hover:text-indigo-200 transition-colors line-clamp-2">
              {blog.title}
            </h3>
          </Link>

          {/* Snippet */}
          <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed line-clamp-3">
            {blog.content}
          </p>

          <Link
            to={readUrl}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <span>Read full story in 3D</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="px-3.5 py-3 sm:px-6 sm:py-4 border-t border-white/10 flex flex-col gap-2 text-xs bg-black/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
              {(blog.authorName || "A")[0]}
            </div>
            <span className="text-slate-300 font-medium truncate max-w-[95px] xs:max-w-[120px] sm:max-w-[150px]">
              {blog.authorName || "Spatial Creator"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
            {/* Native Share Button */}
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const storyUrl = `${window.location.origin}/blog/${blog.documentId || blog.uid}`;
                const shareData = {
                  title: blog.title || "SynthScroll Story",
                  text: blog.title ? `Read "${blog.title}" on SynthScroll` : "Explore this spatial story",
                  url: storyUrl,
                };

                if (navigator.share) {
                  try {
                    await navigator.share(shareData);
                    return;
                  } catch (err) {
                    if (err.name === "AbortError") return;
                  }
                }

                try {
                  await navigator.clipboard.writeText(storyUrl);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                } catch {
                  // Ignore
                }
              }}
              className="p-1.5 px-2 sm:px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1 shrink-0"
              title="Share Story link"
            >
              <span>{shareCopied ? "✓" : "↗"}</span>
              <span className="text-[11px] font-medium">{shareCopied ? "Copied" : "Share"}</span>
            </button>

            {/* Bookmark / Save Button */}
            <button
              onClick={handleSave}
              className={`p-1.5 px-2 sm:px-2.5 rounded-xl border transition-all text-xs flex items-center gap-1 shrink-0 ${
                isSaved
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/20"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
              title={isSaved ? "Saved in Bookmarks" : "Save Story"}
              aria-label="Save Story"
            >
              <motion.span whileTap={{ scale: 1.3 }}>
                {isSaved ? "🔖" : "📑"}
              </motion.span>
              <span className="text-[11px] font-medium hidden sm:inline">
                {isSaved ? "Saved" : "Save"}
              </span>
            </button>

            {/* Like Button (Visible only to authenticated users) */}
            {user && (
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-xl border transition-all shrink-0 ${
                  likesState.isLiked
                    ? "bg-pink-500/20 border-pink-500/40 text-pink-300 shadow-sm shadow-pink-500/20"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
                title={likesState.isLiked ? "Unlike" : "Like"}
              >
                <motion.span
                  whileTap={{ scale: 1.4 }}
                  animate={likesState.isLiked ? { scale: [1, 1.3, 1] } : {}}
                  className="text-xs sm:text-sm"
                >
                  {likesState.isLiked ? "❤️" : "🤍"}
                </motion.span>
                <span className="font-semibold text-[11px] sm:text-xs">{likesState.count}</span>
              </button>
            )}

            {/* Delete Button (Author only, requires user authentication) */}
            {user && isAuthor && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50 shrink-0"
                title="Delete your post"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Source Attribution Badge (renders only for external API posts) */}
        {blog.sourceName && isExternal && (
          <div className="w-full mt-1.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400/80">
            <span className="inline-flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/70 shrink-0 animate-pulse" />
              <span className="truncate">{blog.sourceName}</span>
            </span>
            {blog.sourceUrl && (
              <a
                href={blog.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors shrink-0 flex items-center gap-0.5 ml-2"
                title="Open original external article"
              >
                <span>Original</span>
                <span>↗</span>
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
};

export default BlogCard;
