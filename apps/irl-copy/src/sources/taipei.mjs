// Taipei (Taiwan). The city's building-licence overlay map (臺北市建築執照套繪圖, data.gov.tw 151936, a shapefile in
// TWD97 / TM2 121 (EPSG:3826) with each footprint's licensed floor count, bud_floor) for the buildings, joined with
// OpenStreetMap for every building the overlay lacks (it holds about 10,000 footprints city-wide, mostly licensed since
// 2012) and for the real heights OSM tags carry (`height`, else `building:levels`); both layers are under the Open
// Government Data License Taiwan 1.0 and ODbL respectively. A footprint's height: OSM's `height` where a tagged OSM
// building covers it (the towers: Taipei 101 508 m, Nan Shan Plaza 273 m), else its licensed floors x 3.4 m + 1.5 m,
// else OSM's levels x 3.4 m, else 8 m; place.heights { id: metres } overrides any of them.
// The ground: the national 20 m DTM (內政部 20 公尺網格數值地形模型, data.gov.tw 35430 / 176927, OGDL-Taiwan 1.0) when
// place.dtmFile names its GeoTIFF (EPSG:3826; its download host, tgos.tw, refuses requests from outside Taiwan), else the
// Copernicus GLO-30 DEM (a radar surface model, ~30 m), taken down to the ground: the canopy height (Meta & WRI) off the
// forest, and in the basin a morphological opening (a 60 m disc's min then max) off the buildings.
// The aerial photo: Sentinel-2 L2A (10 m, red, green, blue and near-infrared; Copernicus Sentinel data, free and open),
// as NLSC's orthophoto tiles carry no open licence for derived models. Parks: OSM leisure=park.
import { inflateRawSync } from "node:zlib";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fromUrl, fromFile } from "geotiff";
import canopySources from "./meta-canopy.mjs";

const inTaipei = (p) => p.city === "taipei";
const inTaiwan = (p) => p.country === "TW";
const OGDL = "Open Government Data License, version 1.0 (Taiwan)";
const ODBL = "ODbL 1.0 (credit \"© OpenStreetMap contributors\")";
const CACHE = resolve(import.meta.dirname, "../../.cache");

// ---- Transverse Mercator on GRS80 / WGS84 (the two differ by 0.1 mm here): TWD97 TM2 (121 E, k 0.9999, false easting
// 250 km) and UTM. Forward and inverse by the standard series (Snyder), well under a centimetre over a zone.
const A = 6378137, F = 1 / 298.257222101, E2 = F * (2 - F), EP2 = E2 / (1 - E2), D = Math.PI / 180;
const M = (phi) => A * ((1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256) * phi - ((3 * E2) / 8 + (3 * E2 ** 2) / 32 + (45 * E2 ** 3) / 1024) * Math.sin(2 * phi)
  + ((15 * E2 ** 2) / 256 + (45 * E2 ** 3) / 1024) * Math.sin(4 * phi) - ((35 * E2 ** 3) / 3072) * Math.sin(6 * phi));
