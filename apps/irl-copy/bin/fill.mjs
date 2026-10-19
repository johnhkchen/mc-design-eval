#!/usr/bin/env node
// Fill a place's remaining placeholder masses: every building no compose placement covers gets one model session
// (Haiku by default) that writes a script building it on its exact footprint, renders it, looks once and fixes. The
// sessions go through the plugin's lean wrapper, so their cost lands in a ledger (and $MCD_BILLING / $MCD_BUDGET_USD
// apply); the modules are then placed in the compose file.
//   node bin/fill.mjs <place> [--model haiku] [--jobs 8] [--only id,id] [--ledger <file>] [--place-only]
//     -> work/<place>/fill/<id>.nbt (+ .mjs, -sheet.png), placements added to places/<place>.compose.json
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
const gfile = `${HERE}/.cache/${name}/usgs-lidar.lidar.ground.f32`, G = existsSync(gfile) ? new Float32Array(readFileSync(gfile).buffer.slice(0)) : null;
let lo = Infinity; if (G) for (const v of G) lo = Math.min(lo, v * sc);
const ground = (x, z) => (G ? Math.round(G[z * N + x] * sc) - (Math.floor(lo) - Math.round(4 * sc)) : 0);
const parcels = new Map();
try { for (const f of JSON.parse(readFileSync(`${HERE}/.cache/${name}/${place.city === "seattle" ? "sea" : "sf"}-parcels.json`, "utf8")).layers.parcels.features) parcels.set(f.properties.parcel, f.properties); } catch {}

const placed = new Set(compose.placements.map((p) => p.building));
const todo = m.buildings.filter((b) => !placed.has(b.id) && (!only || only.includes(b.id)) && b.footprint.length >= 20);

function brief(b) {
  const xs = b.footprint.map((c) => c[0]), zs = b.footprint.map((c) => c[1]), x0 = Math.min(...xs), z0 = Math.min(...zs);
  const W = Math.max(...xs) - x0 + 1, D = Math.max(...zs) - z0 + 1, base = Math.min(...b.footprint.map(([x, z]) => ground(x, z)));
  const cells = b.footprint.map(([x, z]) => [x - x0, z - z0, ground(x, z) - base]);
  writeFileSync(`${dir}/${b.id}.cells.json`, JSON.stringify(cells));
  const p = parcels.get(b.parcel) ?? {}, H = b.top - b.base;
  const what = [p.name, p.use, p.year && `built ${p.year}`, p.address].filter(Boolean).join("; ") || "no record";
  return `Build one real building as a Minecraft 1.21.1 module for a city diorama of ${place.name} (${place.note ?? ""}). Scale ${sc} blocks per metre.
The building: ${what}. Footprint ${W} x ${D} blocks; its roof is about ${H} blocks above its lowest ground (from lidar). Decide from that record what it looks like (era, height in storeys of about ${Math.round(3.3 * sc)} blocks, materials typical of the city and its age) and make it read well at a glance from the air and the street at dusk.
Write a Node ESM script ${dir}/${b.id}.mjs that builds it and saves ${dir}/${b.id}.nbt:
  import { readFileSync } from "node:fs"; import { Voxels } from "${HERE}/src/voxels.mjs";
  const cells = JSON.parse(readFileSync("${dir}/${b.id}.cells.json", "utf8"));   // [x, z, ground] per footprint cell, x 0..${W - 1}, z 0..${D - 1}
  const g = new Voxels([${W}, ${H + 12}, ${D}]);  g.set(x, y, z, "white_concrete");  g.set(x, y, z, "oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });  g.save(".../${b.id}.nbt");
Rules: build only on the footprint cells; y 0 is the lowest ground under it and each cell's ground is its third number: fill solid from y 0 up to that cell's ground (foundation), so nothing floats on a slope; the downhill side shows its extra storeys. Real articulation: window grids of glass panes with frames, a base course, storey lines, a cornice or parapet, entrances with doors and canopies, shopfronts on the ground floor where it is commercial, roof equipment or terraces; warm lights (lanterns, shroomlights, glowstone behind glass) in some windows. No interiors (an air gap behind the glass and a floor slab per storey). Block ids without "minecraft:", only blocks that exist in 1.21.1.
Then run, in ${dir}: node ${PLUGIN}/tools/bin/mcd.mjs render ${b.id}.nbt  (writes ${b.id}-sheet.png); Read the sheet once, fix what reads badly (flat walls, stray blocks, holes), re-run the script, and stop. Reply with one line: what you built.`;
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

if (!argv.includes("--place-only")) {
  console.log(`${todo.length} buildings to fill, ${jobs} at a time, on ${model} (${process.env.MCD_BILLING ?? "subscription"})`);
  let i = 0; await Promise.all(Array.from({ length: Math.min(jobs, todo.length) }, async () => { while (i < todo.length) await run(todo[i++]); }));
}
// place every module built: at the footprint's box corner, the placeholder cleared
let n = 0;
for (const b of m.buildings.filter((q) => !placed.has(q.id) && existsSync(`${dir}/${q.id}.nbt`))) {
  const key = `fill-${b.id}`, xs = b.footprint.map((c) => c[0]), zs = b.footprint.map((c) => c[1]);
  compose.modules[key] = { file: `work/${name}/fill/${b.id}.nbt`, plot: [0, 0, Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)] };
  compose.placements.push({ building: b.id, module: key, mode: "at", at: [0, 0], quarter: 0, clear: "all" }); n++;
}
writeFileSync(composeFile, JSON.stringify(compose, null, 1) + "\n");
console.log(`placed ${n} fill modules in ${name}.compose.json`);
