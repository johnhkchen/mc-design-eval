// The fix system's cloud store: the issues and fix_jobs tables in D1 (migrations/0002_fixes.sql).
const issue = (r) => ({ id: r.id, building: r.building, kind: r.kind, at: r.at ? JSON.parse(r.at) : null, what: r.what, source: r.source, status: r.status, version: r.version, createdAt: r.created_at, jobId: r.job_id });
const job = (r) => ({ id: r.id, type: r.type ?? "fix", kind: r.kind, buildings: JSON.parse(r.buildings), note: r.note, tier: r.tier, budget: r.budget, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at, result: r.result ? JSON.parse(r.result) : null });
const COLS = { status: "status", version: "version", jobId: "job_id", updatedAt: "updated_at", result: "result" };

export function d1Store(DB) {
  const patch = async (table, id, p) => { const sets = [], args = [];
    for (const [k, v] of Object.entries(p)) if (COLS[k]) { sets.push(`${COLS[k]} = ?`); args.push(k === "result" ? JSON.stringify(v) : v); }
    if (!sets.length) return true;
    return (await DB.prepare(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = ?`).bind(...args, id).run()).meta.changes > 0; };
  return {
    listIssues: async () => (await DB.prepare("SELECT * FROM issues").all()).results.map(issue),
    listJobs: async () => (await DB.prepare("SELECT * FROM fix_jobs ORDER BY created_at DESC").all()).results.map(job),
    putIssues: async (rows) => { if (!rows.length) return; await DB.batch(rows.map((r) => DB.prepare("INSERT OR IGNORE INTO issues (id, building, kind, at, what, source, status, version, created_at, job_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(r.id, r.building, r.kind, r.at == null ? null : JSON.stringify(r.at), r.what, r.source, r.status, r.version, r.createdAt, r.jobId))); },
    patchIssue: (id, p) => patch("issues", id, p),
    insertJob: (j) => DB.prepare("INSERT INTO fix_jobs (id, type, kind, buildings, note, tier, budget, status, created_at, updated_at, result) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)").bind(j.id, j.type, j.kind, JSON.stringify(j.buildings), j.note, j.tier, j.budget, j.status, j.createdAt, j.updatedAt).run(),
    patchJob: (id, p) => patch("fix_jobs", id, p),
  };
}
