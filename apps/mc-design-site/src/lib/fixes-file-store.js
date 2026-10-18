// The fix system's dev-server store: data/fixes.json ({ issues, jobs }), the same rows as the cloud's D1 tables.
import { readFile, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";

export function fileStore(path) {
  let queue = Promise.resolve();
  const read = async () => (existsSync(path) ? JSON.parse(await readFile(path, "utf8")) : { issues: [], jobs: [] });
  const edit = (fn) => (queue = queue.then(async () => { const d = await read(); const out = fn(d); await writeFile(path + ".tmp", JSON.stringify(d, null, 1) + "\n"); await rename(path + ".tmp", path); return out; }));
  return {
    listIssues: async () => (await read()).issues,
    listJobs: async () => (await read()).jobs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    putIssues: (rows) => edit((d) => { const ids = new Set(d.issues.map((r) => r.id)); for (const r of rows) if (!ids.has(r.id)) d.issues.push(r); }),
    patchIssue: (id, patch) => edit((d) => { const r = d.issues.find((r) => r.id === id); if (r) Object.assign(r, patch); return !!r; }),
    insertJob: (job) => edit((d) => { d.jobs.push(job); }),
    patchJob: (id, patch) => edit((d) => { const j = d.jobs.find((j) => j.id === id); if (j) Object.assign(j, patch); return !!j; }),
  };
}
