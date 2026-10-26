#!/usr/bin/env node
// Fill a place's remaining placeholder masses: every building no compose placement covers gets one model session
// (Haiku by default) that writes a script building it on its exact footprint, renders it, looks once and fixes. The
// sessions go through the plugin's lean wrapper, so their cost lands in a ledger (and $MCD_BILLING / $MCD_BUDGET_USD
// apply); the modules are then placed in the compose file.
//   node bin/fill.mjs <place> [--model haiku] [--jobs 8] [--only id,id] [--ledger <file>] [--place-only]
//     [--roofs] each footprint cell also carries the lidar's roof height there (a 4th number), for skylines of towers on
//     podiums and setbacks; [--min-cells n] skip footprints smaller than n cells (default 20)
//     -> work/<place>/fill/<id>.nbt (+ .mjs, -sheet.png), placements added to places/<place>.compose.json
//   [--turn <deg>|auto [--turn-box x0,z0,x1,z1]] buildings (whose footprint centre is in the box, if given) are built
//     square in their own frame (the footprint turned back by deg) and placed turned by deg about the footprint's centre:
//     a street grid at an angle to the place's axes (DUMBO's, where the place is turned to the Brooklyn Bridge) gets
//     straight walls, not staircases. auto: each footprint's own angle (its smallest bounding box, 1-degree steps), used
//     when that box is under 85% of the square one's area
//   [--batch] the Message Batches API at half price instead of claude -p sessions, in lockstep rounds over every building
//     at once: round 1 each writes its script (one reply, no tools); every script runs and renders here; round 2 each
//     sees its own sheet (and any error) and returns a fixed script or OK; round 3 only for scripts that still fail.
//     Each request is just the brief (no Claude Code system prompt or tool definitions); one ledger row per request
//     (billing "api-batch"); $MCD_BUDGET_USD / $MCD_BUDGET_LEDGERS checked before each round. [--rounds 3]
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { plan } from "../src/sources/index.mjs";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN = process.env.MCD_PLUGIN || resolve(HERE, "../../../minecraft-design");
const argv = process.argv.slice(2), opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const name = argv[0], model = opt("--model", "haiku"), jobs = +opt("--jobs", 8), only = opt("--only")?.split(",");
const place = JSON.parse(readFileSync(`${HERE}/places/${name}.json`, "utf8")), sc = place.scale;
const m = JSON.parse(readFileSync(`${HERE}/out/${name}/manifest.json`, "utf8")), N = m.size[0];
const composeFile = `${HERE}/places/${name}.compose.json`, compose = existsSync(composeFile) ? JSON.parse(readFileSync(composeFile, "utf8")) : { modules: {}, placements: [] };
const dir = `${HERE}/work/${name}/fill`, ledger = resolve(opt("--ledger", `${dir}/ledger.jsonl`));
mkdirSync(dir, { recursive: true });
// ground per cell from the lidar raster, as build.mjs rounds it (unsmoothed: offsets within a footprint)
// (or, with no lidar, the place's ground raster: Taiwan's DTM or its bare-earth DEM, src/sources/taipei.mjs)
const gfile = [`${HERE}/.cache/${name}/usgs-lidar.lidar.ground.f32`, `${HERE}/.cache/${name}/ign-lidar-hd.lidar.ground.f32`, `${HERE}/.cache/${name}/linz-lidar.lidar.ground.f32`, `${HERE}/.cache/${name}/taiwan-ground.ground.f32`].find((f) => existsSync(f)), G = gfile ? new Float32Array(readFileSync(gfile).buffer.slice(0)) : null;
let lo = Infinity; if (G) for (const v of G) lo = Math.min(lo, v * sc);
const ground = (x, z) => (G ? Math.round(G[z * N + x] * sc) - (Math.floor(lo) - Math.round(4 * sc)) : 0);
const parcels = new Map();
// the parcels come from whichever source the place's plan picks for them (its cache file is named by the source's id)
try { for (const f of JSON.parse(readFileSync(`${HERE}/.cache/${name}/${plan(place).parcels.id}.json`, "utf8")).layers.parcels.features) parcels.set(f.properties.parcel, f.properties); } catch {}

