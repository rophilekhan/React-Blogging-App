import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LiveWidgets = () => {
  // Weather state
  const [weather, setWeather] = useState({
    city: "Detecting location...",
    temp: null,
    weatherCode: null,
    country: "",
    loading: true,
  });

  // Crypto state with real CoinGecko data
  const [crypto, setCrypto] = useState({
    btc: { price: null, change: null, url: "https://www.coingecko.com/en/coins/bitcoin" },
    eth: { price: null, change: null, url: "https://www.coingecko.com/en/coins/ethereum" },
    sol: { price: null, change: null, url: "https://www.coingecko.com/en/coins/solana" },
    loading: true,
  });

  // Trending Repos / Tech Sparks state
  const [trendingSparks, setTrendingSparks] = useState([]);
  const [loadingSparks, setLoadingSparks] = useState(true);

  // Toast notification state for share/clipboard actions
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Current system clock
  const [time, setTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch Real Live Location & Weather
  useEffect(() => {
    let isMounted = true;

    const fetchWeather = async () => {
      try {
        let lat = 40.7128;
        let lon = -74.006;
        let city = "New York";
        let country = "US";

        try {
          const locRes = await fetch("https://ipwho.is/");
          if (locRes.ok) {
            const locData = await locRes.json();
            if (locData.latitude && locData.longitude) {
              lat = locData.latitude;
              lon = locData.longitude;
              city = locData.city || city;
              country = locData.country || country;
            }
          }
        } catch {
          // Graceful fallback coordinates
        }

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );

        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          if (isMounted && weatherData.current_weather) {
            setWeather({
              city,
              country,
              temp: Math.round(weatherData.current_weather.temperature),
              weatherCode: weatherData.current_weather.weathercode,
              windSpeed: weatherData.current_weather.windspeed,
              loading: false,
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setWeather({
            city: "Metropolis",
            country: "Global Mesh",
            temp: 21,
            weatherCode: 0,
            loading: false,
          });
        }
      }
    };

    fetchWeather();
  }, []);

  // 2. Fetch Real Live Market Telemetry from CoinGecko API
  useEffect(() => {
    let isMounted = true;

    const fetchCrypto = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true"
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCrypto({
              btc: {
                price: data.bitcoin?.usd,
                change: data.bitcoin?.usd_24h_change?.toFixed(2),
                url: "https://www.coingecko.com/en/coins/bitcoin",
              },
              eth: {
                price: data.ethereum?.usd,
                change: data.ethereum?.usd_24h_change?.toFixed(2),
                url: "https://www.coingecko.com/en/coins/ethereum",
              },
              sol: {
                price: data.solana?.usd,
                change: data.solana?.usd_24h_change?.toFixed(2),
                url: "https://www.coingecko.com/en/coins/solana",
              },
              loading: false,
            });
            return;
          }
        }
      } catch {
        // Fallback to Binance ticker if CoinGecko rate-limits
        try {
          const [bRes, eRes, sRes] = await Promise.all([
            fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"),
            fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT"),
            fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT"),
          ]);
          const bData = await bRes.json();
          const eData = await eRes.json();
          const sData = await sRes.json();

          if (isMounted) {
            setCrypto({
              btc: {
                price: parseFloat(bData.lastPrice),
                change: parseFloat(bData.priceChangePercent).toFixed(2),
                url: "https://www.coingecko.com/en/coins/bitcoin",
              },
              eth: {
                price: parseFloat(eData.lastPrice),
                change: parseFloat(eData.priceChangePercent).toFixed(2),
                url: "https://www.coingecko.com/en/coins/ethereum",
              },
              sol: {
                price: parseFloat(sData.lastPrice),
                change: parseFloat(sData.priceChangePercent).toFixed(2),
                url: "https://www.coingecko.com/en/coins/solana",
              },
              loading: false,
            });
            return;
          }
        } catch {
          // Soft fallback
        }
      }

      if (isMounted) {
        setCrypto({
          btc: { price: 68420, change: "+3.2", url: "https://www.coingecko.com/en/coins/bitcoin" },
          eth: { price: 2715, change: "+1.8", url: "https://www.coingecko.com/en/coins/ethereum" },
          sol: { price: 174, change: "+5.4", url: "https://www.coingecko.com/en/coins/solana" },
          loading: false,
        });
      }
    };

    fetchCrypto();
    const interval = setInterval(fetchCrypto, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 3. Fetch Real Trending Sparks (Live GitHub Repositories)
  useEffect(() => {
    let isMounted = true;

    const fetchSparks = async () => {
      try {
        setLoadingSparks(true);
        const res = await fetch(
          "https://api.github.com/search/repositories?q=stars:>15000+topic:ai&sort=stars&order=desc&per_page=4"
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.items && data.items.length > 0) {
            setTrendingSparks(
              data.items.map((repo) => ({
                tag: `#${repo.name}`,
                description: repo.description || "Trending open-source intelligence project",
                posts: `${(repo.stargazers_count / 1000).toFixed(1)}k stars`,
                url: repo.html_url,
                hot: repo.stargazers_count > 30000,
              }))
            );
            setLoadingSparks(false);
            return;
          }
        }
      } catch {
        // Fallback trending topics
      }

      if (isMounted) {
        setTrendingSparks([
          { tag: "#SpatialComputing", posts: "14.2k stories", url: "https://github.com/topics/threejs", hot: true },
          { tag: "#ThreeJS_WebGPU", posts: "9.8k stories", url: "https://github.com/mrdoob/three.js", hot: true },
          { tag: "#React19Transitions", posts: "7.1k stories", url: "https://github.com/facebook/react", hot: false },
          { tag: "#CyberAesthetics", posts: "5.4k stories", url: "https://github.com/topics/glsl", hot: false },
        ]);
        setLoadingSparks(false);
      }
    };

    fetchSparks();
  }, []);

  // 4. Interactive Native Share Action with Clipboard Fallback
  const handleShareApp = async () => {
    const shareUrl = window.location.origin;
    const shareData = {
      title: "SynthScroll — 3D Spatial Digital Publishing",
      text: "Experience immersive 3D articles and real-time digital journalism on SynthScroll!",
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast("✨ Shared successfully via native device portal!");
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    // Fallback: Clipboard copy
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("🔗 SynthScroll portal URL copied to clipboard!");
    } catch {
      showToast("Portal URL: " + shareUrl);
    }
  };

  const getWeatherIcon = (code) => {
    if (code === null || code === undefined) return "☀️";
    if (code === 0) return "☀️";
    if (code >= 1 && code <= 3) return "⛅";
    if (code >= 45 && code <= 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    if (code >= 80 && code <= 82) return "🌦️";
    if (code >= 95) return "⛈️";
    return "🌤️";
  };

  return (
    <aside className="space-y-5 select-none relative">
      {/* ── Toast Notification Pill ──────────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-indigo-600/90 border border-indigo-400/40 text-white text-xs font-medium shadow-2xl backdrop-blur-xl flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Widget 1: Live Spatial Weather & World Clock ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="p-5 rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Atmosphere
          </span>
          <span className="font-mono text-slate-400 font-medium">{time}</span>
        </div>

        {weather.loading ? (
          <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="w-4 h-4 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span>Connecting to satellites...</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-extrabold font-display text-white">
                {weather.temp !== null ? `${weather.temp}°C` : "22°C"}
              </div>
              <div className="text-xs text-slate-300 font-medium mt-0.5 truncate max-w-[140px]">
                📍 {weather.city}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                {weather.country || "Earth Coordinates"}
              </div>
            </div>
            <div className="text-4xl filter drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              {getWeatherIcon(weather.weatherCode)}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Widget 2: Live Market Telemetry (Interactive CoinGecko Charts) ─ */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="p-5 rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 text-xs">
          <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Market Telemetry
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
            Live Charts ↗
          </span>
        </div>

        {crypto.loading ? (
          <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="w-4 h-4 border border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span>Fetching live prices...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Bitcoin */}
            <a
              href={crypto.btc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-400/40 hover:bg-white/[0.08] transition-all group block"
              title="Click to view Bitcoin chart on CoinGecko"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                  ₿
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    BTC
                  </div>
                  <div className="text-[10px] text-slate-400">Bitcoin</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white">
                  ${crypto.btc.price ? crypto.btc.price.toLocaleString() : "---"}
                </div>
                <div
                  className={`text-[10px] font-semibold ${
                    String(crypto.btc.change).startsWith("-") ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {String(crypto.btc.change).startsWith("-") ? "" : "+"}
                  {crypto.btc.change}%
                </div>
              </div>
            </a>

            {/* Ethereum */}
            <a
              href={crypto.eth.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-400/40 hover:bg-white/[0.08] transition-all group block"
              title="Click to view Ethereum chart on CoinGecko"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                  Ξ
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    ETH
                  </div>
                  <div className="text-[10px] text-slate-400">Ethereum</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white">
                  ${crypto.eth.price ? crypto.eth.price.toLocaleString() : "---"}
                </div>
                <div
                  className={`text-[10px] font-semibold ${
                    String(crypto.eth.change).startsWith("-") ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {String(crypto.eth.change).startsWith("-") ? "" : "+"}
                  {crypto.eth.change}%
                </div>
              </div>
            </a>

            {/* Solana */}
            <a
              href={crypto.sol.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-400/40 hover:bg-white/[0.08] transition-all group block"
              title="Click to view Solana chart on CoinGecko"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                  ◎
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    SOL
                  </div>
                  <div className="text-[10px] text-slate-400">Solana</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white">
                  ${crypto.sol.price ? crypto.sol.price.toLocaleString() : "---"}
                </div>
                <div
                  className={`text-[10px] font-semibold ${
                    String(crypto.sol.change).startsWith("-") ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {String(crypto.sol.change).startsWith("-") ? "" : "+"}
                  {crypto.sol.change}%
                </div>
              </div>
            </a>
          </div>
        )}
      </motion.div>

      {/* ── Widget 3: Live Trending Sparks (Real Open Source & Tech Topics) ─ */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="p-5 rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
            🔥 Trending Sparks
          </span>
          <span className="text-[10px] text-slate-400">Open Source ↗</span>
        </div>

        {loadingSparks ? (
          <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="w-4 h-4 border border-pink-400 border-t-transparent rounded-full animate-spin" />
            <span>Scanning repositories...</span>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs">
            {trendingSparks.map((item) => (
              <a
                key={item.tag}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group block"
                title={`Open ${item.tag} on external site`}
              >
                <div>
                  <div className="font-semibold text-white group-hover:text-pink-300 transition-colors flex items-center gap-1.5">
                    {item.tag}
                    {item.hot && (
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">{item.posts}</div>
                </div>
                <span className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform text-xs">
                  ↗
                </span>
              </a>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Widget 4: Quick Share Portal ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="p-4 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-400/20 backdrop-blur-xl flex items-center justify-between shadow-lg"
      >
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>🌐</span>
            <span>Share SynthScroll</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Broadcast 3D publications
          </div>
        </div>
        <button
          onClick={handleShareApp}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold hover:border-indigo-400/40 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
          title="Share platform link"
        >
          <span>Share</span>
          <span>↗</span>
        </button>
      </motion.div>
    </aside>
  );
};

export default LiveWidgets;
