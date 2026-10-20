#!/usr/bin/env node
// A run's agents on a timeline, from its ledger.jsonl (start = t - ms). Sessions group by role (architect, designer,
// kit, the crew's parts and rooms, inspector, fixes, lamps, fix rounds); a role whose sessions overlap packs them into
// thin stacked lanes, so a wave of Haiku agents reads as one clump as thick as its concurrency. Bars are coloured by
// model; each role's cost sits at the right. On top: agents running, and the cumulative spend (each stretch coloured by
// its spend rate). The x axis is the whole wall time with every stretch of 2+ minutes with no agent running collapsed
// to a narrow break (its length under the axis), so active time takes the width. Names come from the session tapes
// (crew/<part-N> cwd -> plan parts then rooms; root sessions by model and order); a revise-vN.log starts a fix round.
//   node gantt.mjs <run dir> [...more]                 -> <run>/gantt.svg + gantt.png, each run on its own wall time
//   node gantt.mjs --project <out.svg> [--title t] [--from ISO] [--to ISO] <run dir> [...more]
//        one chart for several runs (the buildings of one project) on the project's wall time: a streamgraph of agents
//        running per building, the project's spend, then each building's clumps; --from/--to widen the x domain to
//        the project's own start and end (an ask, a final render), else it is the first session to the last activity
//   --tz <IANA zone>   clock times on the axis (default the machine's)
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const SCALE = 0.4;   // $/min at full bar height
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const read = (f) => readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const args = process.argv.slice(2), opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const PROJECT = opt("--project"), TITLE = opt("--title"), FROM = opt("--from"), TO = opt("--to"), TZ = opt("--tz");
const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", ...(TZ ? { timeZone: TZ } : {}) });
const hm = (min) => (min >= 60 ? `${Math.floor(min / 60)}h ${String(Math.round(min % 60)).padStart(2, "0")}m` : `${Math.round(min)}m`);

// batched sessions (billing "api-batch") log one row per turn, its ms the batch's wait (submit to result): one session's
// turns become one bar from its first submit to its last result, the waiting included, its cost their sum
function batchSessions(rows) {
  const by = new Map(), out = [];
  for (const r of rows) { if (r.billing !== "api-batch" || !r.session) { out.push(r); continue; } if (!by.has(r.session)) by.set(r.session, []); by.get(r.session).push(r); }
  for (const [sid, rs] of by) { const start = Math.min(...rs.map((r) => r.start)), end = Math.max(...rs.map((r) => r.end));
    out.push({ ...rs[0], sid, start, end, ms: end - start, turns: rs.length, cost: rs.reduce((a, r) => a + (r.cost ?? 0), 0), out: rs.reduce((a, r) => a + (r.out ?? 0), 0),
      waits: rs.reduce((a, r) => a + (r.ms ?? 0), 0) }); }
  return out;
}

