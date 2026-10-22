import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { useAuth } from "../contexts/AuthContext";
import {
  getData,
  getSingleDocument,
  getUserSavedPostIds,
  uploadImage,
  updateUserProfileData,
} from "../firebase/methods";
import BlogCard from "../components/ui/BlogCard";
import Loader3D from "../components/ui/Loader3D";

// Subtle ambient particle background
const ParticleField = lazy(() => import("../components/3d/ParticleField"));

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("authored"); // "authored" | "saved"
  const [myBlogs, setMyBlogs] = useState([]);
  const [savedBlogs, setSavedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [currentPhotoURL, setCurrentPhotoURL] = useState(user?.photoURL || "");
  const [toastMessage, setToastMessage] = useState("");

  const avatarInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // 1. Fetch user's authored publications
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

  // 2. Fetch user's saved/bookmarked publications (Supporting both native Firestore & external API stories)
  useEffect(() => {
    let isMounted = true;

    const fetchSavedStories = async () => {
      if (!user?.uid) return;
      try {
        setLoadingSaved(true);
        const savedItems = await getUserSavedPostIds(user.uid);

        if (!savedItems || savedItems.length === 0) {
          if (isMounted) setSavedBlogs([]);
          return;
        }

        // Fetch document details for normal string IDs, or keep external post objects directly
        const docs = await Promise.all(
          savedItems.map(async (item) => {
            if (!item) return null;
            // If already a complete post object (saved external API post)
            if (typeof item === "object") {
              return {
                ...item,
                documentId: item.documentId || item.id,
                imageUrl: item.imageUrl || item.coverImage || "",
              };
            }
            // If a string document ID (normal Firestore post)
            if (typeof item === "string") {
              return await getSingleDocument(item, "blogs");
            }
            return null;
          })
        );

        if (isMounted) {
          const validDocs = docs.filter(Boolean);
          setSavedBlogs(validDocs);
        }
      } catch (err) {
        console.error("Error fetching saved stories:", err);
      } finally {
        if (isMounted) setLoadingSaved(false);
      }
    };

    fetchSavedStories();
    return () => {
      isMounted = false;
    };
  }, [user?.uid, activeTab]);

  // 3. Profile Picture Upload using Firebase Storage & updateProfile
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("❌ Image size must be less than 5MB");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const storagePath = `avatars/${user.uid}_${Date.now()}_${file.name}`;
      const downloadUrl = await uploadImage(file, storagePath);

      // Update Firebase Auth user globally and sync Firestore user document
      await updateUserProfileData(user, { photoURL: downloadUrl });

      setCurrentPhotoURL(downloadUrl);
      showToast("✨ Profile picture updated globally!");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      showToast("Failed to upload avatar: " + (err.message || "Network error"));
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handlePostDeleted = (deletedId) => {
    setMyBlogs((prev) => prev.filter((b) => (b.documentId || b.id) !== deletedId));
    setSavedBlogs((prev) => prev.filter((b) => (b.documentId || b.id) !== deletedId));
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

      {/* Hidden File Input for Avatar Upload */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 px-6 py-4 backdrop-blur-xl bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
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
            to="/"
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2"
          >
            <span>←</span>
            <span>Feed</span>
          </Link>
          <button
            onClick={async () => {
              await logout();
              navigate("/");
            }}
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
          className="w-full mb-10"
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
              {/* Interactive Avatar with Upload Trigger */}
              <div
                onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                className="relative group shrink-0 cursor-pointer"
                title="Click to upload a new profile picture"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-indigo-400/40 shadow-xl shadow-indigo-950/60 flex items-center justify-center bg-gradient-to-tr from-indigo-900 via-purple-900 to-slate-900 relative">
                  {currentPhotoURL ? (
                    <img
                      src={currentPhotoURL}
                      alt={userDisplayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-3xl font-extrabold font-display tracking-wider bg-gradient-to-r from-indigo-200 to-pink-200 bg-clip-text text-transparent">
                      {userInitials}
                    </span>
                  )}

                  {/* Hover Overlay with Camera Icon */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                    <span className="text-xl">📷</span>
                    <span className="text-[10px] font-semibold tracking-wide">
                      Change Photo
                    </span>
                  </div>

                  {/* Uploading Spinner */}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-1 text-white z-20">
                      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[9px] font-mono text-indigo-300">
                        Uploading...
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 border-2 border-slate-950 shadow-md flex items-center justify-center text-xs text-white group-hover:scale-110 transition-transform"
                  title="Upload new photo"
                >
                  ✎
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
                      Saved Bookmarks
                    </span>
                    <span className="text-2xl font-extrabold text-amber-300 font-display flex items-center justify-center md:justify-start gap-1">
                      <span>🔖</span>
                      <span>{savedBlogs.length}</span>
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center md:text-left col-span-2 sm:col-span-1">
                    <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">
                      Total Likes
                    </span>
                    <span className="text-2xl font-extrabold text-pink-400 font-display flex items-center justify-center md:justify-start gap-1">
                      <span>❤️</span>
                      <span>{totalLikes}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Tilt>

        {/* ── Tab Switcher: Authored Stories vs Saved Stories ───────────────── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl w-fit">
              <button
                onClick={() => setActiveTab("authored")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "authored"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>✍️</span>
                <span>My Authored Stories</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
                  {myBlogs.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("saved")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "saved"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>🔖</span>
                <span>Saved Stories</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
                  {savedBlogs.length}
                </span>
              </button>
            </div>

            <Link
              to="/"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-indigo-500/30 transition-all text-center"
            >
              + Create New Story
            </Link>
          </div>

          {/* Tab 1: Authored Stories */}
          {activeTab === "authored" && (
            <div>
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400 font-mono">
                    Fetching your publications...
                  </span>
                </div>
              ) : myBlogs.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                  <span className="text-4xl block mb-3">✍️</span>
                  <h3 className="text-lg font-bold text-white mb-2">
                    No Stories Published Yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                    You haven't published any stories yet. Launch the spatial dashboard and write your first article today.
                  </p>
                  <Link
                    to="/"
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all inline-block shadow-lg shadow-indigo-600/30"
                  >
                    Write Your First Story →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myBlogs.map((blog) => (
                    <BlogCard
                      key={blog.documentId || blog.id}
                      blog={blog}
                      onDelete={handlePostDeleted}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Saved Stories / Bookmarks */}
          {activeTab === "saved" && (
            <div>
              {loadingSaved ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400 font-mono">
                    Retrieving your saved bookmarks...
                  </span>
                </div>
              ) : savedBlogs.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                  <span className="text-4xl block mb-3">🔖</span>
                  <h3 className="text-lg font-bold text-white mb-2">
                    No Saved Stories Yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                    Click the bookmark icon on any story in the dashboard feed to save it to your personal reading library.
                  </p>
                  <Link
                    to="/"
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all inline-block shadow-lg shadow-indigo-600/30"
                  >
                    Browse Community Feed →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedBlogs.map((blog) => (
                    <BlogCard
                      key={blog.documentId || blog.id}
                      blog={blog}
                      onDelete={handlePostDeleted}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* ── Toast Notification Pill ──────────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-indigo-600/95 border border-indigo-400/40 text-white text-xs font-medium shadow-2xl backdrop-blur-xl flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
