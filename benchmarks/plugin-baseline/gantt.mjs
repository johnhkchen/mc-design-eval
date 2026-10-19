#!/usr/bin/env node
// A run's agents on a timeline, from its ledger.jsonl (start = t - ms). Sessions are grouped by role (architect,
// designer, kit, the crew's parts and rooms, inspector, fixes, lamps, fix rounds); a role whose sessions overlap packs
// them into thin stacked lanes, so a wave of forty Haiku agents reads as one clump whose thickness is how many run at
// once. Bar colour is spend per minute (cost / minutes) on one scale for every chart; a lone session also takes its
// rate as bar height. On top: agents running, and the cumulative spend (its slope the spend rate, coloured on the same
// scale). The x axis is the whole wall time, idle stretches included: a gap with no agent running for 5+ minutes is
// shaded and labelled (a run waiting on its checks). Names come from the session tapes (crew/<part-N> cwd -> plan
// parts then rooms; root sessions by model and order); a revise-vN.log marks where each fix round starts.
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

function sessions(dir) {
  const rows = read(join(dir, "ledger.jsonl")).filter((r) => r.model).map((r) => ({ ...r, end: Date.parse(r.t), start: Date.parse(r.t) - (r.ms ?? 0) }));
  const plan = existsSync(join(dir, "plan.json")) ? JSON.parse(readFileSync(join(dir, "plan.json"), "utf8")) : {};
  const names = [...(plan.parts ?? []).map((p) => p.name), ...(plan.rooms ?? []).map((r) => r.name)];
  // tapes: file name = start time, first frame carries the cwd
  const tapes = existsSync(join(dir, "sessions")) ? readdirSync(join(dir, "sessions")).map((f) => {
    const m = f.match(/^(\d{4}-\d\d-\d\dT\d\d)-(\d\d)-(\d\d)-(\d{3})Z/);
    let cwd = "";
    try { cwd = JSON.parse(readFileSync(join(dir, "sessions", f), "utf8").split("\n")[0]).cwd ?? ""; } catch {}
    return { start: m ? Date.parse(`${m[1]}:${m[2]}:${m[3]}.${m[4]}Z`) : NaN, cwd };
  }) : [];
  // fix rounds: each revise-vN.log was created when its round started
  const rounds = readdirSync(dir).map((f) => f.match(/^revise-(v\d+)\.log$/)).filter(Boolean)
    .map((m) => ({ v: m[1], at: statSync(join(dir, m[0])).birthtimeMs, until: statSync(join(dir, m[0])).mtimeMs })).sort((a, b) => a.at - b.at);
  const used = new Set();
  let art = 0, rootHaiku = 0;
  for (const r of rows.sort((a, b) => a.start - b.start)) {
    let best = -1, gap = 5000;
    tapes.forEach((t, i) => { const d = Math.abs(t.start - r.start); if (!used.has(i) && d < gap) { gap = d; best = i; } });
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

// stretches of 5+ minutes inside [t0, t1] with no session running
function idle(rows, t0, t1) {
  const iv = rows.map((r) => [r.start, r.end]).sort((a, b) => a[0] - b[0]), out = [];
  let at = t0;
  for (const [a, b] of iv) { if (a - at >= 5 * 60000) out.push([at, a]); at = Math.max(at, b); }
  if (t1 - at >= 5 * 60000) out.push([at, t1]);
  return out;
}

const LANE = 5, ROW = 24, GAP = 8, COLLAPSE = 10 * 60000, IDLE_PX = 34;

// time -> x with every idle stretch of 10+ minutes collapsed to a narrow break, so active time takes the width
function makeScale(t0, t1, gaps, L, W) {
  const G = gaps.filter(([a, b]) => b - a >= COLLAPSE).sort((p, q) => p[0] - q[0]);
  const active = Math.max(1, t1 - t0 - G.reduce((t, [a, b]) => t + b - a, 0)), k = (W - G.length * IDLE_PX) / active;
  const pieces = []; let cur = t0, pos = L;
  for (const [a, b] of G) { pieces.push({ a: cur, b: a, xa: pos, xb: pos + (a - cur) * k }); pos += (a - cur) * k; pieces.push({ a, b, xa: pos, xb: pos + IDLE_PX, idle: true }); pos += IDLE_PX; cur = b; }
  pieces.push({ a: cur, b: t1, xa: pos, xb: L + W });
  const x = (t) => { if (t <= t0) return L; for (const p of pieces) if (t <= p.b) return p.xa + (p.b > p.a ? (t - p.a) / (p.b - p.a) : 0) * (p.xb - p.xa); return L + W; };
  x.inv = (px) => { for (const p of pieces) if (px <= p.xb) return p.a + (p.xb > p.xa ? (px - p.xa) / (p.xb - p.xa) : 0) * (p.b - p.a); return t1; };
  x.pieces = pieces;
  return x;
}

// what the whole thing cost end to end: wall time against time with an agent running, agent-hours, tokens, dollars
const big = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n));
function endToEnd(rows, t0, t1) {
  const iv = rows.map((r) => [r.start, r.end]).sort((a, b) => a[0] - b[0]); let act = 0, s0 = null, e0 = null;
  for (const [a, b] of iv) { if (s0 === null || a > e0) { if (s0 !== null) act += e0 - s0; s0 = a; e0 = b; } else e0 = Math.max(e0, b); } if (s0 !== null) act += e0 - s0;
  const sum = (f) => rows.reduce((t, r) => t + (r[f] ?? 0), 0), agentMin = sum("ms") / 60000, wall = (t1 - t0) / 60000, active = act / 60000;
  return { wall, active, idle: wall - active, agentMin, avg: active ? agentMin / active : 0, cost: sum("cost"), out: sum("out"), inp: sum("in"), cr: sum("cacheRead"), cw: sum("cacheWrite"),
    time: `end to end ${hm(wall)}: ${hm(active)} with an agent running (${Math.round((active / wall) * 100)}%), ${hm(wall - active)} with none (idle stretches of 10+ min collapsed to a break) · ${(agentMin / 60).toFixed(1)} agent-hours, ${(active ? agentMin / active : 0).toFixed(1)} agents on average while any ran`,
    tokens: (c) => `tokens: ${big(sum("out"))} out, ${big(sum("cacheRead"))} cache read, ${big(sum("cacheWrite"))} cache write, ${big(sum("in"))} in · $${sum("cost").toFixed(2)} (${c})` };
}
function blockHeight(gs) { return gs.reduce((h, g) => h + (g.lanes > 1 ? Math.max(ROW, g.lanes * LANE + 8) : ROW) + 2, 0); }