function sessions(dir) {
  const rows = batchSessions(read(join(dir, "ledger.jsonl")).filter((r) => r.model).map((r) => ({ ...r, end: Date.parse(r.t), start: Date.parse(r.t) - (r.ms ?? 0) })));
  const plan = existsSync(join(dir, "plan.json")) ? JSON.parse(readFileSync(join(dir, "plan.json"), "utf8")) : {};
  const names = [...(plan.parts ?? []).map((p) => p.name), ...(plan.rooms ?? []).map((r) => r.name)];
  // tapes: file name = start time, first frame carries the cwd
  const tapes = existsSync(join(dir, "sessions")) ? readdirSync(join(dir, "sessions")).map((f) => {
    const m = f.match(/^(\d{4}-\d\d-\d\dT\d\d)-(\d\d)-(\d\d)-(\d{3})Z/);
    let cwd = "", sid = null;
    try { const first = JSON.parse(readFileSync(join(dir, "sessions", f), "utf8").split("\n")[0]); cwd = first.cwd ?? ""; sid = first.session_id ?? null; } catch {}
    return { start: m ? Date.parse(`${m[1]}:${m[2]}:${m[3]}.${m[4]}Z`) : NaN, cwd, sid };
  }) : [];
  // fix rounds: each revise-vN.log was created when its round started
  const rounds = readdirSync(dir).map((f) => f.match(/^revise-(v\d+)\.log$/)).filter(Boolean)
    .map((m) => ({ v: m[1], at: statSync(join(dir, m[0])).birthtimeMs, until: statSync(join(dir, m[0])).mtimeMs })).sort((a, b) => a.at - b.at);
  const used = new Set();
  let art = 0, rootHaiku = 0;
  for (const r of rows.sort((a, b) => a.start - b.start)) {
    let best = -1, gap = 5000;
    if (r.sid) best = tapes.findIndex((t) => t.sid === r.sid);                       // a batched session: by its id
    else tapes.forEach((t, i) => { const d = Math.abs(t.start - r.start); if (!used.has(i) && d < gap) { gap = d; best = i; } });
    const cwd = best >= 0 ? (used.add(best), tapes[best].cwd) : "";
    const crew = cwd.match(/\/crew\/(part|fix|lamp)-(\d+)$/);
    const round = rounds.filter((x) => r.start >= x.at - 5000).pop();
    // the art runs before the plan: a mood board, then the concept rounds
    if (round) { r.name = `fix round ${round.v} (${r.model})`; r.group = `fix round ${round.v}`; }
    else if (r.model === "codex") { r.name = art++ === 0 ? "mood board" : `concept round ${art - 1}`; r.group = "concept art"; }
    else if (crew) { r.name = `${crew[1] === "fix" ? "fix: " : crew[1] === "lamp" ? "lamps: " : ""}${(names[+crew[2] - 1] ?? crew[0]).replace(/^room: /, "")}`;
      r.group = crew[1] === "fix" ? "fixes" : crew[1] === "lamp" ? "lamplighters" : "crew: parts and rooms"; }
    else if (r.model === "opus") r.name = r.group = "architect (form)";
    else if (r.model === "sonnet") r.name = r.group = "designer (plan)";
    else if (r.effort === "medium") { r.name = "kit (vocab / scaffold)"; r.group = "kit (vocab / scaffold)"; }
    else if (rootHaiku++ === 0) { r.name = names[0] ?? "part 1"; r.group = "crew: parts and rooms"; }
    else r.name = r.group = "inspector";
    r.min = (r.ms ?? 0) / 60000;
    r.rate = r.min > 0 ? (r.cost ?? 0) / r.min : 0;
  }
  // the run's last activity: its last session, or a fix round's log written after it
  const last = Math.max(...rows.map((r) => r.end), ...rounds.map((x) => x.until));
  return { dir, name: PROJECT ? basename(dir).replace(/-kit$/, "") : basename(dir), rows, last };
}

function colour(rate, max) {               // log scale: pale green (nearly free) -> amber -> deep red ($/min high)
  const t = Math.min(1, Math.log10(1 + rate * 1000) / Math.log10(1 + max * 1000));
  const h = 130 - 130 * t, l = 72 - 30 * t;
  return `hsl(${h.toFixed(0)},70%,${l.toFixed(0)}%)`;
}

// roles in order of first start; overlapping sessions packed first-fit into lanes (lanes = the role's peak concurrency)
function groups(rows) {
  const g = new Map();
  for (const r of [...rows].sort((a, b) => a.start - b.start)) { if (!g.has(r.group)) g.set(r.group, []); g.get(r.group).push(r); }
  return [...g].map(([name, rs]) => {
    const ends = [];
    for (const r of rs) { let k = ends.findIndex((e) => e <= r.start); if (k < 0) { k = ends.length; ends.push(0); } ends[k] = r.end; r.lane = k; }
    return { name, rows: rs, lanes: ends.length, cost: rs.reduce((a, r) => a + (r.cost ?? 0), 0), start: rs[0].start, end: Math.max(...rs.map((r) => r.end)) };
  });
}

// stretches of 2+ minutes inside [t0, t1] with no session running
function idle(rows, t0, t1) {
  const iv = rows.map((r) => [r.start, r.end]).sort((a, b) => a[0] - b[0]), out = [];
  let at = t0;
  for (const [a, b] of iv) { if (a - at >= COLLAPSE) out.push([at, a]); at = Math.max(at, b); }
  if (t1 - at >= COLLAPSE) out.push([at, t1]);
  return out;
}

const LANE = 5, ROW = 24, GAP = 8, COLLAPSE = 2 * 60000, LONG = 10 * 60000;
const breakPx = (ms) => (ms >= LONG ? 26 : 12);   // a collapsed stretch's drawn width

