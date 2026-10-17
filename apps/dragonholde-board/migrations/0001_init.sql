-- Board state. Each row keeps its record as JSON in `data`; status and cannon live in their own columns because the
-- board changes them, while plans rewrite `data`.
CREATE TABLE towns (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE projects (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'loaded', 'running', 'done', 'dropped')),
  cannon INTEGER,
  updated_at TEXT,
  data TEXT NOT NULL
);
CREATE INDEX tasks_project ON tasks (project);
CREATE TABLE pool (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL);
