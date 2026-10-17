import { schedule as plan, criticalPath, hoursOf as hoursFor } from "./schedule.js";

const STAGES = ["capture", "plan", "earthworks", "buildings", "done"];
const NEXT = { queued: "loaded", loaded: "running", running: "done" };
const PREV = { loaded: "queued", running: "loaded", done: "running" };
const state = { town: null, projects: [], tasks: [], pool: { cannons: 20, secPerBlock: 1.5, setupMin: 5 }, ready: false, canWrite: true };
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmtH = (h) => h < 1 ? Math.round(h * 60) + " min" : h.toFixed(1) + " h";
const hoursOf = (t) => hoursFor(t, state.pool);
const byId = () => Object.fromEntries(state.tasks.map((t) => [t.id, t]));
const blockers = (t, ix) => (t.deps || []).filter((d) => ix[d] && ix[d].status !== "done" && ix[d].status !== "dropped");
const projOf = (id) => state.projects.find((p) => p.id === id);
const projColor = (id) => `var(--p${(((projOf(id)?.order || 1) - 1) % 4) + 1})`;
const projLabel = (p) => p ? `${p.code || p.id} · ${p.name || "unnamed"}${p.placeholder ? " (placeholder)" : ""}` : "";

const schedule = () => plan(state.tasks, state.pool);

function renderStats(sch) {
  const cannon = state.tasks.filter((t) => t.kind === "cannon"), open = cannon.filter((t) => t.status !== "done" && t.status !== "dropped");
  const busy = cannon.filter((t) => t.status === "loaded" || t.status === "running").length;
  const work = open.reduce((a, t) => a + (t.work || 0), 0);
  $("stats").innerHTML = [
    ["Projects", state.projects.length], ["Cannons busy", `${busy}/${state.pool.cannons}`],
    ["Blocks left", work.toLocaleString()], ["Cannon-hours left", fmtH(work * state.pool.secPerBlock / 3600)], ["Critical path", fmtH(criticalPath(state.tasks, state.pool))], ["Est. finish", sch.bars.length ? fmtH(sch.end) : "—"]
  ].map(([k, v]) => `<div class="stat"><span class="eyebrow">${k}</span><b>${v}</b></div>`).join("");
}