const placed = new Set(compose.placements.map((p) => p.building));
const todo = m.buildings.filter((b) => !placed.has(b.id) && (!only || only.includes(b.id)) && b.footprint.length >= +opt("--min-cells", 20));
// --roofs: the lidar's surface per cell (as build.mjs rounds the ground), capped at the building's top, for the 4th number
const sfile = gfile?.replace(/ground\.f32$/, "surface.f32"), roofs = argv.includes("--roofs") && G && existsSync(sfile) ? new Float32Array(readFileSync(sfile).buffer.slice(0)) : null;

// --turn: the footprint in its own square frame. Local cell (lx, lz) of a W x D box whose centre sits at (uc, vc) in the
// footprint's turned-back coordinates; the world cell under it is the one the placement's inverse map reads from
// (place.mjs placeTurned), so the module lands back on its footprint. -> { cells: [[lx, lz, wx, wz]], W, D, shift } or null
const turnOpt = opt("--turn"), turnBox = opt("--turn-box")?.split(",").map(Number), turnCache = new Map();
function turnAngle(b) {
  if (turnOpt !== "auto") return +turnOpt || 0;
  const area = (deg) => { const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t); let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const [x, z] of b.footprint) { const u = x * c + z * s, v = -x * s + z * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    return (u1 - u0 + 1) * (v1 - v0 + 1); };
  let best = 0, bestA = area(0); for (let d = 1; d < 90; d++) { const a = area(d); if (a < bestA) { bestA = a; best = d; } }
  return bestA < 0.85 * area(0) ? best : 0;
}
function turned(b) {
  if (!turnOpt) return null;
  if (turnCache.has(b.id)) return turnCache.get(b.id);
  const n = b.footprint.length, cx = b.footprint.reduce((a, f) => a + f[0], 0) / n + 0.5, cz = b.footprint.reduce((a, f) => a + f[1], 0) / n + 0.5;
  const turnDeg = turnAngle(b);
  if (!turnDeg || (turnBox && (cx < turnBox[0] || cz < turnBox[1] || cx > turnBox[2] || cz > turnBox[3]))) { turnCache.set(b.id, null); return null; }
  const t = (turnDeg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), set = new Set(b.footprint.map(([x, z]) => `${x},${z}`));
  const uv = b.footprint.map(([x, z]) => { const dx = x + 0.5 - cx, dz = z + 0.5 - cz; return [dx * c + dz * s, -dx * s + dz * c]; });
  const us = uv.map((p) => p[0]), vs = uv.map((p) => p[1]), W = Math.round(Math.max(...us) - Math.min(...us)) + 1, D = Math.round(Math.max(...vs) - Math.min(...vs)) + 1;
  const uc = (Math.max(...us) + Math.min(...us)) / 2, vc = (Math.max(...vs) + Math.min(...vs)) / 2, cells = [];
  for (let lz = 0; lz < D; lz++) for (let lx = 0; lx < W; lx++) {
    const u = uc + lx + 0.5 - W / 2, v = vc + lz + 0.5 - D / 2, wx = Math.floor(cx + u * c - v * s), wz = Math.floor(cz + u * s + v * c);
    if (set.has(`${wx},${wz}`)) cells.push([lx, lz, wx, wz]);
  }
  const T = { cells, W, D, angle: turnDeg, shift: [+(uc * c - vc * s).toFixed(3), +(uc * s + vc * c).toFixed(3)] };
  turnCache.set(b.id, T); return T;
}