// one run's roles from y0 down: a row per lone role (bar height = rate), a clump per overlapping role
function drawBlock(o, gs, x, y0, L, maxRate) {
  let y = y0;
  for (const g of gs) {
    const clump = g.lanes > 1, h = clump ? Math.max(ROW, g.lanes * LANE + 8) : ROW, mid = y + h / 2;
    const label = clump ? `${g.name} ×${g.rows.length}` : g.rows.length > 1 ? `${g.name} ×${g.rows.length}` : g.name;
    o.push(`<text x="${L - 8}" y="${mid + 4}" text-anchor="end" fill="#222">${esc(label.slice(0, 34))}</text>`);
    for (const r of g.rows) {
      const bx = x(r.start), bw = Math.max(2, x(r.end) - bx);
      const bh = clump ? LANE - 1 : Math.max(3, (r.rate / maxRate) * (ROW - 6));
      const by = clump ? y + 4 + r.lane * LANE : mid - bh / 2;
      o.push(`<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${clump ? 1 : 2}" fill="${colour(r.rate, maxRate)}" stroke="#0002" stroke-width="0.5"><title>${esc(r.name)}: ${r.model}${r.effort ? "@" + r.effort : ""} $${(r.cost ?? 0).toFixed(2)} · ${r.min.toFixed(1)}m</title></rect>`);
    }
    const ex = x(g.end) + 6, peak = clump ? ` · peak ${g.lanes}` : "";
    const lone = g.rows.length === 1 ? g.rows[0] : null;
    const note = lone ? `${lone.model}${lone.effort ? "@" + lone.effort : ""} $${(lone.cost ?? 0).toFixed(2)} · ${lone.min.toFixed(1)}m${lone.out ? ` · ${(lone.out / 1000).toFixed(0)}K out` : ""}`
      : `$${g.cost.toFixed(2)} · ${hm((g.end - g.start) / 60000)} wall${peak}`;
    o.push(`<text x="${ex.toFixed(1)}" y="${mid + 4}" fill="#555">${esc(note)}</text>`);
    y += h + 2;
  }
  return y - y0;
}

