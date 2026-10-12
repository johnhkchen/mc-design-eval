#!/usr/bin/env node
// Prompt caching across a run's sessions, from the ledger and the session tapes: tokens written to the cache, read
// from it and output, with each one's share of the list cost (Haiku 5.5 rates fitted on our ledgers, 5-minute and
// 1-hour writes priced apart), and how much of each session's first prompt came from the cache (a session that
// starts with a warm shared prefix reads it; a cold one writes all of it).
//   node cache-report.mjs <run dir>...
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const M = 1e6, IN = 0.1 / M;                     // Haiku 5.5 under the 100K-output tier: input $0.10/M
const PRICE = { read: IN * 0.1, write5m: IN * 1.25, write1h: IN * 2, out: 0.5 / M };
const jl = (f) => readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

for (const dir of process.argv.slice(2)) {
  const tapes = existsSync(join(dir, "sessions")) ? readdirSync(join(dir, "sessions")).filter((f) => f.endsWith(".jsonl")) : [];
  const t = { w5: 0, w1: 0, read: 0, out: 0, firstRead: 0, firstWrite: 0, n: 0, cost: 0 };
  for (const f of tapes) {
    const L = jl(join(dir, "sessions", f));
    if (/codex/.test(L[0]?.model ?? "")) continue;
    const r = L.find((x) => x.type === "result"), u = r?.usage;
    if (!u || !Object.keys(r.modelUsage ?? {}).some((m) => m.includes("haiku"))) continue;
    t.n++; t.cost += r.total_cost_usd ?? 0;
    t.w5 += u.cache_creation?.ephemeral_5m_input_tokens ?? 0; t.w1 += u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
    t.read += u.cache_read_input_tokens ?? 0; t.out += u.output_tokens ?? 0;
    const a = L.find((x) => x.type === "assistant")?.message?.usage;
    if (a) { t.firstRead += a.cache_read_input_tokens ?? 0; t.firstWrite += a.cache_creation_input_tokens ?? 0; }
  }
  const K = (n) => `${(n / 1000).toFixed(0)}K`, $ = (n) => `$${n.toFixed(2)}`;
  const parts = { "cache writes (5m)": t.w5 * PRICE.write5m, "cache writes (1h)": t.w1 * PRICE.write1h, "cache reads": t.read * PRICE.read, output: t.out * PRICE.out };
  console.log(`${basename(dir)}: ${t.n} Haiku sessions, ${$(t.cost)} billed`);
  console.log(`  written ${K(t.w5 + t.w1)} (5m ${K(t.w5)}, 1h ${K(t.w1)}) · read ${K(t.read)} · output ${K(t.out)}`);
  console.log(`  at list rates: ${Object.entries(parts).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${$(v)}`).join(" · ")}`);
  console.log(`  first prompt: ${K(t.firstRead / t.n)} read from cache, ${K(t.firstWrite / t.n)} written, per session (${Math.round((100 * t.firstRead) / (t.firstRead + t.firstWrite))}% cached)`);
}
