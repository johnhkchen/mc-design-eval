#!/usr/bin/env node
// Every render project on one timeline, an executive brief: a row per project with its agents running (a stream stacked
// by model, as thick as the concurrency) and its final path-traced renders under it, on a shared wall clock where every
// stretch of 10+ minutes with nothing running (no agent, no render) is collapsed to a narrow break. Cost, sessions and
// render time per project at the right; the whole portfolio's totals on top.
//   node portfolio-gantt.mjs <spec.json> <out.svg> [--tz America/Los_Angeles]
//   spec: { title, projects: [{ name, billing, note?, runs: [dir|ledger, ...], renders: [{ png | scene, ms?, lost? }] }] }
//   -> out.svg + out.png
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2), opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const [specFile, out] = argv, tz = opt("--tz", Intl.DateTimeFormat().resolvedOptions().timeZone);
const spec = JSON.parse(readFileSync(specFile, "utf8"));
const MODEL = { opus: "#3b3355", sonnet: "#6f86c6", haiku: "#d9b45a" }, ORDER = ["opus", "sonnet", "haiku"], RENDER = "#c4553b";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const fmt = (n) => (n >= 1e9 ? (n / 1e9).toFixed(2) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(n));
const dur = (ms) => { const m = Math.round(ms / 6e4); return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}` : `${m}m`; };

const ledgers = (p) => { if (!existsSync(p)) return []; if (statSync(p).isFile()) return [p]; const o = [];
  for (const e of readdirSync(p)) { if (e === "sessions" || e === "node_modules") continue; const q = join(p, e);
    if (statSync(q).isDirectory()) o.push(...ledgers(q)); else if (e === "ledger.jsonl") o.push(q); } return o; };
// a render's span: Chunky's scene file holds its render time; the photograph's mtime is its end
// (a render stopped before its photograph: scene, its scene file in chunky/, whose dump's mtime is where it stopped)
const renderSpan = (r) => { const scene = r.scene ?? r.png.replace("/shots/", "/chunky/").replace(/\.png$/, ".json");
  const end = statSync(r.png && existsSync(r.png) ? r.png : scene.replace(/\.json$/, ".dump")).mtimeMs; let ms = r.ms;
  if (!ms) ms = JSON.parse(readFileSync(scene, "utf8")).renderTime;
  return { a: end - ms, b: end, label: r.label, lost: !!r.lost }; };

const P = spec.projects.map((p) => {
  const rows = [];
  for (const f of [...new Set(p.runs.flatMap(ledgers))]) for (const l of readFileSync(f, "utf8").split("\n")) {
    if (!l.trim()) continue; let r; try { r = JSON.parse(l); } catch { continue; }
    if (!r.model || !(r.out || r.cost)) continue; const m = ORDER.find((k) => r.model.includes(k)); if (!m) continue;
    const b = Date.parse(r.t); rows.push({ m, a: b - (r.ms || 0), b, cost: r.cost || 0, tin: (r.in || 0) + (r.cacheWrite || 0) + (r.cacheRead || 0), out: r.out || 0 }); }
  const renders = (p.renders ?? []).filter((r) => existsSync(r.png ?? "") || existsSync(r.scene ?? "")).map(renderSpan);
  const sum = (k, m) => rows.filter((r) => !m || r.m === m).reduce((s, r) => s + r[k], 0);
  return { ...p, rows, renders, cost: sum("cost"), tin: sum("tin"), out: sum("out"), byModel: Object.fromEntries(ORDER.map((m) => [m, sum("cost", m)])),
    renderMs: renders.filter((r) => !r.lost).reduce((s, r) => s + r.b - r.a, 0) };
});

// the shared clock: busy spans (any agent, any render), gaps of 10+ minutes collapsed to a break
const spans = P.flatMap((p) => [...p.rows, ...p.renders]).map((s) => [s.a, s.b]).sort((x, y) => x[0] - y[0]);
const busy = []; for (const [a, b] of spans) { const l = busy[busy.length - 1]; if (l && a <= l[1] + 10 * 6e4) l[1] = Math.max(l[1], b); else busy.push([a, b]); }
const L = 190, R = 250, BREAK = 16, CW = 1200;
const activeMs = busy.reduce((s, [a, b]) => s + b - a, 0), pxPerMs = (CW - BREAK * (busy.length - 1)) / activeMs;
const X = (t) => { let x = L; for (let i = 0; i < busy.length; i++) { const [a, b] = busy[i];
  if (t <= b) return x + Math.max(0, t - a) * pxPerMs; x += (b - a) * pxPerMs + BREAK; } return x; };

const clock = (t) => new Date(t).toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" });
const day = (t) => new Date(t).toLocaleDateString("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" });
const tot = { cost: 0, tin: 0, out: 0, sessions: 0, render: 0, api: 0, by: { opus: 0, sonnet: 0, haiku: 0 } };
for (const p of P) { tot.cost += p.cost; tot.tin += p.tin; tot.out += p.out; tot.sessions += p.rows.length; tot.render += p.renderMs; if (p.billing === "API") tot.api += p.cost; for (const m of ORDER) tot.by[m] += p.byModel[m]; }
const t0 = busy[0][0], t1 = busy[busy.length - 1][1];

const ROWH = 66, TOP = 150, H = TOP + P.length * ROWH + 60, W = L + CW + R;
const o = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Helvetica,Arial,sans-serif" font-size="12">`, `<rect width="${W}" height="${H}" fill="#fbfaf7"/>`];
o.push(`<text x="24" y="38" font-size="22" font-weight="bold" fill="#1d1b24">${esc(spec.title)}</text>`);
// headline numbers
const kpis = [[dur(t1 - t0), `end to end (${day(t0)} – ${day(t1)})`], [dur(activeMs), "active"], [`$${tot.cost.toFixed(2)}`, `$${tot.api.toFixed(2)} API · $${(tot.cost - tot.api).toFixed(2)} subscription`],
  [String(tot.sessions), "agent sessions"], [`${fmt(tot.tin)} / ${fmt(tot.out)}`, "tokens in / out"], [dur(tot.render), "final renders"]];
