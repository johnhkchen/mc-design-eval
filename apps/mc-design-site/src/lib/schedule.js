// Estimated schedule: running and loaded jobs keep their cannon; queued jobs go, in order, to the cannon that frees up
// first, once their prerequisites finish. The player sets cannons up one at a time, so each start also waits on setup.
export const OPEN = (t) => t.status !== "done" && t.status !== "dropped";
export const hoursOf = (t, pool) => (t.work || 0) * pool.secPerBlock / 3600;

export function schedule(tasks, pool) {
  const ix = Object.fromEntries(tasks.map((t) => [t.id, t]));
  const C = pool.cannons, setupH = pool.setupMin / 60;
  const free = Array.from({ length: C }, () => 0), bars = [], finish = {};
  const jobs = tasks.filter((t) => t.kind === "cannon");
  for (const t of jobs) if (!OPEN(t)) finish[t.id] = 0;
  for (const t of jobs.filter((t) => t.status === "loaded" || t.status === "running")) {
    const c = Number.isInteger(t.cannon) && t.cannon < C ? t.cannon : free.indexOf(Math.min(...free));
    const s = free[c], e = s + hoursOf(t, pool); free[c] = e; finish[t.id] = e; bars.push({ t, c, s, e });
  }
  let left = jobs.filter((t) => t.status === "queued").sort((a, b) => a.project.localeCompare(b.project) || a.seq - b.seq), clock = 0;
  while (left.length) {
    const t = left.find((q) => (q.deps || []).every((d) => d in finish || !ix[d]));
    if (!t) break;
    left = left.filter((q) => q !== t);
    const depEnd = Math.max(0, ...(t.deps || []).map((d) => finish[d] || 0));
    let c = 0; for (let i = 1; i < C; i++) if (free[i] < free[c]) c = i;
    clock += setupH;
    const s = Math.max(free[c], depEnd, clock), e = s + hoursOf(t, pool);
    free[c] = e; finish[t.id] = e; bars.push({ t, c, s, e, planned: true });
  }
  return { bars, end: Math.max(0, ...bars.map((b) => b.e)), stuck: left };
}

// The longest chain of prerequisites, in hours of cannon time (no setup, unlimited cannons).
export function criticalPath(tasks, pool) {
  const ix = Object.fromEntries(tasks.map((t) => [t.id, t])), memo = {};
  const len = (id, seen = new Set()) => { if (id in memo) return memo[id]; const t = ix[id]; if (!t || !OPEN(t) || seen.has(id)) return 0;
    seen.add(id); return (memo[id] = hoursOf(t, pool) + Math.max(0, ...(t.deps || []).map((d) => len(d, seen)))); };
  return Math.max(0, ...tasks.filter((t) => t.kind === "cannon").map((t) => len(t.id)));
}