function renderMap() {
  if (!state.projects.length) { $("mapBody").className = "empty"; $("mapBody").textContent = "No parcels yet. Claude adds each development here as it is planned."; return; }
  const bb = state.projects.map((p) => p.bbox).filter(Boolean);
  const x0 = Math.min(...bb.map((b) => b[0])) - 12, z0 = Math.min(...bb.map((b) => b[1])) - 12, x1 = Math.max(...bb.map((b) => b[2])) + 12, z1 = Math.max(...bb.map((b) => b[3])) + 12;
  const W = x1 - x0, H = z1 - z0;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Parcels and cannon job footprints in world coordinates"><defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--rule)" stroke-width="2"/></pattern></defs>`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="var(--sheet)"/>`;
  for (let gx = Math.ceil(x0 / 16) * 16; gx < x1; gx += 16) s += `<line x1="${gx - x0}" y1="0" x2="${gx - x0}" y2="${H}" stroke="var(--rule)" stroke-width="${gx % 64 ? .2 : .5}"/>`;
  for (let gz = Math.ceil(z0 / 16) * 16; gz < z1; gz += 16) s += `<line x1="0" y1="${gz - z0}" x2="${W}" y2="${gz - z0}" stroke="var(--rule)" stroke-width="${gz % 64 ? .2 : .5}"/>`;
  const col = { dropped: "var(--dropped)", queued: "var(--queued)", loaded: "var(--loaded)", running: "var(--running)", done: "var(--done)" };
  for (const p of state.projects) { const [a, b, c, d] = p.bbox;
    s += `<a href="#p-${esc(p.id)}"><rect x="${a - x0}" y="${b - z0}" width="${c - a + 1}" height="${d - b + 1}" fill="${p.stage === "done" ? "url(#hatch)" : "var(--parcel)"}" fill-opacity="${p.stage === "done" ? 1 : .55}" stroke="${projColor(p.id)}" stroke-width="1.2"/></a>`; }
  const jobs = state.tasks.filter((t) => t.kind === "cannon" && t.foot && t.status !== "dropped" && t.file !== "0-staging.nbt").sort((a, b) => (b.foot[2] - b.foot[0]) * (b.foot[3] - b.foot[1]) - (a.foot[2] - a.foot[0]) * (a.foot[3] - a.foot[1]));
  for (const t of jobs) { const [a, b, c, d] = t.foot;
    s += `<rect x="${a - x0 + .6}" y="${b - z0 + .6}" width="${c - a - .2}" height="${d - b - .2}" fill="${col[t.status]}" fill-opacity="${t.status === "queued" ? .1 : .28}" stroke="${col[t.status]}" stroke-width=".6" stroke-dasharray="${t.kind === "cannon" && /dig/.test(t.file) ? "2 1.5" : ""}"><title>${esc(t.file)} · ${t.status}</title></rect>`; }
  for (const p of state.projects) { const [a, b] = p.bbox;
    s += `<text x="${a - x0 + 3}" y="${b - z0 + 9}" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="9" fill="${projColor(p.id)}" letter-spacing=".6">${esc(p.code || p.id)}</text>`; }
  const lx = Math.ceil(x0 / 64) * 64, lz = Math.ceil(z0 / 64) * 64;
  s += `<text x="${lx - x0 + 1.5}" y="${H - 3}" font-family="JetBrains Mono, monospace" font-size="4.2" fill="var(--muted)">x ${lx}</text><text x="2" y="${lz - z0 - 1.5}" font-family="JetBrains Mono, monospace" font-size="4.2" fill="var(--muted)">z ${lz}</text>`;
  s += `<g transform="translate(${W - 10},14)"><path d="M0,-8 L3,2 L0,0 L-3,2 Z" fill="var(--ink)"/><text y="-10" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-size="6" font-weight="700" fill="var(--ink)">N</text></g></svg>`;
  $("mapBody").className = ""; $("mapBody").innerHTML = s;
}