// time -> x with every stretch of 2+ minutes with no agent running collapsed to a narrow break, so active time takes the width
function makeScale(t0, t1, gaps, L, W) {
  // breaks only a blip apart (under 90 s of activity between them) merge into one; the blips draw inside it
  const G = []; for (const [a, b] of gaps.filter(([a, b]) => b - a >= COLLAPSE).sort((p, q) => p[0] - q[0])) { const l = G[G.length - 1]; if (l && a - l[1] < 90e3) l[1] = b; else G.push([a, b]); }
  const active = Math.max(1, t1 - t0 - G.reduce((t, [a, b]) => t + b - a, 0)), k = (W - G.reduce((t, [a, b]) => t + breakPx(b - a), 0)) / active;
  const pieces = []; let cur = t0, pos = L;
  for (const [a, b] of G) { pieces.push({ a: cur, b: a, xa: pos, xb: pos + (a - cur) * k }); pos += (a - cur) * k; pieces.push({ a, b, xa: pos, xb: pos + breakPx(b - a), idle: true }); pos += breakPx(b - a); cur = b; }
  pieces.push({ a: cur, b: t1, xa: pos, xb: L + W });
  const x = (t) => { if (t <= t0) return L; for (const p of pieces) if (t <= p.b) return p.xa + (p.b > p.a ? (t - p.a) / (p.b - p.a) : 0) * (p.xb - p.xa); return L + W; };
  x.inv = (px) => { for (const p of pieces) if (px <= p.xb) return p.a + (p.xb > p.xa ? (px - p.xa) / (p.xb - p.xa) : 0) * (p.b - p.a); return t1; };
  x.pieces = pieces;
  return x;
}

// totals for the header: wall time against time with an agent running, agent-hours, tokens, dollars by model
const big = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e8 ? 0 : 1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n));
function totals(rows, t0, t1) {
  const iv = rows.map((r) => [r.start, r.end]).sort((a, b) => a[0] - b[0]); let act = 0, s0 = null, e0 = null;
  for (const [a, b] of iv) { if (s0 === null || a > e0) { if (s0 !== null) act += e0 - s0; s0 = a; e0 = b; } else e0 = Math.max(e0, b); } if (s0 !== null) act += e0 - s0;
  const sum = (f) => rows.reduce((t, r) => t + (r[f] ?? 0), 0), models = {};
  for (const r of rows) models[r.model] = (models[r.model] ?? 0) + (r.cost ?? 0);
  // tokens in, all in: fresh input, cache reads and cache writes
  return { wall: (t1 - t0) / 60000, active: act / 60000, agentH: sum("ms") / 3.6e6, cost: sum("cost"), out: sum("out"), tin: sum("in") + sum("cacheRead") + sum("cacheWrite"), models };
}

const MODEL = { opus: "#3b3355", sonnet: "#6f86c6", haiku: "#d9b45a", codex: "#a0a0a0" };
const mColour = (m) => MODEL[Object.keys(MODEL).find((k) => m.includes(k))] ?? "#a0a0a0";

function header(o, title, e, W) {
  o.push(`<text x="16" y="26" font-size="16" font-weight="bold">${esc(title)}</text>`,
    `<text x="16" y="48" fill="#333">${hm(e.wall)} end to end · ${hm(e.active)} with agents running · ${e.agentH.toFixed(1)} agent-hours · ${big(e.tin)} tokens in · ${big(e.out)} out · $${e.cost.toFixed(2)}</text>`);
  let lx = 16;
  for (const [m, c] of Object.entries(e.models).sort((a, b) => b[1] - a[1])) {
    const t = `${m} $${c.toFixed(2)}`;
    o.push(`<rect x="${lx}" y="58" width="10" height="10" rx="2" fill="${mColour(m)}"/><text x="${lx + 14}" y="67" fill="#333">${t}</text>`); lx += 30 + t.length * 6.6;
  }
}

function blockHeight(gs) { return gs.reduce((h, g) => h + (g.lanes > 1 ? Math.max(ROW, g.lanes * LANE + 8) : ROW) + 2, 0); }

