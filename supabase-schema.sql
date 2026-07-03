create table qr_codes (
  id text primary key,
  label text,
  destination text,
  created_at timestamptz not null default now(),
  programmed_at timestamptz
);

create table scans (
  id bigserial primary key,
  qr_id text not null references qr_codes(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  country text,
  city text,
  referrer text,
  user_agent text
);

create index scans_qr_id_idx on scans (qr_id);

create view qr_stats as
select
  q.id,
  q.label,
  q.destination,
  q.created_at,
  q.programmed_at,
  count(s.id) as scan_count,
  max(s.scanned_at) as last_scan
from qr_codes q
left join scans s on s.qr_id = q.id
group by q.id;
