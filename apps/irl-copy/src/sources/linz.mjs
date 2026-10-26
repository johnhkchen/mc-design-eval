// New Zealand. Toitū Te Whenua LINZ's open buckets on AWS (no key), CC BY 4.0: credit LINZ and the dataset.
//   lidar      nz-elevation: the 1 m DEM (ground) and DSM (surface: roofs, crowns, anything standing) of a region's
//              lidar survey, as cloud-optimised GeoTIFF tiles in NZTM2000 (EPSG:2193), found through each survey's STAC
//              collection. Each block cell takes the mean ground and the highest surface of the 1 m samples in it; the sea
//              is nodata in both (no returns), which build.mjs fills from the shore.
//   aerial     nz-imagery: the region's newest urban orthophoto (Auckland: 6 cm, 2023), read from its overviews at
//              about half a metre. True colour only, so the near-infrared build.mjs reads for green is made up from the
//              photo's excess green (2g - r - b): grass and crowns read green, grey paving and roofs don't.
//   parks      OSM leisure=park / garden (the volcanic cones are domains: Maungawhau's crater reads as park grass).
//   buildings, streets, water ... OpenStreetMap (osm.mjs): LINZ's own building outlines need a key, and most of
//              them are in OSM already; a footprint's height comes from the lidar (build.mjs: its DSM median over the DEM).
// place.linz { elevation: ["auckland/auckland-part-1_2024", ...], imagery: ["auckland/auckland-central_2023_0.06m", ...] }
// names the surveys, in order of preference (the first that covers a cell supplies it); Auckland's are the default.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fromUrl, addDecoder } from "geotiff";
import sharp from "sharp";
import { tmForward } from "./taipei.mjs";

// LINZ's photos are WebP inside the TIFF (compression 50001), which geotiff.js decodes only in a browser: sharp does it here,
// as many channels as the tile holds (GDAL writes RGBA)
addDecoder(50001, () => class {
  async decode(fd, buffer) {
    const want = fd.SamplesPerPixel ?? 4, { data, info } = await sharp(Buffer.from(buffer)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (want === 4) return data.buffer.slice(data.byteOffset, data.byteOffset + data.length);
    const out = new Uint8Array(info.width * info.height * want);
    for (let i = 0, j = 0; i < data.length; i += 4) for (let k = 0; k < want; k++) out[j++] = data[i + k];
    return out.buffer;
  }
});
const inNZ = (p) => p.country === "NZ";
const CC = "CC BY 4.0 (credit \"Toitū Te Whenua LINZ\")";
const ELEV = "https://nz-elevation.s3.ap-southeast-2.amazonaws.com", IMG = "https://nz-imagery.s3.ap-southeast-2.amazonaws.com";
const CACHE = resolve(import.meta.dirname, "../../.cache/linz");
// NZTM2000: Transverse Mercator on GRS80, 173 E, k 0.9996, false easting 1,600 km, false northing 10,000 km
const NZTM = { lon0: 173, k0: 0.9996, fe: 1600000, fn: 10000000 };
const DEFAULT = { elevation: ["auckland/auckland-part-1_2024", "auckland/auckland-part-2_2024"], imagery: ["auckland/auckland-central_2023_0.06m", "auckland/auckland_2010-2012_0.5m"] };

// a STAC collection's items (their bbox and asset URL), cached: [{ id, bbox: [w, s, e, n], href }]
async function items(base, path) {
  const file = `${CACHE}/${path.replace(/\//g, "_")}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const coll = await (await fetch(`${base}/${path}/collection.json`)).json(), links = coll.links.filter((l) => l.rel === "item"), out = [];
  for (let i = 0; i < links.length; i += 16) out.push(...await Promise.all(links.slice(i, i + 16).map(async (l) => {
    const it = await (await fetch(`${base}/${path}/${l.href.replace(/^\.\//, "")}`)).json(), a = Object.values(it.assets)[0];
    return { id: it.id, bbox: it.bbox, href: `${base}/${path}/${a.href.replace(/^\.\//, "")}` }; })));
  mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(out));
  process.stderr.write(`  linz: ${path}: ${out.length} tiles indexed\n`);
  return out;
}
async function overpass(query) {
  for (let wait = 2000; ; wait *= 2) {
    const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "user-agent": "mc-design irl-copy/0.1" }, body: new URLSearchParams({ data: query }) });
    if (r.ok) return (await r.json()).elements;
    if (wait > 64000) throw new Error(`Overpass: ${r.status}`);
    await new Promise((ok) => setTimeout(ok, wait));
  }
}
const hits = (list, b) => list.filter(({ bbox: [w, s, e, n] }) => w < b.east && e > b.west && s < b.north && n > b.south);