function jobRow(t, ix, opts = {}) {
  const bl = blockers(t, ix);
  const blocked = t.status === "queued" && bl.length > 0;
  if (t.kind !== "cannon") {
    return `<div class="job ${t.status === "dropped" ? "is-dropped" : ""}"><input class="box" type="checkbox" id="cb-${esc(t.id)}" data-todo="${esc(t.id)}" ${t.status === "done" ? "checked" : ""} ${state.canWrite ? "" : "disabled"}><label for="cb-${esc(t.id)}" class="t">${esc(t.title)}</label><span></span></div>`;
  }
  const corner = (t.corner || []).join(" ");
  const mats = Object.entries(t.materials || {}).sort((a, b) => b[1] - a[1]);
  const label = blocked ? "waiting" : t.status;
  if (t.status === "dropped") return `<div class="job is-dropped"><button class="chip" data-s="dropped" disabled>dropped</button><span class="t">${esc(t.title)} <span class="muted mono" style="font-weight:400;font-size:.8rem">${esc(t.file || "")}</span></span><span>${state.canWrite ? `<button class="back" data-restore="${esc(t.id)}" title="Restore to queued" aria-label="Restore ${esc(t.title)}">↶</button>` : ""}</span></div>`;
  return `<div class="job">
    <button class="chip" data-s="${t.status}" ${blocked ? "data-blocked" : ""} data-job="${esc(t.id)}" ${blocked || t.status === "done" || !state.canWrite ? "disabled" : ""} title="${blocked ? "Waits on " + esc(bl.map((d) => ix[d].file).join(", ")) : t.status === "done" ? "Done" : "Mark " + NEXT[t.status]}">${label}</button>
    <span class="t">${opts.project ? `<span class="eyebrow" style="color:${projColor(t.project)}">${esc(projOf(t.project)?.code || t.project)}</span> ` : ""}${esc(t.title)} <span class="muted mono" style="font-weight:400;font-size:.8rem">${esc(t.file)}</span></span>
    <span>${t.status !== "queued" && state.canWrite ? `<button class="back" data-back="${esc(t.id)}" aria-label="Step ${esc(t.file)} back to ${PREV[t.status]}" title="Back to ${PREV[t.status]}">↶</button>` : ""}</span>
    <div class="sub">
      <span>corner <button class="copy" data-copy="${esc(corner)}" title="Copy for the schematic tool">${esc(corner)}</button></span>
      <span>${(t.work || 0).toLocaleString()} blocks · ${fmtH(hoursOf(t))}</span>
      ${t.asset ? `<a href="/api/assets/${t.asset.split("/").map(encodeURIComponent).join("/")}" download="${esc(t.file)}">download .nbt</a>` : ""}
      ${Number.isInteger(t.cannon) && t.status !== "done" && t.status !== "queued" ? `<span>cannon #${t.cannon + 1}</span>` : ""}
      <span>${esc(t.mode || "")}</span>
      ${blocked ? `<span style="color:var(--blocked)">waits on ${bl.length} job${bl.length > 1 ? "s" : ""}</span>` : ""}
      ${t.status === "queued" && state.canWrite ? `<button class="back" data-drop="${esc(t.id)}" style="font-size:.8rem">drop</button>` : ""}
      ${mats.length ? `<details class="mat"><summary>${mats.length} block kinds</summary><ul>${mats.map(([b, n]) => `<li><span class="mono">${n.toLocaleString()}</span> ${esc(b.replace(/_/g, " "))}</li>`).join("")}</ul></details>` : ""}
    </div></div>`;
}

function renderNext() {
  const ix = byId();
  const ready = state.tasks.filter((t) => t.kind === "cannon" && t.status === "queued" && !blockers(t, ix).length).sort((a, b) => a.seq - b.seq);
  const live = state.tasks.filter((t) => t.kind === "cannon" && (t.status === "loaded" || t.status === "running"));
  const free = state.pool.cannons - live.length;
  if (!ready.length && !live.length) { $("next").innerHTML = `<div class="empty">Nothing ready to load. Jobs waiting on others unlock as those finish.</div>`; return; }
  $("next").innerHTML = `<div class="muted" style="font-size:.85rem">${free} cannon${free === 1 ? "" : "s"} free · ${ready.length} job${ready.length === 1 ? "" : "s"} ready</div>` + live.concat(ready.slice(0, Math.max(0, free) + 2)).map((t) => jobRow(t, ix, { project: true })).join("");
}

function renderYard(sch) {
  const live = Object.fromEntries(state.tasks.filter((t) => t.kind === "cannon" && (t.status === "loaded" || t.status === "running") && Number.isInteger(t.cannon)).map((t) => [t.cannon, t]));
  $("pool").innerHTML = Array.from({ length: state.pool.cannons }, (_, i) => { const t = live[i];
    return `<div class="slot ${t ? (t.status === "running" ? "busy" : "ld") : ""}"><b>#${i + 1}</b>${t ? esc(t.file.replace(".nbt", "")) : '<span class="muted">idle</span>'}</div>`; }).join("");
  const lanes = [...new Set(sch.bars.map((b) => b.c))].sort((a, b) => a - b);
  if (!lanes.length) { $("yard").innerHTML = `<div class="empty">No cannon work left to schedule.</div>`; return; }
  const LW = 46, RH = 18, W = 900, T = Math.max(sch.end, .5), sx = (h) => LW + (h / T) * (W - LW - 10), H = lanes.length * RH + 26;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Estimated schedule per cannon">`;
  const step = T > 8 ? 2 : T > 3 ? 1 : .5;
  for (let h = 0; h <= T + 1e-9; h += step) s += `<line x1="${sx(h)}" y1="0" x2="${sx(h)}" y2="${H - 16}" stroke="var(--rule)" stroke-width="1"/><text x="${sx(h)}" y="${H - 4}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="var(--muted)">${h}h</text>`;
  lanes.forEach((c, i) => { s += `<text x="0" y="${i * RH + 13}" font-family="JetBrains Mono, monospace" font-size="10" fill="var(--muted)">#${c + 1}</text>`; });
  for (const b of sch.bars) { const i = lanes.indexOf(b.c), w = Math.max(2, sx(b.e) - sx(b.s));
    const fill = b.planned ? projColor(b.t.project) : b.t.status === "running" ? "var(--running)" : "var(--loaded)";
    s += `<rect x="${sx(b.s)}" y="${i * RH + 3}" width="${w}" height="${RH - 6}" fill="${fill}" fill-opacity="${b.planned ? .45 : .9}"><title>${esc(b.t.file)} · ${fmtH(b.e - b.s)} · starts ~${fmtH(b.s)}</title></rect>`;
    if (w > 70) s += `<text x="${sx(b.s) + 4}" y="${i * RH + 13}" font-family="JetBrains Mono, monospace" font-size="9" fill="var(--ink)">${esc(b.t.file.replace(".nbt", ""))}</text>`; }
  s += `</svg>`;
  $("yard").innerHTML = s + `<div class="muted" style="font-size:.8rem;margin-top:6px">Estimate: ${state.pool.secPerBlock} s per block, ${state.pool.setupMin} min to set up each cannon, one setup at a time. Solid bars are loaded or running; pale bars are queued work placed on the next free cannon once its prerequisites finish.</div>`;
}

