-- Campaigns are active when created/launched; no pending review state.
update campaigns
set status = 'approved'
where status = 'pending';

alter table campaigns
  alter column status set default 'approved';

alter table campaigns drop constraint if exists campaigns_status_check;

alter table campaigns
  add constraint campaigns_status_check
  check (status in ('approved', 'rejected'));
