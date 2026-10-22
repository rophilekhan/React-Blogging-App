import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendData, uploadImage } from "../../firebase/methods";
import { useAuth } from "../../contexts/AuthContext";
import { useDraftStore } from "../../store/draftStore";
import { analyzeContent, replyToDebate } from "../../services/aiService";

const CATEGORIES = ["Technology", "Design", "AI & Robotics", "Web3", "Life & Ideas"];

const PostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth();

  // Zustand persistent draft store
  const draftTitle = useDraftStore((state) => state.title);
  const draftContent = useDraftStore((state) => state.content);
  const draftCategory = useDraftStore((state) => state.category);
  const setDraft = useDraftStore((state) => state.setDraft);
  const clearDraft = useDraftStore((state) => state.clearDraft);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Auto-Save & Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState(""); // "" | "saving" | "saved"

  // AI Review & Debate State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReview, setAiReview] = useState(null);
  const [debateMessages, setDebateMessages] = useState([]);
  const [userRebuttal, setUserRebuttal] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Debounce refs
  const debounceTimerRef = useRef(null);
  const isInitialHydrated = useRef(false);
  const chatScrollRef = useRef(null);

  // 1. Hydrate from persistent draft store on modal open
  useEffect(() => {
    if (isOpen) {
      setTitle(draftTitle || "");
      setContent(draftContent || "");
      setCategory(draftCategory || CATEGORIES[0]);

      if (draftTitle || draftContent) {
        setSaveStatus("saved");
      }
      isInitialHydrated.current = true;
    } else {
      isInitialHydrated.current = false;
      setSaveStatus("");
      setError("");
      setIsAiOpen(false);
      setAiReview(null);
      setDebateMessages([]);
      setUserRebuttal("");
    }
  }, [isOpen]);

  // 2. Debounced auto-save to IndexedDB (1 second after user stops typing)
  useEffect(() => {
    if (!isOpen || !isInitialHydrated.current) return;

    if (title || content) {
      setSaveStatus("saving");
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDraft({
        title,
        content,
        category,
      });

      if (title.trim() || content.trim()) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("");
      }
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [title, content, category, isOpen, setDraft]);

  // Scroll debate chat to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [debateMessages, isAiThinking]);

  // Trigger AI Review
  const handleToggleAi = async () => {
    if (isAiOpen) {
      setIsAiOpen(false);
      return;
    }

    setIsAiOpen(true);

    if (!aiReview) {
      try {
        setIsAiLoading(true);
        const analysis = await analyzeContent(content || title);
        setAiReview(analysis);
        setDebateMessages([
          {
            sender: "ai",
            text: `${analysis.critique}\n\n🔥 Debate Challenge: ${analysis.debateQuestion}`,
          },
        ]);
      } catch (err) {
        console.error("AI Analysis error:", err);
      } finally {
        setIsAiLoading(false);
      }
    }
  };

  // User submits rebuttal to AI
  const handleSendRebuttal = async (e) => {
    e.preventDefault();
    if (!userRebuttal.trim() || isAiThinking) return;

    const messageText = userRebuttal.trim();
    setUserRebuttal("");

    const newMessages = [...debateMessages, { sender: "user", text: messageText }];
    setDebateMessages(newMessages);

    try {
      setIsAiThinking(true);
      const aiReply = await replyToDebate(newMessages, messageText);
      setDebateMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
    } catch (err) {
      console.error("AI reply error:", err);
    } finally {
      setIsAiThinking(false);
    }
  };

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleDiscardDraft = () => {
    if (window.confirm("Discard your locally saved draft and start fresh?")) {
      clearDraft();
      setTitle("");
      setContent("");
      setCategory(CATEGORIES[0]);
      setImageFile(null);
      setImagePreview(null);
      setSaveStatus("");
      setAiReview(null);
      setDebateMessages([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Please provide both a title and post content.");
      return;
    }

    try {
      setIsSubmitting(true);
      let imageUrl = "";

      if (imageFile) {
        const path = `blog_covers/${user?.uid || "guest"}_${Date.now()}_${imageFile.name}`;
        imageUrl = await uploadImage(imageFile, path);
      }

      const newPost = {
        title: title.trim(),
        content: content.trim(),
        category,
        imageUrl,
        uid: user?.uid || "anonymous",
        authorEmail: user?.email || "anonymous@blogverse.dev",
        authorName: user?.displayName || user?.email?.split("@")[0] || "Spatial Creator",
        likes: 0,
        likedBy: [],
        createdAtClient: new Date().toISOString(),
      };

      // Push to Firestore with timeout
      await sendData(newPost, "blogs");

      // Clear draft ONLY upon successful upload
      clearDraft();

      setTitle("");
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setSaveStatus("");
      setAiReview(null);
      setDebateMessages([]);

      onPostCreated();
      onClose();
    } catch (err) {
      console.error("[PostModal Error]:", err);
      const exactErrorMsg = err?.code
        ? `Firebase [${err.code}]: ${err.message}`
        : err?.message || "Failed to publish post.";

      setError(exactErrorMsg);
      // Explicitly alert so missing API/database permissions are clearly visible
      alert(`Publishing Error:\n\n${exactErrorMsg}\n\nNote: If Cloud Firestore API is disabled, enable it in the Google Cloud / Firebase console.`);
    } finally {
      // Always reset publishing state so the button returns to normal
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Container — expands seamlessly when AI panel is active */}
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full ${
            isAiOpen ? "max-w-5xl" : "max-w-2xl"
          } bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-white z-10 overflow-hidden my-4 sm:my-8 transition-all duration-300 max-h-[92vh] overflow-y-auto`}
        >
          {/* Subtle Ambient Sheen */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5 relative">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                  Spatial Publishing & Synthesis
                </span>

                {/* Auto-Save Indicator */}
                {saveStatus === "saving" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Saving draft...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                  >
                    <span>✓</span>
                    <span>Draft saved locally</span>
                  </motion.span>
                )}
              </div>

              <h2 className="text-2xl font-bold font-display text-white mt-0.5">
                Create New Story
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {(title.trim() || content.trim()) && (
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  title="Discard current draft"
                >
                  Discard
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
              <span className="text-red-400 font-bold">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Main 2-Column Responsive Layout (Editor + AI Review Panel) */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* ── Left Side: Editor Form ──────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Story Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Architecture of Spatial Interfaces..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 text-sm transition-all"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Topic Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        category === cat
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400"
                          : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Content
                </label>
                <textarea
                  required
                  rows={isAiOpen ? 7 : 6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your article in full markdown or plain text..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 text-sm transition-all resize-y"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Cover Image (Optional)
                </label>
                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 max-h-36 group">
                    <img
                      src={imagePreview}
                      alt="Cover Preview"
                      className="w-full h-36 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-red-600 text-white text-xs backdrop-blur-md transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-white/20 hover:border-indigo-400/60 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-all">
                    <span className="text-lg mb-0.5">🖼️</span>
                    <span className="text-xs text-slate-300">
                      Click to select cover image (PNG, JPG, WebP)
                    </span>
                    <span className="text-[10px] text-slate-500">Max size: 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-center order-2 sm:order-1"
                >
                  Close (Preserve Draft)
                </button>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
                  {/* AI Review Toggle Button */}
                  <button
                    type="button"
                    onClick={handleToggleAi}
                    className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 truncate ${
                      isAiOpen
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400"
                        : "bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-300"
                    }`}
                  >
                    <span>🤖</span>
                    <span className="truncate">{isAiOpen ? "Hide AI" : "AI Review"}</span>
                  </button>

                  {/* Publish Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed truncate"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <span>Publish Story →</span>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* ── Right Side: AI Review & Debate Panel ────────────────────── */}
            {isAiOpen && (
              <motion.div
                initial={{ opacity: 0, x: 25, width: 0 }}
                animate={{ opacity: 1, x: 0, width: "100%" }}
                exit={{ opacity: 0, x: 25, width: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full lg:w-[380px] shrink-0 bg-white/[0.04] backdrop-blur-xl border border-white/15 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden"
              >
                {/* AI Panel Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>🤖</span> Socratic Debate Bot
                    </span>
                  </div>
                  {aiReview && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 truncate max-w-[150px]">
                      {aiReview.topic}
                    </span>
                  )}
                </div>

                {/* AI Review Content / Conversation Thread */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px] text-xs"
                >
                  {isAiLoading ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                      <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-slate-400 text-xs">
                        Stress-testing your thesis for blind spots...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Topic Tone Banner */}
                      {aiReview && (
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-400/20 text-[11px] text-purple-200">
                          <strong className="text-white">AI Stance:</strong> {aiReview.tone}
                        </div>
                      )}

                      {/* Debate Messages Thread */}
                      {debateMessages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-start gap-2 ${
                            msg.sender === "user" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                              msg.sender === "user"
                                ? "bg-indigo-600 text-white"
                                : "bg-purple-600 text-white"
                            }`}
                          >
                            {msg.sender === "user" ? "👤" : "🤖"}
                          </div>
                          <div
                            className={`p-3 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-line ${
                              msg.sender === "user"
                                ? "bg-indigo-600/30 border border-indigo-400/30 text-indigo-100 rounded-tr-none"
                                : "bg-white/[0.06] border border-white/10 text-slate-200 rounded-tl-none shadow-sm"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </motion.div>
                      ))}

                      {/* AI Thinking Animation */}
                      {isAiThinking && (
                        <div className="flex items-center gap-2 text-xs text-purple-300">
                          <div className="w-5 h-5 rounded-full bg-purple-600/40 flex items-center justify-center text-[10px]">
                            🤖
                          </div>
                          <div className="flex gap-1 items-center bg-white/[0.06] px-3 py-2 rounded-2xl border border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Debate Input Footer */}
                <form onSubmit={handleSendRebuttal} className="mt-3 pt-3 border-t border-white/10">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={userRebuttal}
                      onChange={(e) => setUserRebuttal(e.target.value)}
                      placeholder="Rebut the AI's critique..."
                      disabled={isAiThinking || isAiLoading}
                      className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950/80 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!userRebuttal.trim() || isAiThinking || isAiLoading}
                      className="absolute right-1.5 p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:hover:bg-purple-600 transition-all text-xs"
                      title="Send Rebuttal"
                    >
                      ➤
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 text-center">
                    Defend your argument to refine your story before publishing
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PostModal;
