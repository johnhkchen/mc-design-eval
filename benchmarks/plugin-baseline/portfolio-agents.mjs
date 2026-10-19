#!/usr/bin/env node
// The agent runs behind a portfolio of projects (the companion to portfolio-gantt.mjs, from the same spec): who does the
// work and who costs the money. Shares by model of sessions, agent-hours, output tokens and cost; every session's cost
// as a dot on a log scale per model; and per project, sessions and cost stacked by model on shared scales.
//   node portfolio-agents.mjs <spec.json> <out.svg>   -> out.svg + out.png
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [specFile, out] = process.argv.slice(2), spec = JSON.parse(readFileSync(specFile, "utf8"));
const MODEL = { opus: "#3b3355", sonnet: "#6f86c6", haiku: "#d9b45a" }, ORDER = ["opus", "sonnet", "haiku"];
const NAME = { opus: "Opus", sonnet: "Sonnet", haiku: "Haiku" }, INK = "#1d1b24", MUTED = "#7a7466", RULE = "#ebe6dc";
const fmt = (n) => (n >= 1e9 ? (n / 1e9).toFixed(2) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(Math.round(n)));
const money = (v) => (v >= 10 ? `$${v.toFixed(0)}` : v >= 1 ? `$${v.toFixed(2)}` : `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}¢`);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const ledgers = (p) => { if (!existsSync(p)) return []; if (statSync(p).isFile()) return [p]; const o = [];
  for (const e of readdirSync(p)) { if (e === "sessions" || e === "node_modules") continue; const q = join(p, e);
    if (statSync(q).isDirectory()) o.push(...ledgers(q)); else if (e === "ledger.jsonl") o.push(q); } return o; };

const P = spec.projects.map((p) => { const rows = [];
  for (const f of [...new Set(p.runs.flatMap(ledgers))]) for (const l of readFileSync(f, "utf8").split("\n")) {
    if (!l.trim()) continue; let r; try { r = JSON.parse(l); } catch { continue; }
    if (!r.model || !(r.out || r.cost)) continue; const m = ORDER.find((k) => r.model.includes(k)); if (!m) continue;
    rows.push({ m, cost: r.cost || 0, out: r.out || 0, ms: r.ms || 0 }); }
  return { name: p.name, rows }; });
const all = P.flatMap((p) => p.rows);
const share = (k) => { const t = all.reduce((s, r) => s + (k === "n" ? 1 : r[k]), 0); return ORDER.map((m) => { const v = all.filter((r) => r.m === m).reduce((s, r) => s + (k === "n" ? 1 : r[k]), 0); return { m, v, f: v / t }; }); };
const S = { n: share("n"), ms: share("ms"), out: share("out"), cost: share("cost") };
const pct = (k, m) => Math.round(S[k].find((x) => x.m === m).f * 100);

const W = 1640, o = [];
// headline
o.push(`<text x="32" y="44" font-size="22" font-weight="bold" fill="${INK}">${esc(spec.agentsTitle ?? "Who does the work, who costs the money")}</text>`,
  `<text x="32" y="70" font-size="14" fill="${MUTED}">${all.length.toLocaleString("en-US")} agent sessions across ${P.length} projects: Haiku runs ${pct("n", "haiku")}% of them and writes ${pct("out", "haiku")}% of the output for ${pct("cost", "haiku")}% of the cost; Opus is ${pct("n", "opus")}% of sessions and ${pct("cost", "opus")}% of the cost.</text>`);

// 1. shares: four 100% bars
const B0 = 112, BL = 170, BW = 640, BH = 34;
o.push(`<text x="32" y="${B0 - 14}" font-size="11" fill="${MUTED}" letter-spacing="0.5">SHARE BY MODEL</text>`);
[["n", "Sessions", (v) => v.toLocaleString("en-US")], ["ms", "Agent-hours", (v) => `${(v / 3.6e6).toFixed(1)} h`], ["out", "Output tokens", fmt], ["cost", "Cost", (v) => `$${v.toFixed(2)}`]].forEach(([k, label, f], i) => {
  const y = B0 + i * (BH + 16); let x = BL;
  o.push(`<text x="32" y="${y + BH / 2 + 5}" font-size="14" font-weight="bold" fill="${INK}">${label}</text>`);
  for (const s of S[k]) { const w = s.f * BW; o.push(`<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${BH}" fill="${MODEL[s.m]}"/>`);
    if (w > 44) o.push(`<text x="${(x + 8).toFixed(1)}" y="${y + 15}" font-size="12" font-weight="bold" fill="${s.m === "haiku" ? INK : "#fff"}">${Math.round(s.f * 100)}%</text>`,
      `<text x="${(x + 8).toFixed(1)}" y="${y + 28}" font-size="10" fill="${s.m === "haiku" ? "#5a4a20" : "#e4e0ee"}">${f(s.v)}</text>`);
    x += w; } });