function renderSettings() {
  const p = state.pool;
  $("settings").innerHTML = `<label>Cannons <input id="set-cannons" type="number" min="1" max="64" value="${p.cannons}" ${state.canWrite ? "" : "disabled"}></label>
    <label>s / block <input id="set-spb" type="number" min="0.1" max="10" step="0.1" value="${p.secPerBlock}" ${state.canWrite ? "" : "disabled"}></label>
    <label>setup min <input id="set-setup" type="number" min="0" max="60" step="1" value="${p.setupMin}" ${state.canWrite ? "" : "disabled"}></label>
    <span class="muted">fed by ${esc(p.feed || "hand")}</span>`;
}

function renderProjects() {
  const ix = byId();
  if (!state.projects.length) { $("projects").innerHTML = ""; return; }
  $("projects").innerHTML = state.projects.slice().sort((a, b) => a.order - b.order).map((p) => {
    const si = STAGES.indexOf(p.stage), tasks = state.tasks.filter((t) => t.project === p.id);
    const done = tasks.filter((t) => t.status === "done").length;
    const groups = STAGES.slice(0, 4).map((st) => { const ts = tasks.filter((t) => t.stage === st).sort((a, b) => a.seq - b.seq);
      if (!ts.length) return ""; const d = ts.filter((t) => t.status === "done").length;
      return `<div class="group"><h3>${st} <span class="muted mono" style="font-size:.8rem">${d}/${ts.length}</span></h3>${ts.map((t) => jobRow(t, ix)).join("")}</div>`; }).join("");
    return `<section class="panel" id="p-${esc(p.id)}">
      <header style="display:flex;flex-wrap:wrap;gap:8px 20px;align-items:end;justify-content:space-between">
        <div><div class="eyebrow">client ${esc(p.client || "—")} · corner ${esc((p.exportCorner || []).join(" "))}</div><h2 style="color:${projColor(p.id)}">${esc(projLabel(p))}</h2></div>
        <div class="stages">${STAGES.map((s, i) => `<span class="stg ${i === si ? "on" : i < si ? "past" : ""}">${s}</span>`).join("")}</div>
      </header>
      <div>${esc(p.summary || "")} <span class="muted">${done}/${tasks.length} tasks done.</span></div>
      ${p.note ? `<div class="note">${esc(p.note)}</div>` : ""}
      ${groups}
    </section>`; }).join("");
}

function render() {
  if (!state.ready) return;
  const sch = schedule();
  if (state.town) { $("townName").textContent = state.town.name || "Town"; $("townCode").textContent = `Town ${state.town.code || ""} · land office · world coordinates`; }
  renderStats(sch); renderMap(); renderNext(); renderSettings(); renderYard(sch); renderProjects();
}