// clock ticks every 5/10/15/30/60 minutes over the active stretches, a break mark where idle time was collapsed
function axis(o, x, W, yTop, yBot) {
  const act = x.pieces.filter((p) => !p.idle), span = act.reduce((t, p) => t + (p.b - p.a), 0) / 60000;
  const step = [5, 10, 15, 30, 60, 120].find((st) => (span / st) * 70 <= W) ?? 240;
  let lastLabel = -Infinity;
  for (const p of x.pieces) {
    if (p.idle) { o.push(`<path d="M${(p.xa + 6).toFixed(1)},${yBot + 4} l4,-8 M${(p.xb - 10).toFixed(1)},${yBot + 4} l4,-8" stroke="#8a7f6a" stroke-width="1.5"/>`,
      `<text x="${((p.xa + p.xb) / 2).toFixed(1)}" y="${yBot + 30}" text-anchor="middle" fill="#8a7f6a" font-size="11">+${hm((p.b - p.a) / 60000)}</text>`); continue; }
    for (let t = Math.ceil(p.a / (step * 60000)) * step * 60000; t <= p.b; t += step * 60000) {
      const gx = x(t); o.push(`<line x1="${gx.toFixed(1)}" y1="${yTop}" x2="${gx.toFixed(1)}" y2="${yBot}" stroke="#e3e0d8"/>`);
      if (gx - lastLabel > 52 && x.pieces.every((q) => !q.idle || gx < q.xa - 24 || gx > q.xb + 24)) { o.push(`<text x="${gx.toFixed(1)}" y="${yBot + 16}" text-anchor="middle" fill="#777">${clock.format(t)}</text>`); lastLabel = gx; }
    }
  }
}

// collapsed idle time: a plain strip behind the whole chart (its duration is on the axis)
function breaks(o, x, yTop, yBot) {
  for (const p of x.pieces) if (p.idle) o.push(`<rect x="${p.xa.toFixed(1)}" y="${yTop}" width="${(p.xb - p.xa).toFixed(1)}" height="${yBot - yTop}" fill="#efe9dc"/>`);
}

function idleBands(o, gaps, x, yTop, yBot, label = true) {
  gaps = gaps.filter(([a, b]) => b - a < COLLAPSE || x(b) - x(a) > IDLE_PX + 1);   // collapsed stretches are drawn by breaks()
  for (const [a, b] of gaps) {
    const xa = x(a), xb = x(b), w = xb - xa, txt = `no agent · ${hm((b - a) / 60000)}`;
    o.push(`<rect x="${xa.toFixed(1)}" y="${yTop}" width="${w.toFixed(1)}" height="${yBot - yTop}" fill="url(#idle)"/>`);
    if (!label) continue;
    if (w > 100 && yBot - yTop > 30) o.push(`<text x="${(xa + w / 2).toFixed(1)}" y="${yBot - 6}" text-anchor="middle" fill="#8a7f6a">${txt}</text>`);
  }
}