// the place's cells in NZTM: each cell's centre, the box round them, and the step one block east (x) and south (z) makes
function cellsNZTM(frame) {
  const { N, lonLat } = frame, c = new Float64Array(2 * N * N);
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const [X, Y] = tmForward(...lonLat(x, z), NZTM); c[2 * (z * N + x)] = X; c[2 * (z * N + x) + 1] = Y; }
  const m = N >> 1, k = 2 * (m * N + m), dx = [c[k + 2] - c[k], c[k + 3] - c[k + 1]], dz = [c[k + 2 * N] - c[k], c[k + 2 * N + 1] - c[k + 1]];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < c.length; i += 2) { x0 = Math.min(x0, c[i]); x1 = Math.max(x1, c[i]); y0 = Math.min(y0, c[i + 1]); y1 = Math.max(y1, c[i + 1]); }
  return { c, dx, dz, box: [x0 - 4, y0 - 4, x1 + 4, y1 + 4] };
}

// one tile's part inside the box, at about res metres: from the overview nearest that (no finer than needed), read in
// pieces of at most 1024 px a side (one big read spans thousands of blocks, and geotiff.js's block cache loses some of
// them: "reading 'offset'") -> { x0, y1, rx, ry, W, H, bands, nodata }
async function readTile(href, [bx0, by0, bx1, by1], res) {
  const tiff = await fromUrl(href, { cacheSize: 2000 }), base = await tiff.getImage(), [tx0, ty0, tx1, ty1] = base.getBoundingBox();
  const x0 = Math.max(bx0, tx0), y0 = Math.max(by0, ty0), x1 = Math.min(bx1, tx1), y1 = Math.min(by1, ty1);
  if (x0 >= x1 || y0 >= y1) return null;
  const n = await tiff.getImageCount(), baseRes = (tx1 - tx0) / base.getWidth(); let im = base;
  for (let i = 1; i < n; i++) { const o = await tiff.getImage(i); if (((tx1 - tx0) / o.getWidth()) <= res * 1.01) im = o; else break; }
  const rx = (tx1 - tx0) / im.getWidth(), ry = (ty1 - ty0) / im.getHeight();
  const u0 = Math.floor((x0 - tx0) / rx), u1 = Math.ceil((x1 - tx0) / rx), v0 = Math.floor((ty1 - y1) / ry), v1 = Math.ceil((ty1 - y0) / ry), W = u1 - u0, H = v1 - v0;
  const spp = im.getSamplesPerPixel(), bands = Array.from({ length: spp }, () => new Float32Array(W * H));
  for (let v = v0; v < v1; v += 1024) for (let u = u0; u < u1; u += 1024) {
    const win = [u, v, Math.min(u1, u + 1024), Math.min(v1, v + 1024)], w = win[2] - win[0];
    for (let tries = 0; ; tries++) {
      try { const r = await im.readRasters({ window: win });
        for (let k = 0; k < spp; k++) for (let j = 0; j < win[3] - win[1]; j++) bands[k].set(r[k].subarray(j * w, (j + 1) * w), (v - v0 + j) * W + (u - u0));
        break; }
      catch (e) {
        // a tile with empty blocks (the sea past the survey's edge: byte count 0) breaks geotiff.js's block reader for
        // any read: such a tile is left out, and the next survey covers its cells
        if (/offset/.test(e.message)) { process.stderr.write(`  linz: ${href.split("/").pop()} unreadable (empty blocks), left out\n`); return null; }
        if (tries >= 3) throw e; await new Promise((ok) => setTimeout(ok, 2000 * 2 ** tries)); }
    }
  }
  return { x0: tx0 + u0 * rx, y1: ty1 - v0 * ry, rx, ry, W, H, bands, nodata: base.getGDALNoData(), baseRes };
}
const pixel = (wins, X, Y) => { for (const w of wins) { const u = Math.floor((X - w.x0) / w.rx), v = Math.floor((w.y1 - Y) / w.ry);
  if (u >= 0 && v >= 0 && u < w.W && v < w.H) return [w, v * w.W + u]; } return null; };
async function readAll(list, box, res) { const out = [];
  for (let i = 0; i < list.length; i += 4) out.push(...(await Promise.all(list.slice(i, i + 4).map((t) => readTile(t.href, box, res)))).filter(Boolean));
  return out; }

