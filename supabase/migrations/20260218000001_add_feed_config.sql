alter table feeds add column if not exists config jsonb default '{}'::jsonb;

comment on column feeds.config is 'Stores lightweight display settings: { interval, transition, fit, sleep_schedule: { start, end, enabled }, show_clock }';
