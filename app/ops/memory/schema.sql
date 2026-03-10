-- Optional relational memory store for agents.
-- Keep project scope isolated to budgetapp.

create table if not exists memory_threads (
  thread_id text primary key,
  project_id text not null default 'budgetapp',
  venture_id text not null,
  task_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memory_events (
  event_id bigserial primary key,
  project_id text not null default 'budgetapp',
  venture_id text not null,
  thread_id text not null references memory_threads(thread_id) on delete cascade,
  task_id text,
  agent_id text not null,
  event_type text not null,
  role text not null,
  content text not null,
  why_it_happened text,
  next_action text,
  confidence numeric(4,3),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_memory_events_thread_time
  on memory_events (thread_id, created_at desc);

create index if not exists idx_memory_events_venture_time
  on memory_events (venture_id, created_at desc);

create table if not exists memory_decisions (
  decision_id bigserial primary key,
  project_id text not null default 'budgetapp',
  venture_id text not null,
  thread_id text not null,
  task_id text,
  decision_text text not null,
  rationale text,
  tradeoffs text,
  decided_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_memory_decisions_venture_time
  on memory_decisions (venture_id, created_at desc);

create table if not exists memory_summaries (
  summary_id bigserial primary key,
  project_id text not null default 'budgetapp',
  venture_id text not null,
  thread_id text,
  window_start timestamptz not null,
  window_end timestamptz not null,
  summary text not null,
  facts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_memory_summaries_venture_window
  on memory_summaries (venture_id, window_start desc, window_end desc);