kpis.forEach(([v, k], i) => { const x = 24 + i * 260; o.push(`<text x="${x}" y="78" font-size="20" font-weight="bold" fill="#1d1b24">${esc(v)}</text>`, `<text x="${x}" y="96" fill="#7a7466">${esc(k)}</text>`); });
// legend: models with their share of spend, then renders
let lx = 24; for (const m of ORDER) { o.push(`<rect x="${lx}" y="114" width="12" height="12" rx="2" fill="${MODEL[m]}"/><text x="${lx + 18}" y="124" fill="#3a3630">${m[0].toUpperCase() + m.slice(1)} $${tot.by[m].toFixed(2)}</text>`); lx += 150; }
o.push(`<rect x="${lx}" y="117" width="22" height="6" rx="2" fill="${RENDER}"/><text x="${lx + 30}" y="124" fill="#3a3630">Path-traced render</text>`);
o.push(`<text x="${L + CW + 16}" y="${TOP - 10}" fill="#7a7466" font-size="11">COST · SESSIONS · RENDER</text>`);

// breaks first, under everything
// break lengths labelled longest first, each kept clear of the ones already placed
let bx = L; const gaps = [];
for (let i = 0; i < busy.length; i++) { const [a, b] = busy[i]; bx += (b - a) * pxPerMs;
  if (i < busy.length - 1) { gaps.push({ x: bx + BREAK / 2, gap: busy[i + 1][0] - b });
    o.push(`<rect x="${bx.toFixed(1)}" y="${TOP - 4}" width="${BREAK}" height="${P.length * ROWH + 4}" fill="#efebe2"/>`); bx += BREAK; } }
const placed = []; for (const g of gaps.sort((p, q) => q.gap - p.gap)) { if (placed.some((x) => Math.abs(x - g.x) < 36)) continue; placed.push(g.x);
  o.push(`<text x="${g.x.toFixed(1)}" y="${TOP + P.length * ROWH + 16}" text-anchor="middle" font-size="10" fill="#a0957e">${dur(g.gap)}</text>`); }
