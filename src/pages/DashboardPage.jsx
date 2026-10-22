import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/ui/Navbar";
import BlogCard from "../components/ui/BlogCard";
import BlogCardSkeleton from "../components/ui/BlogCardSkeleton";
import PostModal from "../components/ui/PostModal";
import LiveWidgets from "../components/ui/LiveWidgets";
import Loader3D from "../components/ui/Loader3D";
import EasterEggArtifact from "../components/3d/EasterEggArtifact";
import { useAuth } from "../contexts/AuthContext";
import { getAllData, getData } from "../firebase/methods";
import { fetchMultiSourceFeed, deduplicateArticles } from "../services/apiSeeder";

// Dynamic chunk-splitting for subtle background particle canvas
const ParticleField = lazy(() => import("../components/3d/ParticleField"));

const FEED_CACHE_KEY = "synthscroll_feed_cache";

const getCachedBlogs = () => {
  try {
    const raw = sessionStorage.getItem(FEED_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return deduplicateArticles(parsed);
      }
    }
  } catch (e) {
    console.warn("Failed to parse cached feed:", e);
  }
  return [];
};

const getBlogCardKey = (blog, idx) => {
  if (blog.documentId) return `card-doc-${blog.documentId}`;
  if (blog.id) return `card-id-${blog.id}`;
  if (blog.sourceUrl) return `card-url-${blog.sourceUrl}`;
  const slug = (blog.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (slug) return `card-slug-${slug}`;
  return `card-idx-${idx}`;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all"); // "all" | "my"
  const [blogs, setBlogs] = useState(getCachedBlogs);
  const [loading, setLoading] = useState(() => getCachedBlogs().length === 0);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pageRef = useRef(1);
  const observerTarget = useRef(null);
  const blogsRef = useRef(blogs);
  blogsRef.current = blogs;

  // ── Auto-Fetch Engine (Firebase + Live External APIs with Strict Deduplication)
  const fetchBlogs = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent && blogsRef.current.length === 0) {
          setLoading(true);
        } else {
          setIsRevalidating(true);
        }

        let firebaseData = [];
        let externalData = [];

        if (activeTab === "my" && user?.uid) {
          firebaseData = await getData("blogs", user.uid);
        } else {
          // Concurrently fetch Firebase user stories and multi-source external dispatches
          const [fbResult, apiResult] = await Promise.allSettled([
            getAllData("blogs"),
            fetchMultiSourceFeed(1, 6),
          ]);

          if (fbResult.status === "fulfilled" && Array.isArray(fbResult.value)) {
            firebaseData = fbResult.value;
          }
          if (apiResult.status === "fulfilled" && Array.isArray(apiResult.value)) {
            externalData = apiResult.value;
          }
        }

        // Combine Firebase stories and live external API articles
        const combined = [...(firebaseData || []), ...(externalData || [])];

        // Sort newest first
        const sorted = combined.sort((a, b) => {
          const timeA = a.createdAt?.seconds
            ? a.createdAt.seconds * 1000
            : new Date(a.createdAtClient || 0).getTime();
          const timeB = b.createdAt?.seconds
            ? b.createdAt.seconds * 1000
            : new Date(b.createdAtClient || 0).getTime();
          return timeB - timeA;
        });

        // Strict deduplication using Set on title, URL, and documentId
        const uniqueBlogs = deduplicateArticles(sorted);

        setBlogs(uniqueBlogs);
        pageRef.current = 1;
        setHasMore(true);

        // Cache the primary feed in sessionStorage for zero-latency instant display
        if (activeTab === "all") {
          try {
            sessionStorage.setItem(FEED_CACHE_KEY, JSON.stringify(uniqueBlogs));
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

  // Trigger auto-fetching on mount and tab switch
  useEffect(() => {
    fetchBlogs(blogsRef.current.length > 0);
  }, [fetchBlogs]);

  // ── Infinite Scroll: Seamless Auto-Fetch on Intersection (Preserving Prev State) ──
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading || activeTab === "my") return;

    try {
      setLoadingMore(true);
      const nextPage = pageRef.current + 1;
      const nextDispatches = await fetchMultiSourceFeed(nextPage, 6);

      if (!nextDispatches || nextDispatches.length === 0) {
        setHasMore(false);
        return;
      }

      pageRef.current = nextPage;

      setBlogs((prev) => {
        // Collect existing identifiers
        const existingUrls = new Set(
          prev
            .map((b) => (b.sourceUrl || b.url || "").trim().toLowerCase())
            .filter(Boolean)
        );
        const existingTitles = new Set(
          prev
            .map((b) => (b.title || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""))
            .filter(Boolean)
        );
        const existingIds = new Set(
          prev.map((b) => b.documentId || b.id).filter(Boolean)
        );

        // Filter strictly new items so existing objects remain untouched
        const freshItems = nextDispatches.filter((item) => {
          if (!item) return false;
          const id = item.documentId || item.id;
          if (id && existingIds.has(id)) return false;
          const normTitle = (item.title || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
          if (normTitle && existingTitles.has(normTitle)) return false;
          const normUrl = (item.sourceUrl || item.url || "").trim().toLowerCase();
          if (normUrl && existingUrls.has(normUrl)) return false;
          return true;
        });

        if (freshItems.length === 0) return prev;

        // Append strictly new items without reordering or remounting existing items
        const merged = [...prev, ...freshItems];
        if (activeTab === "all") {
          try {
            sessionStorage.setItem(FEED_CACHE_KEY, JSON.stringify(merged));
          } catch (e) {
            // Ignore quota errors
          }
        }
        return merged;
      });
    } catch (err) {
      console.warn("Infinite scroll auto-fetch notice:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, activeTab]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: "350px", // Trigger early before reaching viewport end
        threshold: 0.1,
      }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [handleLoadMore]);

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
  // Dynamic Category Extraction: Includes base topics plus any custom author categories in feed
  const categories = useMemo(() => {
    const base = [
      "All",
      "Technology",
      "Social & Trending",
      "Music & Culture",
      "Design",
      "AI & Robotics",
      "Web3",
    ];
    const customFound = new Set();
    blogs.forEach((b) => {
      if (b.category && typeof b.category === "string") {
        const trimmed = b.category.trim();
        const inBase = base.some((bc) => bc.toLowerCase() === trimmed.toLowerCase());
        if (!inBase && trimmed.length > 0) {
          customFound.add(trimmed);
        }
      }
    });
    return [...base, ...Array.from(customFound)];
  }, [blogs]);

  // Robust Filtered stories engine
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (blog.title || "").toLowerCase().includes(q) ||
        (blog.content || "").toLowerCase().includes(q) ||
        (blog.authorName || "").toLowerCase().includes(q);

      const matchesCategory = (() => {
        if (!selectedCategory || selectedCategory === "All") return true;
        const sel = selectedCategory.trim().toLowerCase();
        const cat = (blog.category || "").trim().toLowerCase();

        // Exact match
        if (cat === sel) return true;

        // Semantic synonym mappings
        if (sel === "technology" && (cat === "tech" || cat === "space")) return true;
        if (sel.includes("ai") && (cat === "ai" || cat.includes("robot"))) return true;
        if (sel.includes("music") && (cat === "music" || cat.includes("culture") || cat.includes("sound"))) return true;
        if (sel.includes("social") && (cat === "social" || cat.includes("trend") || cat.includes("discuss"))) return true;
        if (sel === "web3" && (cat.includes("crypto") || cat.includes("blockchain"))) return true;

        // Substring / fuzzy match
        return cat.includes(sel) || sel.includes(cat);
      })();

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
        isRevalidating={isRevalidating}
      />

      {/* ── Main Layout (Content Grid + Live Widgets Sidebar) ─────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:p-8">

        {/* Welcome & Stats Banner */}
        <section className="mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-white/[0.05] backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div className="relative z-10 max-w-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                {user ? "Spatial Author Portal" : "Decentralized Public Mesh"}
              </span>
              <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold font-display text-white mt-1 leading-tight">
                {user ? "Explore & Publish Blogs" : "Explore SynthScroll Universe"}
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
                    className={`flex-1 sm:flex-initial px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all text-center truncate ${activeTab === "all"
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
                    className={`flex-1 sm:flex-initial px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all text-center truncate ${activeTab === "my"
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
                    className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all text-xs truncate max-w-[160px] ${selectedCategory === cat
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-h-[460px]">
                  {[...Array(6)].map((_, i) => (
                    <BlogCardSkeleton key={`init-skeleton-${i}`} />
                  ))}
                </div>
              ) : filteredBlogs.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <AnimatePresence>
                      {filteredBlogs.map((blog, idx) => (
                        <BlogCard
                          key={getBlogCardKey(blog, idx)}
                          blog={blog}
                          onDelete={handlePostDeleted}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Infinite Scroll Bottom Skeletons Loader with Stable Min-Height Container */}
                  <div
                    className={`transition-all duration-300 ${loadingMore ? "min-h-[460px] opacity-100" : "min-h-0 opacity-0"
                      }`}
                  >
                    {loadingMore && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 min-h-[460px]">
                        <BlogCardSkeleton />
                        <BlogCardSkeleton />
                        <BlogCardSkeleton />
                      </div>
                    )}
                  </div>

                  {/* Sentinel trigger element for Infinite Scroll IntersectionObserver */}
                  <div ref={observerTarget} className="h-16 w-full pointer-events-none" />
                </>
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
                    {activeTab === "my"
                      ? "Publish your inaugural dimension or dispatch your thoughts to the mesh."
                      : "Browse real-time spatial dispatches or broadcast your own story to the universe."}
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 w-full">
                    {user ? (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-indigo-500/30 transition-all truncate"
                      >
                        Write Story →
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate("/login")}
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-indigo-500/30 transition-all truncate"
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