export const TWD97 = { lon0: 121, k0: 0.9999, fe: 250000, fn: 0 };
export const utmZone = (zone) => ({ lon0: (zone - 1) * 6 - 180 + 3, k0: 0.9996, fe: 500000, fn: 0 });
/** lon, lat (degrees) -> [easting, northing] (metres) */
export function tmForward(lon, lat, { lon0, k0, fe, fn } = TWD97) {
  const phi = lat * D, N = A / Math.sqrt(1 - E2 * Math.sin(phi) ** 2), T = Math.tan(phi) ** 2, C = EP2 * Math.cos(phi) ** 2, a = Math.cos(phi) * (lon - lon0) * D;
  const x = k0 * N * (a + ((1 - T + C) * a ** 3) / 6 + ((5 - 18 * T + T ** 2 + 72 * C - 58 * EP2) * a ** 5) / 120) + fe;
  const y = k0 * (M(phi) + N * Math.tan(phi) * (a ** 2 / 2 + ((5 - T + 9 * C + 4 * C ** 2) * a ** 4) / 24 + ((61 - 58 * T + T ** 2 + 600 * C - 330 * EP2) * a ** 6) / 720)) + fn;
  return [x, y];
}
/** [easting, northing] -> [lon, lat] */
export function tmInverse(x, y, { lon0, k0, fe, fn } = TWD97) {
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2)), mu = (y - fn) / k0 / (A * (1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256));
  const p1 = mu + ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) + ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) + ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) + ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const N1 = A / Math.sqrt(1 - E2 * Math.sin(p1) ** 2), T1 = Math.tan(p1) ** 2, C1 = EP2 * Math.cos(p1) ** 2, R1 = (A * (1 - E2)) / (1 - E2 * Math.sin(p1) ** 2) ** 1.5, d = (x - fe) / (N1 * k0);
  const lat = p1 - ((N1 * Math.tan(p1)) / R1) * (d ** 2 / 2 - ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * EP2) * d ** 4) / 24 + ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * EP2 - 3 * C1 ** 2) * d ** 6) / 720);
  const lon = lon0 * D + (d - ((1 + 2 * T1 + C1) * d ** 3) / 6 + ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * EP2 + 24 * T1 ** 2) * d ** 5) / 120) / Math.cos(p1);
  return [lon / D, lat / D];
}

// ---- a zip's entries (stored or deflated), from its central directory
export function unzip(buf) {
  let e = buf.length - 22; while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--; if (e < 0) throw new Error("not a zip");
  const n = buf.readUInt16LE(e + 10), out = new Map(); let p = buf.readUInt32LE(e + 16);
  for (let i = 0; i < n; i++) {
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nl).toString("utf8"), lo = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28), raw = buf.subarray(lo, lo + size);
    out.set(name, method === 8 ? inflateRawSync(raw) : Buffer.from(raw)); p += 46 + nl + xl + cl;
  }
  return out;
}
// ---- a shapefile's polygons (type 5) and its dBASE records
export function readShp(shp) {
  const out = []; let p = 100;
  while (p + 8 <= shp.length) {
    const len = shp.readInt32BE(p + 4) * 2, r = p + 8, type = shp.readInt32LE(r);
    if (type === 5 || type === 15 || type === 25) {
      const np = shp.readInt32LE(r + 36), nv = shp.readInt32LE(r + 40), parts = [];
      for (let i = 0; i < np; i++) parts.push(shp.readInt32LE(r + 44 + 4 * i));
      const v0 = r + 44 + 4 * np, rings = [];
      for (let i = 0; i < np; i++) { const a = parts[i], b = i + 1 < np ? parts[i + 1] : nv, ring = [];
        for (let k = a; k < b; k++) ring.push([shp.readDoubleLE(v0 + 16 * k), shp.readDoubleLE(v0 + 16 * k + 8)]); rings.push(ring); }
      out.push(rings);
    } else out.push(null);
    p = r + len;
  }
  return out;
}
export function readDbf(dbf) {
  const n = dbf.readUInt32LE(4), hl = dbf.readUInt16LE(8), rl = dbf.readUInt16LE(10), fields = [];
  for (let o = 32; o < hl - 1; o += 32) fields.push({ name: dbf.subarray(o, o + 11).toString("latin1").replace(/\0.*$/s, ""), len: dbf[o + 16] });
  const rows = [];
  for (let i = 0; i < n; i++) { let o = hl + i * rl + 1; const row = {};
    for (const f of fields) { row[f.name] = dbf.subarray(o, o + f.len).toString("utf8").trim(); o += f.len; } rows.push(row); }
  return rows;
}
// signed area (shoelace, x/y) and a ring's centroid; a point in a ring (even-odd)
const area = (r) => { let s = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return s / 2; };
const centroid = (r) => { let x = 0, y = 0; for (const p of r) { x += p[0]; y += p[1]; } return [x / r.length, y / r.length]; };
const inside = (pt, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
  const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };
const inBox = (lon, lat, b) => lon >= b.west && lon <= b.east && lat >= b.south && lat <= b.north;