// one run's roles from y0 down: a row per lone role, a clump of lanes per overlapping role; bars by model; cost at right
function drawBlock(o, gs, x, y0, L, W) {
  let y = y0;
  for (const g of gs) {
    const clump = g.lanes > 1, h = clump ? Math.max(ROW, g.lanes * LANE + 8) : ROW, mid = y + h / 2;
    o.push(`<text x="${L - 8}" y="${mid + 4}" text-anchor="end" fill="#222">${esc(g.name.replace(/^crew: /, ""))}${g.rows.length > 1 ? ` <tspan fill="#888">×${g.rows.length}</tspan>` : ""}</text>`);
    for (const r of g.rows) {
      const bx = x(r.start), bw = Math.max(2, x(r.end) - bx), bh = clump ? LANE - 1 : 8, by = clump ? y + 4 + r.lane * LANE : mid - 4;
      o.push(`<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh}" rx="1" fill="${mColour(r.model)}"><title>${esc(r.name)}: ${r.model}${r.effort ? "@" + r.effort : ""} $${(r.cost ?? 0).toFixed(2)} · ${r.min.toFixed(1)}m</title></rect>`);
    }
    o.push(`<text x="${L + W + 12}" y="${mid + 4}" fill="#555">$${g.cost.toFixed(2)}</text>`);
    y += h + 2;
  }
  return y - y0;
}

// clock ticks over the active stretches; collapsed stretches show only their length
function axis(o, x, W, yTop, yBot) {
  const act = x.pieces.filter((p) => !p.idle), span = act.reduce((t, p) => t + (p.b - p.a), 0) / 60000;
  const step = [5, 10, 15, 30, 60, 120].find((st) => (span / st) * 70 <= W) ?? 240;
  let last = -Infinity;
  for (const p of act) for (let t = Math.ceil(p.a / (step * 60000)) * step * 60000; t <= p.b; t += step * 60000) {
    const gx = x(t); o.push(`<line x1="${gx.toFixed(1)}" y1="${yTop}" x2="${gx.toFixed(1)}" y2="${yBot}" stroke="#ebe8e0"/>`);
    if (gx - last > 52) { o.push(`<text x="${gx.toFixed(1)}" y="${yBot + 16}" text-anchor="middle" fill="#777">${clock.format(t)}</text>`); last = gx; }
  }
  const placed = [];
  for (const p of x.pieces.filter((q) => q.idle && q.b - q.a >= 5 * 60000).sort((m, n) => (n.b - n.a) - (m.b - m.a))) {
    const cx = (p.xa + p.xb) / 2, txt = `+${hm((p.b - p.a) / 60000)}`, w = txt.length * 6.2 + 6;
    if (placed.some(([l, r]) => cx - w / 2 < r && cx + w / 2 > l)) continue;
    placed.push([cx - w / 2, cx + w / 2]);
    o.push(`<text x="${cx.toFixed(1)}" y="${yBot + 32}" text-anchor="middle" fill="#a0957e" font-size="11">${txt}</text>`);
  }
}

function breaks(o, x, yTop, yBot) {
  for (const p of x.pieces) if (p.idle) o.push(`<rect x="${p.xa.toFixed(1)}" y="${yTop}" width="${(p.xb - p.xa).toFixed(1)}" height="${yBot - yTop}" fill="#efe9dc"/>`);
}

// a run's own waits while the chart's clock runs (others busy): hatched, at scale
function waits(o, gaps, x, yTop, yBot) {
  for (const [a, b] of gaps) { const xa = x(a), xb = x(b); if (xb - xa > breakPx(b - a) + 1) o.push(`<rect x="${xa.toFixed(1)}" y="${yTop}" width="${(xb - xa).toFixed(1)}" height="${yBot - yTop}" fill="url(#idle)"/>`); }
}

