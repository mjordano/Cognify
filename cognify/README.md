# Cognify — AI Flashcard Studio

AI-powered flashcard app built with **Next.js 14 App Router**. Paste any study material, choose how many cards to generate, and let GPT-4o-mini craft single/multiple-choice flashcards with explanations.

## Features

- 🔑 API key onboarding with `localStorage` persistence
- ✦ AI-generated flashcards (single & multiple choice) via GPT-4o-mini
- 📝 Full quiz mode with per-question scoring
- 📊 Results screen with score ring and wrong-answer review
- ◷ Session history (up to 20 sessions) with replay & delete
- ↓ Export history as `.json`
- ⚙ Settings modal to update or remove API key
- 🌑 Dark theme, purple accents, smooth animations

---

## Local Development

### Prerequisites

- Node.js 18+ (https://nodejs.org)
- An OpenAI API key (https://platform.openai.com/api-keys)

### Steps

```bash
# 1. Clone or download this project
git clone <your-repo-url>
cd cognify

# 2. Install dependencies
npm install

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

On first visit, you'll be prompted to enter your OpenAI API key. It's stored only in your browser's `localStorage` — never sent to any backend.

### Build for production (local test)

```bash
npm run build
npm start
```

---

## Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
# Install Vercel CLI globally
npm install -g vercel

# From the project root:
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Framework: Next.js (auto-detected)
# - No environment variables needed (API key lives in the browser)

# Deploy to production:
vercel --prod
```

### Option B — Vercel Dashboard (GUI)

1. Push this project to a GitHub / GitLab / Bitbucket repository.
2. Go to [https://vercel.com/new](https://vercel.com/new).
3. Import your repository.
4. Vercel auto-detects Next.js. Leave all settings as defaults.
5. Click **Deploy**.

> **Note:** No environment variables are required. OpenAI calls are made directly from the browser using the user's own API key.

---

## Project Structure

```
cognify/
├── app/
│   ├── layout.jsx          # Root layout + Google Fonts
│   ├── page.jsx            # Entry point → renders CognifyApp
│   └── globals.css         # All styles (CSS variables, animations)
├── components/
│   ├── CognifyApp.jsx      # Main client component — all state & logic
│   ├── screens/
│   │   ├── OnboardScreen.jsx   # First-run API key entry
│   │   ├── MainScreen.jsx      # New deck + History tabs
│   │   ├── LoadingScreen.jsx   # Spinner while AI generates
│   │   ├── QuizScreen.jsx      # Card-by-card quiz
│   │   └── ResultsScreen.jsx   # Score ring + wrong-answer review
│   └── ui/
│       └── SettingsModal.jsx   # API key management modal
├── next.config.js
├── vercel.json
├── package.json
└── README.md
```

---

## Architecture Notes

- **Client-only OpenAI calls** — `fetch()` goes directly from the browser to `https://api.openai.com`. No backend API routes exist, keeping the app fully static-deployable.
- **No environment variables** — the OpenAI key is entered by the user and stored in `localStorage` under `cognify_api_key`.
- **History** — stored in `localStorage` under `cognify_history` as a JSON array (max 20 entries, oldest auto-pruned).
- **`'use client'`** — `CognifyApp.jsx` is a Client Component due to `useState`, `useEffect`, and `localStorage` usage. The `app/page.jsx` is a Server Component that simply imports it.
