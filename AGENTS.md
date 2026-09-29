<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back into Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# Base44 dev environment

## Stack

- Vite 8 + TanStack Start (SSR) + React 19 + Tailwind 4. Frontend-only app; backend is an **external** Supabase project.
- Dev server: `npm run dev` → `vite dev --host 0.0.0.0 --port 3000`.
- No lockfile; `npm install` resolves deps fresh on each container start (node_modules in a named volume).

## Running here

- `docker compose -f docker-compose.base44.yml up -d --build` boots a `node:22-slim` container with the repo bind-mounted at `/app`.
- The container runs `npm install` then `npm run dev`. First boot takes ~1–2 min while deps install.
- Health: `GET /` on port 3000.

## Supabase / credentials

- The app has **hardcoded default** Supabase URL + publishable key in `src/lib/supabase.ts`, so it boots without any env vars. Those defaults point at the project's own Supabase instance.
- Optional overrides via env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`). The `.env.example` lists these.
- No external-service secrets are required to boot. If the user wants to point at their own Supabase project, they provide those three values.

## Notes

- `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` is passed through so Vite accepts the preview's external hostname.
- Supabase schema lives in `supabase/setup.sql` (run in the Supabase Dashboard SQL editor, not locally).