let lx = BL; for (const m of ORDER) { o.push(`<rect x="${lx}" y="${B0 + 4 * (BH + 16) - 4}" width="12" height="12" rx="2" fill="${MODEL[m]}"/><text x="${lx + 18}" y="${B0 + 4 * (BH + 16) + 6}" fill="#3a3630">${NAME[m]}</text>`); lx += 110; }

// 2. every session's cost, log scale, a strip per model
const SX = 900, SW = 700, S0 = 112, lo = 0.001, hi = 10, LX = (v) => SX + (Math.log10(Math.max(lo, Math.min(hi, v))) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) * SW;
o.push(`<text x="${SX}" y="${S0 - 14}" font-size="11" fill="${MUTED}" letter-spacing="0.5">COST OF EACH SESSION</text>`);
for (const v of [0.001, 0.01, 0.1, 1, 10]) o.push(`<line x1="${LX(v).toFixed(1)}" y1="${S0}" x2="${LX(v).toFixed(1)}" y2="${S0 + 3 * 64}" stroke="${RULE}"/>`,
  `<text x="${LX(v).toFixed(1)}" y="${S0 + 3 * 64 + 16}" text-anchor="middle" font-size="11" fill="${MUTED}">${v >= 1 ? "$" + v : v * 100 + "¢"}</text>`);
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
ORDER.forEach((m, i) => { const y = S0 + i * 64, c = all.filter((r) => r.m === m).map((r) => r.cost).sort((a, b) => a - b);
  for (const v of c) o.push(`<circle cx="${LX(v).toFixed(1)}" cy="${(y + 10 + rnd() * 34).toFixed(1)}" r="2.6" fill="${MODEL[m]}" fill-opacity="${m === "haiku" ? 0.55 : 0.85}"/>`);
  const med = c[c.length >> 1];
  o.push(`<line x1="${LX(med).toFixed(1)}" y1="${y + 4}" x2="${LX(med).toFixed(1)}" y2="${y + 50}" stroke="${INK}" stroke-width="2"/>`,
    `<text x="${SX - 12}" y="${y + 26}" text-anchor="end" font-size="13" font-weight="bold" fill="${INK}">${NAME[m]}</text>`,
    `<text x="${SX - 12}" y="${y + 42}" text-anchor="end" font-size="11" fill="${MUTED}">median ${money(med)}</text>`); });

// 3. per project: sessions and cost stacked by model, shared scales
const T0 = 400, RH = 34, maxN = Math.max(...P.map((p) => p.rows.length)), maxC = Math.max(...P.map((p) => p.rows.reduce((s, r) => s + r.cost, 0)));
const NX = 250, NW = 560, CX = 900, CWD = 560;
o.push(`<line x1="32" y1="${T0 - 44}" x2="${W - 32}" y2="${T0 - 44}" stroke="${RULE}"/>`,
  `<text x="${NX}" y="${T0 - 14}" font-size="11" fill="${MUTED}" letter-spacing="0.5">SESSIONS PER PROJECT</text>`, `<text x="${CX}" y="${T0 - 14}" font-size="11" fill="${MUTED}" letter-spacing="0.5">COST PER PROJECT</text>`);
P.forEach((p, i) => { const y = T0 + i * RH;
  o.push(`<text x="32" y="${y + 17}" font-size="13" font-weight="bold" fill="${INK}">${esc(p.name)}</text>`);
  let x = NX; for (const m of ORDER) { const n = p.rows.filter((r) => r.m === m).length, w = (n / maxN) * NW; if (w) o.push(`<rect x="${x.toFixed(1)}" y="${y + 4}" width="${w.toFixed(1)}" height="18" fill="${MODEL[m]}"/>`); x += w; }
  o.push(`<text x="${(x + 8).toFixed(1)}" y="${y + 18}" font-size="12" fill="#3a3630">${p.rows.length}</text>`);
  x = CX; let tot = 0; for (const m of ORDER) { const c = p.rows.filter((r) => r.m === m).reduce((s, r) => s + r.cost, 0), w = (c / maxC) * CWD; tot += c; if (w) o.push(`<rect x="${x.toFixed(1)}" y="${y + 4}" width="${w.toFixed(1)}" height="18" fill="${MODEL[m]}"/>`); x += w; }
  o.push(`<text x="${(x + 8).toFixed(1)}" y="${y + 18}" font-size="12" fill="#3a3630">$${tot.toFixed(2)}</text>`); });

const H = T0 + P.length * RH + 28;
writeFileSync(out, [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Helvetica,Arial,sans-serif" font-size="12">`, `<rect width="${W}" height="${H}" fill="#fbfaf7"/>`, ...o, "</svg>"].join("\n"));
try { execFileSync("rsvg-convert", ["-z", "1.5", "-o", out.replace(/\.svg$/, ".png"), out]); } catch (e) { console.error("no png:", e.message); }
console.log(`${out}: ${all.length} sessions; haiku ${pct("n", "haiku")}% sessions, ${pct("out", "haiku")}% output, ${pct("cost", "haiku")}% cost; opus ${pct("n", "opus")}% / ${pct("cost", "opus")}%`);
