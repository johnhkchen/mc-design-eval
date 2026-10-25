// France (mainland). Everything from IGN's Géoplateforme (data.geopf.fr), under the Licence Ouverte / Open Licence 2.0
// (Etalab): credit IGN and the dataset.
//   lidar      LiDAR HD's elevation models (0.5 m, derived from the national point cloud, flown 2021-2025): the MNT
//              (ground) and MNS (surface: roofs, crowns, anything standing), read through the WMS-R as Lambert-93
//              GeoTIFF windows of up to 2 km. No point cloud to decode; each block cell takes the mean ground and the
//              highest surface of the 0.5 m samples in it.
//   aerial     BD ORTHO (20 cm, the newest flight) in true colour, and its infrared edition (IRC: near-infrared, red,
//              green) for the near-infrared, read at 0.5 m.
//   buildings  BD TOPO's batiment: every footprint in France, each with its height (hauteur, from the lidar or
//              stereo), floors where known, use, wall and roof materials (from the Fichiers fonciers, often empty in
//              cities) and the year it appeared; OSM gives the names (a named OSM building or monument over its centroid).
//   water      BD TOPO's surface_hydrographique (the Seine is a relation in OSM, which the OSM source doesn't read).
//   parks      OSM leisure=park / garden.
// Projection: Lambert-93 (EPSG:2154, RGF93 on GRS80: conic conformal, standard parallels 44 and 49 N).
import { fromArrayBuffer } from "geotiff";

const inFrance = (p) => p.country === "FR";
const LO = "Licence Ouverte / Open Licence 2.0 (Etalab)";
const ODBL = "ODbL 1.0 (credit \"© OpenStreetMap contributors\")";
const GPF = "https://data.geopf.fr";

// WGS84 (RGF93 is within centimetres of it) -> Lambert-93 metres
const L93 = (() => {
  const a = 6378137, f = 1 / 298.257222101, e = Math.sqrt(f * (2 - f)), d = Math.PI / 180;
  const m = (p) => Math.cos(p) / Math.sqrt(1 - e * e * Math.sin(p) ** 2);
  const t = (p) => Math.tan(Math.PI / 4 - p / 2) / ((1 - e * Math.sin(p)) / (1 + e * Math.sin(p))) ** (e / 2);
  const p1 = 44 * d, p2 = 49 * d, p0 = 46.5 * d, l0 = 3 * d;
  const n = (Math.log(m(p1)) - Math.log(m(p2))) / (Math.log(t(p1)) - Math.log(t(p2))), F = m(p1) / (n * t(p1) ** n), r0 = a * F * t(p0) ** n;
  return (lon, lat) => { const r = a * F * t(lat * d) ** n, th = n * (lon * d - l0); return [700000 + r * Math.sin(th), 6600000 + r0 - r * Math.cos(th)]; };
})();

// the place's cells in Lambert-93: each cell's centre, and the step one block east (x) and south (z) makes there
function cellsL93(frame) {
  const { N, lonLat } = frame, c = new Float64Array(2 * N * N);
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const [X, Y] = L93(...lonLat(x, z)); c[2 * (z * N + x)] = X; c[2 * (z * N + x) + 1] = Y; }
  const m = N >> 1, k = 2 * (m * N + m), dx = [c[k + 2] - c[k], c[k + 3] - c[k + 1]], dz = [c[k + 2 * N] - c[k], c[k + 2 * N + 1] - c[k + 1]];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < c.length; i += 2) { x0 = Math.min(x0, c[i]); x1 = Math.max(x1, c[i]); y0 = Math.min(y0, c[i + 1]); y1 = Math.max(y1, c[i + 1]); }
  return { c, dx, dz, box: [x0 - 4, y0 - 4, x1 + 4, y1 + 4] };
}

