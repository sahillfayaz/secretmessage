-- Fresh SecretBox schema. For an existing deployment, run migration_public_links.sql instead.
create extension if not exists pgcrypto;
create table if not exists public.inboxes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  public_token text not null unique,
  owner_token_hash text not null,
  is_active boolean not null default true,
  recovery_key_hash text unique,
  recovery_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  constraint recovery_key_consistency check ((recovery_enabled and recovery_key_hash is not null) or (not recovery_enabled and recovery_key_hash is null))
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(), inbox_id uuid not null references public.inboxes(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 1000), created_at timestamptz not null default now()
);
create index if not exists messages_inbox_id_idx on public.messages(inbox_id);
-- These are no-ops on a fresh schema and let this file update the former build.
alter table public.inboxes add column if not exists name text;
alter table public.inboxes add column if not exists public_token text;
alter table public.inboxes add column if not exists owner_token_hash text;
alter table public.inboxes add column if not exists is_active boolean not null default true;
alter table public.inboxes alter column name set default 'SecretBox user';
update public.inboxes set name = 'SecretBox user' where name is null;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inboxes' and column_name='share_token_hash') then
    alter table public.inboxes alter column share_token_hash drop not null;
  end if;
end $$;
create unique index if not exists inboxes_public_token_unique on public.inboxes(public_token) where public_token is not null;
alter table public.inboxes enable row level security;
alter table public.messages enable row level security;
-- No table policies: browser access is limited to the RPC functions below.
-- Remove RPCs from the previous share-code architecture before installing the
-- public-link / private-owner-token implementation.
drop function if exists public.create_inbox(text, text);
drop function if exists public.send_message(text, text);
drop function if exists public.get_messages(uuid, text);
drop function if exists public.delete_message(uuid, text, uuid);
drop function if exists public.delete_all_messages(uuid, text);
drop function if exists public.recover_inbox(text, text);
create or replace function public.create_inbox(p_name text, p_public_token text, p_owner_token text)
returns table(id uuid, name text, public_token text) language plpgsql security definer set search_path = public, extensions as $$
begin
  if char_length(btrim(p_name)) not between 1 and 80 or char_length(p_public_token) < 24 or char_length(p_owner_token) < 24 then raise exception 'Invalid inbox details'; end if;
  return query insert into inboxes(name, public_token, owner_token_hash) values (btrim(p_name), p_public_token, crypt(p_owner_token, gen_salt('bf', 12))) returning inboxes.id, inboxes.name, inboxes.public_token;
end $$;
create or replace function public.get_public_inbox(p_public_token text)
returns table(name text) language sql security definer set search_path = public as $$ select i.name from inboxes i where i.public_token = p_public_token and i.is_active $$;
create or replace function public.send_public_message(p_public_token text, p_message text)
returns void language plpgsql security definer set search_path = public as $$
declare v_inbox uuid;
begin
  if char_length(btrim(p_message)) not between 1 and 1000 then raise exception 'Invalid message'; end if;
  select id into v_inbox from inboxes where public_token = p_public_token and is_active;
  if v_inbox is null then raise exception 'Invalid inbox'; end if;
  insert into messages(inbox_id, message) values (v_inbox, btrim(p_message));
end $$;
create or replace function public.get_owner_messages(p_inbox_id uuid, p_owner_token text)
returns table(id uuid, message text, created_at timestamptz) language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from inboxes i where i.id=p_inbox_id and i.owner_token_hash=crypt(p_owner_token, i.owner_token_hash)) then raise exception 'Unauthorized'; end if;
  return query select m.id, m.message, m.created_at from messages m where m.inbox_id=p_inbox_id order by m.created_at desc;
end $$;
create or replace function public.delete_owner_message(p_inbox_id uuid, p_owner_token text, p_message_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from inboxes where id=p_inbox_id and owner_token_hash=crypt(p_owner_token, owner_token_hash)) then raise exception 'Unauthorized'; end if;
  delete from messages where id=p_message_id and inbox_id=p_inbox_id;
end $$;
create or replace function public.delete_all_owner_messages(p_inbox_id uuid, p_owner_token text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from inboxes where id=p_inbox_id and owner_token_hash=crypt(p_owner_token, owner_token_hash)) then raise exception 'Unauthorized'; end if;
  delete from messages where inbox_id=p_inbox_id;
end $$;
create or replace function public.set_recovery_key(p_inbox_id uuid, p_owner_token text, p_recovery_key text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if char_length(p_recovery_key) < 6 then raise exception 'Password must be at least 6 characters'; end if;
  update inboxes set recovery_key_hash=crypt(p_recovery_key, gen_salt('bf', 12)), recovery_enabled=true where id=p_inbox_id and owner_token_hash=crypt(p_owner_token, owner_token_hash);
  if not found then raise exception 'Unauthorized'; end if;
end $$;
create or replace function public.login_inbox(p_public_token text, p_password text, p_new_owner_token text)
returns table(id uuid, name text, public_token text, is_active boolean) language plpgsql security definer set search_path = public, extensions as $$
begin
  return query update inboxes set owner_token_hash=crypt(p_new_owner_token, gen_salt('bf', 12))
  where inboxes.public_token=p_public_token and recovery_enabled and recovery_key_hash=crypt(p_password, recovery_key_hash)
  returning inboxes.id, inboxes.name, inboxes.public_token, inboxes.is_active;
end $$;
create or replace function public.update_inbox_name(p_inbox_id uuid, p_owner_token text, p_name text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if char_length(btrim(p_name)) not between 1 and 80 then raise exception 'Invalid name'; end if;
  update inboxes set name=btrim(p_name) where id=p_inbox_id and owner_token_hash=crypt(p_owner_token, owner_token_hash);
  if not found then raise exception 'Unauthorized'; end if;
end $$;
create or replace function public.set_inbox_active(p_inbox_id uuid, p_owner_token text, p_is_active boolean)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update inboxes set is_active=p_is_active where id=p_inbox_id and owner_token_hash=crypt(p_owner_token, owner_token_hash);
  if not found then raise exception 'Unauthorized'; end if;
end $$;
create or replace function public.delete_inbox(p_inbox_id uuid, p_owner_token text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from inboxes where id=p_inbox_id and owner_token_hash=crypt(p_owner_token, owner_token_hash);
  if not found then raise exception 'Unauthorized'; end if;
end $$;
create or replace function public.recover_inbox(p_recovery_key text, p_new_owner_token text)
returns table(id uuid, name text, public_token text) language plpgsql security definer set search_path = public, extensions as $$
begin
  return query update inboxes set owner_token_hash=crypt(p_new_owner_token, gen_salt('bf', 12)) where recovery_enabled and recovery_key_hash=crypt(p_recovery_key, recovery_key_hash) returning inboxes.id, inboxes.name, inboxes.public_token;
end $$;
grant execute on function public.create_inbox(text,text,text), public.get_public_inbox(text), public.send_public_message(text,text), public.get_owner_messages(uuid,text), public.delete_owner_message(uuid,text,uuid), public.delete_all_owner_messages(uuid,text), public.set_recovery_key(uuid,text,text), public.login_inbox(text,text,text), public.update_inbox_name(uuid,text,text), public.set_inbox_active(uuid,text,boolean), public.delete_inbox(uuid,text), public.recover_inbox(text,text) to anon, authenticated;
