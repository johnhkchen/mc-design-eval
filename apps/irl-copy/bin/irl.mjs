#!/usr/bin/env node
// irl-copy: a real place, from open data, as Minecraft land with building masses: the input the design pipeline takes
// in place of a player's land export.
//   node bin/irl.mjs sources [place]      the sources, and which supplies each layer for a place
//   node bin/irl.mjs fetch <place>        download every planned source into .cache/<place>/ (once per source); with
//                                         "align": "auto" it first turns the place to its landmark or street grid;
//                                         --only <source> fetches that source again (e.g. --only osm), whether cached or not;
//                                         --skip <source,...> leaves sources out (a service that is down)
//   node bin/irl.mjs build <place>        compose out/<place>/{land.nbt, manifest.json, SOURCES.md} from the cache
//   node bin/irl.mjs all <place>          fetch, then build
//   node bin/irl.mjs landmark <no> <place> [--city san-francisco|seattle] [--half m] [--scale s]   a place file framed on a city landmark
//   node bin/irl.mjs world <place>        build (and compose, if the place has a compose file) into a Minecraft Java world:
//                                         out/<place>/world/ (for Chunky, or a single-player save)
//   node bin/irl.mjs modules <place> <dir> [--palette places/survival-palette.json]    each module of the place's compose file as its own .nbt, its swaps applied (and the palette's)
//                                         (for the catalog: names from "catalog": { module: id } in the compose file)
//   node bin/irl.mjs compose <place>      build, then put the designed modules in (places/<place>.compose.json):
//                                         out/<place>/composed.nbt
// <place> is a file under places/ without .json (e.g. sf/alamo-square).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { frameFor } from "../src/frame.mjs";
import { SOURCES, LAYERS, plan } from "../src/sources/index.mjs";
import { buildPlace } from "../src/build.mjs";
import { compose } from "../src/place.mjs";
import { landmark as sfLandmark } from "../src/sources/datasf.mjs";
import { landmark as seaLandmark } from "../src/sources/seattle.mjs";
import { writeWorld } from "../src/anvil.mjs";
// beside a world: the top block's height in each column (Uint16, z * X + x, after an 8-byte X, Z header), for
// chunky-fade.mjs to tell how far off each pixel's ground is
function writeHeights(file, grid) {
  const [X, Y, Z] = grid.size, h = new Uint16Array(X * Z);
  grid.forEachCell((i) => { const x = i % X, r = Math.floor(i / X), y = r % Y, z = Math.floor(r / Y); if (y + 1 > h[z * X + x]) h[z * X + x] = y + 1; });
  const head = Buffer.alloc(8); head.writeUInt32LE(X, 0); head.writeUInt32LE(Z, 4); writeFileSync(file, Buffer.concat([head, Buffer.from(h.buffer)]));
}
import { floating, underpin } from "../src/float.mjs";
import { alignment } from "../src/align.mjs";
import { load as loadStructure } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";   // reads the design pipeline's modules

const HERE = resolve(import.meta.dirname, ".."), [cmd, name] = process.argv.slice(2);
// --set key=json (repeatable) overrides a place key for this run (e.g. --set tideM=8.2 for a high-tide world)
const sets = Object.fromEntries(process.argv.flatMap((a, i) => (a === "--set" ? [process.argv[i + 1]] : [])).map((kv) => { const [k, ...v] = kv.split("="); let j; try { j = JSON.parse(v.join("=")); } catch { j = v.join("="); } return [k, j]; }));
const load = (n) => ({ id: n, ...JSON.parse(readFileSync(`${HERE}/places/${n}.json`, "utf8")), ...sets });
const cache = (n, s) => `${HERE}/.cache/${n}/${s}`;
// a sparse (tall) world's structure file can run to gigabytes before gzip: past place.maxStructureBlocks (default 40M) it
// is left out (the world, the manifest and the briefs carry the place); dense places always write it, as before
function saveStructure(grid, file, place) {
  if (grid.sparse) { const n = grid.count(), max = place.maxStructureBlocks ?? 40e6;
    if (n > max) { console.warn(`(${n.toLocaleString()} blocks: past ${max.toLocaleString()}, ${file.split("/").pop()} is not written; use the world)`); return; } }
  grid.save(file);
}