// cumulative spend: piecewise linear between session starts and ends, slope = the summed rate of the sessions running
function spendStrip(o, rows, x, t0, t1, L, W, cy0, ch, maxRate) {
  const total = rows.reduce((a, r) => a + (r.cost ?? 0), 0), ticks = [...new Set([t0, ...rows.flatMap((r) => [r.start, r.end]), t1])].sort((a, b) => a - b);
  const cyOf = (c) => cy0 - (total ? c / total : 0) * ch;
  let cum = 0, half = null, act = 0, actHalf = null; const line = [];
  for (let k = 0; k + 1 < ticks.length; k++) {
    const a = ticks[k], b = ticks[k + 1];
    const rate = rows.reduce((s, r) => s + (r.start <= a && r.end >= b && r.ms ? (r.cost ?? 0) / r.ms : 0), 0);   // $/ms
    const next = cum + rate * (b - a);
    const running = rows.some((r) => r.start <= a && r.end >= b);
    if (half == null && next >= total / 2 && rate > 0) { half = a + (total / 2 - cum) / rate; actHalf = act + (half - a); }
    if (running) act += b - a;
    const [xa, xb, ya, yb] = [x(a).toFixed(1), x(b).toFixed(1), cyOf(cum).toFixed(1), cyOf(next).toFixed(1)];
    const c = rate > 0 ? colour(rate * 60000, maxRate) : "#d9d4c7";
    o.push(`<polygon points="${xa},${cy0} ${xa},${ya} ${xb},${yb} ${xb},${cy0}" fill="${c}" stroke="${c}" stroke-width="0.5"/>`);
    line.push(`${xa},${ya}`, `${xb},${yb}`);
    cum = next;
  }
  o.push(`<polyline points="${line.join(" ")}" fill="none" stroke="#0005" stroke-width="1"/>`,
    `<text x="16" y="${cy0 - ch + 10}" fill="#333">spend so far</text>`, `<text x="16" y="${cy0 - ch + 25}" fill="#777">(slope = $/min)</text>`,
    ...[0, 0.5, 1].map((f) => `<line x1="${L}" y1="${cy0 - f * ch}" x2="${L + W}" y2="${cy0 - f * ch}" stroke="#0003" stroke-dasharray="${f ? "3 3" : ""}"/><text x="${L - 8}" y="${cy0 - f * ch + 4}" text-anchor="end" fill="#777">${f ? `${f * 100}% · $${(total * f).toFixed(2)}` : "0%"}</text>`));
  if (half != null) o.push(`<line x1="${x(half).toFixed(1)}" y1="${cy0 - ch / 2}" x2="${x(half).toFixed(1)}" y2="${cy0}" stroke="#333" stroke-dasharray="2 3"/>`,
    `<text x="${(x(half) + 6).toFixed(1)}" y="${cy0 - 6}" fill="#333" font-weight="bold">half the spend in ${hm(actHalf / 60000)} of active time (of ${hm(act / 60000)})</text>`);
  return total;
}

const HEAD = (w, h) => [`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" font-family="Helvetica,Arial,sans-serif" font-size="12">`,
  `<defs><pattern id="idle" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#f1ece0"/><line x1="0" y1="0" x2="0" y2="8" stroke="#e2d9c4" stroke-width="3"/></pattern></defs>`,
  `<rect width="100%" height="100%" fill="#fbfaf7"/>`];
const byModel = (rows) => Object.entries(rows.reduce((a, r) => ((a[r.model] = (a[r.model] ?? 0) + (r.cost ?? 0)), a), {})).map(([m, c]) => `${m} $${c.toFixed(2)}`).join(" · ");

