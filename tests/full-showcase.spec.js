// ─────────────────────────────────────────────────────────────────────────────
// SynthScroll — Phase 27 Cinematic Showcase Test
// True HD 1080p Fast-Paced Showcase with Realistic Cursor, Click Animations & Codesphinx Finale
// Viewport: 1920×1080 (HD Retina) | Video: 'on' (see playwright.config.showcase.js)
//
// Run with:
//   npx playwright test tests/full-showcase.spec.js --config=playwright.config.showcase.js
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from "@playwright/test";

// ── Test Credentials ──────────────────────────────────────────────────────────
// Persistent showcase Firebase account so Profile & Saved Stories are populated.
const SHOWCASE_EMAIL = "contact.codesphinx@gmail.com";
const SHOWCASE_PASSWORD = "Silver433";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: showSubtitle(page, text, durationMs)
//   Injects a fixed glassmorphic subtitle bar at the bottom of the page DOM
//   and auto-hides it after durationMs milliseconds.
// ─────────────────────────────────────────────────────────────────────────────
async function showSubtitle(page, text, durationMs = 2800) {
  await page.evaluate(
    ({ text, durationMs }) => {
      const SUBTITLE_ID = "__synthscroll_subtitle__";
      let el = document.getElementById(SUBTITLE_ID);

      if (!el) {
        el = document.createElement("div");
        el.id = SUBTITLE_ID;
        Object.assign(el.style, {
          position: "fixed",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%) translateY(12px)",
          zIndex: "99999",
          maxWidth: "1050px",
          width: "90vw",
          padding: "14px 32px",
          borderRadius: "16px",
          background: "rgba(5, 7, 20, 0.88)",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
          border: "1px solid rgba(129, 140, 248, 0.35)",
          boxShadow:
            "0 10px 40px rgba(0,0,0,0.70), 0 0 0 1px rgba(255,255,255,0.05) inset",
          color: "#f1f5f9",
          fontSize: "18px",
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          fontWeight: "600",
          letterSpacing: "0.015em",
          lineHeight: "1.5",
          textAlign: "center",
          pointerEvents: "none",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          opacity: "0",
          userSelect: "none",
        });

        // Pulsing indigo dot accent
        const dot = document.createElement("span");
        Object.assign(dot.style, {
          display: "inline-block",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#818cf8",
          marginRight: "10px",
          verticalAlign: "middle",
          boxShadow: "0 0 10px #818cf8",
        });

        const textSpan = document.createElement("span");
        textSpan.id = "__synth_sub_text__";
        el.appendChild(dot);
        el.appendChild(textSpan);
        document.body.appendChild(el);
      }

      // Update text content
      const textSpan = document.getElementById("__synth_sub_text__");
      if (textSpan) textSpan.textContent = text;

      // Fade + slide in
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(12px)";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = "1";
          el.style.transform = "translateX(-50%) translateY(0)";
        });
      });

      // Schedule fade-out
      if (el.__hideTimer) clearTimeout(el.__hideTimer);
      el.__hideTimer = setTimeout(() => {
        el.style.opacity = "0";
        el.style.transform = "translateX(-50%) translateY(12px)";
      }, durationMs - 350);
    },
    { text, durationMs }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: injectFakeCursor(page)