export default [
  { id: "linz-lidar", layers: ["lidar"], name: "LINZ lidar elevation (1 m DEM and DSM)", licence: CC,
    attribution: "Toitū Te Whenua LINZ, NZ elevation (lidar DEM and DSM)", url: "https://registry.opendata.aws/nz-elevation/", covers: inNZ,
    async fetch(place, frame) {
      const { N, scale } = frame, { c, dx, dz, box } = cellsNZTM(frame), surveys = place.linz?.elevation ?? DEFAULT.elevation;
      const k = Math.max(1, Math.round(1 / scale)), sub = []; for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) sub.push([(a + 0.5) / k - 0.5, (b + 0.5) / k - 0.5]);
      const ground = new Float32Array(N * N), surface = new Float32Array(N * N).fill(-Infinity), count = new Float32Array(N * N), gN = new Uint16Array(N * N), used = [];
      for (const survey of surveys) for (const [kind, isGround] of [["dem_1m", true], ["dsm_1m", false]]) {
        const list = hits(await items(ELEV, `${survey}/${kind}/2193`), frame.box); if (!list.length) continue;
        const wins = await readAll(list, box, 1); let n = 0;
        for (let i = 0; i < N * N; i++) { if (isGround ? gN[i] : count[i]) continue; for (const [u, v] of sub) {
          const hit = pixel(wins, c[2 * i] + u * dx[0] + v * dz[0], c[2 * i + 1] + u * dx[1] + v * dz[1]); if (!hit) continue;
          const val = hit[0].bands[0][hit[1]]; if (!(val > -100) || val === hit[0].nodata) continue;
          if (isGround) { ground[i] += val; gN[i]++; } else { if (val > surface[i]) surface[i] = val; count[i]++; }
          n++; } }
        if (n) used.push(`${survey}/${kind}`);
        process.stderr.write(`  linz ${survey} ${kind}: ${list.length} tiles, ${n.toLocaleString()} samples\n`);
      }
      let nf = 0; for (let i = 0; i < N * N; i++) if (gN[i]) { ground[i] /= gN[i]; nf++; }
      if (!nf) throw new Error("no LINZ elevation in the box");
      // the sea has no ground: the shore's lowest ground stands in (build.mjs levels open water from it)
      let lo = Infinity; for (let i = 0; i < N * N; i++) if (gN[i]) lo = Math.min(lo, ground[i]);
      for (let i = 0; i < N * N; i++) { if (!gN[i]) ground[i] = lo; if (!Number.isFinite(surface[i])) surface[i] = ground[i]; }
      process.stderr.write(`  linz lidar: ${nf.toLocaleString()} of ${(N * N).toLocaleString()} cells with ground, ${k * k} samples a cell\n`);
      return { lidar: { kind: "rasters", n: N, rasters: { ground, surface, count }, collection: used.join(" + "), points: null } };
    } },
  { id: "linz-aerial", layers: ["aerial"], name: "LINZ aerial imagery (urban orthophoto, read at 0.5 m)", licence: CC,
    attribution: "Toitū Te Whenua LINZ, NZ aerial imagery", url: "https://registry.opendata.aws/nz-imagery/", covers: inNZ,
    async fetch(place, frame) {
      const { N } = frame, { c, box } = cellsNZTM(frame), bands = [0, 1, 2, 3].map(() => new Float32Array(N * N)), done = new Uint8Array(N * N), used = [];
      for (const survey of place.linz?.imagery ?? DEFAULT.imagery) {
        const list = hits(await items(IMG, `${survey}/rgb/2193`), frame.box); if (!list.length) continue;
        const wins = await readAll(list, box, 0.5); let n = 0;
        for (let i = 0; i < N * N; i++) { if (done[i]) continue; const hit = pixel(wins, c[2 * i], c[2 * i + 1]); if (!hit) continue;
          const [w, p] = hit, r = w.bands[0][p], g = w.bands[1][p], b = w.bands[2][p]; if (!r && !g && !b) continue;
          bands[0][i] = r; bands[1][i] = g; bands[2][i] = b; bands[3][i] = r + 2.2 * Math.max(0, 2 * g - r - b); done[i] = 1; n++; }
        if (n) used.push(survey);
        process.stderr.write(`  linz ${survey}: ${list.length} tiles, ${n.toLocaleString()} cells\n`);
      }
      return { aerial: { kind: "rasters", n: N, year: used.join(" + "), tiles: used, rasters: { r: bands[0], g: bands[1], b: bands[2], nir: bands[3] } } };
    } },
  { id: "nz-parks", layers: ["parks"], name: "OpenStreetMap parks and gardens (leisure=park|garden)", licence: "ODbL 1.0 (credit \"© OpenStreetMap contributors\")",
    attribution: "© OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright", covers: inNZ,
    async fetch(place, { box: b }) {
      const els = await overpass(`[out:json][timeout:90];(way["leisure"~"^(park|garden)$"](${b.south},${b.west},${b.north},${b.east}););out geom;`);
      return { parks: { type: "FeatureCollection", features: els.filter((e) => (e.geometry ?? []).length > 3)
        .map((e) => ({ type: "Feature", properties: { name: e.tags?.name ?? null }, geometry: { type: "Polygon", coordinates: [e.geometry.map((p) => [p.lon, p.lat])] } })) } };
    } },
];