// place.align "auto": before anything is sampled on the grid, turn the place so its landmark's footprint (or, failing a
// rectangular one, its streets) runs along the axes; the angle is written into the place file (rotate, and what it came
// from), once: delete rotate to measure again. The footprints and streets are fetched over a box that holds any turn.
async function resolveAlign(n) {
  const place = load(n); if (place.align !== "auto" || typeof place.rotate === "number") return;
  const wide = frameFor({ ...place, rotate: 45 }), flat = frameFor({ ...place, rotate: 0 }), p = plan(place), got = {};
  for (const layer of ["buildings", "streets"]) { const s = p[layer]; if (s) got[layer] = (await s.fetch(place, wide))[layer]?.features ?? []; }
  const a = alignment(place, { buildings: got.buildings, streets: got.streets, toBlock: flat.toBlock });
  const { id, ...file } = place; file.rotate = a.rotate; file.rotateFrom = { from: a.from, ...a.detail };
  writeFileSync(`${HERE}/places/${n}.json`, JSON.stringify(file, null, 1) + "\n");
  console.log(`${n}: turned ${a.rotate} degrees (from the ${a.from}${a.detail[a.from] ? `: ${JSON.stringify(a.detail[a.from])}` : ""})`);
}

async function fetchPlace(n) {
  await resolveAlign(n);
  const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
  const place = load(n), frame = frameFor(place), chosen = [...new Set(Object.values(plan(place)).filter(Boolean))].filter((s) => !only || s.id === only)
    .filter((s) => !process.argv.includes("--skip") || !process.argv[process.argv.indexOf("--skip") + 1].split(",").includes(s.id));
  mkdirSync(`${HERE}/.cache/${n}`, { recursive: true });
  for (const s of chosen) {
    // a source that fails (a service down) is left out, so the sources after it still arrive; fetch --only retries it
    const t0 = Date.now(), meta = {};
    let layers; try { layers = await s.fetch(place, frame); } catch (e) { console.error(`${s.id}: failed (${e.message}); left out`); if (process.env.IRL_DEBUG) console.error(e.stack); continue; }
    for (const [layer, data] of Object.entries(layers)) {
      if (data.kind === "raster") { writeFileSync(cache(n, `${s.id}.${layer}.f32`), Buffer.from(data.data.buffer)); meta[layer] = { kind: "raster", n: data.n, rotate: frame.rotate, tile: data.tile }; }
      else if (data.kind === "rasters") { const { rasters, ...rest } = data; for (const [r, a] of Object.entries(rasters)) writeFileSync(cache(n, `${s.id}.${layer}.${r}.f32`), Buffer.from(a.buffer)); meta[layer] = { ...rest, rotate: frame.rotate, names: Object.keys(rasters) }; }
      else meta[layer] = data;
    }
    writeFileSync(cache(n, `${s.id}.json`), JSON.stringify({ source: s.id, fetchedAt: new Date().toISOString(), layers: meta }));
    console.log(`${s.id}: ${Object.entries(meta).map(([k, v]) => `${k} ${v.features?.length ?? v.kind}`).join(", ")} (${Date.now() - t0} ms)`);
  }
}

