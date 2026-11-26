# QuizUp

QuizUp is a Turkish quiz creation and play experience built with React + Vite.

## Run locally
```bash
npm install
npm run dev
```

## Deploy to Vercel
Import this GitHub repository in Vercel. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.

## Deploy to Render
Create a **Static Site** from this repository. The included `render.yaml` configures the build and publish directory automatically. Alternatively use build command `npm install && npm run build` and publish directory `dist`.

Both hosts can deploy the same `main` branch independently. New GitHub commits can trigger automatic deployments on both platforms.

## Current stage
- Responsive QuizUp interface
- Quiz creation with four answer choices, correct answer selection and per-question timer
- Browser-local quiz saving and quiz discovery
- Single-player quiz flow and results
- PIN join screen prepared for a future realtime backend

**Important:** At this stage, quizzes are saved only in the current browser using localStorage. They are not yet public across devices. Accounts, shared quiz publishing, realtime rooms, synchronized multiplayer scoring and moderation require a connected backend (planned: a separate Supabase project for QuizUp). Do not treat the PIN screen as an active multiplayer service yet.
