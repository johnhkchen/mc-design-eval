#!/usr/bin/env node
// irl-copy: a real place, from open data, as Minecraft land with building masses: the input the design pipeline takes
// in place of a player's land export.
//   node bin/irl.mjs sources [place]      the sources, and which supplies each layer for a place
//   node bin/irl.mjs fetch <place>        download every planned source into .cache/<place>/ (once per source)
//   node bin/irl.mjs build <place>        compose out/<place>/{land.nbt, manifest.json, SOURCES.md} from the cache
//   node bin/irl.mjs all <place>          fetch, then build
// <place> is a file under places/ without .json (e.g. sf/alamo-square).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { frameFor } from "../src/frame.mjs";
import { SOURCES, LAYERS, plan } from "../src/sources/index.mjs";
import { buildPlace } from "../src/build.mjs";

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
      else meta[layer] = data;
    }
    writeFileSync(cache(n, `${s.id}.json`), JSON.stringify({ source: s.id, fetchedAt: new Date().toISOString(), layers: meta }));
    console.log(`${s.id}: ${Object.entries(meta).map(([k, v]) => `${k} ${v.features?.length ?? v.kind}`).join(", ")} (${Date.now() - t0} ms)`);
  }
}

function buildFrom(n) {
  const place = load(n), frame = frameFor(place), p = plan(place), L = {};
  for (const layer of LAYERS) { const s = p[layer]; if (!s) continue;
    const f = cache(n, `${s.id}.json`); if (!existsSync(f)) throw new Error(`no cache for ${s.id}: run fetch first`);
    const d = JSON.parse(readFileSync(f, "utf8")).layers[layer]; if (!d) continue;
    // a raster is sampled on the place's grid, so it's only good for the frame it was fetched at (scale, size)
    if (d.kind === "raster" && d.n !== frame.N) throw new Error(`${s.id} ${layer} was fetched for a ${d.n}x${d.n} grid, the place is now ${frame.N}x${frame.N} (scale or size changed): run fetch again`);
    L[layer] = d.kind === "raster" ? { ...d, data: new Float32Array(readFileSync(cache(n, `${s.id}.${layer}.f32`)).buffer.slice(0)) } : d; }
  const { grid, manifest } = buildPlace(place, frame, L), out = `${HERE}/out/${n}`;
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
else console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 9).join("\n"));
