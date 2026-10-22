// Advanced Multi-Source API Seeder & Deduplicator for SynthScroll
// Aggregates Global Aerospace News, Reddit Trending, and iTunes Cultural Music feeds with strict deduplication

import { sendData } from "../firebase/methods";

// Curated high-resolution Unsplash fallback images by category
const CATEGORY_FALLBACK_IMAGES = {
  Technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  Space: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  Music: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
  Culture: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1200&q=80",
  AI: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
  General: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
};

/**
 * Strict Data Deduplication Engine:
 * Strips out any duplicate articles based on normalized title, sourceUrl, or documentId.
 */
export const deduplicateArticles = (articles = []) => {
  if (!Array.isArray(articles)) return [];

  const seenTitles = new Set();
  const seenUrls = new Set();
  const seenIds = new Set();

  return articles.filter((article) => {
    if (!article) return false;

    // Check ID
    const docId = article.documentId || article.id;
    if (docId && seenIds.has(docId)) {
      return false;
    }

    // Clean & normalize title (lowercase, alphanumeric only)
    const rawTitle = (article.title || "").trim().toLowerCase();
    const cleanTitle = rawTitle.replace(/[^a-z0-9]/g, "");

    if (cleanTitle) {
      if (seenTitles.has(cleanTitle)) {
        return false;
      }
    }

    // Clean & normalize source URL
    const rawUrl = (article.sourceUrl || article.url || "").trim().toLowerCase();
    if (rawUrl && rawUrl !== "about:blank") {
      if (seenUrls.has(rawUrl)) {
        return false;
      }
    }

    // Mark as seen
    if (cleanTitle) seenTitles.add(cleanTitle);
    if (rawUrl && rawUrl !== "about:blank") seenUrls.add(rawUrl);
    if (docId) seenIds.add(docId);

    return true;
  });
};

/**
 * Normalizes any external data item into a clean SynthScroll BlogCard object
 */
export const normalizeToBlogCard = ({
  id,
  title,
  content,
  category = "General",
  imageUrl = "",
  authorName = "SynthScroll Wire",
  authorEmail = "wire@synthscroll.dev",
  sourceUrl = "",
  sourceName = "External Feed",
}) => {
  const fallbackImg = CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.General;
  const validImageUrl = imageUrl && imageUrl.startsWith("http") ? imageUrl : fallbackImg;
  const cleanTitle = (title || "Untitled Article").trim();
  const titleSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 24);

  // Generate deterministic ID so duplicates are recognized instantly
  const stableId = id ? `api_${id}` : `art_${titleSlug || Math.random().toString(36).substring(2, 7)}`;

  return {
    documentId: stableId,
    title: cleanTitle,
    content: (content || "Read the complete spatial publication in full digital depth.").trim(),
    category,
    imageUrl: validImageUrl,
    authorName,
    authorEmail,
    uid: "system_seeder",
    likes: Math.floor(Math.random() * 65) + 12,
    likedBy: [],
    sourceUrl: sourceUrl || "",
    sourceName,
    isExternal: true,
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
    createdAtClient: new Date().toISOString(),
  };
};

/**
 * Fetches Spaceflight / Global Aerospace News with pagination
 */
