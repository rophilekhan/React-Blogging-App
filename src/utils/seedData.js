import { sendData } from "../firebase/methods";

/**
 * seedRealNewsData
 * Fetches real, live news articles from public open APIs,
 * pairs them with real generated author profiles,
 * and pushes them dynamically into Firestore.
 */
export const seedRealNewsData = async (limit = 4) => {
  try {
    let rawArticles = [];

    // 1. Fetch real articles from Spaceflight News API (Open CORS, live space/technology news)
    try {
      const newsRes = await fetch(
        `https://api.spaceflightnewsapi.net/v4/articles/?limit=${limit}`
      );
      if (newsRes.ok) {
        const data = await newsRes.json();
        if (data.results && data.results.length > 0) {
          rawArticles = data.results.map((item) => ({
            title: item.title,
            content:
              item.summary ||
              "Exploring the cutting edge of aerospace engineering, astronomical research, and interplanetary exploration.",
            imageUrl: item.image_url || "",
            category: "Technology",
            source: item.news_site || "Space News",
          }));
        }
      }
    } catch (e) {
      console.warn("Spaceflight News API fetch error, attempting fallback...", e);
    }

    // Secondary fallback: saurav.tech public Technology News API
    if (rawArticles.length === 0) {
      try {
        const fallbackRes = await fetch(
          "https://saurav.tech/NewsAPI/top-headlines/category/technology/us.json"
        );
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          if (fbData.articles && fbData.articles.length > 0) {
            rawArticles = fbData.articles.slice(0, limit).map((item) => ({
              title: item.title,
              content:
                item.description ||
                item.content ||
                "Latest technological breakthrough breaking records across global computing networks.",
              imageUrl: item.urlToImage || "",
              category: "Technology",
              source: item.source?.name || "Tech Wire",
            }));
          }
        }
      } catch (err) {
        console.warn("Fallback news API failed:", err);
      }
    }

    if (rawArticles.length === 0) {
      throw new Error("Unable to reach open news APIs. Check your network connection.");
    }

    // 2. Fetch real dynamic authors from RandomUser API
    let authors = [];
    try {
      const authorRes = await fetch(`https://randomuser.me/api/?results=${rawArticles.length}`);
      if (authorRes.ok) {
        const authorData = await authorRes.json();
        authors = authorData.results || [];
      }
    } catch (e) {
      console.warn("RandomUser API fetch error:", e);
    }

    // 3. Map real articles to Firestore blogs structure & insert
    const seededCount = [];

    for (let i = 0; i < rawArticles.length; i++) {
      const article = rawArticles[i];
      const author = authors[i] || {
        name: { first: "Nova", last: "Vanguard" },
        email: `contributor_${Date.now()}@blogverse.dev`,
        login: { uuid: `author_${Date.now()}_${i}` },
      };

      const blogDoc = {
        title: article.title,
        content: article.content,
        category: article.category || "Technology",
        imageUrl: article.imageUrl,
        uid: `live_${author.login?.uuid || Date.now()}_${i}`,
        authorEmail: author.email,
        authorName: `${author.name.first} ${author.name.last}`,
        likes: Math.floor(Math.random() * 50) + 5,
        likedBy: [],
        createdAtClient: new Date().toISOString(),
      };

      await sendData(blogDoc, "blogs");
      seededCount.push(blogDoc);
    }

    return {
      success: true,
      count: seededCount.length,
      articles: seededCount,
    };
  } catch (error) {
    console.error("Failed to seed real news data:", error);
    throw error;
  }
};
