-- The fix system: issues found by the checks or reported by a person, and fix jobs that batch buildings with the
-- same kind of issue (type fix, code only) or study why one kind keeps coming out (type study). `at`, `buildings` and
-- `result` are JSON.
CREATE TABLE issues (
  id TEXT PRIMARY KEY,
  building TEXT NOT NULL,
  kind TEXT NOT NULL,
  at TEXT,
  what TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('check', 'person')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waived', 'fixed')),
  version TEXT,
  created_at TEXT NOT NULL,
  job_id TEXT
);
CREATE INDEX issues_building ON issues (building);
CREATE INDEX issues_kind ON issues (kind, status);
CREATE TABLE fix_jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'fix' CHECK (type IN ('fix', 'study')),
  kind TEXT NOT NULL,
  buildings TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'auto' CHECK (tier IN ('auto', 'haiku', 'sonnet')),
  budget REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'review', 'tagged', 'accepted', 'rejected', 'failed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  result TEXT
);
