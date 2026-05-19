-- Sprint 5: premium tier flag (Stripe can flip this later)
alter table profiles add column if not exists is_premium boolean default false;