// clock ticks at each busy span's start, thinned so labels never collide
let lastTick = -1e9; for (const [a] of busy) { const x = X(a); if (x - lastTick < 70) continue; lastTick = x;
  o.push(`<line x1="${x.toFixed(1)}" y1="${TOP - 4}" x2="${x.toFixed(1)}" y2="${TOP + P.length * ROWH}" stroke="#ddd6c8" stroke-dasharray="2,3"/>`,
    `<text x="${x.toFixed(1)}" y="${TOP + P.length * ROWH + 32}" font-size="10" fill="#7a7466">${clock(a)}</text>`); }

const maxConc = 16, AG = 40;   // agents band: 40 px at 16 concurrent sessions (more is clipped to the band)
P.forEach((p, k) => {
  const y = TOP + k * ROWH;
  if (k) o.push(`<line x1="16" y1="${y}" x2="${W - 16}" y2="${y}" stroke="#ebe6dc"/>`);
  o.push(`<text x="24" y="${y + 26}" font-size="14" font-weight="bold" fill="#1d1b24">${esc(p.name)}</text>`,
    `<text x="24" y="${y + 44}" font-size="11" fill="#7a7466">${esc(p.billing)}${p.note ? " · " + esc(p.note) : ""}</text>`);
  // the agents stream: sampled every 1.5 px, stacked opus (bottom) to haiku
  if (p.rows.length) { const xs = []; const xa = X(Math.min(...p.rows.map((r) => r.a))), xb = X(Math.max(...p.rows.map((r) => r.b)));
    for (let x = xa; x <= xb + 1.5; x += 1.5) xs.push(x);
    // invert X by bisection over time
    const inv = (x) => { let lo = t0, hi = t1; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (X(mid) < x) lo = mid; else hi = mid; } return lo; };
    const ts = xs.map(inv), base = y + 6 + AG; let below = xs.map(() => 0);
    for (const m of ORDER) { const c = ts.map((t) => p.rows.filter((r) => r.m === m && r.a <= t && r.b >= t).length);
      if (!c.some(Boolean)) continue; const top = below.map((v, i) => v + c[i]);
      const sc = (v) => (Math.min(v, maxConc) / maxConc) * AG;
      const pts = xs.map((x, i) => `${x.toFixed(1)},${(base - sc(top[i])).toFixed(1)}`).join(" ") + " " + xs.map((x, i) => `${x.toFixed(1)},${(base - sc(below[i])).toFixed(1)}`).reverse().join(" ");
      o.push(`<polygon points="${pts}" fill="${MODEL[m]}"/>`); below = top; } }
  // renders under the stream
  for (const r of p.renders) { const xa = X(r.a), xb = X(r.b);
    o.push(`<rect x="${xa.toFixed(1)}" y="${y + 52}" width="${Math.max(2, xb - xa).toFixed(1)}" height="7" rx="2" fill="${RENDER}"${r.lost ? ` fill-opacity="0.35"` : ""}/>`); }
  o.push(`<text x="${L + CW + 16}" y="${y + 26}" font-size="14" font-weight="bold" fill="#1d1b24">$${p.cost.toFixed(2)}</text>`,
    `<text x="${L + CW + 92}" y="${y + 26}" fill="#3a3630">${p.rows.length} sess</text>`,
    `<text x="${L + CW + 170}" y="${y + 26}" fill="${RENDER}">${p.renderMs ? dur(p.renderMs) : ""}</text>`,
    `<text x="${L + CW + 16}" y="${y + 44}" font-size="11" fill="#7a7466">${fmt(p.tin)} in · ${fmt(p.out)} out</text>`);
});
o.push("</svg>");
writeFileSync(out, o.join("\n"));
try { execFileSync("rsvg-convert", ["-z", "1.5", "-o", out.replace(/\.svg$/, ".png"), out]); } catch (e) { console.error("no png:", e.message); }
console.log(`${out}: ${P.length} projects, ${tot.sessions} sessions, $${tot.cost.toFixed(2)}, active ${dur(activeMs)} of ${dur(t1 - t0)}, ${busy.length} busy spans`);