function svgRun(run) {
  const rows = run.rows, t0 = Math.min(...rows.map((r) => r.start)), t1 = run.last, gs = groups(rows);
  const maxRate = Math.max(SCALE, ...rows.map((r) => r.rate));
  const L = 230, W = 820, R = 260, D = 36, top = 250 + D, H = top + blockHeight(gs) + 60, gaps = idle(rows, t0, t1);
  const x = makeScale(t0, t1, gaps, L, W), e = endToEnd(rows, t0, t1);
  const o = HEAD(L + W + R, H);
  breaks(o, x, 80 + D, H - 40);
  o.push(`<text x="16" y="24" font-size="16" font-weight="bold">${esc(run.name)}: ${rows.length} agent sessions, ${hm(e.wall)} end to end, ${hm(e.active)} active, $${e.cost.toFixed(2)}</text>`,
    `<text x="16" y="42" fill="#555">bar colour = spend per minute (deepest red = $${maxRate.toFixed(2)}/min, the same in every chart); overlapping sessions of one role stack into a clump, one thin lane each</text>`,
    `<text x="16" y="60" fill="#333">${esc(e.time)}</text>`, `<text x="16" y="78" fill="#333">${esc(e.tokens(byModel(rows)))}</text>`);
  // agents running: a filled step line on the run's wall time
  const ev = rows.flatMap((r) => [[r.start, 1], [r.end, -1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let n = 0, peak = 0; for (const [, d] of ev) { n += d; peak = Math.max(peak, n); }
  const base = 110 + D, sy = (k) => base - k * (45 / Math.max(peak, 1)); n = 0; const pts = [`${L},${base}`];
  for (const [t, d] of ev) { pts.push(`${x(t).toFixed(1)},${sy(n).toFixed(1)}`); n += d; pts.push(`${x(t).toFixed(1)},${sy(n).toFixed(1)}`); }
  pts.push(`${L + W},${base}`);
  o.push(`<text x="16" y="${90 + D}" fill="#333">agents running</text><text x="16" y="${105 + D}" fill="#777">(peak ${peak})</text>`,
    `<polygon points="${pts.join(" ")}" fill="#c9d6e8" stroke="#4a6fa5" stroke-width="1"/>`, `<line x1="${L}" y1="${base}" x2="${L + W}" y2="${base}" stroke="#999"/>`);
  idleBands(o, gaps, x, top - 8, H - 40);
  spendStrip(o, rows, x, t0, t1, L, W, 220 + D, 90, maxRate);
  axis(o, x, W, top - 8, H - 40);
  drawBlock(o, gs, x, top, L, maxRate);
  o.push("</svg>");
  return o.join("\n");
}

const PALETTE = ["#4e79a7", "#f28e2b", "#59a14f", "#b07aa1", "#e15759", "#76b7b2", "#edc948", "#9c755f", "#bab0ac", "#ff9da7"];

function svgProject(runs) {
  const all = runs.flatMap((r) => r.rows);
  const t0 = Math.min(FROM ? Date.parse(FROM) : Infinity, ...all.map((r) => r.start)), t1 = Math.max(TO ? Date.parse(TO) : -Infinity, ...runs.map((r) => r.last));
  const maxRate = Math.max(SCALE, ...all.map((r) => r.rate));
  runs.sort((a, b) => Math.min(...a.rows.map((r) => r.start)) - Math.min(...b.rows.map((r) => r.start)));
  runs.forEach((r, i) => { r.colour = PALETTE[i % PALETTE.length]; r.gs = groups(r.rows); });
  const L = 230, W = 1000, R = 260, sTop = 114, sH = 190, cy0 = sTop + sH + 120, ch = 80, top = cy0 + 50;
  const H = top + runs.reduce((h, r) => h + 26 + blockHeight(r.gs) + GAP, 0) + 60, gaps = idle(all, t0, t1);
  const x = makeScale(t0, t1, gaps, L, W), e = endToEnd(all, t0, t1);
  const o = HEAD(L + W + R, H);
  breaks(o, x, sTop - 4, H - 40);
  o.push(`<text x="16" y="24" font-size="16" font-weight="bold">${esc(TITLE ?? "Project")}: ${runs.length} buildings, ${all.length} agent sessions, ${hm(e.wall)} end to end, ${hm(e.active)} active, $${e.cost.toFixed(2)}</text>`,
    `<text x="16" y="42" fill="#555">top: agents running per building, stacked about the middle (a streamgraph); below: each building's roles, overlapping sessions stacked into clumps; bar colour = spend per minute (deepest red = $${maxRate.toFixed(2)}/min)</text>`,
    `<text x="16" y="60" fill="#333">${esc(e.time)}</text>`, `<text x="16" y="78" fill="#333">${esc(e.tokens(byModel(all)))}</text>`);
  // streamgraph: counts per building sampled evenly across the drawn width, stacked symmetric about the centre line
  const N = 800, ts = Array.from({ length: N + 1 }, (_, i) => x.inv(L + (W * i) / N));
  const counts = runs.map((r) => ts.map((t) => r.rows.reduce((k, s) => k + (s.start <= t && t < s.end ? 1 : 0), 0)));
  const smooth = counts.map((c) => c.map((_, i) => { let t = 0, n = 0; for (let d = -4; d <= 4; d++) if (c[i + d] != null) { t += c[i + d]; n++; } return t / n; }));
  const raw = ts.map((_, i) => counts.reduce((a, c) => a + c[i], 0)), sums = ts.map((_, i) => smooth.reduce((a, c) => a + c[i], 0));
  const peak = Math.max(1, ...raw), mid = sTop + sH / 2, k = (sH - 10) / Math.max(1, ...sums);
  const acc = ts.map((_, i) => mid - (sums[i] * k) / 2), boxes = [];
  o.push(`<text x="16" y="${mid - 6}" fill="#333">agents running</text><text x="16" y="${mid + 9}" fill="#777">(peak ${peak} at once)</text>`);
  runs.forEach((r, j) => {
    const lo = acc.slice(), hi = acc.map((y, i) => y + smooth[j][i] * k);
    const poly = [...ts.map((t, i) => `${x(t).toFixed(1)},${lo[i].toFixed(1)}`), ...ts.map((t, i) => `${x(t).toFixed(1)},${hi[i].toFixed(1)}`).reverse()];
    o.push(`<polygon points="${poly.join(" ")}" fill="${r.colour}" fill-opacity="0.85" stroke="${r.colour}" stroke-width="0.5"><title>${esc(r.name)}</title></polygon>`);
    const tw = r.name.length * 6.8 + 6, half = Math.ceil((tw / 2 / W) * N);
    let best = null;
    for (let i = half; i <= N - half; i++) {
      let thin = Infinity; for (let d = -half; d <= half; d++) thin = Math.min(thin, (hi[i + d] - lo[i + d]));
      if (thin < 14 || (best && thin <= best.thin)) continue;
      const bx = x(ts[i]) - tw / 2, by = (lo[i] + hi[i]) / 2 - 7;
      if (boxes.some((q) => bx < q.x + q.w && bx + tw > q.x && by < q.y + 14 && by + 14 > q.y)) continue;
      best = { i, thin, bx, by };
    }
    if (best) { boxes.push({ x: best.bx, y: best.by, w: tw }); o.push(`<text x="${x(ts[best.i]).toFixed(1)}" y="${(best.by + 11).toFixed(1)}" text-anchor="middle" fill="#fff" font-weight="bold">${esc(r.name)}</text>`); }
    for (let i = 0; i <= N; i++) acc[i] = hi[i];
  });
  // legend
  let lx = L; runs.forEach((r) => { o.push(`<rect x="${lx}" y="${sTop + sH + 14}" width="10" height="10" rx="2" fill="${r.colour}"/><text x="${lx + 14}" y="${sTop + sH + 23}" fill="#333">${esc(r.name)}</text>`); lx += 34 + r.name.length * 7.4; });
  spendStrip(o, all, x, t0, t1, L, W, cy0, ch, maxRate);
  axis(o, x, W, sTop - 4, H - 40);
  // each building: a header row in its colour, its idle stretches shaded, then its roles
  let y = top;
  for (const r of runs) {
    const bh = 26 + blockHeight(r.gs), cost = r.rows.reduce((a, s) => a + (s.cost ?? 0), 0), r0 = Math.min(...r.rows.map((s) => s.start));
    idleBands(o, idle(r.rows, r0, r.last), x, y + 22, y + bh);
    o.push(`<rect x="16" y="${y + 6}" width="10" height="10" rx="2" fill="${r.colour}"/>`,
      `<text x="32" y="${y + 15}" font-weight="bold" fill="#222">${esc(r.name)}</text>`,
      `<text x="${L + 4}" y="${y + 15}" fill="#555">${r.rows.length} sessions · $${cost.toFixed(2)} · ${clock.format(r0)} to ${clock.format(r.last)} (${hm((r.last - r0) / 60000)})</text>`,
      `<line x1="16" y1="${y + 21}" x2="${L + W}" y2="${y + 21}" stroke="${r.colour}" stroke-opacity="0.5"/>`);
    drawBlock(o, r.gs, x, y + 26, L, maxRate);
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
