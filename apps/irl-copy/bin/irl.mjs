#!/usr/bin/env node
// irl-copy: a real place, from open data, as Minecraft land with building masses: the input the design pipeline takes
// in place of a player's land export.
//   node bin/irl.mjs sources [place]      the sources, and which supplies each layer for a place
//   node bin/irl.mjs fetch <place>        download every planned source into .cache/<place>/ (once per source)
//   node bin/irl.mjs build <place>        compose out/<place>/{land.nbt, manifest.json, SOURCES.md} from the cache
//   node bin/irl.mjs all <place>          fetch, then build
//   node bin/irl.mjs compose <place>      build, then put the designed modules in (places/<place>.compose.json):
//                                         out/<place>/composed.nbt
// <place> is a file under places/ without .json (e.g. sf/alamo-square).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { frameFor } from "../src/frame.mjs";
import { SOURCES, LAYERS, plan } from "../src/sources/index.mjs";
import { buildPlace } from "../src/build.mjs";
import { compose } from "../src/place.mjs";
import { load as loadStructure } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";   // reads the design pipeline's modules

const HERE = resolve(import.meta.dirname, ".."), [cmd, name] = process.argv.slice(2);
const load = (n) => ({ id: n, ...JSON.parse(readFileSync(`${HERE}/places/${n}.json`, "utf8")) });
const cache = (n, s) => `${HERE}/.cache/${n}/${s}`;

async function fetchPlace(n) {
  const place = load(n), frame = frameFor(place), chosen = [...new Set(Object.values(plan(place)).filter(Boolean))];
  mkdirSync(`${HERE}/.cache/${n}`, { recursive: true });
  for (const s of chosen) {
    const t0 = Date.now(), layers = await s.fetch(place, frame), meta = {};
    for (const [layer, data] of Object.entries(layers)) {
      if (data.kind === "raster") { writeFileSync(cache(n, `${s.id}.${layer}.f32`), Buffer.from(data.data.buffer)); meta[layer] = { kind: "raster", n: data.n, tile: data.tile }; }
      else if (data.kind === "rasters") { const { rasters, ...rest } = data; for (const [r, a] of Object.entries(rasters)) writeFileSync(cache(n, `${s.id}.${layer}.${r}.f32`), Buffer.from(a.buffer)); meta[layer] = { ...rest, names: Object.keys(rasters) }; }
      else meta[layer] = data;
    }
    writeFileSync(cache(n, `${s.id}.json`), JSON.stringify({ source: s.id, fetchedAt: new Date().toISOString(), layers: meta }));
    console.log(`${s.id}: ${Object.entries(meta).map(([k, v]) => `${k} ${v.features?.length ?? v.kind}`).join(", ")} (${Date.now() - t0} ms)`);
  }
}

function buildFrom(n, { composeWith } = {}) {
  const place = load(n), frame = frameFor(place), p = plan(place), L = {};
  for (const layer of LAYERS) { const s = p[layer]; if (!s) continue;
    const f = cache(n, `${s.id}.json`); if (!existsSync(f)) throw new Error(`no cache for ${s.id}: run fetch first`);
    const d = JSON.parse(readFileSync(f, "utf8")).layers[layer]; if (!d) continue;
    // a raster is sampled on the place's grid, so it's only good for the frame it was fetched at (scale, size)
    if ((d.kind === "raster" || d.kind === "rasters") && d.n !== frame.N) throw new Error(`${s.id} ${layer} was fetched for a ${d.n}x${d.n} grid, the place is now ${frame.N}x${frame.N} (scale or size changed): run fetch again`);
    const f32 = (file) => new Float32Array(readFileSync(cache(n, file)).buffer.slice(0));
    L[layer] = d.kind === "raster" ? { ...d, data: f32(`${s.id}.${layer}.f32`) }
      : d.kind === "rasters" ? { ...d, rasters: Object.fromEntries(d.names.map((r) => [r, f32(`${s.id}.${layer}.${r}.f32`)])) } : d; }
  const { grid, manifest, ground } = buildPlace(place, frame, L), out = `${HERE}/out/${n}`;
  if (composeWith) {
    const spec = JSON.parse(readFileSync(`${HERE}/places/${n}.compose.json`, "utf8")), files = new Map();
    const mod = (name) => { const m = spec.modules[name]; if (!files.has(m.file)) files.set(m.file, loadStructure(resolve(HERE, m.file))); return { module: files.get(m.file), plot: m.plot }; };
    const notes = compose(grid, manifest, spec.placements.map((p) => ({ ...p, ...mod(p.module), ...(p.end ? { end: mod(p.end) } : {}) })), { ground, I: (x, z) => z * frame.N + x });
    mkdirSync(out, { recursive: true }); grid.save(`${out}/composed.nbt`); console.log(notes.join("\n")); console.log(`${n}: composed -> out/${n}/composed.nbt`); return;
  }
  mkdirSync(out, { recursive: true });
  const used = [...new Set(Object.entries(p).filter(([l, s]) => s && L[l]).map(([, s]) => s))];
  manifest.sources = Object.fromEntries(Object.entries(p).filter(([l, s]) => s && L[l]).map(([l, s]) => [l, s.id]));
  manifest.credits = used.map((s) => `${s.attribution} (${s.licence})`);
  grid.save(`${out}/land.nbt`);
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
else console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 9).join("\n"));