// one WMS-R layer over the box as GeoTIFF windows (at most 4000 px a side), each { x0, y1, res, W, H, bands }
async function windows(layer, [bx0, by0, bx1, by1], res = 0.5, side = 2000) {
  const out = [], jobs = [];
  for (let x = Math.floor(bx0 / side) * side; x < bx1; x += side) for (let y = Math.floor(by0 / side) * side; y < by1; y += side) jobs.push([x, y]);
  async function one([x, y]) {
    const W = Math.round(side / res), url = `${GPF}/wms-r?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&STYLES=&CRS=EPSG:2154&LAYERS=${layer}&FORMAT=image/geotiff`
      + `&BBOX=${x},${y},${x + side},${y + side}&WIDTH=${W}&HEIGHT=${W}`;
    for (let tries = 0; ; tries++) {
      const r = await fetch(url);
      if (r.ok && (r.headers.get("content-type") ?? "").includes("tiff")) {
        const im = await (await fromArrayBuffer(await r.arrayBuffer())).getImage();
        out.push({ x0: x, y1: y + side, res, W, H: W, bands: await im.readRasters() }); return;
      }
      if (tries >= 4) throw new Error(`${layer} ${x},${y}: ${r.status} ${(await r.text()).slice(0, 200)}`);
      await new Promise((ok) => setTimeout(ok, 3000 * 2 ** tries));
    }
  }
  for (let i = 0; i < jobs.length; i += 3) await Promise.all(jobs.slice(i, i + 3).map(one));
  process.stderr.write(`  ${layer}: ${jobs.length} windows\n`);
  return out;
}
// the window and pixel a Lambert-93 point falls in
const pixel = (wins, X, Y) => { for (const w of wins) { const u = Math.floor((X - w.x0) / w.res), v = Math.floor((w.y1 - Y) / w.res);
  if (u >= 0 && v >= 0 && u < w.W && v < w.H) return [w, v * w.W + u]; } return null; };

async function wfs(type, box, extra = "") {
  const bb = `${box.south},${box.west},${box.north},${box.east},urn:ogc:def:crs:EPSG::4326`, feats = [];
  for (let start = 0; ; start += 5000) {
    const r = await fetch(`${GPF}/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=${type}&SRSNAME=EPSG:4326&OUTPUTFORMAT=application/json`
      + `&BBOX=${bb}&COUNT=5000&STARTINDEX=${start}${extra}`);
    if (!r.ok) throw new Error(`${type}: ${r.status} ${(await r.text()).slice(0, 200)}`);
    const page = (await r.json()).features; feats.push(...page);
    if (page.length < 5000) return feats;
  }
}
async function overpass(query) {
  for (let wait = 2000; ; wait *= 2) {
    const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "user-agent": "mc-design irl-copy/0.1" }, body: new URLSearchParams({ data: query }) });
    if (r.ok) return (await r.json()).elements;
    if (wait > 64000) throw new Error(`Overpass: ${r.status}`);
    await new Promise((ok) => setTimeout(ok, wait));
  }
}
const inside = ([x, y], ring) => { let o = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
  const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) o = !o; } return o; };
const centroid = (ring) => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];

// BD TOPO's usage and wall-material codes in the words materials.mjs and fitout.mjs read
const USE = { "Résidentiel": "residential", "Commercial et services": "commercial", "Industriel": "industrial", "Agricole": "agricultural",
  "Religieux": "religious", "Sportif": "sports", "Annexe": "annex" };
// materiaux_des_murs: two-digit Fichiers fonciers codes, combined (01 stone, 02 millstone, 03 concrete, 04 brick,
// 05 breeze block, 06 wood, 09 other): masonry -> C, concrete -> B, wood -> D (the assessor letters materials.mjs knows)
const construction = (code) => { const c = String(code ?? ""); return /[124]/.test(c) ? "C" : /[35]/.test(c) ? "B" : /6/.test(c) ? "D" : null; };
// and the wall itself (materials.mjs takes rec.wall over its assessor rules, which read masonry as red brick): dressed
// limestone where the record says stone or says nothing (Paris and most old French towns), brick only where it says brick
const wall = (code) => { const c = String(code ?? "");
  return /^0?[12]/.test(c) ? ["smooth_sandstone", "stone"] : /^0?4/.test(c) ? ["bricks", "brick"] : /^0?[35]/.test(c) ? ["light_gray_concrete", "concrete"]
    : /^0?6/.test(c) ? ["spruce_planks", "timber"] : ["smooth_sandstone", "stone or render (unrecorded)"]; };