function buildFrom(n, { composeWith, world } = {}) {
  const place = load(n), frame = frameFor(place), p = plan(place), L = {};
  for (const layer of LAYERS) { const s = p[layer]; if (!s) continue;
    const f = cache(n, `${s.id}.json`); if (!existsSync(f)) { console.warn(`(no cache for ${s.id}: the ${layer} layer is left out; fetch to add it)`); continue; }
    const d = JSON.parse(readFileSync(f, "utf8")).layers[layer]; if (!d) continue;
    // a raster is sampled on the place's grid, so it's only good for the frame it was fetched at (scale, size)
    if ((d.kind === "raster" || d.kind === "rasters") && (d.n !== frame.N || (d.rotate ?? 0) !== frame.rotate)) throw new Error(`${s.id} ${layer} was fetched for a ${d.n}x${d.n} grid turned ${d.rotate ?? 0} degrees, the place is now ${frame.N}x${frame.N} turned ${frame.rotate} (scale, size or rotation changed): run fetch again`);
    const f32 = (file) => new Float32Array(readFileSync(cache(n, file)).buffer.slice(0));
    L[layer] = d.kind === "raster" ? { ...d, data: f32(`${s.id}.${layer}.f32`) }
      : d.kind === "rasters" ? { ...d, rasters: Object.fromEntries(d.names.map((r) => [r, f32(`${s.id}.${layer}.${r}.f32`)])) } : d; }
  const { grid, manifest, ground } = buildPlace(place, frame, L), out = `${HERE}/out/${n}`;
  if (composeWith) {
    const spec = JSON.parse(readFileSync(`${HERE}/places/${n}.compose.json`, "utf8")), files = new Map();
    const mod = (name) => { const m = spec.modules[name]; if (!files.has(m.file)) files.set(m.file, loadStructure(resolve(HERE, m.file))); return { module: files.get(m.file), plot: m.plot, swap: m.swap }; };
    // the designed blocks: every block a module puts down (not the open-data land, not what compose clears)
    let designed = 0; const set0 = grid.set; grid.set = function (x, y, z, block, state) { if (!/air$/.test(block)) designed++; return set0.call(this, x, y, z, block, state); };
    const notes = compose(grid, manifest, spec.placements.map((p) => ({ ...p, ...mod(p.module), ...(p.end ? { end: mod(p.end) } : {}) })), { ground, I: (x, z) => z * frame.N + x, angle: spec.angle ?? 0 });
    grid.set = set0; console.log(`${n}: ${designed} designed blocks placed by the modules`);
    // anything left hanging in the air (a module on the wrong base, a kit missing its bottom course): named, by the
    // placement whose footprint box holds it, so the compose file or the kit can be fixed
    // first propped up where they nearly touch (a module's tower one block over its podium, a chimney short of its roof)
    let propped = 0; for (const h of floating(grid, { ground })) propped += underpin(grid, h);
    if (propped) console.warn(`${n}: ${propped} blocks of support under pieces that hung just clear of what is under them`);
    // a crown whose trunk a placement cleared (the module's box takes logs, the leaves overhanging it stay) goes too
    let crowns = 0; for (const h of floating(grid, { ground, min: 1 })) if (h.cells.every((c) => /leaves$/.test(grid.palette[grid.cellAt(c)].block))) { for (const c of h.cells) grid.setCellAt(c, 0); crowns++; }
    if (crowns) console.warn(`${n}: ${crowns} tree crowns left without their trunks removed`);
    const hung = floating(grid, { ground, faces: false }), boxes = spec.placements.map((p) => { const b = manifest.buildings.find((m) => m.id === p.building); if (!b) return null;
      const xs = b.footprint.map((c) => c[0]), zs = b.footprint.map((c) => c[1]); return { m: p.module, b: p.building, box: [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)] }; }).filter(Boolean);
    for (const h of hung.slice(0, 40)) { const [x0, y0, z0, x1, y1, z1] = h.box, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const by = boxes.filter((q) => cx >= q.box[0] - 8 && cx <= q.box[2] + 8 && cz >= q.box[1] - 8 && cz <= q.box[3] + 8).map((q) => `${q.m} (${q.b})`);
      const k = new Map(); for (const c of h.cells) { const b = grid.palette[grid.cellAt(c)].block.replace("minecraft:", ""); k.set(b, (k.get(b) ?? 0) + 1); }
      console.warn(`floating: ${h.size} blocks (${[...k].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([b, v]) => `${b} ${v}`).join(", ")}) at ${x0},${y0},${z0}..${x1},${y1},${z1}, ${h.gap} above what is under it${by.length ? ` - ${[...new Set(by)].join(", ")}` : ""}`); }
    if (hung.length) console.warn(`${n}: ${hung.length} floating pieces of 8+ blocks (${hung.reduce((s, h) => s + h.size, 0)} blocks)`);
    mkdirSync(out, { recursive: true }); saveStructure(grid, `${out}/composed.nbt`, place); console.log(notes.join("\n")); console.log(`${n}: composed -> out/${n}/composed.nbt`);
    if (world) { writeHeights(`${out}/heights.bin`, grid); const r = writeWorld(`${out}/world`, grid, { name: place.name }); console.log(`${n}: world -> out/${n}/world (${r.chunks} chunks, ${r.regions} regions${r.datapack ? `; datapack ${r.datapack.name}: the overworld ${r.datapack.height} high, to y ${r.datapack.maxY}` : ""})`); }
    return;
  }
  mkdirSync(out, { recursive: true });
  const used = [...new Set(Object.entries(p).filter(([l, s]) => s && L[l]).map(([, s]) => s))];
  manifest.sources = Object.fromEntries(Object.entries(p).filter(([l, s]) => s && L[l]).map(([l, s]) => [l, s.id]));
  manifest.credits = used.map((s) => `${s.attribution} (${s.licence})`);
  saveStructure(grid, `${out}/land.nbt`, place);
  writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 1));
  writeFileSync(`${out}/SOURCES.md`, [`# ${place.name}: sources`, "", "| Layer | Source | Licence | Credit |", "|---|---|---|---|",
    ...Object.entries(p).filter(([l, s]) => s && L[l]).map(([l, s]) => `| ${l} | [${s.name}](${s.url}) | ${s.licence} | ${s.attribution} |`), ""].join("\n"));
  console.log(`${n}: ${grid.size.join("x")}, ${manifest.buildings.length} buildings, ${manifest.trees} trees -> out/${n}/land.nbt`);
}

