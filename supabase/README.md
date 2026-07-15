# SQUASH Supabase Backend Notes

This folder contains database setup for the SQUASH backend.

## Security rules

- Never commit real Supabase keys, database passwords, service role keys, payment secrets, or webhook secrets.
- The frontend may only use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.local` or Vercel environment variables.
- The Supabase service role key must only live in trusted server-side code or dashboard settings, never in React/Vite code.
- Keep Row Level Security enabled on every table that contains user, job, report, payout, or payment data.

## Phase 1 setup

1. Copy `.env.example` to `.env.local`.
2. Add your Supabase project URL and anon key to `.env.local`.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. Confirm all tables have RLS enabled.
5. Add the same env vars to Vercel Project Settings > Environment Variables.

## Next phase

Phase 2 replaces localStorage demo auth with Supabase Auth while keeping the current UI intact.