const fetchGlobalNews = async (page = 1, limit = 4) => {
  try {
    const offset = Math.max(0, (page - 1) * limit);
    const res = await fetch(
      `https://api.spaceflightnewsapi.net/v4/articles/?limit=${limit}&offset=${offset}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((item) =>
      normalizeToBlogCard({
        id: item.id,
        title: item.title,
        content: `${item.summary || ""}\n\nSource: Published on ${item.news_site || "Space News Wire"}.`,
        category: "Technology",
        imageUrl: item.image_url,
        authorName: item.news_site || "Orbital News Desk",
        authorEmail: "orbit@synthscroll.dev",
        sourceUrl: item.url,
        sourceName: item.news_site ? `Source: ${item.news_site}` : "Data from Spaceflight News",
      })
    );
  } catch (err) {
    console.warn("Global News fetch notice:", err?.message || err);
    return [];
  }
};

/**
 * Fetches Social & Regional Discussions from Reddit API with page-based subreddits
 */
const fetchRedditDiscussions = async (page = 1) => {
  const subredditSets = [
    ["technology", "pakistan"],
    ["webdev", "space"],
    ["artificial", "gadgets"],
    ["programming", "futurology"],
  ];
  const subreddits = subredditSets[(page - 1) % subredditSets.length] || subredditSets[0];
  const results = [];

  for (const sub of subreddits) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=3`);
      if (res.ok) {
        const json = await res.json();
        const posts = json?.data?.children || [];

        for (const p of posts) {
          const postData = p.data;
          // Filter out stickied announcements
          if (postData.stickied) continue;

          // Attempt preview image or thumbnail
          let img = "";
          if (postData.preview?.images?.[0]?.source?.url) {
            img = postData.preview.images[0].source.url.replace(/&amp;/g, "&");
          } else if (postData.thumbnail && postData.thumbnail.startsWith("http")) {
            img = postData.thumbnail;
          }

          results.push(
            normalizeToBlogCard({
              id: postData.id,
              title: postData.title,
              content:
                postData.selftext ||
                `Community conversation trending on r/${sub} with ${postData.num_comments} active commentaries.`,
              category: sub === "pakistan" ? "Design" : "AI",
              imageUrl: img,
              authorName: `u/${postData.author || "creator"}`,
              authorEmail: `${postData.author || "user"}@synthscroll.dev`,
              sourceUrl: `https://reddit.com${postData.permalink}`,
              sourceName: `Data from Reddit (r/${sub})`,
            })
          );
        }
      }
    } catch (err) {
      console.warn(`Reddit /r/${sub} fetch notice:`, err?.message || err);
    }
  }

  return results;
};

/**
 * Fetches Regional Music & Sound Culture from iTunes Search API with page-based queries
 * Pulled for Indian, Pakistani, Coke Studio, Desi Hip Hop, and Global Lofi
 */
