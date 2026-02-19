-- ============================================================================
-- User Profiles table — stores tier status for freemium model
-- Only the service role can INSERT/UPDATE; clients can only SELECT their own row.
-- ============================================================================

create table if not exists user_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null unique,
    tier text not null default 'free' check (tier in ('free', 'pro')),
    stripe_payment_id text,
    upgraded_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS
alter table user_profiles enable row level security;

-- Users can only READ their own profile (no insert/update from client)
create policy "Users can view their own profile"
    on user_profiles for select
    using (auth.uid() = user_id);

create index if not exists idx_user_profiles_user_id on user_profiles(user_id);

-- ============================================================================
-- Auto-create a profile row when a new user signs up
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.user_profiles (user_id, tier)
    values (new.id, 'free')
    on conflict (user_id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ============================================================================
-- Tier-aware INSERT policies for feeds and sources
-- Free tier: max 1 feed, max 1 source. Pro: unlimited.
-- Drop existing simple ownership-only insert policies first.
-- ============================================================================

-- Feeds: replace insert policy
drop policy if exists "Users can insert their own feeds" on feeds;

create policy "Tier-aware feed insert"
    on feeds for insert
    with check (
        auth.uid() = user_id
        and (
            exists (
                select 1 from user_profiles
                where user_profiles.user_id = auth.uid()
                and user_profiles.tier = 'pro'
            )
            or (
                select count(*) from feeds
                where feeds.user_id = auth.uid()
            ) < 1
        )
    );

-- Sources: replace insert policy
drop policy if exists "Users can insert their own sources" on sources;

create policy "Tier-aware source insert"
    on sources for insert
    with check (
        auth.uid() = user_id
        and (
            exists (
                select 1 from user_profiles
                where user_profiles.user_id = auth.uid()
                and user_profiles.tier = 'pro'
            )
            or (
                select count(*) from sources
                where sources.user_id = auth.uid()
            ) < 1
        )
    );

-- ============================================================================
-- Config enforcement trigger
-- Prevents free-tier users from saving custom configs even if they bypass the UI.
-- ============================================================================

create or replace function enforce_free_config()
returns trigger as $$
begin
    if exists (
        select 1 from user_profiles
        where user_profiles.user_id = new.user_id
        and user_profiles.tier = 'free'
    ) then
        new.config = '{"interval":30,"transition":"crossfade","fit":"cover","shuffle":true,"show_clock":true}'::jsonb;
    end if;
    return new;
end;
$$ language plpgsql security definer;

create trigger enforce_free_tier_config
    before insert or update on feeds
    for each row execute function enforce_free_config();
