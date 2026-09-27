# SecretBox

SecretBox is a focused anonymous-message inbox built with React, Tailwind CSS, and Supabase. Create a public link, share it anywhere, and read incoming notes from a private owner dashboard.

## Features

- Create an inbox with only a display name—no email or account registration.
- Share a random public `/u/:token` link so anyone can send a note anonymously.
- Private owner dashboard for reading, sharing, and deleting messages.
- Persisted browser session, automatic redirect to the owner inbox, and secure logout.
- Board-link and password login on another device.
- Pause/reactivate public links, edit the display name, or permanently delete an inbox.
- Light/dark theme and responsive, accessible UI.
- 1,000-character message limit, empty-message rejection, and a basic send cooldown.

## Technology

- React + Vite
- Tailwind CSS
- React Router
- Supabase PostgreSQL + RPC
- Vercel-ready deployment configuration

## Local setup

1. Create a Supabase project.
2. In Supabase **SQL Editor**, run the complete `supabase/schema.sql` script.
3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Run `npm install` and `npm run dev`.
5. Create a new inbox and test its public link in another browser.

## Scripts

```bash
npm run dev       # local development
npm run build     # production build
npm run preview   # preview the production build
```

## Supabase security

RLS is enabled on `inboxes` and `messages`; the frontend has no direct table policies. It uses narrowly scoped PostgreSQL RPC functions only.

- Public visitors can look up only the display name for a single known public token and send a validated message to it.
- Owner operations require a random browser-owner token, stored locally in the owner browser and bcrypt-hashed in PostgreSQL.
- Board passwords are bcrypt-hashed using `pgcrypto`; plaintext passwords are never stored.
- The browser uses only `VITE_SUPABASE_ANON_KEY`. Never expose a Supabase service-role key in client-side environment variables.

## Deployment

Import the repository into Vercel and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the project environment settings. The included `vercel.json` rewrites clean React routes to the SPA entry point.

## Repository hygiene

`.env`, dependencies, build output, logs, and local editor settings are excluded by `.gitignore`. Commit `.env.example`, never `.env`.
"# secretmessage" 