const fetchMusicCulture = async (page = 1) => {
  const querySets = [
    ["coke+studio+pakistan", "bollywood+top+hits"],
    ["desi+hip+hop+urdu+rap", "pakistani+indie+acoustic"],
    ["talhah+anjum+aleemrk", "arijit+singh+bollywood"],
    ["global+lofi+chill+beats", "eastern+classical+fusion"],
  ];
  const queries = querySets[(page - 1) % querySets.length] || querySets[0];
  const results = [];

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=15`
      );
      if (res.ok) {
        const json = await res.json();
        const tracks = json.results || [];

        for (const t of tracks) {
          const highResArt = (t.artworkUrl100 || "").replace("100x100bb", "600x600bb");
          results.push(
            normalizeToBlogCard({
              id: t.trackId,
              title: `${t.trackName} — ${t.artistName}`,
              content: `Featured acoustic sonic track from the album "${t.collectionName}". Released in ${
                t.releaseDate ? new Date(t.releaseDate).getFullYear() : "recent years"
              } under ${t.primaryGenreName || "Regional Sound"}. Enjoy spatial immersion with rhythm frequencies.`,
              category: "Music",
              imageUrl: highResArt,
              authorName: t.artistName || "Sonic Collective",
              authorEmail: "audio@synthscroll.dev",
              sourceUrl: t.trackViewUrl,
              sourceName: "Source: iTunes Music",
            })
          );
        }
      }
    } catch (err) {
      console.warn("iTunes Music fetch notice:", err?.message || err);
    }
  }

  return results;
};

export const TASTE_QUERIES = {
  "For You": [
    "coke studio pakistan",
    "bollywood top hits",
    "desi hip hop",
    "pakistani indie",
    "arijit singh",
    "talhah anjum",
    "aleemrk",
  ],
  "Bollywood": [
    "bollywood top hits",
    "arijit singh",
    "shreya ghoshal",
    "bollywood romantic hits",
    "hindi pop hits",
    "pritam hits",
  ],
  "Pakistani": [
    "pakistani coke studio",
    "atif aslam",
    "ali sethi pasoori",
    "nusrat fateh ali khan",
    "pakistani pop",
    "kaifi khalil",
    "young stunners urdu",
  ],
  "Hip Hop": [
    "desi hip hop",
    "talhah anjum",
    "aleemrk",
    "young stunners",
    "sidhu moose wala",
    "krsna rap",
    "ap dhillon",
  ],
  "Lo-Fi": [
    "global lofi chill",
    "lofi chill beats",
    "bollywood lofi",
    "pakistani lofi",
    "ambient lofi beats",
  ],
  // Explicit category names requested
  "Bollywood Top Hits": [
    "bollywood top hits",
    "arijit singh",
    "shreya ghoshal",
    "hindi chartbusters",
  ],
  "Pakistani Coke Studio": [
    "pakistani coke studio",
    "coke studio season",
    "ali sethi",
    "kaifi khalil",
    "atif aslam",
  ],
  "Desi Hip Hop": [
    "desi hip hop",
    "talhah anjum",
    "aleemrk",
    "young stunners",
    "krsna",
    "sidhu moose wala",
  ],
  "Global Lo-Fi": [
    "global lofi chill",
    "lofi chill beats",
    "bollywood lofi",
    "pakistani lofi",
  ],
};

/**
 * Dynamic Taste & Regional Music Fetcher:
 * Supports Indian, Pakistani, Desi Hip Hop, Bollywood, Coke Studio, and custom search queries
 */
export const fetchMusicByTaste = async (genre = "For You", limit = 20) => {
  let query = "";

  const cleanGenre = (genre || "").trim();
  const matchedKey = Object.keys(TASTE_QUERIES).find(
    (k) => k.toLowerCase() === cleanGenre.toLowerCase()
  );

  if (matchedKey) {
    const queryList = TASTE_QUERIES[matchedKey];
    query = queryList[Math.floor(Math.random() * queryList.length)];
  } else if (cleanGenre.length > 0) {
    query = cleanGenre;
  } else {
    query = "coke studio pakistan";
  }

  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encoded}&media=music&entity=song&limit=${limit}`
    );
    if (!res.ok) return [];
    const json = await res.json();
    const tracks = json.results || [];

    const seenUrls = new Set();
    return tracks
      .filter((t) => {
        if (!t.previewUrl || !t.previewUrl.startsWith("http")) return false;
        if (seenUrls.has(t.previewUrl)) return false;
        seenUrls.add(t.previewUrl);
        return true;
      })
      .map((t) => {
        const highResArt = (t.artworkUrl100 || "").replace("100x100bb", "400x400bb");
        return {
          id: String(t.trackId),
          title: t.trackName || "Regional Track",
          artist: t.artistName || "Sonic Collective",
          album: t.collectionName || "SynthScroll Music Mesh",
          url: t.previewUrl,
          artwork:
            highResArt ||
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
          genre: t.primaryGenreName || genre || "Regional Pop",
        };
      });
  } catch (err) {
    console.warn(`iTunes Music taste fetch notice for "${genre}":`, err?.message || err);
    return [];
  }
};

/**
 * Backward compatibility wrapper for fetchMusicTracks
 */
export const fetchMusicTracks = async (limit = 20) => {
  return await fetchMusicByTaste("For You", limit);
};

/**
 * Advanced Multi-API Aggregator using Promise.allSettled
 * Fetches all feeds concurrently without single-point failure, deduplicates output
 */
export const fetchMultiSourceFeed = async (page = 1, limit = 6) => {
  const settled = await Promise.allSettled([
    fetchGlobalNews(page, Math.ceil(limit / 2)),
    fetchRedditDiscussions(page),
    fetchMusicCulture(page),
  ]);

  const allArticles = [];

  settled.forEach((res) => {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      allArticles.push(...res.value);
    }
  });

  // Shuffle to create an eclectic mix, then apply strict deduplication
  const shuffled = allArticles.sort(() => Math.random() - 0.5);
  return deduplicateArticles(shuffled);
};

/**
 * Seeds and writes unique aggregated articles directly into Firestore & Local Cache
 */
export const seedAdvancedFeed = async (count = 6) => {
  const articles = await fetchMultiSourceFeed(1, count);
  if (articles.length === 0) {
    throw new Error("Multi-source API fetch returned no results.");
  }

  const seeded = [];
  for (const article of articles) {
    try {
      const docId = await sendData(article, "blogs");
      seeded.push({ ...article, documentId: docId });
    } catch (err) {
      console.warn("Seeding item error:", err);
    }
  }

  return {
    count: seeded.length,
    articles: deduplicateArticles(seeded),
  };
};