// cumulative spend, each stretch coloured by its spend rate; the dashed line marks half the spend in active time
function spendStrip(o, rows, x, t0, t1, L, W, cy0, ch) {
  const total = rows.reduce((a, r) => a + (r.cost ?? 0), 0), ticks = [...new Set([t0, ...rows.flatMap((r) => [r.start, r.end]), t1])].sort((a, b) => a - b);
  const maxRate = Math.max(SCALE, ...rows.map((r) => r.rate)), cyOf = (c) => cy0 - (total ? c / total : 0) * ch;
  let cum = 0, half = null, act = 0, actHalf = 0; const line = [];
  for (let k = 0; k + 1 < ticks.length; k++) {
    const a = ticks[k], b = ticks[k + 1], rate = rows.reduce((s, r) => s + (r.start <= a && r.end >= b && r.ms ? (r.cost ?? 0) / r.ms : 0), 0);
    const next = cum + rate * (b - a), running = rows.some((r) => r.start <= a && r.end >= b);
    if (half == null && next >= total / 2 && rate > 0) { half = a + (total / 2 - cum) / rate; actHalf = act + (half - a); }
    if (running) act += b - a;
    const [xa, xb, ya, yb] = [x(a).toFixed(1), x(b).toFixed(1), cyOf(cum).toFixed(1), cyOf(next).toFixed(1)], c = rate > 0 ? colour(rate * 60000, maxRate) : "#ddd8cc";
    o.push(`<polygon points="${xa},${cy0} ${xa},${ya} ${xb},${yb} ${xb},${cy0}" fill="${c}" stroke="${c}" stroke-width="0.5"/>`);
    line.push(`${xa},${ya}`, `${xb},${yb}`); cum = next;
  }
  o.push(`<polyline points="${line.join(" ")}" fill="none" stroke="#0005" stroke-width="1"/>`, `<line x1="${L}" y1="${cy0}" x2="${L + W}" y2="${cy0}" stroke="#bbb"/>`,
    `<text x="${L - 8}" y="${cy0 - ch + 4}" text-anchor="end" fill="#555">$${total.toFixed(2)}</text>`, `<text x="16" y="${cy0 - ch / 2 + 4}" fill="#333">spend</text>`);
  if (half != null) o.push(`<line x1="${x(half).toFixed(1)}" y1="${cy0 - ch / 2}" x2="${x(half).toFixed(1)}" y2="${cy0}" stroke="#333" stroke-dasharray="2 3"/>`,
    `<text x="${(x(half) + 5).toFixed(1)}" y="${cy0 - 6}" fill="#333">half by ${hm(actHalf / 60000)}</text>`);
}

const HEAD = (w, h) => [`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" font-family="Helvetica,Arial,sans-serif" font-size="12">`,
  `<defs><pattern id="idle" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#f4f0e6"/><line x1="0" y1="0" x2="0" y2="8" stroke="#e6dfcd" stroke-width="3"/></pattern></defs>`,
  `<rect width="100%" height="100%" fill="#fbfaf7"/>`];

