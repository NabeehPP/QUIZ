# RAGGING? GAME OVER. 🎮

A live, Kahoot-style multiplayer anti-ragging quiz for college orientation — one projector screen, up to 7 phone-in teams, 15 questions, server-scored, real-time.

Built with **Next.js 14 (App Router) + Supabase (Postgres + Realtime) + Tailwind + Framer Motion**. No accounts, no passwords — teams just scan a QR code.

---

## 1. Set up Supabase (5 min)

1. Create a free project at https://supabase.com.
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**.
   This creates the `games`, `teams`, `questions`, `answers` tables, enables Row Level Security, and turns on Realtime for `games` and `teams`.
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (⚠️ secret — server-only)

## 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in the three values from step 1.

## 3. Run locally

```bash
npm install
npm run dev
```

- Landing page: http://localhost:3000
- Host/projector: http://localhost:3000/host
- Join on phone: http://localhost:3000/play

> On your phone, use your computer's LAN IP instead of `localhost` (e.g. `http://192.168.1.20:3000/play`), or just test against the deployed Vercel URL below — much easier on the day of the event.

## 4. Deploy to Vercel (recommended for the event)

1. Push this folder to a GitHub repo.
2. Import it into [Vercel](https://vercel.com/new).
3. Add the same three environment variables in **Project Settings → Environment Variables**.
4. Deploy. You'll get a URL like `https://your-quiz.vercel.app` — use that everywhere on the day.

---

## How it works

- **Landing (`/`)** — headline, awareness blurb, "JOIN GAME" and "I'm hosting" buttons.
- **Host (`/host` → `/host/[code]`)** — create a game, projector screen shows the QR code + game code, live team cards as they join (max 7), then drives the whole quiz: 15s animated countdown, four color-coded options, auto-reveals once every team has answered (or the timer runs out), shows the correct answer + explanation, and finishes with a dramatic podium + full leaderboard + confetti.
- **Team (`/play` → `/play/[code]`)** — enter a team name (no password), animated waiting screen, then big color-coded A/B/C/D buttons per question. Tapping locks the answer immediately ("🔒 Answer Locked!") — scores and rankings are never shown mid-game, only after the final question.
- **Scoring is 100% server-side** (`app/api/game/[code]/answer/route.ts`), using the Supabase **service role** key inside API routes only. Correct answers are never sent to the browser until the host reveals them, so there is no way to cheat by reading network requests. Each correct answer = 100 pts + up to 50 speed-bonus pts based on how quickly the team answered within the 15s window.

### Data model (kept intentionally simple)
- `games` — one row per session: code, phase (`lobby → question → reveal → leaderboard`), current question index.
- `teams` — up to 7 per game, auto-assigned a color.
- `questions` — the 15 anti-ragging questions (edit these anytime in `lib/questions.ts`, which is the real source of truth and is never bundled to the browser).
- `answers` — one row per team per question, with server-computed correctness and points.

### Reliability notes for event day
- Realtime updates use Supabase's `postgres_changes` subscriptions, with a 4-second polling fallback baked in — so if the venue Wi-Fi drops a websocket message, screens self-heal within a few seconds instead of freezing.
- The host auto-advances to the reveal step the moment all joined teams have answered, so slow phones can't stall the group; the 15s timer is the hard backstop either way.
- "Play Again" resets the same game code back to the lobby (clears teams/answers) so you can run back-to-back sessions with different batches without re-sharing a new QR code — or just hit **Create New Game** on `/host` for a fully fresh code.
- Do a full dry run (create a game, join with 2–3 phones, play all 15 questions) at least once before the event.

### Editing the questions
Open `lib/questions.ts`. Keep exactly 15 entries, each with exactly 4 `options`, a 0-indexed `correctIndex`, and a short `explanation`. No DB migration needed — just redeploy.

### Adjusting scoring / timing
Both live in `lib/questions.ts` (`TIME_LIMIT_SECONDS`) and `app/api/game/[code]/answer/route.ts` (`BASE_POINTS`, `MAX_SPEED_BONUS`).

### Sound effects
All sounds are synthesized at runtime with the Web Audio API (`lib/soundEngine.ts`) — no external audio files or dependencies. Sounds only start after a real user gesture (Create Game, Start Quiz, Join Team, tapping an answer), per browser autoplay rules.

- Button click, team-join chime, final-3-second countdown ticks, "time almost over" warning, correct/incorrect feedback, pre-reveal suspense sting, game-finished fanfare, and podium celebration.
- A 🔊/🔇 **Sound On/Off** toggle sits in the top-right of the host/projector screen only; turning it off silences everything immediately, including anything mid-playback. The preference is remembered per browser via `localStorage`.
- Team phones always have sound on by default (each device controls its own audio locally).
- Tune volumes/notes in `lib/soundEngine.ts` if you want them even more subtle for your venue.

### Visual effects
Small, purely cosmetic additions layered on top of the original design (no layout or component-structure changes):
- A pulsing alert ring around the countdown timer during the final 3 seconds.
- A soft green glow + pulse ring around the correct answer on reveal (host and team screens).
- A gentle shake on the team's own answer button when it was wrong.
- An animated color-shimmer sweep on the hero/leaderboard headlines (`text-shimmer` + `animate-shimmer` in `app/globals.css` / `tailwind.config.ts`).
- An animated "teams answered" progress bar on the host screen (in addition to the existing count).
- A soft glowing halo behind the 1st-place medal on the podium, and behind a team's own medal on their results screen.
- Subtle hover/tap scale feedback on primary buttons (Create Game, Start Quiz, Next Question, Play Again, Join Team, Continue).

All of this is additive CSS/animation — no scoring, Supabase logic, game flow, or existing layout was changed.
