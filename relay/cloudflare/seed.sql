-- Tunnel domains
INSERT OR IGNORE INTO tunnel_domains (id, domain, is_active)
VALUES
  ('td_exposed', 'workslocal.exposed', 1),
  ('td_io', 'workslocal.io', 1),
  ('td_run', 'workslocal.run', 1);