function svgRun(run) {
  const rows = run.rows, t0 = Math.min(...rows.map((r) => r.start)), t1 = run.last, gs = groups(rows), gaps = idle(rows, t0, t1);
  const L = 200, W = 860, R = 80, aTop = 86, aH = 50, cy0 = aTop + aH + 80, top = cy0 + 30, H = top + blockHeight(gs) + 50;
  const x = makeScale(t0, t1, gaps, L, W), o = HEAD(L + W + R, H);
  breaks(o, x, aTop, H - 40);
  header(o, run.name, totals(rows, t0, t1), W);
  const ev = rows.flatMap((r) => [[r.start, 1], [r.end, -1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let n = 0, peak = 0; for (const [, d] of ev) { n += d; peak = Math.max(peak, n); }
  const base = aTop + aH, sy = (k) => base - k * (aH / Math.max(peak, 1)); n = 0; const pts = [`${L},${base}`];
  for (const [t, d] of ev) { pts.push(`${x(t).toFixed(1)},${sy(n).toFixed(1)}`); n += d; pts.push(`${x(t).toFixed(1)},${sy(n).toFixed(1)}`); }
  pts.push(`${L + W},${base}`);
  o.push(`<text x="16" y="${base - aH / 2 + 4}" fill="#333">agents</text><text x="${L - 8}" y="${aTop + 4}" text-anchor="end" fill="#555">${peak}</text>`,
    `<polygon points="${pts.join(" ")}" fill="#c9d3e6" stroke="#5b6f99" stroke-width="1"/>`);
  spendStrip(o, rows, x, t0, t1, L, W, cy0, 60);
  axis(o, x, W, aTop, H - 40);
  drawBlock(o, gs, x, top, L, W);
  o.push("</svg>");
  return o.join("\n");
}

const PALETTE = ["#4e79a7", "#f28e2b", "#59a14f", "#b07aa1", "#e15759", "#76b7b2", "#edc948", "#9c755f", "#bab0ac", "#ff9da7"];

function svgProject(runs) {
  const all = runs.flatMap((r) => r.rows);
  const t0 = Math.min(FROM ? Date.parse(FROM) : Infinity, ...all.map((r) => r.start)), t1 = Math.max(TO ? Date.parse(TO) : -Infinity, ...runs.map((r) => r.last));
  runs.sort((a, b) => Math.min(...a.rows.map((r) => r.start)) - Math.min(...b.rows.map((r) => r.start)));
  runs.forEach((r, i) => { r.colour = PALETTE[i % PALETTE.length]; r.gs = groups(r.rows); });
  const L = 200, W = 1000, R = 80, sTop = 90, sH = 170, cy0 = sTop + sH + 100, top = cy0 + 30;
  const H = top + runs.reduce((h, r) => h + 26 + blockHeight(r.gs) + GAP, 0) + 50, gaps = idle(all, t0, t1);
  const x = makeScale(t0, t1, gaps, L, W), o = HEAD(L + W + R, H);
  breaks(o, x, sTop, H - 40);
  header(o, TITLE ?? "Project", totals(all, t0, t1), W);
  // streamgraph: agents running per building, sampled evenly across the drawn width, stacked about the middle
  const N = 800, ts = Array.from({ length: N + 1 }, (_, i) => x.inv(L + (W * i) / N));
  const counts = runs.map((r) => ts.map((t) => r.rows.reduce((k, s) => k + (s.start <= t && t < s.end ? 1 : 0), 0)));
  const smooth = counts.map((c) => c.map((_, i) => { let t = 0, n = 0; for (let d = -4; d <= 4; d++) if (c[i + d] != null) { t += c[i + d]; n++; } return t / n; }));
  const peak = Math.max(1, ...ts.map((_, i) => counts.reduce((a, c) => a + c[i], 0))), sums = ts.map((_, i) => smooth.reduce((a, c) => a + c[i], 0));
  const mid = sTop + sH / 2, k = (sH - 10) / Math.max(1, ...sums), acc = ts.map((_, i) => mid - (sums[i] * k) / 2);
  o.push(`<text x="16" y="${mid + 4}" fill="#333">agents</text><text x="${L - 8}" y="${mid + 4}" text-anchor="end" fill="#555">peak ${peak}</text>`);
  runs.forEach((r, j) => {
    const lo = acc.slice(), hi = acc.map((y, i) => y + smooth[j][i] * k);
    o.push(`<polygon points="${[...ts.map((t, i) => `${x(t).toFixed(1)},${lo[i].toFixed(1)}`), ...ts.map((t, i) => `${x(t).toFixed(1)},${hi[i].toFixed(1)}`).reverse()].join(" ")}" fill="${r.colour}" fill-opacity="0.85"><title>${esc(r.name)}</title></polygon>`);
    for (let i = 0; i <= N; i++) acc[i] = hi[i];
  });
  let lx = L; runs.forEach((r) => { o.push(`<rect x="${lx}" y="${sTop + sH + 12}" width="10" height="10" rx="2" fill="${r.colour}"/><text x="${lx + 14}" y="${sTop + sH + 21}" fill="#333">${esc(r.name)}</text>`); lx += 34 + r.name.length * 7.4; });
  spendStrip(o, all, x, t0, t1, L, W, cy0, 60);
  axis(o, x, W, sTop, H - 40);
  let y = top;
  for (const r of runs) {
    const bh = 26 + blockHeight(r.gs), e = totals(r.rows, Math.min(...r.rows.map((s) => s.start)), r.last);
    waits(o, idle(r.rows, Math.min(...r.rows.map((s) => s.start)), r.last), x, y + 22, y + bh);
    o.push(`<rect x="16" y="${y + 6}" width="10" height="10" rx="2" fill="${r.colour}"/><text x="32" y="${y + 15}" font-weight="bold" fill="#222">${esc(r.name)}</text>`,
      `<text x="${L + W + 12}" y="${y + 15}" font-weight="bold" fill="#222">$${e.cost.toFixed(2)}</text>`,
      `<line x1="16" y1="${y + 21}" x2="${L + W + R - 10}" y2="${y + 21}" stroke="${r.colour}" stroke-opacity="0.5"/>`);
    drawBlock(o, r.gs, x, y + 26, L, W);
    y += bh + GAP;
  }
  o.push("</svg>");
  return o.join("\n");
}

const png = (svgFile) => { try { execFileSync("rsvg-convert", ["-z", "1.5", "-o", svgFile.replace(/\.svg$/, ".png"), svgFile]); } catch (e) { console.error("no png:", e.message); } };
if (PROJECT) {
  const runs = args.map(sessions);
  writeFileSync(PROJECT, svgProject(runs)); png(PROJECT);
  console.log(`${PROJECT}: ${runs.length} runs, ${runs.reduce((a, r) => a + r.rows.length, 0)} sessions -> svg/png`);
} else for (const dir of args) {
  const run = sessions(dir), out = join(dir, "gantt.svg");
  writeFileSync(out, svgRun(run)); png(out);
  console.log(`${dir}: ${run.rows.length} sessions -> gantt.svg/png`);
}
