// Advanced Multi-Source API Seeder for SynthScroll
// Aggregates Global News, Reddit Social Trending, and iTunes Cultural Music feeds into BlogCard schema

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
}) => {
  const fallbackImg = CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.General;
  const validImageUrl = imageUrl && imageUrl.startsWith("http") ? imageUrl : fallbackImg;

  return {
    documentId: `seed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: (title || "Untitled Article").trim(),
    content: (content || "Read the complete spatial publication in full digital depth.").trim(),
    category,
    imageUrl: validImageUrl,
    authorName,
    authorEmail,
    uid: "system_seeder",
    likes: Math.floor(Math.random() * 65) + 12,
    likedBy: [],
    sourceUrl: sourceUrl || "",
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
    createdAtClient: new Date().toISOString(),
  };
};

/**
 * Fetches Spaceflight / Global Aerospace News
 */
const fetchGlobalNews = async () => {
  try {
    const res = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=4");
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
      })
    );
  } catch (err) {
    console.warn("Global News fetch notice:", err?.message || err);
    return [];
  }
};

/**
 * Fetches Social & Regional Discussions from Reddit API
 */
const fetchRedditDiscussions = async () => {
  const subreddits = ["technology", "pakistan"];
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
 * Fetches Regional Music & Sound Culture from iTunes Search API
 */
const fetchMusicCulture = async () => {
  const queries = ["coke+studio+pakistan", "desi+hip+hop+urdu+rap"];
  const results = [];

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=3`
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
              } under ${t.primaryGenreName || "Contemporary Sound"}. Enjoy spatial immersion with rhythm frequencies.`,
              category: "Music",
              imageUrl: highResArt,
              authorName: t.artistName || "Sonic Collective",
              authorEmail: "audio@synthscroll.dev",
              sourceUrl: t.trackViewUrl,
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

/**
 * Advanced Multi-API Aggregator using Promise.allSettled
 * Fetches all feeds concurrently without single-point failure
 */
export const fetchMultiSourceFeed = async () => {
  const settled = await Promise.allSettled([
    fetchGlobalNews(),
    fetchRedditDiscussions(),
    fetchMusicCulture(),
  ]);

  const allArticles = [];

  settled.forEach((res) => {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      allArticles.push(...res.value);
    }
  });

  // Shuffle to create an eclectic, vibrant feed
  return allArticles.sort(() => Math.random() - 0.5);
};

/**
 * Seeds and writes the aggregated articles directly into Firestore & Local Cache
 */
export const seedAdvancedFeed = async () => {
  const articles = await fetchMultiSourceFeed();
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
    articles: seeded,
  };
};
