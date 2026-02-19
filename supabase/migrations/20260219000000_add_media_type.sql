-- Add media_type column to source_items (default 'image' for existing rows)
alter table source_items add column if not exists media_type text not null default 'image' check (media_type in ('image', 'video'));

-- Add video_url column for direct video playback (bypasses proxy)
alter table source_items add column if not exists video_url text;
