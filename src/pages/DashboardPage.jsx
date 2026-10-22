import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/ui/Navbar";
import BlogCard from "../components/ui/BlogCard";
import SkeletonBlogCard from "../components/ui/SkeletonBlogCard";
import PostModal from "../components/ui/PostModal";
import LiveWidgets from "../components/ui/LiveWidgets";
import Loader3D from "../components/ui/Loader3D";
import EasterEggArtifact from "../components/3d/EasterEggArtifact";
import { useAuth } from "../contexts/AuthContext";
import { getAllData, getData } from "../firebase/methods";
import { seedAdvancedFeed } from "../services/apiSeeder";

// Dynamic chunk-splitting for subtle background particle canvas
const ParticleField = lazy(() => import("../components/3d/ParticleField"));

const FEED_CACHE_KEY = "synthscroll_feed_cache";

const getCachedBlogs = () => {
  try {
    const raw = sessionStorage.getItem(FEED_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse cached feed:", e);
  }
  return [];
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all"); // "all" | "my"
  const [blogs, setBlogs] = useState(getCachedBlogs);
  const [loading, setLoading] = useState(() => getCachedBlogs().length === 0);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState("");

  const blogsRef = useRef(blogs);
  blogsRef.current = blogs;

  // Stale-While-Revalidate Feed Fetcher
  const fetchBlogs = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent && blogsRef.current.length === 0) {
          setLoading(true);
        } else {
          setIsRevalidating(true);
        }

        let data = [];
        if (activeTab === "my" && user?.uid) {
          data = await getData("blogs", user.uid);
        } else {
          data = await getAllData("blogs");
        }

        // Sort newest first
        const sorted = (data || []).sort((a, b) => {
          const timeA = a.createdAt?.seconds
            ? a.createdAt.seconds * 1000
            : new Date(a.createdAtClient || 0).getTime();
          const timeB = b.createdAt?.seconds
            ? b.createdAt.seconds * 1000
            : new Date(b.createdAtClient || 0).getTime();
          return timeB - timeA;
        });

        setBlogs(sorted);

        // Cache the primary feed in sessionStorage for zero-latency instant display
        if (activeTab === "all") {
          try {
            sessionStorage.setItem(FEED_CACHE_KEY, JSON.stringify(sorted));
          } catch (cacheErr) {
            console.warn("sessionStorage cache write error:", cacheErr);
          }
        }
      } catch (err) {
        console.error("Error fetching blogs:", err);
      } finally {
        setLoading(false);
        setIsRevalidating(false);
      }
    },
    [activeTab, user?.uid]
  );

  useEffect(() => {
    fetchBlogs(blogsRef.current.length > 0);
  }, [fetchBlogs]);

  // Advanced Multi-API Aggregator Seeder Action (News, Reddit, Music)
  const handleFetchAdvancedFeed = async () => {
    try {
      setIsSeeding(true);
      setSeedNotice("");
      const result = await seedAdvancedFeed(6);
      setSeedNotice(
        `⚡ Synced ${result.count} multi-source dispatches (News, Reddit & Music) into feed!`
      );
      await fetchBlogs(true);
      setTimeout(() => setSeedNotice(""), 4500);
    } catch (err) {
      console.error("Live multi-API seeding failed:", err);
      setSeedNotice("Failed to sync live feeds. Please try again.");
      setTimeout(() => setSeedNotice(""), 4000);
    } finally {
      setIsSeeding(false);
    }
  };

  const handlePostDeleted = (deletedId) => {
    setBlogs((prev) => {
      const updated = prev.filter((b) => b.documentId !== deletedId);
      try {
        sessionStorage.setItem(FEED_CACHE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  // Filtered stories
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesSearch =
        (blog.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (blog.content || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (blog.authorName || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || blog.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [blogs, searchQuery, selectedCategory]);

  // Quick stats
  const totalMyPosts = useMemo(() => {
    if (!user) return 0;
    return blogs.filter((b) => b.uid === user?.uid).length;
  }, [blogs, user]);

  const totalLikes = useMemo(() => {
    return blogs.reduce((acc, curr) => acc + (curr.likes || 0), 0);
  }, [blogs]);

  const categories = [
    "All",
    "Technology",
    "Social & Trending",
    "Music & Culture",
    "Design",
    "AI & Robotics",
    "Web3",
  ];

  return (
    <div className="relative min-h-screen text-white select-none pb-24 bg-[#050714] overflow-x-hidden">
      {/* ── 3D Particle Canvas Background with Suspense ───────────────────── */}
      <Suspense fallback={<Loader3D message="Initializing Particle Space..." />}>
        <ParticleField />
      </Suspense>

      {/* ── Responsive Mobile-First Header & Navbar ───────────────────────── */}
      <Navbar
        isDashboard={true}
        onOpenWriteModal={() => setIsModalOpen(true)}
        onFetchAdvancedFeed={handleFetchAdvancedFeed}
        isSeeding={isSeeding}
        isRevalidating={isRevalidating}
      />

      {/* ── Main Layout (Content Grid + Live Widgets Sidebar) ─────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:p-8">
        {/* Live Seed Feedback Banner */}
        <AnimatePresence>
          {seedNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-lg backdrop-blur-md"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">✨</span>
                <span className="font-medium truncate">{seedNotice}</span>
              </div>
              <button
                onClick={() => setSeedNotice("")}
                className="text-emerald-300 hover:text-white text-xs px-2 py-1 shrink-0 ml-2"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome & Stats Banner */}
        <section className="mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-white/[0.05] backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div className="relative z-10 max-w-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                {user ? "Spatial Author Portal" : "Decentralized Public Mesh"}
              </span>
              <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold font-display text-white mt-1 leading-tight">
                {user ? "Explore & Publish Dimensions" : "Explore SynthScroll Universe"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300/80 mt-1.5 leading-relaxed">
                {user ? (
                  <>
                    Logged in as{" "}
                    <strong className="text-indigo-300">
                      {user.displayName || user.email}
                    </strong>
                    . Browse live telemetry, read real-time articles, or broadcast new
                    stories.
                  </>
                ) : (
                  <>
                    Browsing in <strong className="text-indigo-300">Guest Mode</strong>.
                    Experience real-time multi-source dispatches (Spaceflight, Reddit,
                    Music) and live telemetry in 3D. Sign in to publish.
                  </>
                )}
              </p>
            </div>

            {/* Quick Metrics (Responsive 3-Column Grid) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full md:w-auto relative z-10 shrink-0">
              <div className="px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center min-w-0 md:min-w-[90px]">
                <div className="text-lg sm:text-2xl font-bold font-display text-white">
                  {blogs.length}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider truncate">
                  Stories
                </div>
              </div>

              {user ? (
                <div className="px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center min-w-0 md:min-w-[90px]">
                  <div className="text-lg sm:text-2xl font-bold font-display text-indigo-300">
                    {totalMyPosts}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider truncate">
                    My Posts
                  </div>
                </div>
              ) : (
                <div className="px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center min-w-0 md:min-w-[90px]">
                  <div className="text-lg sm:text-2xl font-bold font-display text-indigo-300">
                    Guest
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider truncate">
                    Access
                  </div>
                </div>
              )}

              <div className="px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center min-w-0 md:min-w-[90px]">
                <div className="text-lg sm:text-2xl font-bold font-display text-pink-300">
                  {totalLikes}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider truncate">
                  Total Likes
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Responsive Body: Main Feed + Right Widgets Sidebar */}
        <div className="flex flex-col xl:flex-row gap-6 md:gap-8 items-start">
          {/* ── Left Column: Controls & Stories Feed ────────────────────────── */}
          <div className="flex-1 min-w-0 w-full">
            {/* Filter & Tab Switcher Bar */}
            <section className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 w-full sm:w-fit backdrop-blur-xl">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all text-center truncate ${
                      activeTab === "all"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All Community Stories
                  </button>
                  <button
                    onClick={() => {
                      if (user) {
                        setActiveTab("my");
                      } else {
                        navigate("/login");
                      }
                    }}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all text-center truncate ${
                      activeTab === "my"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title={
                      !user
                        ? "Sign in to view your published stories"
                        : "View your personal stories"
                    }
                  >
                    My Stories{" "}
                    {!user && (
                      <span className="text-[10px] text-indigo-300 ml-1">
                        (Sign In)
                      </span>
                    )}
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stories, authors..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 backdrop-blur-md transition-all"
                  />
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Category Chips with Horizontal Scroll */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar text-xs -mx-4 px-4 sm:mx-0 sm:px-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all text-xs truncate max-w-[160px] ${
                      selectedCategory === cat
                        ? "bg-purple-500/25 border border-purple-400/40 text-purple-200"
                        : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* Stories Grid (Strictly grid-cols-1 on mobile, md:grid-cols-2, lg:grid-cols-3 on large) */}
            <section>
              {loading && blogs.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <SkeletonBlogCard />
                  <SkeletonBlogCard />
                  <SkeletonBlogCard />
                </div>
              ) : filteredBlogs.length > 0 ? (
                <motion.div
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                >
                  <AnimatePresence>
                    {filteredBlogs.map((blog) => (
                      <BlogCard
                        key={blog.documentId || `${blog.uid}_${blog.createdAtClient}`}
                        blog={blog}
                        onDelete={handlePostDeleted}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="p-6 sm:p-10 text-center rounded-3xl bg-white/[0.03] border border-dashed border-white/15 backdrop-blur-xl">
                  <div className="text-4xl mb-3">📡</div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                    {searchQuery || selectedCategory !== "All"
                      ? "No matching stories found"
                      : activeTab === "my"
                      ? "You haven't written any stories yet"
                      : "No stories in feed yet"}
                  </h3>
                  <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
                    Click "Multi-API Feed Sync" above to aggregate real-world Spaceflight
                    News, Reddit discussions, and iTunes tracks, or publish your own story.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 w-full">
                    <button
                      onClick={handleFetchAdvancedFeed}
                      disabled={isSeeding}
                      className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 truncate"
                    >
                      <span>⚡</span>
                      <span>Sync Multi-Source Dispatches</span>
                    </button>
                    {user ? (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-indigo-500/30 transition-all truncate"
                      >
                        Write Story →
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate("/login")}
                        className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-indigo-500/30 transition-all truncate"
                      >
                        Sign in to Publish →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ── Right Column: Dynamic Live Widgets Sidebar ──────────────────── */}
          <div className="w-full xl:w-80 xl:shrink-0 mt-6 xl:mt-0">
            <div className="xl:sticky xl:top-24">
              <LiveWidgets />
            </div>
          </div>
        </div>
      </main>

      {/* ── Post Creation Modal ──────────────────────────────────────────── */}
      {user && (
        <PostModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPostCreated={() => fetchBlogs(true)}
        />
      )}

      {/* ── Hidden 3D Agency Easter Egg Artifact ─────────────────────────── */}
      <EasterEggArtifact />
    </div>
  );
};

export default DashboardPage;