async function overpass(query) {
  for (let wait = 2000; ; wait *= 2) {
    const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "user-agent": "mc-design irl-copy/0.1" }, body: new URLSearchParams({ data: query }) });
    if (r.ok) return (await r.json()).elements;
    if (wait > 64000) throw new Error(`Overpass: ${r.status}`);
    await new Promise((ok) => setTimeout(ok, wait));
  }
}
const metres = (s) => { const v = parseFloat(String(s ?? "").replace(",", ".")); return Number.isFinite(v) ? v : NaN; };
const STOREY = 3.4;
const licensedHeight = (floors) => (floors > 0 ? floors * STOREY + 1.5 : NaN);

const BUD_URL = "https://data.taipei/api/dataset/af067fb6-9e47-4f4c-a484-e72eba161319/resource/ccdfe8df-ef54-4c13-a93d-ba42968ced3b/download";

/** The licence overlay map's footprints in a box: [{ id, ring: [[lon, lat]], floors, construction, year, licence }] */
async function licenceFootprints(place, box) {
  const dir = `${CACHE}/${place.id}`, zip = `${dir}/taipei-licence-map.zip`; mkdirSync(dir, { recursive: true });
  if (!existsSync(zip)) { const r = await fetch(BUD_URL); if (!r.ok) throw new Error(`data.taipei: ${r.status}`); writeFileSync(zip, Buffer.from(await r.arrayBuffer())); }
  const files = unzip(readFileSync(zip)), shp = [...files.keys()].find((k) => k.endsWith(".shp")), dbf = shp.replace(/\.shp$/, ".dbf");
  const polys = readShp(files.get(shp)), rows = readDbf(files.get(dbf)), seen = new Map(), out = [];
  polys.forEach((rings, i) => {
    if (!rings) return; const row = rows[i], outer = rings.reduce((a, r) => (Math.abs(area(r)) > Math.abs(area(a)) ? r : a), rings[0]);
    const ll = outer.map(([x, y]) => tmInverse(x, y)); if (!ll.some(([lo, la]) => inBox(lo, la, box))) return;
    const lic = row.budatt_no || `row${i}`, k = (seen.get(lic) ?? 0) + 1; seen.set(lic, k);
    const roc = parseInt(lic, 10);
    out.push({ id: `TPE${lic.replace(/[^0-9A-Za-z]+/g, "-")}${k > 1 ? `-${k}` : ""}`, ring: ll, xy: outer, floors: +row.bud_floor || 0, construction: row.bud_const || null,
      year: roc > 30 && roc < 200 ? roc + 1911 : null, licence: lic });
  });
  return out;
}

/** OSM building outlines in a box (ways, and the outer ways of multipolygon relations) with their height tags */
async function osmBuildings(box) {
  const bb = `${box.south},${box.west},${box.north},${box.east}`;
  const els = await overpass(`[out:json][timeout:120];(way["building"](${bb});relation["building"](${bb}););out geom;`);
  const out = [];
  for (const e of els) {
    const t = e.tags ?? {}, ways = e.type === "way" ? [e.geometry] : (e.members ?? []).filter((m) => m.role === "outer" && m.geometry).map((m) => m.geometry);
    ways.forEach((g, k) => { if (!g || g.length < 4 || g[0].lat !== g.at(-1).lat || g[0].lon !== g.at(-1).lon) return;
      out.push({ id: `OSM${e.type[0]}${e.id}${ways.length > 1 ? `-${k}` : ""}`, ring: g.map((p) => [p.lon, p.lat]), height: metres(t.height), levels: metres(t["building:levels"]),
        name: t["name:en"] ?? t.name ?? null, nameZh: t.name ?? null }); });
  }
  return out;
}

