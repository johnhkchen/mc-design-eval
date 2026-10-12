#!/usr/bin/env node
// A run's agents on a timeline: one bar per model session from its ledger.jsonl (start = t - ms), bar length its wall
// time, bar height AND colour its spend per minute (cost / minutes), a strip on top with how many agents run at once.
// Names come from the session tapes (crew/<part-N> cwd -> plan parts then rooms; root sessions by model and order).
//   node gantt.mjs <run dir> [...more]   -> <run>/gantt.svg + gantt.png (rsvg-convert)
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const read = (f) => readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));

function sessions(dir) {
  const rows = read(join(dir, "ledger.jsonl")).map((r) => ({ ...r, end: Date.parse(r.t), start: Date.parse(r.t) - (r.ms ?? 0) }));
  const plan = existsSync(join(dir, "plan.json")) ? JSON.parse(readFileSync(join(dir, "plan.json"), "utf8")) : {};
  const names = [...(plan.parts ?? []).map((p) => p.name), ...(plan.rooms ?? []).map((r) => r.name)];
  // tapes: file name = start time, first frame carries the cwd
  const tapes = existsSync(join(dir, "sessions")) ? readdirSync(join(dir, "sessions")).map((f) => {
    const m = f.match(/^(\d{4}-\d\d-\d\dT\d\d)-(\d\d)-(\d\d)-(\d{3})Z/);
    let cwd = "";
    try { cwd = JSON.parse(readFileSync(join(dir, "sessions", f), "utf8").split("\n")[0]).cwd ?? ""; } catch {}
    return { start: m ? Date.parse(`${m[1]}:${m[2]}:${m[3]}.${m[4]}Z`) : NaN, cwd };
  }) : [];
  const used = new Set();
  let seenArt = false, rootHaikuAfterArt = 0;
  for (const r of rows.sort((a, b) => a.start - b.start)) {
    let best = -1, gap = 5000;
    tapes.forEach((t, i) => { const d = Math.abs(t.start - r.start); if (!used.has(i) && d < gap) { gap = d; best = i; } });
    const cwd = best >= 0 ? (used.add(best), tapes[best].cwd) : "";
    const crew = cwd.match(/\/crew\/(part|fix)-(\d+)$/);
    if (r.model === "codex") { r.name = "concept art + palette"; seenArt = true; }
    else if (crew) r.name = `${crew[1] === "fix" ? "fix: " : ""}${names[+crew[2] - 1] ?? crew[0]}`;
    else if (r.model === "opus") r.name = "architect (form)";
    else if (r.model === "sonnet") r.name = "designer (plan)";
    else if (!seenArt) r.name = "kit (vocab / scaffold)";
    else r.name = rootHaikuAfterArt++ === 0 ? names[0] ?? "part 1" : "inspector";
    r.min = (r.ms ?? 0) / 60000;
    r.rate = r.min > 0 ? (r.cost ?? 0) / r.min : 0;
  }
  return rows;
}

function colour(rate, max) {               // log scale: pale green (nearly free) -> amber -> deep red ($/min high)
  const t = Math.min(1, Math.log10(1 + rate * 1000) / Math.log10(1 + max * 1000));
  const h = 130 - 130 * t, l = 72 - 30 * t;
  return `hsl(${h.toFixed(0)},70%,${l.toFixed(0)}%)`;
}

function svg(dir, rows) {
  const t0 = Math.min(...rows.map((r) => r.start)), t1 = Math.max(...rows.map((r) => r.end));
  const span = (t1 - t0) / 60000, total = rows.reduce((a, r) => a + (r.cost ?? 0), 0);
  const maxRate = Math.max(...rows.map((r) => r.rate), 0.01);
  const L = 230, W = 760, R = 250, top = 130, rowH = 26, H = top + rows.length * rowH + 50;
  const x = (ms) => L + ((ms - t0) / 60000 / span) * W;
  const o = [`<svg xmlns="http://www.w3.org/2000/svg" width="${L + W + R}" height="${H}" font-family="Helvetica,Arial,sans-serif" font-size="12">`,
    `<rect width="100%" height="100%" fill="#fbfaf7"/>`,
    `<text x="16" y="24" font-size="16" font-weight="bold">${esc(basename(dir))}: ${rows.length} agent sessions, ${span.toFixed(0)} min, $${total.toFixed(2)}</text>`,
    `<text x="16" y="42" fill="#555">bar length = wall time; bar height and colour = spend per minute (tallest/reddest $${maxRate.toFixed(3)}/min)</text>`,
    `<text x="16" y="60" fill="#555">spend by model: ${Object.entries(rows.reduce((a, r) => ((a[r.model] = (a[r.model] ?? 0) + (r.cost ?? 0)), a), {})).map(([m, c]) => `${m} $${c.toFixed(2)}`).join(" · ")}</text>`];
  // concurrency strip
  const ev = rows.flatMap((r) => [[r.start, 1], [r.end, -1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let n = 0, peak = 0, pts = [`${L},110`];
  for (const [t, d] of ev) { pts.push(`${x(t).toFixed(1)},${110 - n * (50 / 24)}`); n += d; peak = Math.max(peak, n); pts.push(`${x(t).toFixed(1)},${110 - n * (50 / 24)}`); }
  o.push(`<text x="16" y="90" fill="#333">agents running</text><text x="16" y="105" fill="#777">(peak ${peak})</text>`,
    `<polyline points="${pts.join(" ")}" fill="#c9d6e8" stroke="#4a6fa5" stroke-width="1"/>`,
    `<line x1="${L}" y1="110" x2="${L + W}" y2="110" stroke="#999"/>`);
  // minute grid
  const step = span > 40 ? 10 : 5;
  for (let m = 0; m <= span; m += step) {
    const gx = L + (m / span) * W;
    o.push(`<line x1="${gx}" y1="${top - 8}" x2="${gx}" y2="${H - 40}" stroke="#e3e0d8"/>`, `<text x="${gx}" y="${H - 24}" text-anchor="middle" fill="#777">${m}m</text>`);
  }
  rows.forEach((r, i) => {
    const y = top + i * rowH, h = Math.max(3, (r.rate / maxRate) * (rowH - 4)), bx = x(r.start), bw = Math.max(2, x(r.end) - bx);
    o.push(`<text x="${L - 8}" y="${y + rowH / 2 + 4}" text-anchor="end" fill="#222">${esc(r.name.slice(0, 32))}</text>`,
      `<rect x="${bx.toFixed(1)}" y="${(y + (rowH - h) / 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${colour(r.rate, maxRate)}" stroke="#0003"/>`,
      `<text x="${(bx + bw + 6).toFixed(1)}" y="${y + rowH / 2 + 4}" fill="#555">${r.model}${r.effort ? "@" + r.effort : ""} $${(r.cost ?? 0).toFixed(2)} · ${r.min.toFixed(1)}m${r.out ? ` · ${(r.out / 1000).toFixed(0)}K out` : ""}${r.warn ? " ⚠" : ""}</text>`);
  });
  o.push("</svg>");
  return o.join("\n");
}

for (const dir of process.argv.slice(2)) {
  const rows = sessions(dir), out = join(dir, "gantt.svg");
  writeFileSync(out, svg(dir, rows));
  try { execFileSync("rsvg-convert", ["-z", "1.5", "-o", join(dir, "gantt.png"), out]); } catch (e) { console.error("no png:", e.message); }
  console.log(`${dir}: ${rows.length} sessions -> gantt.svg/png`);
}
