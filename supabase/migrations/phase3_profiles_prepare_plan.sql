-- Sprint 3: Prepare Tomorrow plan storage + explicit hints toggle persistence if missing
alter table profiles add column if not exists prepare_plan jsonb default null;
