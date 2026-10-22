import { defineConfig } from "@playwright/test";

/**
 * Playwright Config — Phase 26 Cinematic Showcase (True HD 1080p Export)
 * 1920×1080 viewport with deviceScaleFactor: 2 for ultra-crisp Retina rendering.
 * Video recording ALWAYS ON at 1920×1080.
 *
 * Run with:
 *   npx playwright test tests/full-showcase.spec.js --config=playwright.config.showcase.js
 */
export default defineConfig({
  testDir:       "./tests",
  fullyParallel: false,
  workers:       1,
  // 180s (3 minutes) timeout to completely avoid timeout crashes
  timeout:       180000,
  expect:        { timeout: 15000 },
  reporter:      [["list"]],

  use: {
    baseURL: "http://localhost:5173",

    // True HD 1920×1080 viewport with 2x Retina pixel density
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,

    // Always-on video recording in crisp 1920×1080
    video: {
      mode: "on",
      size: { width: 1920, height: 1080 },
    },

    // Keep trace so you can inspect failed steps in Playwright UI
    trace:      "retain-on-failure",
    screenshot: "only-on-failure",

    // Hardware-accelerated WebGL + High-DPI Force Device Scale Factor
    launchOptions: {
      args: [
        "--enable-webgl",
        "--use-angle=default",
        "--ignore-gpu-blocklist",
        "--enable-gpu-rasterization",
        "--disable-web-security",
        "--force-device-scale-factor=2",
        "--high-dpi-support=1",
      ],
    },
  },

  projects: [
    {
      name: "showcase-chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
        video: {
          mode: "on",
          size: { width: 1920, height: 1080 },
        },
        launchOptions: {
          args: [
            "--enable-webgl",
            "--use-angle=default",
            "--ignore-gpu-blocklist",
            "--enable-gpu-rasterization",
            "--disable-web-security",
            "--force-device-scale-factor=2",
            "--high-dpi-support=1",
          ],
        },
      },
    },
  ],

  webServer: {
    command:             "npm run dev",
    url:                 "http://localhost:5173",
    // Re-use the already-running dev server — no extra process spawned
    reuseExistingServer: true,
    timeout:             120000,
  },
});