//   Injects a high-quality base64 standard mouse pointer SVG with drop shadow
//   (z-index: 999999, pointer-events: none) bound to mousemove events,
//   featuring an expanding visual click/tap ripple circle at click coordinates.
// ─────────────────────────────────────────────────────────────────────────────
async function injectFakeCursor(page) {
  const cursorInit = () => {
    const CURSOR_ID = "__synth_fake_cursor__";
    const init = () => {
      if (document.getElementById(CURSOR_ID)) return;

      // Base64 SVG of standard desktop mouse pointer (black body, white outline)
      const POINTER_SVG_BASE64 =
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDI4IDI4IiBmaWxsPSJub25lIj48cGF0aCBkPSJNNCAyVjIyTDkuNSAxN0wxNC41IDI1TDE3LjUgMjMuNUwxMi41IDE1LjVIMjAuNUw0IDJaIiBmaWxsPSIjMDAwMDAwIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+";

      const cursor = document.createElement("div");
      cursor.id = CURSOR_ID;
      Object.assign(cursor.style, {
        position: "fixed",
        top: "0px",
        left: "0px",
        width: "28px",
        height: "28px",
        pointerEvents: "none",
        zIndex: "999999",
        transition: "transform 0.1s ease-out",
        filter:
          "drop-shadow(0 4px 8px rgba(0,0,0,0.85)) drop-shadow(0 1px 3px rgba(0,0,0,0.95)) drop-shadow(0 0 1px rgba(255,255,255,0.8))",
      });

      // Pointer SVG image
      const img = document.createElement("img");
      img.src = POINTER_SVG_BASE64;
      img.width = 26;
      img.height = 26;
      Object.assign(img.style, {
        display: "block",
        pointerEvents: "none",
        userSelect: "none",
      });
      cursor.appendChild(img);

      if (document.body) {
        document.body.appendChild(cursor);
      } else {
        document.addEventListener("DOMContentLoaded", () => {
          if (document.body && !document.getElementById(CURSOR_ID)) {
            document.body.appendChild(cursor);
          }
        });
      }

      // Track mouse movements with sub-pixel pointer tip alignment
      window.addEventListener(
        "mousemove",
        (e) => {
          cursor.style.left = `${e.clientX - 4}px`;
          cursor.style.top = `${e.clientY - 2}px`;
        },
        { passive: true }
      );

      // Visual Click/Tap Indicator: Expanding semi-transparent ripple circle
      window.addEventListener(
        "mousedown",
        (e) => {
          const ripple = document.createElement("div");
          ripple.className = "__synth_tap_ripple__";
          Object.assign(ripple.style, {
            position: "fixed",
            left: `${e.clientX}px`,
            top: `${e.clientY}px`,
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "rgba(129, 140, 248, 0.45)",
            border: "2px solid rgba(255, 255, 255, 0.95)",
            boxShadow:
              "0 0 16px rgba(129, 140, 248, 0.95), 0 0 6px rgba(236, 72, 153, 0.8)",
            pointerEvents: "none",
            zIndex: "999998",
            transform: "translate(-50%, -50%) scale(0.3)",
            transition:
              "transform 0.4s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.4s ease-out",
            opacity: "1",
          });
          document.body.appendChild(ripple);

          // Animate expansion
          requestAnimationFrame(() => {
            ripple.style.transform = "translate(-50%, -50%) scale(3.8)";
            ripple.style.opacity = "0";
          });

          // Clean up DOM after animation completes
          setTimeout(() => {
            if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
          }, 450);

          // Mechanical cursor press response
          cursor.style.transform = "scale(0.88)";
        },
        { passive: true }
      );

      window.addEventListener(
        "mouseup",
        () => {
          cursor.style.transform = "scale(1)";
        },
        { passive: true }
      );
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  };

  await page.addInitScript(cursorInit);
  await page.evaluate(cursorInit).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: moveAndClick(page, locator, options)
//   Enforces smooth cursor travel with page.mouse.move(x, y, { steps: 15 }),
//   strictly followed by element.hover({ force: true }) before clicking.
// ─────────────────────────────────────────────────────────────────────────────
async function moveAndClick(page, locator, options = {}) {
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
    const box = await locator.boundingBox();
    if (box) {
      const targetX = box.x + box.width / 2;
      const targetY = box.y + box.height / 2;
      // 1. Smooth cursor travel
      await page.mouse.move(targetX, targetY, { steps: options.steps || 15 });
      // 2. Enforced element hover
      await locator.hover({ force: true }).catch(() => {});
      await page.waitForTimeout(options.hoverDelay || 70);
      // 3. Trigger mousedown (spawns tap ripple) + mouseup
      await page.mouse.down();
      await page.waitForTimeout(50);
      await page.mouse.up();
      return;
    }
  } catch (err) {}
  await locator.hover({ force: true }).catch(() => {});
  await locator.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: moveAndHover(page, locator, steps)
// ─────────────────────────────────────────────────────────────────────────────
async function moveAndHover(page, locator, steps = 15) {
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
    const box = await locator.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
      await locator.hover({ force: true }).catch(() => {});
      await page.waitForTimeout(80);
      return;
    }
  } catch (err) {}
  await locator.hover({ force: true }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: smoothScroll(page, targetY, steps, delayPerStep)
//   Fast-paced, aggressive scrolling with default delay 10ms and 15 steps.
// ─────────────────────────────────────────────────────────────────────────────
async function smoothScroll(page, targetY, steps = 15, delayPerStep = 10) {
  const currentY = await page.evaluate(() => window.scrollY);
  const delta = (targetY - currentY) / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((dy) => window.scrollBy(0, dy), delta);
    await page.waitForTimeout(delayPerStep);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: humanType(page, locator, text, delayMs)
//   Fast typing at 30ms per character with visible cursor movement and enforced hover.
// ─────────────────────────────────────────────────────────────────────────────
async function humanType(page, locator, text, delayMs = 30) {
  await locator.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
  const box = await locator.boundingBox().catch(() => null);
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 }).catch(() => {});
  }
  await locator.hover({ force: true }).catch(() => {});
  await locator.click();
  await locator.type(text, { delay: delayMs });
}