async function setStatus(id, to) {
  const t = state.tasks.find((x) => x.id === id); if (!t) return;
  const patch = { status: to, updatedAt: new Date().toISOString() };
  if (to === "loaded" && !Number.isInteger(t.cannon)) {
    const used = new Set(state.tasks.filter((x) => x.kind === "cannon" && (x.status === "loaded" || x.status === "running") && Number.isInteger(x.cannon)).map((x) => x.cannon));
    let c = 0; while (used.has(c)) c++; patch.cannon = c < state.pool.cannons ? c : null;
  }
  if (to === "queued") patch.cannon = null;
  delete patch.updatedAt;
  await api(`/api/tasks/${encodeURIComponent(id)}`, patch);
}

document.addEventListener("click", async (ev) => {
  const el = ev.target.closest("button"); if (!el) return;
  if (el.dataset.copy) { const v = el.dataset.copy; try { await navigator.clipboard.writeText(v); el.textContent = "copied"; setTimeout(() => (el.textContent = v), 900); } catch { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } return; }
  if (el.dataset.job) { const t = state.tasks.find((x) => x.id === el.dataset.job); if (t && NEXT[t.status]) { el.disabled = true; await setStatus(t.id, NEXT[t.status]); } return; }
  if (el.dataset.drop) { await setStatus(el.dataset.drop, "dropped"); return; }
  if (el.dataset.restore) { await setStatus(el.dataset.restore, "queued"); return; }
  if (el.dataset.back) { const t = state.tasks.find((x) => x.id === el.dataset.back); if (t && PREV[t.status]) await setStatus(t.id, PREV[t.status]); }
});
document.addEventListener("change", async (ev) => {
  const el = ev.target;
  if (el.dataset.todo) { await setStatus(el.dataset.todo, el.checked ? "done" : "queued"); return; }
  const map = { "set-cannons": "cannons", "set-spb": "secPerBlock", "set-setup": "setupMin" };
  if (map[el.id]) { const v = Number(el.value); if (!Number.isFinite(v) || v <= 0 && el.id !== "set-setup") return;
    await api("/api/pool", { [map[el.id]]: el.id === "set-cannons" ? Math.round(v) : v }); }
});

const token = () => { try { return localStorage.getItem("boardToken") || ""; } catch { return ""; } };
const authHeaders = () => (token() ? { authorization: `Bearer ${token()}` } : {});

async function api(path, patch) {
  const r = await fetch(path, { method: "PATCH", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify(patch) }).catch(() => null);
  if (!r || !r.ok) { $("stats").insertAdjacentHTML("beforeend", `<div class="conn">Not saved: ${r ? esc((await r.json()).error) : "the board server isn't reachable"}</div>`); }
  await load();
}

async function load() {
  const r = await fetch("/api/board").catch(() => null);
  if (!r || !r.ok) { $("mapBody").textContent = "Can't reach the board server. Start it with npm run dev."; return; }
  const b = await r.json();
  const sess = await fetch("/api/session", { headers: authHeaders() }).then((x) => x.json()).catch(() => ({ canWrite: false }));
  state.canWrite = !!sess.canWrite; renderSignIn(sess);
  state.town = Object.values(b.towns || {})[0] || null;
  state.projects = Object.entries(b.projects || {}).map(([id, p]) => ({ id, ...p }));
  state.tasks = Object.entries(b.tasks || {}).map(([id, t]) => ({ id, ...t }));
  state.pool = { ...state.pool, ...b.pool };
  state.ready = true; render();
}

function renderSignIn(sess) {
  const el = $("signin");
  if (sess.canWrite) { el.innerHTML = token() ? `<span class="muted">Signed in to change the board.</span> <button class="back" id="signout">Sign out</button>` : ""; return; }
  el.innerHTML = `<form id="signinForm" class="settings"><span class="muted">Viewing only. To change the board:</span>
    <label for="tokenInput">admin token</label><input id="tokenInput" type="password" autocomplete="current-password" style="width:200px"><button class="copy" type="submit">Sign in</button></form>`;
}
document.addEventListener("submit", (ev) => {
  if (ev.target.id !== "signinForm") return; ev.preventDefault();
  try { localStorage.setItem("boardToken", $("tokenInput").value.trim()); } catch {}
  load();
});
document.addEventListener("click", (ev) => { if (ev.target.id === "signout") { try { localStorage.removeItem("boardToken"); } catch {} load(); } });

load();
if (import.meta.hot) import.meta.hot.on("board:changed", load);