function brief(b) {
  const xs = b.footprint.map((c) => c[0]), zs = b.footprint.map((c) => c[1]), x0 = Math.min(...xs), z0 = Math.min(...zs), T = turned(b);
  const W = T ? T.W : Math.max(...xs) - x0 + 1, D = T ? T.D : Math.max(...zs) - z0 + 1, base = Math.min(...b.footprint.map(([x, z]) => ground(x, z)));
  const fl = Math.floor(lo) - Math.round(4 * sc), roofAt = (x, z) => Math.max(ground(x, z), Math.min(Math.round(roofs[z * N + x] * sc) - fl, b.top)) - base;
  const local = T ? T.cells : b.footprint.map(([x, z]) => [x - x0, z - z0, x, z]);
  const cells = local.map(([lx, lz, x, z]) => (roofs ? [lx, lz, ground(x, z) - base, roofAt(x, z)] : [lx, lz, ground(x, z) - base]));
  writeFileSync(`${dir}/${b.id}.cells.json`, JSON.stringify(cells));
  const p = parcels.get(b.parcel) ?? {}, H = b.top - b.base;
  const what = [b.name, p.name, p.landmark, p.nature !== "Indifférenciée" && p.nature, p.use, p.year && `built ${p.year}`, p.stories && `${p.stories} storeys`, p.wallKind && `walls: ${p.wallKind}`, p.address].filter(Boolean).join("; ") || "no record";
  return `Build one real building as a Minecraft 1.21.1 module for a city diorama of ${place.name} (${place.note ?? ""}). Scale ${sc} blocks per metre.
The building: ${what}. Footprint ${W} x ${D} blocks; its roof is about ${H} blocks above its lowest ground (from lidar). Decide from that record what it looks like (era, height in storeys of about ${Math.round(3.3 * sc)} blocks, materials typical of the city and its age) and make it read well at a glance from the air and the street at dusk.
Write a Node ESM script ${dir}/${b.id}.mjs that builds it and saves ${dir}/${b.id}.nbt:
  import { readFileSync } from "node:fs"; import { Voxels } from "${HERE}/src/voxels.mjs";
  const cells = JSON.parse(readFileSync("${dir}/${b.id}.cells.json", "utf8"));   // [x, z, ground${roofs ? ", roof" : ""}] per footprint cell, x 0..${W - 1}, z 0..${D - 1}
  const g = new Voxels([${W}, ${H + 12}, ${D}]);  g.set(x, y, z, "white_concrete");  g.set(x, y, z, "oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });  g.save(".../${b.id}.nbt");
Rules: build only on the footprint cells; y 0 is the lowest ground under it and each cell's ground is its third number: fill solid from y 0 up to that cell's ground (foundation), so nothing floats on a slope; the downhill side shows its extra storeys.${roofs ? " Each cell's fourth number is the lidar's roof height above y 0 there: follow it for the massing (a tower on a podium, setbacks stepping in as it rises, lower wings), smoothing lidar noise into clean flat tiers." : ""} Every storey, setback tier and roof stands directly on what is below it: no empty course under a tier, nothing hanging in the air. Real articulation: window grids of glass panes with frames, a base course, storey lines, a cornice or parapet, entrances with doors and canopies, shopfronts on the ground floor where it is commercial, roof equipment or terraces; warm lights (lanterns, shroomlights, glowstone behind glass) in some windows. No interiors (an air gap behind the glass and a floor slab per storey). Block ids without "minecraft:", only blocks that exist in 1.21.1.
Then run, in ${dir}: node ${PLUGIN}/tools/bin/mcd.mjs render ${b.id}.nbt  (writes ${b.id}-sheet.png); Read the sheet once, fix what reads badly (flat walls, stray blocks, holes), re-run the script, and stop. Reply with one line: what you built.`;
}