// ---- rasters: a GeoTIFF window sampled (bilinear) onto the place's grid, through a lon/lat -> pixel map
async function sampleTiff(im, frame, toPix) {
  const { N, box, lonLat } = frame, W0 = im.getWidth(), H0 = im.getHeight();
  const c = [toPix(box.west, box.north), toPix(box.east, box.north), toPix(box.west, box.south), toPix(box.east, box.south)];
  const win = [Math.max(0, Math.floor(Math.min(...c.map((p) => p[0]))) - 2), Math.max(0, Math.floor(Math.min(...c.map((p) => p[1]))) - 2),
    Math.min(W0, Math.ceil(Math.max(...c.map((p) => p[0]))) + 3), Math.min(H0, Math.ceil(Math.max(...c.map((p) => p[1]))) + 3)];
  const bands = await im.readRasters({ window: win }), W = win[2] - win[0], H = win[3] - win[1];
  const outs = Array.from(bands, () => new Float32Array(N * N));
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const [a, b] = toPix(...lonLat(x, z)), u = a - 0.5 - win[0], v = b - 0.5 - win[1];
    const u0 = Math.max(0, Math.min(W - 2, Math.floor(u))), v0 = Math.max(0, Math.min(H - 2, Math.floor(v))), fu = Math.max(0, Math.min(1, u - u0)), fv = Math.max(0, Math.min(1, v - v0));
    for (let k = 0; k < bands.length; k++) { const B = bands[k], i = v0 * W + u0;
      outs[k][z * N + x] = (B[i] * (1 - fu) + B[i + 1] * fu) * (1 - fv) + (B[i + W] * (1 - fu) + B[i + W + 1] * fu) * fv; }
  }
  return outs;
}
// separable min or max filter over a square of radius r cells, then the disc is approximated by two passes of each
function minmax(src, N, r, max) {
  const tmp = new Float32Array(N * N), out = new Float32Array(N * N), pick = max ? Math.max : Math.min;
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { let v = src[z * N + x]; for (let d = -r; d <= r; d++) { const xx = x + d; if (xx >= 0 && xx < N) v = pick(v, src[z * N + xx]); } tmp[z * N + x] = v; }
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { let v = tmp[z * N + x]; for (let d = -r; d <= r; d++) { const zz = z + d; if (zz >= 0 && zz < N) v = pick(v, tmp[zz * N + x]); } out[z * N + x] = v; }
  return out;
}
/** A surface model taken down to the ground: canopy (metres, per cell) off it, then in the basin (below `basin` metres)
 *  a morphological opening over `r` cells off the buildings, blended out over 20 m up the slopes. Exported for the test. */
export function bareEarth(dsm, N, { canopy = null, canopyShare = 0.8, r, basin = 45 }) {
  const g = Float32Array.from(dsm, (v, i) => v - (canopy ? canopyShare * canopy[i] : 0));
  const open = minmax(minmax(g, N, r, false), N, r, true);
  for (let i = 0; i < N * N; i++) { const w = Math.max(0, Math.min(1, (basin + 20 - open[i]) / 20)); g[i] = w * Math.min(g[i], open[i]) + (1 - w) * g[i]; }
  return g;
}

