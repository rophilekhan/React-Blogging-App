import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { useAuth } from "../contexts/AuthContext";
import { getData } from "../firebase/methods";
import BlogCard from "../components/ui/BlogCard";
import Loader3D from "../components/ui/Loader3D";

// Subtle ambient particle background
const ParticleField = lazy(() => import("../components/3d/ParticleField"));

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [myBlogs, setMyBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUserBlogs = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const data = await getData("blogs", user.uid);
        if (isMounted) {
          const sorted = (data || []).sort((a, b) => {
            const timeA = a.createdAt?.seconds
              ? a.createdAt.seconds * 1000
              : new Date(a.createdAtClient || 0).getTime();
            const timeB = b.createdAt?.seconds
              ? b.createdAt.seconds * 1000
              : new Date(b.createdAtClient || 0).getTime();
            return timeB - timeA;
          });
          setMyBlogs(sorted);
        }
      } catch (err) {
        console.error("Error fetching author posts:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserBlogs();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const handlePostDeleted = (deletedId) => {
    setMyBlogs((prev) => prev.filter((b) => b.documentId !== deletedId));
  };

  const totalLikes = useMemo(() => {
    return myBlogs.reduce((acc, curr) => acc + (Number(curr.likes) || 0), 0);
  }, [myBlogs]);

  const userDisplayName =
    user?.displayName || user?.email?.split("@")[0] || "Spatial Creator";
  const userInitials = userDisplayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative min-h-screen bg-[#050714] text-white selection:bg-indigo-500 selection:text-white pb-24">
      {/* ── Ambient 3D Background ────────────────────────────────────────── */}
      <Suspense fallback={null}>
        <ParticleField />
      </Suspense>

      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 px-6 py-4 backdrop-blur-xl bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_12px_#818cf8]" />
            <span className="text-xl font-extrabold tracking-wider font-display bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              SYNTHSCROLL
            </span>
          </Link>
          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-indigo-300">
            Author Profile
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2"
          >
            <span>←</span>
            <span>Dashboard</span>
          </Link>
          <button
            onClick={logout}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Main Profile Container ───────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        {/* User Profile Glassmorphism Card */}
        <Tilt
          tiltMaxAngleX={4}
          tiltMaxAngleY={4}
          perspective={1200}
          scale={1.01}
          transitionSpeed={1000}
          className="w-full mb-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="p-8 sm:p-10 rounded-3xl bg-white/[0.05] backdrop-blur-2xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden"
          >
            {/* Top ambient glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-indigo-400/40 shadow-xl shadow-indigo-950/60 flex items-center justify-center bg-gradient-to-tr from-indigo-900 via-purple-900 to-slate-900">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={userDisplayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-extrabold font-display tracking-wider bg-gradient-to-r from-indigo-200 to-pink-200 bg-clip-text text-transparent">
                      {userInitials}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-md flex items-center justify-center text-[10px] text-white font-bold" title="Verified Creator">
                  ✓
                </div>
              </div>

              {/* User Bio Details */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-display bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                    {userDisplayName}
                  </h1>
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono tracking-wide bg-indigo-500/15 border border-indigo-400/30 text-indigo-300">
                    Pro Author
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-mono mb-6">
                  {user?.email}
                </p>

                {/* Live Author Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto md:mx-0">
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center md:text-left">
                    <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">
                      Published Stories
                    </span>
                    <span className="text-2xl font-extrabold text-white font-display">
                      {myBlogs.length}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center md:text-left">
                    <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">
                      Total Likes
                    </span>
                    <span className="text-2xl font-extrabold text-pink-400 font-display flex items-center justify-center md:justify-start gap-1">
                      <span>❤️</span>
                      <span>{totalLikes}</span>
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center md:text-left col-span-2 sm:col-span-1">
                    <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">
                      Account Status
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 flex items-center justify-center md:justify-start gap-1.5 mt-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Active Creator
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Tilt>

        {/* ── Author's Published Articles ──────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                My Authored Stories
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Articles and spatial publications authored by your account
              </p>
            </div>

            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-indigo-500/30 transition-all"
            >
              + Create New Story
            </Link>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Fetching your publications...</span>
            </div>
          ) : myBlogs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
              <span className="text-4xl block mb-3">✍️</span>
              <h3 className="text-lg font-bold text-white mb-2">No Stories Published Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                You haven't published any stories yet. Launch the spatial dashboard and write your first article today.
              </p>
              <Link
                to="/dashboard"
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all inline-block shadow-lg shadow-indigo-600/30"
              >
                Write Your First Story →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBlogs.map((blog) => (
                <BlogCard
                  key={blog.documentId}
                  blog={blog}
                  onDelete={handlePostDeleted}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