// ─────────────────────────────────────────────────────────────────────────────
// THE CINEMATIC SHOWCASE TEST
// ─────────────────────────────────────────────────────────────────────────────
test.describe("SynthScroll — Phase 27: Realistic Cursor Interactions & Click Animations", () => {

  test.beforeEach(async ({ page }) => {
    // Auto-dismiss native dialogs
    page.on("dialog", (dialog) => dialog.accept());
    page.on("pageerror", (err) =>
      console.warn("[PAGE ERROR]:", err.message)
    );
    // Inject visible fake cursor tracking
    await injectFakeCursor(page);
  });

  test("Full User Journey with On-Screen Subtitles, Mobile Experience & Codesphinx Finale", async ({ page }) => {

    // ══════════════════════════════════════════════════════════════════════════
    // SEGMENT 1: Guest Mode & 3D Spatial UI
    // ══════════════════════════════════════════════════════════════════════════
    console.log("🎬 Segment 1: Guest Mode & 3D Spatial UI");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await injectFakeCursor(page);

    await showSubtitle(
      page,
      "Welcome to SynthScroll — A Next-Gen 3D Spatial Blogging Platform.",
      3000
    );

    // Confirm Hero banner is visible
    await page
      .getByText("Explore SynthScroll Universe", { exact: false })
      .first()
      .waitFor({ state: "visible", timeout: 15000 })
      .catch(() => {});

    // Brief pause for WebGL Canvas initial render
    await page.waitForTimeout(800);

    // Fast aggressive scroll to reveal feed below fold
    await smoothScroll(page, 480);
    await page.waitForTimeout(400);

    // Smoothly glide cursor to "Guest Mode" badge
    const guestBadge = page.getByText("Guest Mode").first();
    if (await guestBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
      await moveAndHover(page, guestBadge, 5);
    }
    await page.waitForTimeout(400);

    // Fast scroll further to show blog cards
    await smoothScroll(page, 950);
    await page.waitForTimeout(800);

    // ══════════════════════════════════════════════════════════════════════════
    // SEGMENT 2: Tags & Live Widgets
    // ══════════════════════════════════════════════════════════════════════════
    console.log("🎬 Segment 2: Category Filtering & Real-Time Global Feeds");

    // Fast scroll back to filter bar
    await smoothScroll(page, 400);

    await showSubtitle(
      page,
      "Dynamic category filtering & real-time global feeds from Reddit, NASA, and iTunes.",
      3200
    );

    await page.waitForTimeout(400);

    // Glide cursor and click "Technology" category pill
    const techPill = page.locator("button").filter({ hasText: /^Technology$/ }).first();
    if (await techPill.isVisible({ timeout: 6000 }).catch(() => false)) {
      await moveAndClick(page, techPill);
      console.log("  → Clicked Technology category filter");
    }
    await page.waitForTimeout(800);

    // Hover "AI & Robotics"
    const aiPill = page.locator("button").filter({ hasText: /AI/i }).first();
    if (await aiPill.isVisible({ timeout: 3000 }).catch(() => false)) {
      await moveAndHover(page, aiPill, 5);
      await page.waitForTimeout(400);
    }

    // Reset to "All"
    const allPill = page.locator("button").filter({ hasText: /^All$/ }).first();
    if (await allPill.isVisible({ timeout: 3000 }).catch(() => false)) {
      await moveAndClick(page, allPill);
    }

    // Scroll to reveal widget sidebar
    await smoothScroll(page, 800);
    await page.waitForTimeout(800);

    // ══════════════════════════════════════════════════════════════════════════
    // SEGMENT 3: Personalized Regional Music Player
    // ══════════════════════════════════════════════════════════════════════════
    console.log("🎬 Segment 3: Regional Music Player");

    // Fast scroll to top for dock visibility
    await smoothScroll(page, 0);
    await page.waitForTimeout(400);

    await showSubtitle(
      page,
      "Personalized Regional Music — Pakistani, Bollywood, Desi Hip Hop. Vibe while you explore.",
      3500
    );

    // Open playlist flyout
    const playlistTrigger = page.locator("[data-playlist-trigger='true']").first();
    await playlistTrigger.waitFor({ state: "visible", timeout: 10000 });
    await moveAndClick(page, playlistTrigger);
    console.log("  → Playlist flyout opened");
    await page.waitForTimeout(500);

    // Click 🇵🇰 Pakistani taste filter pill
    const pakistaniPill = page
      .getByRole("button", { name: /Pakistani/i })
      .first();
    if (await pakistaniPill.isVisible({ timeout: 4000 }).catch(() => false)) {
      await moveAndClick(page, pakistaniPill);
      console.log("  → Pakistani taste filter selected");
    } else {
      const hipHopPill = page.getByRole("button", { name: /Hip Hop/i }).first();
      if (await hipHopPill.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moveAndClick(page, hipHopPill);
      }
    }

    // Brief pause for tracks to load
    await page.waitForTimeout(1000);

    // Click play
    const playPauseBtn = page
      .locator("button[title*='Play Music'], button[title*='Pause Music']")
      .first();
    if (await playPauseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await moveAndClick(page, playPauseBtn);
      await page.waitForTimeout(500);
    }

    // Close playlist flyout
    const closePlaylistBtn = page
      .locator("button[aria-label='Close playlist']")
      .first();
    if (await closePlaylistBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await moveAndClick(page, closePlaylistBtn);
      console.log("  → Playlist flyout closed");
    }

    await page.waitForTimeout(800);

    // ══════════════════════════════════════════════════════════════════════════
    // SEGMENT 4: Auth Flow & Blog Post Creation
    // ══════════════════════════════════════════════════════════════════════════
    console.log("🎬 Segment 4: Seamless Auth & Content Creation");

    await showSubtitle(
      page,
      "Seamless Authentication & Spatial Content Creation — Publish your story in seconds.",
      3500
    );

    // Tap "Sign in to Publish" in Navbar
    const signInBtn = page
      .locator("button")
      .filter({ hasText: /Sign in to Publish/i })
      .first();

    if (await signInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await moveAndClick(page, signInBtn);
    } else {
      await page.goto("/login", { waitUntil: "domcontentloaded" });
    }

    await expect(page).toHaveURL(/.*login/, { timeout: 12000 });
    await injectFakeCursor(page);
    await page.waitForTimeout(500);

    // Fast credentials entry (30ms delay)
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.waitFor({ state: "visible", timeout: 8000 });
    await humanType(page, emailInput, SHOWCASE_EMAIL, 30);
    await page.waitForTimeout(200);
    await humanType(page, passwordInput, SHOWCASE_PASSWORD, 30);
    await page.waitForTimeout(250);

    // Submit login
    const submitBtn = page.locator('button[type="submit"]').first();
    await moveAndClick(page, submitBtn);

    // Wait for redirect to dashboard
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/dashboard", {
      timeout: 18000,
    }).catch(() => {});
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(800);
    await injectFakeCursor(page);
    console.log("  → Login successful — dashboard loaded");

    // Click "Write Story"
    const writeStoryBtn = page
      .getByText(/Write Story|Create Story/i)
      .first();
    await writeStoryBtn.waitFor({ state: "visible", timeout: 15000 });
    await moveAndClick(page, writeStoryBtn);

    // PostModal opens
    await expect(page.getByText("Create New Story")).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(400);

    // Fill title
    const titleInput = page.locator(
      'input[placeholder="The Architecture of Spatial Interfaces..."]'
    );
    await titleInput.waitFor({ state: "visible", timeout: 5000 });
    await humanType(page, titleInput, "SynthScroll: Future of 3D Spatial Blogging", 25);
    await page.waitForTimeout(200);

    // Select category
    const techCatModalBtn = page
      .locator("button")
      .filter({ hasText: /^Technology$/ })
      .nth(1);
    if (await techCatModalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await moveAndClick(page, techCatModalBtn);
    }
    await page.waitForTimeout(200);

    // Fill content
    const contentArea = page.locator(
      'textarea[placeholder="Write your article in full markdown or plain text..."]'
    );
    await contentArea.waitFor({ state: "visible", timeout: 5000 });
    const articleBody =
      "SynthScroll reimagines content creation by fusing Three.js WebGL rendering with real-time feeds and regional music.";
    await humanType(page, contentArea, articleBody, 20);

    // Wait for auto-save
    await page.waitForTimeout(800);
    const draftSaved = page.getByText("Draft saved locally");
    if (await draftSaved.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("  → Auto-save indicator confirmed");
    }

    // Publish story
    const publishBtn = page.getByRole("button", { name: /Publish Story/i }).first();
    await publishBtn.waitFor({ state: "visible", timeout: 6000 });
    await moveAndClick(page, publishBtn);

    await expect(page.getByText("Create New Story")).not.toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(800);
    console.log("  → Story published and modal closed");

    // ══════════════════════════════════════════════════════════════════════════
    // SEGMENT 5: Profile & Saved Stories
    // ══════════════════════════════════════════════════════════════════════════
    console.log("🎬 Segment 5: Profile & Saved Stories");

    await showSubtitle(
      page,
      "Custom Creator Profiles & Saved Stories — Your spatial identity in SynthScroll.",
      3000
    );

    // Fast scroll down to feed
    await smoothScroll(page, 700);
    await page.waitForTimeout(400);

    // Bookmark post
    const firstSaveBtn = page
      .locator('button[aria-label="Save Story"]')
      .first();

    if (await firstSaveBtn.isVisible({ timeout: 7000 }).catch(() => false)) {
      await moveAndHover(page, firstSaveBtn);
      await page.waitForTimeout(200);
      await moveAndClick(page, firstSaveBtn);
      await page.waitForTimeout(500);
      console.log("  → Story bookmarked (📑 → 🔖)");
    }

    // Navigate to profile
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await injectFakeCursor(page);
    await page.waitForTimeout(800);

    // Fast scroll to stats
    await smoothScroll(page, 380);
    await page.waitForTimeout(400);

    // Switch to Saved tab
    const savedTab = page
      .getByRole("button", { name: /Saved/i })
      .first();

    if (await savedTab.isVisible({ timeout: 6000 }).catch(() => false)) {
      await moveAndClick(page, savedTab);
      await page.waitForTimeout(800);
      console.log("  → Switched to Saved Stories tab");
    }

    // Fast scroll saved items
    await smoothScroll(page, 700);
    await page.waitForTimeout(800);

    // ══════════════════════════════════════════════════════════════════════════
    // SEGMENT 6: Mobile Experience Showcase
    // ══════════════════════════════════════════════════════════════════════════
    console.log("📱 Segment 6: Mobile Experience Showcase");

    // Dynamically set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await injectFakeCursor(page);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(800);

    await showSubtitle(
      page,
      "Flawless Mobile Native Experience.",
      3500
    );

    // Fast scroll mobile feed
    await smoothScroll(page, 380);
    await page.waitForTimeout(500);

    // Open mobile hamburger menu
    const hamburgerBtn = page
      .locator('button[aria-label="Open mobile navigation menu"]')
      .first();
    await hamburgerBtn.waitFor({ state: "visible", timeout: 8000 });
    await moveAndClick(page, hamburgerBtn);
    console.log("  → Mobile hamburger menu opened");
    await page.waitForTimeout(800);

    // Close mobile menu
    const closeMenuBtn = page
      .locator('button[aria-label="Close mobile navigation menu"]')
      .first();
    await closeMenuBtn.waitFor({ state: "visible", timeout: 8000 });
    await moveAndClick(page, closeMenuBtn);
    console.log("  → Mobile hamburger menu closed");
    await page.waitForTimeout(500);

    // Fast scroll mobile feed
    await smoothScroll(page, 200);
    await page.waitForTimeout(500);

    // Revert viewport back to 1920x1080 for Codesphinx Finale
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(800);

    // ══════════════════════════════════════════════════════════════════════════
    // SEGMENT 7: Codesphinx 3D Agency Portal Finale
    // ══════════════════════════════════════════════════════════════════════════
    console.log("🎬 Segment 7: Codesphinx 3D Agency Portal Finale");

    // Navigate to Codesphinx portal
    await page.goto("/agency", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded");
    await injectFakeCursor(page);
    await page.waitForTimeout(800);

    await showSubtitle(
      page,
      "Powered by CodeSphinx: Pioneering High-Impact Digital Experiences.",
      4000
    );

    // Confirm Codesphinx portal is rendered
    await page
      .getByText(/CodeSphinx/i)
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});

    // Fast smooth scroll through layout & 3D elements
    await smoothScroll(page, 550);

    // Hold for 4 seconds to capture 3D finale
    await page.waitForTimeout(4000);

    console.log("✅ Phase 26 True HD Cinematic Showcase completed.");
  });
});