export default [
  // the buildings (and, from the licence map, a record per footprint as its parcel: floors, construction, licence year)
  { id: "taipei-buildings", layers: ["buildings", "parcels"], name: "Taipei City building licence overlay map (臺北市建築執照套繪圖) with OpenStreetMap buildings",
    licence: `${OGDL}; OpenStreetMap ${ODBL}`, attribution: "Taipei City Government, Construction Management Office, 2026, Taipei City Building Licence Overlay Map (臺北市建築執照套繪圖, data.gov.tw 151936); © OpenStreetMap contributors",
    url: "https://data.gov.tw/dataset/151936", covers: inTaipei,
    async fetch(place, frame) {
      const { box } = frame, lic = await licenceFootprints(place, box), osm = await osmBuildings(box);
      // one footprint per building: a licence map footprint wins; overlapping licence phases of one building keep the
      // biggest footprint (its floor count the largest of them)
      const lics = lic.map((b) => ({ ...b, a: Math.abs(area(b.xy)), c: centroid(b.ring) })).sort((p, q) => q.a - p.a), kept = [];
      for (const b of lics) { const dup = kept.find((k) => inside(b.c, k.ring)); if (dup) { dup.floors = Math.max(dup.floors, b.floors); continue; } kept.push(b); }
      const osmC = osm.map((o) => ({ ...o, c: centroid(o.ring), a: Math.abs(area(o.ring)) })), llArea = (b) => Math.abs(area(b.ring));
      // the same building in both: the licence footprint inside the OSM outline, or the OSM outline inside the licence
      // footprint and covering at least half of it (a tower's outline over its podium's licence is not the podium)
      const same = (b, o) => (inside(b.c, o.ring) && o.a >= 0.3 * llArea(b)) || (inside(o.c, b.ring) && o.a >= 0.5 * llArea(b));
      const feats = [], parcels = [];
      for (const b of kept) {
        // an OSM building with a height tag covering this footprint (centroid either way) gives the real height
        const tagged = osmC.filter((o) => same(b, o) && Number.isFinite(o.height)).sort((p, q) => q.height - p.height)[0];
        const named = osmC.find((o) => same(b, o) && o.name);
        let h = place.heights?.[b.id] ?? (tagged ? tagged.height : licensedHeight(b.floors));
        if (!Number.isFinite(h)) { const lv = osmC.find((o) => inside(b.c, o.ring) && Number.isFinite(o.levels)); h = lv ? lv.levels * STOREY + 1.5 : 8; }
        feats.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [b.ring] }, properties: { id: b.id, parcel: b.id, height: +h.toFixed(1), peak: null, name: named?.name ?? null } });
        parcels.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [b.ring] }, properties: { parcel: b.id, stories: b.floors || null, year: b.year, construction: b.construction,
          use: null, address: null, name: named?.nameZh ?? null, landmark: null, licence: b.licence } });
      }
      // OSM buildings the licence map lacks (their centroid in no licence footprint, and no licence centroid in them)
      for (const o of osmC) {
        if (kept.some((b) => inside(o.c, b.ring) || inside(b.c, o.ring))) continue;
        const h = place.heights?.[o.id] ?? (Number.isFinite(o.height) ? o.height : Number.isFinite(o.levels) ? o.levels * STOREY + 1.5 : 8);
        feats.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [o.ring] }, properties: { id: o.id, parcel: null, height: +h.toFixed(1), peak: null, name: o.name } });
      }
      process.stderr.write(`  taipei: ${kept.length} licence-map footprints (${lic.length} records in the box), ${feats.length - kept.length} from OSM\n`);
      return { buildings: { type: "FeatureCollection", features: feats }, parcels: { type: "FeatureCollection", rollYear: "2026-10", features: parcels } };
    } },
  // parks from OSM (leisure=park), for the ground cover inside them
  { id: "taipei-parks", layers: ["parks"], name: "OpenStreetMap parks (leisure=park)", licence: ODBL, attribution: "© OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright",
    covers: inTaiwan,
    async fetch(place, { box: b }) {
      const els = await overpass(`[out:json][timeout:90];(way["leisure"="park"](${b.south},${b.west},${b.north},${b.east}););out geom;`);
      return { parks: { type: "FeatureCollection", features: els.filter((e) => (e.geometry ?? []).length > 3)
        .map((e) => ({ type: "Feature", properties: { name: e.tags?.name ?? null }, geometry: { type: "Polygon", coordinates: [e.geometry.map((p) => [p.lon, p.lat])] } })) } };
    } },
  // the ground: the MOI 20 m DTM (place.dtmFile, a GeoTIFF in EPSG:3826) or Copernicus GLO-30 taken down to the ground
  { id: "taiwan-ground", layers: ["ground"], name: "MOI 20 m DTM (place.dtmFile) or Copernicus GLO-30 DEM, bare-earth", covers: inTaiwan,
    licence: "OGDL-Taiwan 1.0 (MOI DTM) / Copernicus DEM licence (free, attribution)",
    attribution: "Ministry of the Interior, 2025, 20 m grid Digital Terrain Model (內政部20公尺網格數值地形模型) where used; else Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA",
    url: "https://data.gov.tw/dataset/176927",
    async fetch(place, frame) {
      const { N, scale } = frame;
      if (place.dtmFile && existsSync(resolve(CACHE, "..", place.dtmFile))) {
        const im = await (await fromFile(resolve(CACHE, "..", place.dtmFile))).getImage(), [minx, , , maxy] = im.getBoundingBox(), [rx, ry] = im.getResolution();
        const [g] = await sampleTiff(im, frame, (lo, la) => { const [x, y] = tmForward(lo, la); return [(x - minx) / rx, (y - maxy) / ry]; });
        return { ground: { kind: "raster", n: N, source: "MOI 20 m DTM", data: g } };
      }
      const lat0 = Math.floor(frame.box.south), lon0 = Math.floor(frame.box.west);
      if (Math.floor(frame.box.north) !== lat0 || Math.floor(frame.box.east) !== lon0) throw new Error("the place crosses a 1-degree Copernicus tile edge (not handled)");
      const tile = `Copernicus_DSM_COG_10_N${String(lat0).padStart(2, "0")}_00_E${String(lon0).padStart(3, "0")}_00_DEM`;
      const im = await (await fromUrl(`https://copernicus-dem-30m.s3.amazonaws.com/${tile}/${tile}.tif`)).getImage(), [minx, , , maxy] = im.getBoundingBox(), [rx, ry] = im.getResolution();
      const [dsm] = await sampleTiff(im, frame, (lo, la) => [(lo - minx) / rx, (la - maxy) / ry]);
      const ch = (await canopySources[0].fetch(place, frame)).canopy.data.map((v) => v / scale);
      // place.groundFit { canopyShare, openM, basinM }: how much of the canopy height comes off (the radar sees partly into
      // the crowns), the opening's half-width in metres (the biggest building block in the basin: City Hall is ~200 m), and
      // the level below which the basin is opened
      const fit = { canopyShare: 0.8, openM: 30, basinM: 45, ...place.groundFit };
      const g = bareEarth(dsm, N, { canopy: ch, canopyShare: fit.canopyShare, r: Math.round(fit.openM * scale), basin: fit.basinM });
      return { ground: { kind: "raster", n: N, source: `Copernicus GLO-30 ${tile}, bare-earth`, data: g } };
    } },
  // Sentinel-2 L2A from the Planetary Computer: the newest near-cloudless scene, bands 4, 3, 2 and 8 (10 m), scaled to
  // 0-255 like an aerial photo (reflectance 0.25 = 255)
  { id: "sentinel2", layers: ["aerial"], name: "Sentinel-2 L2A (ESA Copernicus, via Microsoft Planetary Computer)", licence: "Copernicus Sentinel data terms (free, full and open; attribution)",
    attribution: "Contains modified Copernicus Sentinel data, processed by ESA", url: "https://planetarycomputer.microsoft.com/dataset/sentinel-2-l2a", covers: inTaiwan,
    async fetch(place, frame) {
      const PC = "https://planetarycomputer.microsoft.com/api", { box, N } = frame;
      const q = encodeURIComponent(JSON.stringify({ "eo:cloud_cover": { lt: 1 } }));
      const s = await (await fetch(`${PC}/stac/v1/search?collections=sentinel-2-l2a&bbox=${box.west},${box.south},${box.east},${box.north}&limit=20&query=${q}&sortby=-datetime`)).json();
      const it = place.sentinelScene ? s.features.find((f) => f.id === place.sentinelScene) : s.features[0]; if (!it) throw new Error("Sentinel-2: no clear scene");
      const { token } = await (await fetch(`${PC}/sas/v1/token/sentinel-2-l2a`)).json();
      const offset = parseFloat(it.properties["s2:processing_baseline"]) >= 4 ? 1000 : 0, out = {};
      for (const [k, band] of [["r", "B04"], ["g", "B03"], ["b", "B02"], ["nir", "B08"]]) {
        const im = await (await fromUrl(`${it.assets[band].href}?${token}`)).getImage(), zone = im.getGeoKeys().ProjectedCSTypeGeoKey % 100;
        const [minx, , , maxy] = im.getBoundingBox(), [rx, ry] = im.getResolution();
        const [v] = await sampleTiff(im, frame, (lo, la) => { const [x, y] = tmForward(lo, la, utmZone(zone)); return [(x - minx) / rx, (y - maxy) / ry]; });
        out[k] = v.map((d) => Math.max(1, Math.min(255, ((d - offset) / 2500) * 255)));
      }
      return { aerial: { kind: "rasters", n: N, year: it.properties.datetime.slice(0, 10), tiles: [it.id], rasters: out } };
    } },
];