// --batch: the same facts as brief(), asked for a script in one reply (the shared rules are the cached system prompt)
const SYSTEM = `You write Node ESM scripts that build one real building each as a Minecraft 1.21.1 structure, for a city diorama of ${place.name} (${place.note ?? ""}). Scale ${sc} blocks per metre.
The script's shape:
  import { readFileSync } from "node:fs"; import { Voxels } from "${HERE}/src/voxels.mjs";
  const cells = JSON.parse(readFileSync("<dir>/<id>.cells.json", "utf8"));   // [x, z, ground${roofs ? ", roof" : ""}] per footprint cell
  const g = new Voxels([W, H, D]);  g.set(x, y, z, "white_concrete");  g.set(x, y, z, "oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });  g.save("<dir>/<id>.nbt");
Rules: build only on the footprint cells; y 0 is the lowest ground under it and each cell's ground is its third number: fill solid from y 0 up to that cell's ground (foundation), so nothing floats on a slope; the downhill side shows its extra storeys.${roofs ? " Each cell's fourth number is the lidar's roof height above y 0 there: follow it for the massing (a tower on a podium, setbacks stepping in as it rises, lower wings), smoothing lidar noise into clean flat tiers." : ""} Every storey, setback tier and roof stands directly on what is below it: no empty course under a tier, nothing hanging in the air. Real articulation: window grids of glass panes with frames, a base course, storey lines, a cornice or parapet, entrances with doors and canopies, shopfronts on the ground floor where it is commercial, roof equipment or terraces; warm lights (lanterns, shroomlights, glowstone behind glass) in some windows. No interiors (an air gap behind the glass and a floor slab per storey). Block ids without "minecraft:", only blocks that exist in 1.21.1 (no pale oak; "chain", not "iron_chain").
Reply with the complete script in one \`\`\`js code block and nothing else after it. It is run for you and rendered; you will see the render sheet once and may fix it.`;
function batchBrief(b) {
  const full = brief(b), xs = b.footprint.map((c) => c[0]), zs = b.footprint.map((c) => c[1]), T = turned(b);
  const W = T ? T.W : Math.max(...xs) - Math.min(...xs) + 1, D = T ? T.D : Math.max(...zs) - Math.min(...zs) + 1, H = b.top - b.base;
  const what = full.match(/The building: ([\s\S]*?)\nWrite a Node ESM script/)[1];
  return `The building: ${what}
Its script: ${dir}/${b.id}.mjs, reading ${dir}/${b.id}.cells.json (x 0..${W - 1}, z 0..${D - 1}), making new Voxels([${W}, ${H + 12}, ${D}]) and saving ${dir}/${b.id}.nbt.`;
}
const codeOf = (t) => { const m = [...t.matchAll(/```(?:js|javascript|mjs)?\s*\n([\s\S]*?)```/g)]; return m.length ? m[m.length - 1][1] : null; };
const sh = (cmd, args, timeout = 180000) => new Promise((res) => { const c = spawn(cmd, args, { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
  let out = "", err = ""; c.stdout.on("data", (d) => (out += d)); c.stderr.on("data", (d) => (err += d));
  const t = setTimeout(() => c.kill("SIGKILL"), timeout); c.on("close", (code) => { clearTimeout(t); res({ code, out, err }); }); });
// run a building's script and render it: { ok, log } (the .nbt and -sheet.png beside it)
async function runAndRender(b) {
  const r = await sh(process.execPath, [`${b.id}.mjs`]);
  if (r.code !== 0 || !existsSync(`${dir}/${b.id}.nbt`)) return { ok: false, log: `node ${b.id}.mjs exited ${r.code}:\n${(r.err || r.out).slice(-1500)}` };
  const v = await sh(process.execPath, [`${PLUGIN}/tools/bin/mcd.mjs`, "render", `${b.id}.nbt`]);
  return { ok: true, sheet: v.code === 0 && existsSync(`${dir}/${b.id}-sheet.png`), log: (r.out + r.err).slice(-600) };
}
async function each(list, fn) { let i = 0; await Promise.all(Array.from({ length: Math.min(jobs, list.length) }, async () => { while (i < list.length) { const x = list[i++]; await fn(x); } })); }
async function batchFill(todo) {
  const { runRound, textOf, imageBlock } = await import(`${PLUGIN}/tools/src/batch.mjs`);
  const sys = [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral", ttl: "1h" } }], conv = new Map(), state = new Map();
  const req = (b, tag) => ({ custom_id: `${b.id}-${tag}`.replace(/[^a-zA-Z0-9_-]/g, "_"), model, effort: "medium", ledger,
    params: { model, max_tokens: 32000, output_config: { effort: "medium" }, system: sys, messages: conv.get(b.id) } });
  for (const b of todo) conv.set(b.id, [{ role: "user", content: [{ type: "text", text: batchBrief(b) }] }]);
  const rounds = +opt("--rounds", 3);
  let active = todo;
  for (let round = 1; round <= rounds && active.length; round++) {
    const t0 = Date.now(), res = await runRound(active.map((b) => req(b, `r${round}`)), { ledger, label: ` round ${round}` });
    const next = [];
    await each(active, async (b) => {
      const r = res.get(`${b.id}-r${round}`.replace(/[^a-zA-Z0-9_-]/g, "_"));
      if (r?.type !== "succeeded") { console.log(`${b.id}: round ${round} ${r?.type ?? "missing"}`); return; }
      conv.get(b.id).push({ role: "assistant", content: r.message.content });
      const code = codeOf(textOf(r)), prev = state.get(b.id);
      if (!code) { console.log(`${b.id}: round ${round} kept (${prev?.ok ? "OK" : "no script"})`); return; }
      const f = `${dir}/${b.id}.mjs`, nbt = `${dir}/${b.id}.nbt`;
      if (prev?.ok) { copyFileSync(f, `${f}.prev`); copyFileSync(nbt, `${nbt}.prev`); }
      writeFileSync(f, code);
      const got = await runAndRender(b);
      if (!got.ok && prev?.ok) { copyFileSync(`${f}.prev`, f); copyFileSync(`${nbt}.prev`, nbt); await runAndRender(b); }
      state.set(b.id, got.ok ? got : prev?.ok ? prev : got);
      console.log(`${b.id}: round ${round} ${got.ok ? "built" : "failed"}${!got.ok && prev?.ok ? " (kept the last good one)" : ""}`);
      // the next round: round 2 for everyone with a sheet or an error; round 3 only for scripts that still fail
      if (round === 1 || !state.get(b.id).ok) {
        const s2 = state.get(b.id), content = [];
        if (s2.ok && s2.sheet) content.push(imageBlock(`${dir}/${b.id}-sheet.png`), { type: "text", text: "Your script ran; this is its render sheet. Fix what reads badly (flat walls, stray or floating blocks, holes, a massing that misses the roof heights, no entrance). Reply with the complete fixed script in one ```js block, or with just OK if it reads well." });
        else content.push({ type: "text", text: `Your script failed:
${s2.log}
Reply with the complete fixed script in one \`\`\`js block.` });
        conv.get(b.id).push({ role: "user", content }); next.push(b);
      }
    });
    console.log(`round ${round}: ${active.length} requests, ${Math.round((Date.now() - t0) / 1000)} s`);
    active = round === 1 ? next : next.filter((b) => !state.get(b.id)?.ok);
  }
}

function run(b) {
  return new Promise((res) => {
    const env = { ...process.env, MCD_LEDGER: ledger };
    const args = [`${PLUGIN}/tools/bin/claude-lean.mjs`, "--lean-effort", "medium", "--", "-p", brief(b), "--model", model, "--output-format", "stream-json", "--verbose",
      "--permission-mode", "bypassPermissions", "--allowedTools", "Bash,Read,Write,Edit"];
    const c = spawn(process.execPath, args, { cwd: dir, env, stdio: ["ignore", "ignore", "pipe"] });
    let err = ""; c.stderr.on("data", (d) => (err += d));
    c.on("close", (code) => { console.log(`${b.id}: ${existsSync(`${dir}/${b.id}.nbt`) ? "built" : `no module (exit ${code}) ${err.trim().slice(-200)}`}`); res(); });
  });
}

if (!argv.includes("--place-only") && argv.includes("--batch")) {
  console.log(`${todo.length} buildings to fill in batched rounds on ${model} (api-batch)`);
  for (const b of todo) brief(b);                                 // writes each <id>.cells.json
  await batchFill(todo);
} else if (!argv.includes("--place-only")) {
  console.log(`${todo.length} buildings to fill, ${jobs} at a time, on ${model} (${process.env.MCD_BILLING ?? "subscription"})`);
  let i = 0; await Promise.all(Array.from({ length: Math.min(jobs, todo.length) }, async () => { while (i < todo.length) await run(todo[i++]); }));
}
// place every module built: at the footprint's box corner, the placeholder cleared
let n = 0;
for (const b of m.buildings.filter((q) => !placed.has(q.id) && existsSync(`${dir}/${q.id}.nbt`))) {
  const key = `fill-${b.id}`, xs = b.footprint.map((c) => c[0]), zs = b.footprint.map((c) => c[1]), T = turned(b);
  compose.modules[key] = { file: `work/${name}/fill/${b.id}.nbt`, plot: T ? [0, 0, T.W - 1, T.D - 1] : [0, 0, Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)] };
  compose.placements.push(T ? { building: b.id, module: key, mode: "centre", angle: T.angle, shift: T.shift }
    : { building: b.id, module: key, mode: "at", at: [0, 0], quarter: 0, clear: "all" }); n++;
}
writeFileSync(composeFile, JSON.stringify(compose, null, 1) + "\n");
console.log(`placed ${n} fill modules in ${name}.compose.json`);