export default [
  { id: "ign-lidar-hd", layers: ["lidar"], name: "IGN LiDAR HD elevation models (MNT and MNS, 0.5 m)", licence: LO,
    attribution: "IGN, LiDAR HD (MNT and MNS), Géoplateforme", url: "https://geoservices.ign.fr/lidarhd", covers: inFrance,
    async fetch(place, frame) {
      const { N, scale } = frame, { c, dx, dz, box } = cellsL93(frame);
      // 0.5 m samples per cell: k x k, spread over the cell
      const k = Math.max(1, Math.round(1 / scale / 0.5)), sub = []; for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) sub.push([(a + 0.5) / k - 0.5, (b + 0.5) / k - 0.5]);
      const ground = new Float32Array(N * N), surface = new Float32Array(N * N).fill(-Infinity), count = new Float32Array(N * N), gN = new Uint16Array(N * N);
      for (const [layer, isGround] of [["IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.LAMB93", true], ["IGNF_LIDAR-HD_MNS_ELEVATION.ELEVATIONGRIDCOVERAGE.LAMB93", false]]) {
        const wins = await windows(layer, box);
        for (let i = 0; i < N * N; i++) for (const [u, v] of sub) {
          const hit = pixel(wins, c[2 * i] + u * dx[0] + v * dz[0], c[2 * i + 1] + u * dx[1] + v * dz[1]); if (!hit) continue;
          const val = hit[0].bands[0][hit[1]]; if (!(val > -100)) continue;                   // nodata (-99999) off the flights
          if (isGround) { ground[i] += val; gN[i]++; } else { if (val > surface[i]) surface[i] = val; count[i]++; }
        }
      }
      let mean = 0, nf = 0; for (let i = 0; i < N * N; i++) if (gN[i]) { ground[i] /= gN[i]; mean += ground[i]; nf++; }
      if (!nf) throw new Error("LiDAR HD: no ground in the box (not flown yet?)");
      mean /= nf; for (let i = 0; i < N * N; i++) { if (!gN[i]) ground[i] = mean; if (!Number.isFinite(surface[i])) surface[i] = ground[i]; }
      process.stderr.write(`  lidar hd: ${nf.toLocaleString()} of ${(N * N).toLocaleString()} cells with ground, ${k * k} samples a cell\n`);
      return { lidar: { kind: "rasters", n: N, rasters: { ground, surface, count }, collection: "IGN LiDAR HD (MNT/MNS 0.5 m)", points: null } };
    } },
  { id: "ign-ortho", layers: ["aerial"], name: "IGN BD ORTHO (true colour and infrared, read at 0.5 m)", licence: LO,
    attribution: "IGN, BD ORTHO®, Géoplateforme", url: "https://geoservices.ign.fr/bdortho", covers: inFrance,
    async fetch(place, frame) {
      const { N } = frame, { c, box } = cellsL93(frame), bands = [0, 1, 2, 3].map(() => new Float32Array(N * N));
      const rgb = await windows("ORTHOIMAGERY.ORTHOPHOTOS", box), irc = await windows("ORTHOIMAGERY.ORTHOPHOTOS.IRC", box);
      for (let i = 0; i < N * N; i++) {
        const a = pixel(rgb, c[2 * i], c[2 * i + 1]), b = pixel(irc, c[2 * i], c[2 * i + 1]);
        if (a) for (let j = 0; j < 3; j++) bands[j][i] = a[0].bands[j][a[1]];
        if (b) bands[3][i] = b[0].bands[0][b[1]];                                              // IRC is near-infrared, red, green
      }
      return { aerial: { kind: "rasters", n: N, year: "latest", tiles: ["ORTHOIMAGERY.ORTHOPHOTOS", "ORTHOIMAGERY.ORTHOPHOTOS.IRC"], rasters: { r: bands[0], g: bands[1], b: bands[2], nir: bands[3] } } };
    } },
  { id: "ign-bdtopo", layers: ["buildings", "parcels"], name: "IGN BD TOPO® buildings (batiment), named from OpenStreetMap", licence: `${LO}; names ${ODBL}`,
    attribution: "IGN, BD TOPO®, Géoplateforme; names © OpenStreetMap contributors", url: "https://geoservices.ign.fr/bdtopo", covers: inFrance,
    async fetch(place, { box }) {
      const raw = await wfs("BDTOPO_V3:batiment", box);
      const b = box, named = (await overpass(`[out:json][timeout:90];(way["name"]["building"](${b.south},${b.west},${b.north},${b.east});way["name"]["historic"](${b.south},${b.west},${b.north},${b.east});relation["name"]["building"](${b.south},${b.west},${b.north},${b.east}););out geom;`))
        .map((e) => ({ name: e.tags.name, ring: (e.geometry ?? e.members?.find((m) => m.role === "outer")?.geometry ?? []).map((p) => [p.lon, p.lat]) })).filter((o) => o.ring.length > 3);
      const feats = [], parcels = [];
      for (const f of raw) {
        if (f.properties.construction_legere || f.properties.etat_de_l_objet !== "En service") continue;
        const p = f.properties, polys = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
        polys.forEach((poly, j) => {
          const ring = poly[0].map(([x, y]) => [x, y]), id = `FR${p.cleabs.replace(/^BATIMENT0*/, "")}${polys.length > 1 ? `-${j}` : ""}`, cc = centroid(ring);
          const name = named.find((o) => inside(cc, o.ring))?.name ?? null;
          const height = place.heights?.[id] ?? (p.hauteur ?? (p.nombre_d_etages ? p.nombre_d_etages * 3 + 1 : 8));
          const peak = p.altitude_maximale_toit != null && p.altitude_minimale_sol != null ? +(p.altitude_maximale_toit - p.altitude_minimale_sol).toFixed(1) : null;
          feats.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [ring] }, properties: { id, parcel: id, height: +height.toFixed(1), peak, name, kind: p.nature } });
          parcels.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [ring] }, properties: { parcel: id, year: p.date_d_apparition ? +p.date_d_apparition.slice(0, 4) : null,
            stories: p.nombre_d_etages ?? null, units: p.nombre_de_logements ?? null, construction: construction(p.materiaux_des_murs), use: USE[p.usage_1] ?? p.usage_1 ?? null,
            address: null, name, landmark: null, nature: p.nature, wall: wall(p.materiaux_des_murs)[0], wallKind: wall(p.materiaux_des_murs)[1], roofMaterial: p.materiaux_de_la_toiture ?? null, rnb: p.identifiants_rnb ?? null } });
        });
      }
      process.stderr.write(`  bd topo: ${feats.length} footprints (${raw.length} records), ${feats.filter((f) => f.properties.name).length} named from OSM\n`);
      return { buildings: { type: "FeatureCollection", features: feats }, parcels: { type: "FeatureCollection", rollYear: "BD TOPO (current)", features: parcels } };
    } },
  { id: "ign-hydro", layers: ["water"], name: "IGN BD TOPO® water surfaces (surface_hydrographique)", licence: LO,
    attribution: "IGN, BD TOPO®, Géoplateforme", url: "https://geoservices.ign.fr/bdtopo", covers: inFrance,
    async fetch(place, { box }) {
      const feats = (await wfs("BDTOPO_V3:surface_hydrographique", box)).filter((f) => f.properties.persistance !== "Intermittent")
        .flatMap((f) => (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates])
          .map((poly) => ({ type: "Feature", properties: { name: f.properties.nature }, geometry: { type: "Polygon", coordinates: poly.map((r) => r.map(([x, y]) => [x, y])) } })));
      return { water: { type: "FeatureCollection", features: feats } };
    } },
  { id: "france-parks", layers: ["parks"], name: "OpenStreetMap parks and gardens (leisure=park|garden)", licence: ODBL, attribution: "© OpenStreetMap contributors",
    url: "https://www.openstreetmap.org/copyright", covers: inFrance,
    async fetch(place, { box: b }) {
      const els = await overpass(`[out:json][timeout:90];(way["leisure"~"^(park|garden)$"](${b.south},${b.west},${b.north},${b.east}););out geom;`);
      return { parks: { type: "FeatureCollection", features: els.filter((e) => (e.geometry ?? []).length > 3)
        .map((e) => ({ type: "Feature", properties: { name: e.tags?.name ?? null }, geometry: { type: "Polygon", coordinates: [e.geometry.map((p) => [p.lon, p.lat])] } })) } };
    } },
];
export { L93 };
