-- Upgrade for the earlier SecretBox schema. It preserves data, but old share
-- tokens cannot become public links because plaintext tokens were never stored.
create extension if not exists pgcrypto;
alter table public.inboxes add column if not exists name text;
alter table public.inboxes add column if not exists public_token text;
alter table public.inboxes add column if not exists owner_token_hash text;
alter table public.inboxes add column if not exists is_active boolean not null default true;
alter table public.inboxes alter column share_token_hash drop not null;
alter table public.inboxes alter column name set default 'SecretBox user';
update public.inboxes set name = 'SecretBox user' where name is null;
alter table public.inboxes alter column name set not null;
create unique index if not exists inboxes_public_token_unique on public.inboxes(public_token) where public_token is not null;
-- Then run schema.sql; it is safe to re-run and installs the new RPC functions.
-- Existing pre-upgrade sessions require recovery (if available) or a new inbox.
