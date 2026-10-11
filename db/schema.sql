-- Skema Prodamat. Idempoten: aman dijalankan ulang lewat `npm run db:migrate`.

create table if not exists activity (
  id text primary key,
  phase text not null default 'pretest' check (phase in ('pretest', 'learning', 'posttest', 'closed')),
  updated_at timestamptz not null default now()
);

-- Saklar Aiko 3D di perangkat siswa; pendamping bisa mematikannya bila Chromebook tersendat.
alter table activity add column if not exists aiko3d boolean not null default true;

create table if not exists participant (
  id uuid primary key default gen_random_uuid(),
  activity_id text not null references activity (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  name_key text not null,
  class_name text not null check (class_name in ('V', 'VI')),
  created_at timestamptz not null default now(),
  unique (activity_id, class_name, name_key)
);

create table if not exists attempt (
  participant_id uuid not null references participant (id) on delete cascade,
  kind text not null check (kind in ('pretest', 'posttest')),
  answers smallint[] not null default array_fill(null::smallint, array[10]),
  revision integer not null default 0,
  submitted_at timestamptz,
  score smallint check (score between 0 and 10),
  updated_at timestamptz not null default now(),
  primary key (participant_id, kind),
  check (cardinality(answers) = 10),
  check (submitted_at is null or (score is not null and array_position(answers, null) is null))
);

-- Waktu jawaban pertama per tes, untuk kriteria "tercepat": durasi dihitung per anak dari jawaban pertama sampai
-- kirim, jadi anak yang datang terlambat tidak dirugikan. Baris lama tetap kosong (waktunya tidak diketahui).
alter table attempt add column if not exists started_at timestamptz;
alter table attempt alter column started_at set default now();

-- Pemenang apresiasi: siswa teraktif dipilih pendamping saat acara, dan batas nilai posttest "hasil bagus"
-- untuk kriteria tercepat.
alter table activity add column if not exists most_active uuid references participant (id) on delete set null;
alter table activity add column if not exists good_score smallint not null default 8 check (good_score between 1 and 10);

create table if not exists session (
  token_hash text primary key,
  role text not null check (role in ('siswa', 'pendamping')),
  activity_id text not null references activity (id) on delete cascade,
  participant_id uuid references participant (id) on delete cascade,
  expires_at timestamptz not null,
  check ((role = 'siswa') = (participant_id is not null))
);
create index if not exists session_expires_idx on session (expires_at);
create index if not exists session_participant_idx on session (participant_id);

create table if not exists login_failure (
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists login_failure_ip_at_idx on login_failure (ip, at);
