# 🌌 SynthScroll — Next-Gen 3D Spatial Blogging Platform

[![React](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v10-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Testing-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

> **SynthScroll** is an immersive, high-impact spatial blogging platform that fuses modern WebGL 3D graphics, live multi-source global API aggregation, personalized regional audio streaming, and seamless Firebase authentication into a cohesive storytelling universe.

---

## ⚡ Core Features Showcase

### 🌐 1. Immersive 3D Spatial Computing UI
- **Three.js & React Three Fiber Engine:** Interactive kinetic grid floor, floating obsidian glass shards, orbiting sparkles, and floating orbs rendered in high performance 60+ FPS WebGL.
- **Parallax Tilt & Glassmorphism:** Subtle tilt physics via `react-parallax-tilt` and deep translucent blur cards (`backdrop-blur-2xl`) tailored for next-generation dark interfaces.
- **Dynamic Camera & Particle Drift:** Ambient light shifts and camera responsive particle fields that react to user scroll dynamics.

### 📡 2. Real-Time Multi-API Feed Seeding & Zero-Latency Caching
- **Automated Aggregator:** Fetches live external stories across global sources via `Promise.allSettled`:
  - **Spaceflight News & NASA:** Deep space science, astrophysics, and aerospace launches.
  - **Global & Tech Currents:** Trending technology updates and GNews syndication.
  - **Social Feeds:** Real-time Reddit community posts (`r/pakistan`, `r/technology`).
- **Strict Deduplication:** In-memory `Map` filtering strips out duplicate titles and canonical URLs before rendering.
- **YouTube-Style Shimmer Skeletons:** Animated pulsing skeletons keep the layout rock-solid and prevent layout shift during fetch cycles.

### 🎵 3. Personalized Regional Music Player
- **Floating 3D Audio Dock:** Global, persistent audio engine that stays playing across all page routes without reload or stutter.
- **Regional Taste Selector:** On-demand playlist fetching powered by the iTunes Search API:
  - 🇵🇰 **Pakistani:** Coke Studio, contemporary indie, and regional hits.
  - 🇮🇳 **Bollywood:** High-energy trending film score anthems.
  - 🎤 **Desi Hip Hop:** Underground & mainstream hip hop (e.g. Talhah Anjum, Aleemrk).
  - 🎧 **Global Lo-Fi:** Chill chillhop beats for reading and deep work.
- **Flyout Playlist & Audio Controls:** Track progress scrubbing, volume controls, skip next/previous, and regional filters.

### 🛡️ 4. Frictionless Guest Mode & True Homepage Routing
- **Public Feed Access:** The root `/` route welcomes guests immediately—no mandatory login wall to read articles or listen to music.
- **Contextual Auth Guards:** Unauthenticated visitors can freely browse and filter. Clicking *"Write Story"*, *"Like"*, or *"Save"* smoothly prompts user sign-in via high-converting glassmorphic modals.
- **Post-Login Redirection:** Automatically routes users straight back to the live dashboard.

### 🔖 5. Persistent Bookmarking & Creator Profiles
- **Universal Save Engine:** Bookmarks both custom Firestore user stories AND third-party external API articles with full payload preservation (title, cover, source, and author attribution).
- **Author Identity:** Profile page featuring avatar uploads, published story management, and a dedicated **Saved Stories** tab.

### 🏷️ 6. Dynamic Category Filtering & Custom Taxonomy
- **Interactive Pills:** Real-time client-side filtering across `All`, `Technology`, `AI & Robotics`, `Design`, `Culture`, and more.
- **Custom Category Expansion:** Authors can type custom tags during story publication with automatic real-time feed synchronization.

### ⚡ 7. CodeSphinx 3D Agency Portal
- Secret interactive easter egg and executive agency portal showcasing CodeSphinx's vision for spatial computing and high-impact digital experiences.

---

## 🛠️ Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/), [Vite 5](https://vitejs.dev/) |
| **3D & Spatial Graphics** | [Three.js](https://threejs.org/), [@react-three/fiber](https://r3f.docs.pmnd.rs/), [@react-three/drei](https://github.com/pmndrs/drei) |
| **Styling & Animations** | [Tailwind CSS 3.4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [react-parallax-tilt](https://github.com/mkosir/react-parallax-tilt) |
| **State & Storage** | [Zustand](https://zustand.docs.pmnd.rs/) (Audio & Player Store), [idb-keyval](https://github.com/jakearchibald/idb-keyval) |
| **Backend & BaaS** | [Firebase 10](https://firebase.google.com/) (Auth, Cloud Firestore, Storage, Security Rules) |
| **Icons & Typography** | [Lucide React](https://lucide.dev/), Inter & Space Grotesk |
| **E2E Automation & Video** | [Playwright](https://playwright.dev/) with High-DPI Video Capture & Synthetic Cursor Engine |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `v20.x` or `v24.x`
- **npm:** `v10.x` or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rophilekhan/React-Blogging-App.git
   cd React-Blogging-App
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id"
   ```

4. **Launch the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🎬 Cinematic Video Showcase (Playwright)

SynthScroll includes an autonomous, 60-second end-to-end showcase test that records a True HD (1080p @ 2x Retina scale) video demonstration.

### Key Capabilities of the Showcase Runner:
- **Synthetic Cursor Engine:** Injects an authentic desktop mouse pointer with smooth 15-step bezier cursor travel and expanding visual tap-ripple animations on click.
- **On-Screen Subtitle Bar:** Automatically injects glassmorphic subtitles into the DOM at each segment.
- **Automated Journey:** Covers Guest Mode ➔ Category Filtering ➔ Regional Music Playback ➔ Login ➔ Story Publishing ➔ Bookmarks ➔ Mobile Responsiveness ➔ CodeSphinx 3D Finale.

### Run the Showcase Automation:
```bash
# Make sure your dev server is active or let Playwright auto-reuse it
npx playwright test tests/full-showcase.spec.js --config=playwright.config.showcase.js
```

Recorded WebM video files are automatically generated in the `test-results/` directory:
```
test-results/
 └── full-showcase-SynthScroll-showcase-chromium/
      └── video.webm
```

---

## 📂 Project Architecture

```
React-Blogging-App/
├── public/                 # Static assets & favicon
├── tests/
│   ├── e2e-flow.spec.js    # Autonomous functional E2E tests
│   └── full-showcase.spec.js # Cinematic HD showcase automation
├── src/
│   ├── components/
│   │   ├── 3d/             # Three.js WebGL spatial components
│   │   │   ├── DynamicScene.jsx
│   │   │   ├── EasterEggArtifact.jsx
│   │   │   ├── FloatingOrbs.jsx
│   │   │   ├── MusicPlayer3D.jsx
│   │   │   ├── ParticleField.jsx
│   │   │   └── ScrollScene.jsx
│   │   ├── guards/         # Auth route guards (ProtectedRoute)
│   │   └── ui/             # Glassmorphic UI components
│   │       ├── BlogCard.jsx
│   │       ├── BlogCardSkeleton.jsx
│   │       ├── LiveWidgets.jsx
│   │       ├── Navbar.jsx
│   │       └── PostModal.jsx
│   ├── contexts/           # Global React Contexts (AuthContext)
│   ├── firebase/           # Firebase initialization & Firestore SDK wrappers
│   │   ├── config.js
│   │   └── methods.js
│   ├── pages/              # Primary route views
│   │   ├── AgencyPortal.jsx   # CodeSphinx 3D Agency Portal
│   │   ├── DashboardPage.jsx  # Main feed with spatial background
│   │   ├── LoginPage.jsx      # Glassmorphic 3D login
│   │   ├── ProfilePage.jsx    # User profile & saved stories
│   │   ├── ReadPage.jsx       # Spatial full-article reading view
│   │   └── RegisterPage.jsx   # Account creation
│   ├── services/
│   │   ├── aiService.js       # AI auto-summary & content generation
│   │   └── apiSeeder.js       # Reddit, NASA, and iTunes API aggregator
│   ├── store/
│   │   ├── audioStore.js      # Global persistent audio player state (Zustand)
│   │   └── draftStore.js      # Offline draft auto-saving store
│   ├── App.jsx             # Top-level routing & persistent audio mount
│   ├── index.css           # Global design system & Tailwind layers
│   └── main.jsx            # Application entry point
├── firestore.rules         # Cloud Firestore security rules
├── storage.rules           # Firebase Storage security rules
├── playwright.config.showcase.js # Dedicated 1080p video showcase config
└── package.json            # Dependencies & scripts
```

---

## 🔒 Security & Data Integrity

- **Firestore Rules:** Enforces authenticated ownership for blog creation, editing, and profile customization.
- **Public Read Access:** Configured to allow global guest reading of published stories while locking write operations.
- **XSS & Content Sanitization:** Markdown rendering sanitized for secure preview and read views.

---

## 👨‍💻 Author & Credits

**Architected & Developed by:**
**Rophile Ahmed Khan**
*Founder & CEO, CodeSphinx*

- **Website:** [CodeSphinx](https://codesphinx.org)
- **GitHub:** [@rophilekhan](https://github.com/rophilekhan)
- **Contact:** `contact.codesphinx@gmail.com`

---

<div align="center">
  <sub>Powered by <strong>CodeSphinx</strong> — Pioneering High-Impact Digital Experiences.</sub>
</div>