if (cmd === "sources") {
  if (name) { const p = plan(load(name)); for (const l of LAYERS) console.log(l.padEnd(12), p[l] ? `${p[l].id}  (${p[l].licence})` : "-"); }
  else for (const s of SOURCES) console.log(s.id.padEnd(14), s.layers.join(",").padEnd(46), s.licence);
} else if (cmd === "fetch") await fetchPlace(name);
else if (cmd === "build") buildFrom(name);
else if (cmd === "all") { await fetchPlace(name); buildFrom(name); }
else if (cmd === "compose") buildFrom(name, { composeWith: true });
else if (cmd === "world") buildFrom(name, { composeWith: existsSync(`${HERE}/places/${name}.compose.json`), world: true });
else if (cmd === "modules") {
  const spec = JSON.parse(readFileSync(`${HERE}/places/${name}.compose.json`, "utf8")), dir = resolve(process.argv[4]); mkdirSync(dir, { recursive: true });
  const { Voxels } = await import("../src/voxels.mjs");
  // --palette <file>: a swap applied over every module's own (places/survival-palette.json: blocks a survival supply chain
  // can't make in volume, swapped for ones it can)
  const pal = process.argv.includes("--palette") ? JSON.parse(readFileSync(resolve(process.argv[process.argv.indexOf("--palette") + 1]), "utf8")).swap : {};
  for (const [mod, id] of Object.entries(spec.catalog ?? {})) {
    const m = spec.modules[mod], src = loadStructure(resolve(HERE, m.file)), [x0, z0, x1, z1] = m.plot;
    let H = 0; for (const c of src.cells.values()) if (c.pos[0] >= x0 && c.pos[0] <= x1 && c.pos[2] >= z0 && c.pos[2] <= z1 && !/air$/.test(c.block)) H = Math.max(H, c.pos[1] + 1);
    const out = new Voxels([x1 - x0 + 1, H, z1 - z0 + 1]);
    for (const c of src.cells.values()) { const [x, y, z] = c.pos; if (x < x0 || x > x1 || z < z0 || z > z1 || /air$/.test(c.block)) continue;
      const n = c.block.replace(/^minecraft:/, ""), w = m.swap?.find((r) => r.from === n && (r.minY == null || y >= r.minY) && (r.maxY == null || y <= r.maxY));
      const b = (w ? w.to : c.block).replace(/^minecraft:/, ""); out.set(x - x0, y, z - z0, pal[b] ?? b, c.state); }
    out.save(`${dir}/${id}.nbt`); console.log(`${id}: ${out.size.join("x")}`);
  }
}
else if (cmd === "landmark") {
  // centred on the landmark's boundary, a box reaching 40 m past it (or --half), at 1.4 blocks a metre (or --scale)
  const city = process.argv.includes("--city") ? process.argv[process.argv.indexOf("--city") + 1] : "san-francisco";
  const lm = await ({ "san-francisco": sfLandmark, seattle: seaLandmark })[city](name), target = process.argv[4], arg = (k, d) => (process.argv.includes(k) ? +process.argv[process.argv.indexOf(k) + 1] : d);
  const pts = (lm.geometry.type === "Polygon" ? [lm.geometry.coordinates] : lm.geometry.coordinates).flat(2);
  const lons = pts.map((p) => p[0]), lats = pts.map((p) => p[1]), lat = (Math.min(...lats) + Math.max(...lats)) / 2, lon = (Math.min(...lons) + Math.max(...lons)) / 2;
  const reach = Math.max((Math.max(...lats) - Math.min(...lats)) * 111000, (Math.max(...lons) - Math.min(...lons)) * 111000 * Math.cos((lat * Math.PI) / 180)) / 2;
  const place = { name: lm.name, note: `${city === "seattle" ? "Seattle" : "San Francisco"} landmark No. ${lm.number}, ${lm.address} (designated ${lm.year}).`, city, country: "US", scale: arg("--scale", 1.4),
    centre: [+lat.toFixed(6), +lon.toFixed(6)], half: arg("--half", Math.round(reach + 40)), align: "auto", landmark: { number: lm.number, photo: lm.photo, document: lm.document } };
  mkdirSync(dirname(`${HERE}/places/${target}.json`), { recursive: true });
  writeFileSync(`${HERE}/places/${target}.json`, JSON.stringify(place, null, 1) + "\n"); console.log(JSON.stringify(place));
}
else console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 9).join("\n"));
