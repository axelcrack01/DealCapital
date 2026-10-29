-- DealCapital: foundation only; do not enable production KYC without licensed provider,
-- legal review, backend audit controls, and explicit verification workflow.
-- Apply using a privileged migration account after staging review.
-- No DNI raw values, face images or financial reports are persisted here.

create schema if not exists dealcapital_private;
revoke all on schema dealcapital_private from public;
revoke all on schema dealcapital_private from anon, authenticated;

create table if not exists dealcapital_private.identity_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  document_type text not null default 'DNI' check (document_type in ('DNI')),
  document_country char(2) not null default 'PE' check (document_country = 'PE'),
  document_fingerprint text unique,
  document_last4 char(4),
  provider text,
  provider_reference text,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'failed', 'expired')),
  first_names text,
  paternal_surname text,
  maternal_surname text,
  birth_date date,
  verified_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verified_fields_required check (
    status <> 'verified' or (
      verified_at is not null and provider is not null
      and first_names is not null and paternal_surname is not null
      and document_fingerprint is not null
    )
  )
);

create table if not exists dealcapital_private.identity_verification_audit (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text,
  event_type text not null check (
    event_type in ('requested', 'verification_succeeded', 'verification_failed', 'expired', 'reviewed')
  ),
  actor_type text not null check (actor_type in ('system', 'provider', 'reviewer')),
  request_id uuid,
  occurred_at timestamptz not null default now()
);

alter table dealcapital_private.identity_verifications enable row level security;
alter table dealcapital_private.identity_verification_audit enable row level security;
-- Deliberately no anon/authenticated policies and no client-facing views.
revoke all on dealcapital_private.identity_verifications from public, anon, authenticated;
revoke all on dealcapital_private.identity_verification_audit from public, anon, authenticated;
revoke all on sequence dealcapital_private.identity_verification_audit_id_seq from public, anon, authenticated;

-- service_role has BYPASSRLS in Supabase; only trusted server-side code may use it.
grant usage on schema dealcapital_private to service_role;
grant select, insert, update, delete on
  dealcapital_private.identity_verifications,
  dealcapital_private.identity_verification_audit
  to service_role;
grant usage, select on sequence
  dealcapital_private.identity_verification_audit_id_seq to service_role;

comment on table dealcapital_private.identity_verifications is
'Private identity checks. Provider authorization and server-only processing required before writing records.';
comment on column dealcapital_private.identity_verifications.document_fingerprint is
'HMAC of normalized document with a high-entropy SERVER secret. NEVER use a bare SHA hash of an 8-digit DNI.';
