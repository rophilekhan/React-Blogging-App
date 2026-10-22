import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, ChevronRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = ({
  isDashboard = true,
  onOpenWriteModal,
  onFetchAdvancedFeed,
  isSeeding = false,
  isRevalidating = false,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      setMobileMenuOpen(false);
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleWriteClick = () => {
    setMobileMenuOpen(false);
    if (user) {
      if (onOpenWriteModal) onOpenWriteModal();
    } else {
      navigate("/login");
    }
  };

  const handleFeedSyncClick = () => {
    setMobileMenuOpen(false);
    if (onFetchAdvancedFeed) onFetchAdvancedFeed();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full px-4 sm:px-6 py-3.5 backdrop-blur-xl bg-slate-950/70 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* ── Brand Logo ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link
              to="/landing"
              className="flex items-center gap-2 shrink-0 group focus:outline-none"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_12px_#818cf8]" />
              <span className="text-lg sm:text-xl font-extrabold tracking-wider font-display bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent group-hover:brightness-110 transition-all">
                SYNTHSCROLL
              </span>
            </Link>

            <span className="hidden lg:inline-block px-3 py-1 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-slate-300">
              Spatial Workspace
            </span>

            {isRevalidating && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] bg-indigo-500/15 border border-indigo-400/25 text-indigo-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                <span>Live Sync</span>
              </span>
            )}
          </div>

          {/* ── Desktop Navigation & Controls (hidden md:flex) ─────────────── */}
          <div className="hidden md:flex items-center gap-2.5 lg:gap-3.5 flex-wrap">
            {/* Multi-API Seeder Button (Dashboard only) */}
            {isDashboard && onFetchAdvancedFeed && (
              <button
                onClick={handleFeedSyncClick}
                disabled={isSeeding}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm truncate"
                title="Aggregates live Spaceflight News, Reddit discussions, and iTunes music into Firestore"
              >
                {isSeeding ? (
                  <>
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-emerald-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Aggregating...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Multi-API Sync</span>
                  </>
                )}
              </button>
            )}

            {/* Write Story (User) / Sign in to Publish (Guest) */}
            {user ? (
              <button
                onClick={handleWriteClick}
                className="px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5 truncate"
              >
                <span>+</span>
                <span>Write Story</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5 truncate"
                title="Sign in to publish your stories"
              >
                <Sparkles size={14} className="shrink-0" />
                <span>Sign in to Publish</span>
              </button>
            )}

            <div className="h-5 w-px bg-white/15" />

            {/* Profile & Auth Section */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs md:text-sm text-slate-300 hover:text-white transition-all group"
                  title="View your author profile"
                >
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 overflow-hidden flex items-center justify-center text-[10px] md:text-[11px] font-bold text-white uppercase shadow-md shadow-indigo-500/20 shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (user.displayName || user.email || "U")[0]
                    )}
                  </div>
                  <span className="hidden lg:inline font-medium">Profile</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-xs md:text-sm text-slate-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile Hamburger Icon (flex md:hidden) ────────────────────── */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white transition-all active:scale-95 focus:outline-none"
              aria-label="Open mobile navigation menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Full-Screen Mobile Glassmorphic Navigation Overlay ───────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-[#050714]/95 backdrop-blur-2xl px-5 py-5 flex flex-col justify-between overflow-y-auto md:hidden"
          >
            {/* Overlay Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <Link
                  to="/landing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_12px_#818cf8]" />
                  <span className="text-lg font-extrabold tracking-wider font-display bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                    SYNTHSCROLL
                  </span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 focus:outline-none"
                  aria-label="Close mobile navigation menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Identity / Guest Status Pill */}
              <div className="mt-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
                {user ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 overflow-hidden flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (user.displayName || user.email || "U")[0]
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">
                        {user.displayName || "Spatial Author"}
                      </div>
                      <div className="text-slate-400 text-[11px] truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-slate-300 font-medium">Guest Mode</span>
                  </div>
                )}
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 shrink-0">
                  {user ? "Author" : "Public"}
                </span>
              </div>

              {/* Primary Mobile Action Buttons (Full Width, Zero Overflow) */}
              <div className="mt-5 space-y-3">
                {isDashboard && onFetchAdvancedFeed && (
                  <button
                    onClick={handleFeedSyncClick}
                    disabled={isSeeding}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-md"
                  >
                    <span>⚡</span>
                    <span className="truncate">
                      {isSeeding ? "Aggregating Feeds..." : "Multi-API Feed Sync"}
                    </span>
                  </button>
                )}

                <button
                  onClick={handleWriteClick}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  {user ? (
                    <>
                      <span>+</span>
                      <span>Write Story</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Sign in to Publish</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mobile Navigation List */}
              <div className="mt-6 pt-4 border-t border-white/10 space-y-1 text-sm">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <span>🪐</span>
                    <span>Dashboard Feed</span>
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </Link>

                <Link
                  to="/landing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <span>🌌</span>
                    <span>3D Landing Page</span>
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </Link>

                {user && (
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>👤</span>
                      <span>Author Profile</span>
                    </span>
                    <ChevronRight size={16} className="text-slate-400" />
                  </Link>
                )}

                <Link
                  to="/codesphinx-portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <span>⚡</span>
                    <span>Agency Portal</span>
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </Link>
              </div>
            </div>

            {/* Overlay Footer: Auth Actions */}
            <div className="mt-8 pt-4 border-t border-white/10">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-300 text-xs sm:text-sm font-semibold active:scale-[0.99] transition-all"
                >
                  Sign Out from SynthScroll
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-3 px-4 rounded-xl text-center text-xs sm:text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/15 transition-all truncate"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-3 px-4 rounded-xl text-center text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all truncate"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
