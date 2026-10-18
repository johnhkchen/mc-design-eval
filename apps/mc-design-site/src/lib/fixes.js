// The fix system's API, shared by the Worker (D1 store) and the dev server (JSON file store). Issues come from the
// deterministic checks (scripts/check.mjs) or from a person; fix jobs batch buildings with the same kind of issue so
// one revision fixes them together, and their before/after counts show which fixes work.
//   issue: { id, building, kind, at, what, source: check|person, status: open|waived|fixed, version, createdAt, jobId }
//   job:   { id, kind, buildings, note, status: queued|running|review|accepted|rejected|failed, createdAt, updatedAt, result }

export const ISSUE_STATUS = ["open", "waived", "fixed"];
export const JOB_STATUS = ["queued", "running", "review", "accepted", "rejected", "failed"];

// what each kind means to a player, for the issues page
export const KINDS = {
  "floating shutter": "A shutter that hangs off nothing: it should lie flat on a wall beside a window.",
  "no front door": "No door facing the street, so the way in never reaches the house.",
  "way in": "The walk from the street to the door breaks the accessible standard: half steps only, a landing at the door, 2 wide.",
  "room unreachable": "A room a player can't walk into from the door, or furniture cutting its floor off.",
  "dark room": "Floor cells with no light, where mobs spawn.",
  "stairs end short": "A flight whose top step leaves a full-block jump onto the floor.",
  "chimney fire": "A fire shut inside its stack instead of burning in an open hearth.",
};

const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
/** A check issue's id is stable across re-checks (building, kind, place), so a waived issue stays waived. */
export const issueId = (i) => `${i.source === "person" ? "p" : "c"}-${hash(`${i.building}|${i.kind}|${JSON.stringify(i.at ?? null)}|${i.source === "person" ? i.what : ""}`)}`;

/** Store interface: listIssues(), listJobs(), putIssues(rows) (insert or keep), replaceCheckIssues(building, rows),
 *  patchIssue(id, patch), insertJob(job), patchJob(id, patch). */
export async function handleFixes({ method, path, query, body, canWrite }, store) {
  const now = new Date().toISOString(), deny = { status: 401, json: { error: "Viewing is public; changing issues and jobs needs a sign-in." } };
  if (path === "/api/issues" && method === "GET") return { status: 200, json: { issues: await store.listIssues(), jobs: await store.listJobs(), kinds: KINDS } };
  if (path === "/api/issues" && method === "POST") {
    if (!canWrite) return deny;
    const { building, kind, what } = body ?? {};
    if (!building || !kind || !what) return { status: 400, json: { error: "building, kind and what are required" } };
    const row = { building: String(building), kind: String(kind).trim().toLowerCase(), at: null, what: String(what), source: "person", status: "open", version: null, createdAt: now, jobId: null };
    row.id = issueId(row); await store.putIssues([row]); return { status: 200, json: row };
  }
  let m = path.match(/^\/api\/issues\/([\w-]+)$/);
  if (m && method === "PATCH") {
    if (!canWrite) return deny;
    if (!ISSUE_STATUS.includes(body?.status)) return { status: 400, json: { error: `status must be one of ${ISSUE_STATUS.join(", ")}` } };
    return (await store.patchIssue(m[1], { status: body.status })) ? { status: 200, json: { ok: true } } : { status: 404, json: { error: `no issue ${m[1]}` } };
  }
  // the checks' results for some buildings ({ buildings: { id: { version, issues } } }), reconciled with what's stored
  if (path === "/api/issues/sync" && method === "POST") {
    if (!canWrite) return deny;
    const all = await store.listIssues(), counts = { inserted: 0, updated: 0 };
    for (const [b, { version, issues }] of Object.entries(body?.buildings ?? {})) {
      const { inserts, updates } = reconcile(all.filter((r) => r.building === b), checkRows(b, version, issues, now));
      if (inserts.length) await store.putIssues(inserts);
      for (const u of updates) { const { id, ...patch } = u; await store.patchIssue(id, patch); }
      counts.inserted += inserts.length; counts.updated += updates.filter((u) => u.status).length;
    }
    return { status: 200, json: counts };
  }
  if (path === "/api/fix-jobs" && method === "GET") { const jobs = await store.listJobs(); return { status: 200, json: query?.status ? jobs.filter((j) => j.status === query.status) : jobs }; }
  if (path === "/api/fix-jobs" && method === "POST") {
    if (!canWrite) return deny;
    const { kind, buildings, note = "" } = body ?? {};
    if (!kind || !Array.isArray(buildings) || !buildings.length) return { status: 400, json: { error: "kind and a non-empty buildings list are required" } };
    const job = { id: `fix-${Date.now().toString(36)}`, kind: String(kind), buildings: buildings.map(String), note: String(note).slice(0, 2000), status: "queued", createdAt: now, updatedAt: now, result: null };
    await store.insertJob(job); return { status: 200, json: job };
  }
  m = path.match(/^\/api\/fix-jobs\/([\w-]+)$/);
  if (m && method === "PATCH") {
    if (!canWrite) return deny;
    if (body?.status && !JOB_STATUS.includes(body.status)) return { status: 400, json: { error: `status must be one of ${JOB_STATUS.join(", ")}` } };
    const patch = { updatedAt: now }; if (body?.status) patch.status = body.status; if (body?.result !== undefined) patch.result = body.result;
    return (await store.patchJob(m[1], patch)) ? { status: 200, json: { ok: true } } : { status: 404, json: { error: `no job ${m[1]}` } };
  }
  return null;
}

/** The check results for the store: one building's check issues as rows (ids stable across runs). */
export function checkRows(building, version, issues, now = new Date().toISOString()) {
  return issues.map((i) => { const row = { building, kind: i.kind, at: i.at ?? null, what: i.what, source: "check", status: "open", version, createdAt: now, jobId: null }; row.id = issueId(row); return row; });
}

/** A re-check of one building against its stored check issues: what to insert, and what changes status. An open issue
 *  the check no longer finds is fixed; a fixed one it finds again is open again; a waived one stays waived. */
export function reconcile(stored, fresh) {
  const was = new Map(stored.filter((r) => r.source === "check").map((r) => [r.id, r])), now = new Set(fresh.map((r) => r.id));
  const inserts = fresh.filter((r) => !was.has(r.id)), updates = [];
  for (const r of fresh) { const o = was.get(r.id); if (o && o.status === "fixed") updates.push({ id: r.id, status: "open", version: r.version }); else if (o) updates.push({ id: r.id, version: r.version }); }
  for (const [id, o] of was) if (!now.has(id) && o.status === "open") updates.push({ id, status: "fixed" });
  return { inserts, updates };
}
