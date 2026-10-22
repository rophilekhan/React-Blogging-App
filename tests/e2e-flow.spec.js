import { test, expect } from "@playwright/test";

test.describe("Blogverse 3D Platform — Autonomous E2E Test Suite", () => {
  const timestamp = Date.now();
  const testUser = {
    name: `Autonomous Tester ${timestamp}`,
    email: `autonomous_qa_${timestamp}@blogverse.dev`,
    password: "Password123!@",
  };

  const testPost = {
    title: `Autonomous Test Story ${timestamp}`,
    content: `Verified automatically by Playwright on Chromium at ${new Date().toISOString()}. Testing Three.js rendering, WebGL context stability, and real-time Firestore synchronization.`,
  };

  test.beforeEach(async ({ page }) => {
    // Intercept native browser confirm dialogs (e.g. Delete Story confirmation)
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    page.on("console", (msg) => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    });

    page.on("requestfailed", (req) => {
      console.log(`[REQ FAILED]: ${req.url()} (${req.failure()?.errorText})`);
    });

    // Monitor for fatal WebGL context failures or unhandled runtime crashes
    page.on("pageerror", (err) => {
      console.error("[Runtime Page Error]:", err.message);
    });
  });

  test("Comprehensive E2E User Journey (Auth, WebGL, CRUD, & Easter Egg)", async ({ page }) => {
    // ── 1. AUTHENTICATION FLOW: Register, Logout, and Log Back In ─────────────
    console.log("Step 1: Testing Registration Flow...");
    await page.goto("/register");
    await expect(page).toHaveURL(/.*register/);

    // Fill registration form
    await page.fill('input[placeholder="Ada Lovelace"]', testUser.name);
    await page.fill('input[placeholder="ada@blogverse.dev"]', testUser.email);
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(testUser.password);
    await passwordInputs.nth(1).fill(testUser.password);

    // Submit registration
    await page.locator('button[type="submit"]').click();

    // Verify successful registration redirects to /dashboard
    await expect(page).toHaveURL(/.*(dashboard|landing)/, { timeout: 15000 });
    await expect(page.getByText(testUser.email)).toBeVisible({ timeout: 10000 });

    // Log Out
    console.log("Step 1b: Testing Sign Out...");
    const signOutBtn = page.getByRole("button", { name: "Sign Out" });
    await signOutBtn.click();
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });

    // Log Back In
    console.log("Step 1c: Testing Re-Authentication at /login...");
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*(dashboard|landing)/, { timeout: 15000 });

    // ── 2. DASHBOARD NAVIGATION & WEBGL CONTEXT STABILITY ─────────────────────
    console.log("Step 2: Navigating to Dashboard and Verifying 3D WebGL Context...");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*dashboard/);

    // Wait for the spatial dashboard layout to mount
    await expect(page.getByText("Spatial Workspace")).toBeVisible({ timeout: 15000 });

    // Assert that the 3D Canvas element is present and active
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 15000 });
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox?.width).toBeGreaterThan(0);
    expect(canvasBox?.height).toBeGreaterThan(0);

    // ── 3. CORE CRUD OPERATIONS: Create, IndexedDB Auto-Save, Like, and Delete ─
    console.log("Step 3: Testing Post Creation and Auto-Recovery...");
    const writeStoryBtn = page.getByRole("button", { name: /Write Story/i }).first();
    await writeStoryBtn.click();

    // Verify PostModal opens
    await expect(page.getByText("Create New Story")).toBeVisible();

    // Type Title and Content
    await page.fill('input[placeholder="The Architecture of Spatial Interfaces..."]', testPost.title);
    await page.fill('textarea[placeholder="Write your article in full markdown or plain text..."]', testPost.content);

    // Check debounced auto-save pill appears (Zustand + idb-keyval)
    await page.waitForTimeout(1200);
    const draftIndicator = page.locator("text=Draft saved locally");
    await expect(draftIndicator).toBeVisible({ timeout: 5000 });

    // Publish Story
    console.log("Step 3b: Publishing Story to Cloud...");
    const publishBtn = page.getByRole("button", { name: /Publish Story/i });
    await publishBtn.click();

    // Modal closes upon successful publish
    await expect(page.getByText("Create New Story")).not.toBeVisible({ timeout: 15000 });

    // Verify story appears in the feed grid
    const publishedPost = page.getByText(testPost.title);
    await expect(publishedPost).toBeVisible({ timeout: 12000 });

    // Test Like Interaction
    console.log("Step 3c: Testing Like Reaction...");
    const postCard = page.locator("article").filter({ hasText: testPost.title });
    const likeBtn = postCard.locator("button").filter({ hasText: /[0-9]+/ });
    await likeBtn.click();
    await page.waitForTimeout(1000);
    await expect(postCard.getByText("❤️")).toBeVisible();

    // Test Delete Action
    console.log("Step 3d: Testing Author Delete Action...");
    const deleteBtn = postCard.locator('button[title="Delete your post"]');
    await deleteBtn.click();
    await expect(page.getByText(testPost.title)).not.toBeVisible({ timeout: 10000 });

    // ── 4. EASTER EGG ARTIFACT & WARP TRANSITION TO AGENCY PORTAL ──────────────
    console.log("Step 4: Testing Quantum Tesseract Warp Navigation...");
    const artifactWidget = page.locator('div[title="Unknown Spatial Anomaly"]');
    await expect(artifactWidget).toBeVisible({ timeout: 10000 });

    // Click artifact to initiate 1.5s warp transition
    await artifactWidget.click();

    // Confirm transition to /codesphinx-portal
    await expect(page).toHaveURL(/.*codesphinx-portal/, { timeout: 10000 });

    // Assert Agency Brand, Executive Leadership, and Social Links
    await expect(page.getByText("CODESPHINX", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Rophile Ahmed Khan")).toBeVisible();
    await expect(page.getByText("Founder & Chief Executive Officer")).toBeVisible();
    await expect(page.getByText("codesphinx.netlify.app")).toBeVisible();

    console.log("All E2E Test Steps Successfully Passed!");
  });
});
