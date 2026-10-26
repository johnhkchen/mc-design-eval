// Compose a place's layers into a Minecraft structure and a manifest: the output contract the design pipeline reads.
//   ground     relaxed between contours (or flat at 0 with none), grass over dirt over stone; the box's edges reach the
//              floor as a diorama's walls
//   streets    12 m of road and 4.5 m of sidewalk either side of each centreline (outside parks)
//   water      two blocks deep at the ground's level; paths 2 m wide; playgrounds as packed mud
//   buildings  each footprint as a plain mass from the lowest ground under it to its roof height, one colour each:
//              massing for the design pipeline to replace, never the finished look
//   lidar      when there is a point cloud: the ground from its ground returns, each building cell's roof at the highest
//              return there (a 3x3 median inside the footprint, so one spike isn't a mast), and the canopy from the
//              returns standing 2 m above the ground away from any building (in place of the canopy map)
//   trees      from the canopy (trees.mjs), else the mapped tree points as simple trees
//   fit-out    a floor at every storey, a front door on the side facing the street, windows along it (fitout.mjs)
//   dressing   kerbs, lane lines, crossings, paving joints, lawns, rails, platforms, lamps, benches, railings, piers,
//              palms: the street-level detail from the same layers (dress.mjs)
//   materials  walls by the assessor's record (era and construction: materials.mjs), roofs the colour the aerial photo
//              shows, open ground green, sand or paving by the aerial photo's colour and near-infrared
// The manifest lists every building (id, footprint cells, base, height, peak) in the structure's frame, the streets
// and the sources with their licences, so a kit build can take the footprints as its plots.
import { writeFileSync } from "node:fs";
import { Voxels } from "./voxels.mjs";
import { cellsIn, distanceTo, along, lines } from "./raster.mjs";
import { groundFromContours } from "./ground.mjs";
import { canopyTrees } from "./trees.mjs";
import { wallFor, roofBlock, groundFrom } from "./materials.mjs";
import { fitOut } from "./fitout.mjs";
import { trimCanopy, dress } from "./dress.mjs";

// widths in metres; everything below is in blocks (metres x the place's scale)
const ROAD_M = 6, WALK_M = 10.5;

export function buildPlace(place, frame, L) {
  // place.roads { roadM, walkM }: a place's own street widths (a carriageway's half width, and the pavement's outer edge),
  // where the defaults' 21 m corridor is too wide (a causeway on the sands, a village's lanes)
  const { N } = frame, I = (x, z) => z * N + x, sc = frame.scale ?? 1, ROAD = (place.roads?.roadM ?? ROAD_M) * sc, WALK = (place.roads?.walkM ?? WALK_M) * sc;
  const lid = L.lidar?.rasters, air = L.aerial?.rasters;
  // a bridge's deck is not ground: ways tagged bridge (the Golden Gate's sidewalks, a footbridge) would be laid at the level
  // of whatever they cross, the water included; leave them out (a designed module puts the bridge in)
  // (likewise a way in a tunnel or under a building, or on a layer below ground: the Mont's lanes under the abbey's vaults)
  const isBridge = (f) => { const t = f.properties ?? {}; return (t.bridge && t.bridge !== "no") || (t["min_height"] && parseFloat(t["min_height"]) > 2); };
  const onBridge = (f) => { const t = f.properties ?? {}; return isBridge(f) || (t.tunnel && t.tunnel !== "no") || parseFloat(t.layer) < 0; };
  // (kept aside as L.bridges, for the place's own decks: dress.mjs place.dress.decks)
  L = { ...L, bridges: { type: "FeatureCollection", features: ["streets", "paths"].flatMap((k) => (L[k]?.features ?? []).filter(isBridge)) } };
  for (const k of ["streets", "paths", "barriers", "rails"]) if (L[k]?.features) L = { ...L, [k]: { ...L[k], features: L[k].features.filter((f) => !onBridge(f)) } };
  // place.lanes { box: [x0, z0, x1, z1] (blocks), match ("^service$": the street's highway class, or its name where the
  // cache kept no class), widthM 3, block "cobblestone" }: streets in the box drawn as narrow paved lanes that follow the
  // ground (no carriageway, kerb, pavement or lines): a walled village's service lane is not a 6 m road with markings
  let lanes = [];
  if (place.lanes) { const [x0, z0, x1, z1] = place.lanes.box, re = new RegExp(place.lanes.match ?? "^service$");
    const isLane = (f) => re.test(f.properties?.highway ?? f.properties?.name ?? "") && lines(f.geometry).flat().every(([lo, la]) => { const [x, z] = frame.toBlock(lo, la); return x >= x0 && x <= x1 && z >= z0 && z <= z1; });
    lanes = (L.streets?.features ?? []).filter(isLane); L = { ...L, streets: { ...L.streets, features: L.streets.features.filter((f) => !isLane(f)) } }; }
  const parcels = new Map((L.parcels?.features ?? []).map((f) => [f.properties.parcel, f.properties]));
  const H = lid ? Float64Array.from(lid.ground, (m) => m * (frame.scale ?? 1))
    // a ground raster (metres per cell: a national DTM, or a DEM taken down to the ground) is used as it is
    : L.ground?.kind === "raster" ? Float64Array.from(L.ground.data, (m) => m * (frame.scale ?? 1))
    : L.ground ? groundFromContours(frame, L.ground, { field: L.ground.field, unit: L.ground.unit * (frame.scale ?? 1) }) : new Float64Array(N * N);
  // place.flats.flatten: the tidal flat (open ground below flats.belowM) laid level at its median (or flats.levelM): the
  // survey's 1-block steps across a bay read as contour lines in a low sun
  // OSM farmland and meadows: never tidal flat (the polders behind the dike lie as low as the bay)
  const field = new Uint8Array(N * N); for (const f of L.fields?.features ?? []) for (const [x, z] of cellsIn(frame, f.geometry)) field[I(x, z)] = /meadow/.test(f.properties.landuse) ? 2 : 1;
  const flat = (i) => lid.ground[i] < place.flats.belowM && !field[i];
  // place.flats.dropPaths: walking routes mapped across the tidal flat (the guided crossings of a bay) leave no trace on the
  // sand; a path most of whose length lies on the flat is left out (a causeway or jetty stands above the flat, so it stays)
  if (place.flats?.dropPaths && lid && L.paths) L = { ...L, paths: { ...L.paths, features: L.paths.features.filter((f) => {
    const pts = along(frame, [f]); let on = 0, n = 0; for (const [fx, fz] of pts) { const x = Math.floor(fx), z = Math.floor(fz); if (x < 0 || z < 0 || x >= N || z >= N) continue; n++; if (flat(I(x, z))) on++; }
    return !n || on / n < 0.7; }) } };
  if (place.flats?.flatten && lid) { const fl = []; for (let i = 0; i < N * N; i++) if (flat(i)) fl.push(lid.ground[i]);
    fl.sort((a, b) => a - b); const level = (place.flats.levelM ?? fl[fl.length >> 1]) * (frame.scale ?? 1);
    for (let i = 0; i < N * N; i++) if (flat(i)) H[i] = level; }
  const park = new Uint8Array(N * N), water = new Uint8Array(N * N), path = new Uint8Array(N * N), play = new Uint8Array(N * N);
  for (const f of L.parks?.features ?? []) for (const [x, z] of cellsIn(frame, f.geometry)) park[I(x, z)] = 1;
  for (const f of L.water?.features ?? []) for (const [x, z] of cellsIn(frame, f.geometry)) water[I(x, z)] = 1;
  // open water the hydrography leaves out (the NHD's waterbodies stop at the shore of the Bay): lidar ground within a metre
  // of sea level with nothing standing on it (a pier's deck reads metres up) or only something far overhead (a bridge's
  // deck, 20 m and more up), levelled to one surface
  if (lid) {
    // the water line differs by datum (the Bay reads near 0 m, Elliott Bay about 1.5 m): within 0.7 m of the frame's
    // lowest ground (its 2nd percentile), never above 3 m
    const sorted = Float32Array.from(lid.ground).sort(), lo = sorted[Math.floor(sorted.length * 0.02)], line = Math.min(3, Math.max(1, lo + 0.7));
    const sea = []; for (let i = 0; i < N * N; i++) if (lid.ground[i] < line && (!lid.count[i] || lid.surface[i] - lid.ground[i] < 0.5 || lid.surface[i] - lid.ground[i] > 20)) { water[i] = 2; sea.push(lid.ground[i]); }
    // open water often returns no points at all (the Golden Gate): the gap is filled from the shore, metres up. A big
    // returnless region (over N cells) that touches the water found above is water too
    if (sea.length) { const seen = new Uint8Array(N * N);
      for (let s = 0; s < N * N; s++) { if (seen[s] || lid.count[s]) continue;
        const comp = [s], stack = [s]; seen[s] = 1; let wet = false;
        while (stack.length) { const i = stack.pop(), x = i % N, z = (i / N) | 0;
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= N || nz >= N) continue;
            const j = nz * N + nx; if (water[j] === 2) wet = true; if (seen[j] || lid.count[j]) continue; seen[j] = 1; stack.push(j); comp.push(j); } }
        if (wet && comp.length > N) for (const i of comp) if (water[i] !== 2) { water[i] = 2; sea.push(Math.min(lid.ground[i], line)); } } }
    if (sea.length > N) { sea.sort((p, q) => p - q); const level = sea[sea.length >> 1] * sc; for (let i = 0; i < N * N; i++) if (water[i] === 2) H[i] = level; }
    else for (let i = 0; i < N * N; i++) if (water[i] === 2) water[i] = 0;
    // a mapped river or lake (the hydrography's polygons) lies flat too: each connected body at its own low ground (the
    // 20th percentile of its cells: the lidar's few water returns scatter high, a bridge's deck higher), not the ground
    // under each cell, which stepped the Seine in bands from bank to bank
    { const seen = new Uint8Array(N * N);
      for (let s = 0; s < N * N; s++) { if (water[s] !== 1 || seen[s]) continue;
        const comp = [s], stack = [s]; seen[s] = 1;
        while (stack.length) { const i = stack.pop(), x = i % N, z = (i / N) | 0;
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= N || nz >= N) continue;
            const j = nz * N + nx; if (water[j] !== 1 || seen[j]) continue; seen[j] = 1; stack.push(j); comp.push(j); } }
        if (comp.length < 50) continue;
        const v = comp.map((i) => lid.ground[i]).sort((a, b) => a - b), level = v[Math.floor(v.length * 0.2)] * sc;
        for (const i of comp) H[i] = level; } }
    // the ground returns carry a few centimetres of noise, and rounding that to blocks on a gentle slope leaves ragged
    // one-block terraces over every plaza and car park: relax it over about 3 m (two box passes), water held level
    const r = Math.max(1, Math.round(2 * sc)), tmp = new Float64Array(N * N);
    for (let pass = 0; pass < 2; pass++) for (const [src, dst, ax] of [[H, tmp, 1], [tmp, H, N]]) {
      for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
        const i = ax === 1 ? a * N + b : b * N + a, at = b; if (water[i]) { dst[i] = src[i]; continue; }
        let s = 0, n = 0; for (let d = -r; d <= r; d++) { const t = at + d; if (t < 0 || t >= N) continue; const j = i + d * ax; if (water[j]) continue; s += src[j]; n++; }
        dst[i] = s / n; } }
  }
  // place.roads.level: a street lies level across its width (no camber rolling to the sides over a hillside's lidar) and
  // smooth along its length: each cell within the sidewalk's reach takes the height of the nearest point of its centreline,
  // the centreline being the ground's median across the carriageway, averaged over about 8 m along the way. The lanes
  // (place.lanes) level across their width the same way; their climb stays stepped (pathStairs)
  if (place.roads?.level) {
    const best = new Float32Array(N * N).fill(Infinity), to = new Float64Array(N * N).fill(NaN), win = Math.max(2, Math.round(8 * sc));
    const level = (features, reach) => { for (const f of features) for (const line of lines(f.geometry)) {
      const pts = along(frame, [{ geometry: { type: "LineString", coordinates: line } }]); if (!pts.length) continue;
      const c = pts.map(([px, pz]) => { const v = []; for (let dz = -reach; dz <= reach; dz++) for (let dx = -reach; dx <= reach; dx++) { if (dx * dx + dz * dz > reach * reach) continue;
        const x = Math.floor(px + dx), z = Math.floor(pz + dz); if (x >= 0 && z >= 0 && x < N && z < N && !water[I(x, z)]) v.push(H[I(x, z)]); }
        v.sort((a, b) => a - b); return v.length ? v[v.length >> 1] : NaN; });
      const s = c.map((_, k) => { let t = 0, n = 0; for (let j = Math.max(0, k - win); j <= Math.min(c.length - 1, k + win); j++) if (Number.isFinite(c[j])) { t += c[j]; n++; } return n ? t / n : NaN; });
      pts.forEach(([px, pz], k) => { if (!Number.isFinite(s[k])) return; const R = reach + 1;
        for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) { const x = Math.floor(px + dx), z = Math.floor(pz + dz); if (x < 0 || z < 0 || x >= N || z >= N) continue;
          const d = Math.hypot(x + 0.5 - px, z + 0.5 - pz), i = I(x, z); if (d <= reach && d < best[i] && !water[i]) { best[i] = d; to[i] = s[k]; } } }); } };
    level(L.streets?.features ?? [], WALK); level(lanes, (place.lanes?.widthM ?? 3) * sc / 2);
    let n = 0, moved = 0, most = 0; for (let i = 0; i < N * N; i++) if (Number.isFinite(to[i])) { const m = Math.abs(Math.round(to[i]) - Math.round(H[i])); n++; if (m) moved++; most = Math.max(most, m); H[i] = to[i]; }
    console.log(`${place.name ?? "place"}: roads levelled: ${n} cells, ${moved} moved (by up to ${most} blocks)`);
  }
  for (const f of L.playgrounds?.features ?? []) for (const [x, z] of cellsIn(frame, f.geometry)) play[I(x, z)] = 1;
  // paths 2 m wide
  for (const [fx, fz] of along(frame, L.paths?.features ?? [])) for (let dz = -sc; dz <= sc; dz += 0.5) for (let dx = -sc; dx <= sc; dx += 0.5) {
    if (dx * dx + dz * dz > sc * sc) continue; const x = Math.floor(fx + dx), z = Math.floor(fz + dz); if (x >= 0 && z >= 0 && x < N && z < N) path[I(x, z)] = 1; }
  // the lanes (place.lanes): paved their own width
  const laneR = (place.lanes?.widthM ?? 3) * sc / 2;
  for (const [fx, fz] of along(frame, lanes)) for (let dz = -laneR; dz <= laneR; dz += 0.5) for (let dx = -laneR; dx <= laneR; dx += 0.5) {
    if (dx * dx + dz * dz > laneR * laneR) continue; const x = Math.floor(fx + dx), z = Math.floor(fz + dz); if (x >= 0 && z >= 0 && x < N && z < N) path[I(x, z)] = 3; }
  // place.parkPaths { width (m), block }: the walks inside parks drawn wider and in their own surface (the National Mall's
  // gravel walks are 6-12 m, and read pale between the elm rows); paths elsewhere (sidewalks mapped as footways) stay 2 m
  if (place.parkPaths) { const r = (place.parkPaths.width ?? 6) * sc / 2;
    for (const [fx, fz] of along(frame, L.paths?.features ?? [])) { const cx = Math.floor(fx), cz = Math.floor(fz); if (cx < 0 || cz < 0 || cx >= N || cz >= N || !park[I(cx, cz)]) continue;
      for (let dz = -r; dz <= r; dz += 0.5) for (let dx = -r; dx <= r; dx += 0.5) { if (dx * dx + dz * dz > r * r) continue;
        const x = Math.floor(fx + dx), z = Math.floor(fz + dz); if (x >= 0 && z >= 0 && x < N && z < N && park[I(x, z)]) path[I(x, z)] = 2; } } }
  const road = distanceTo(frame, (L.streets?.features ?? []).map((f) => f.geometry), WALK + 2 * sc);

  let lo = Infinity, hi = -Infinity; for (const h of H) { lo = Math.min(lo, h); hi = Math.max(hi, h); }
  const floor = Math.floor(lo) - Math.round(4 * sc), ground = (x, z) => Math.round(H[I(x, z)]) - floor;
  // place.addBuildings [{ id, name, centre: [lat, lon], radiusM, heightM }]: a landmark the building layer lacks, as a round
  // footprint for its kit to stand on (OSM maps Auckland's Sky Tower as a tower, not a building)
  if (place.addBuildings) L = { ...L, buildings: { ...L.buildings, features: [...(L.buildings?.features ?? []), ...place.addBuildings.map((a) => {
    const [la, lo] = a.centre, kLo = 111000 * Math.cos((la * Math.PI) / 180), ring = [];
    for (let k = 0; k <= 32; k++) { const t = (2 * Math.PI * k) / 32; ring.push([lo + (a.radiusM * Math.cos(t)) / kLo, la + (a.radiusM * Math.sin(t)) / 111000]); }
    return { type: "Feature", geometry: { type: "Polygon", coordinates: [ring] }, properties: { id: a.id, name: a.name ?? null, height: a.heightM ?? null, peak: a.heightM ?? null } }; })] } };
  const buildings = (L.buildings?.features ?? []).map((f, k) => {
    const cells = cellsIn(frame, f.geometry).filter(([x, z]) => road[I(x, z)] > ROAD); if (!cells.length) return null;
    // place.peaks { id: metres }: a footprint's real peak where its record has none and the lidar caught something over it
    // (a bird or a crane: a 12-storey block in Washington read 700 m)
    const p = place.peaks?.[f.properties.id] != null ? { ...f.properties, peak: place.peaks[f.properties.id] } : f.properties, base = Math.min(...cells.map(([x, z]) => ground(x, z)));
    // the footprint's height, from its record, else the lidar surface's median over it (Seattle's outlines carry none; an
    // OSM outline with no height or levels tag carries a guessed 8 m, which the lidar overrules: Auckland's towers)
    let hm = p.heightGuessed && lid ? NaN : p.height; if (!Number.isFinite(hm) && lid) { const v = cells.map(([x, z]) => I(x, z)).filter((i) => lid.count[i] > 0).map((i) => lid.surface[i] - lid.ground[i]).sort((a, b) => a - b); hm = v.length ? v[v.length >> 1] : NaN; }
    const height = Math.max(3, Math.round((Number.isFinite(hm) ? hm : 6) * sc));
    // each cell's roof: the lidar surface there (3x3 median within the footprint), or the footprint's median height
    const own = new Set(cells.map(([x, z]) => I(x, z))), tops = new Map();
    // where the lidar has no roof over a cell, the recorded height; with no record (the height above is the lidar's own
    // median), a single storey, or a tower's outline would stand its full height wherever it reaches past the tower
    const fallback = Number.isFinite(p.height) && !p.heightGuessed ? base + height : base + Math.round(3 * sc);
    for (const [x, z] of cells) {
      let t = fallback;
      if (lid) { const v = [];
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const j = I(x + dx, z + dz); if (own.has(j) && lid.count[j] > 0) v.push(lid.surface[j]); }
        if (v.length) { v.sort((a, b) => a - b); let m = Math.round(v[v.length >> 1] * sc) - floor;
          // no higher than the footprint's own peak (a tree over the roof is not roof), 1 m of slack
          if (Number.isFinite(p.peak) && p.peak > 0) m = Math.min(m, base + Math.round((p.peak + 1) * sc));
          if (m > ground(x, z) + Math.round(2 * sc)) t = m; } }
      // Minecraft 1.21.1 builds no higher than y 319 (a world's sections start at 0 here): a supertall stops at the limit,
      // unless the place raises it (place.maxY: a tall world, which anvil.mjs opens past 320 with a datapack)
      tops.set(I(x, z), Math.min(t, place.maxY ?? 318));
    }
    return { id: p.id, parcel: p.parcel ?? null, name: p.name ?? null, cells, base, height, peak: p.peak, k, tops, own };
  }).filter(Boolean);
  const isB = new Uint8Array(N * N); for (const b of buildings) for (const [x, z] of b.cells) isB[I(x, z)] = 1;
  // the canopy: from the lidar where there is one (returns 2 m above the ground, a block clear of any building, with at
  // least three canopy neighbours so a lamp post isn't a tree), else the canopy map
  let chm = L.canopy?.data ?? null, canopyGreen = null;
  // place.canopyFrom "map": the canopy map even where there is lidar (Paris's 2024 flight is a winter one round a works
  // site: bare crowns and the restoration's cranes grew into tall trunks with a tuft on top in the Square Jean-XXIII)
  if (lid && place.canopyFrom !== "map") { chm = new Float32Array(N * N); const near = new Uint8Array(N * N);
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) if (isB[I(x, z)]) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, zz = z + dz; if (xx >= 0 && zz >= 0 && xx < N && zz < N) near[I(xx, zz)] = 1; }
    // lidar can't tell a crown from a planter box, a lamp post or a cornice past the footprint, but foliage is bright in
    // the aerial photo's near-infrared and stone isn't: trimCanopy (dress.mjs) judges each patch by its green, its size
    // and its height (a bare winter crown is still a tree; a pole or a kiosk isn't)
    const green = (i) => !air || (air.nir[i] - air.r[i]) / (air.nir[i] + air.r[i] + 1e-6) > 0.12; canopyGreen = green;
    const h = (i) => (lid.count[i] && !near[i] ? lid.surface[i] - lid.ground[i] : 0);
    // no tree stands over 70 m (the tallest in either city are about 60): taller returns off a footprint are a tower's
    // reach past its outline (the Space Needle's legs and saucer over its lawn), not a crown
    // (place.maxTreeM lowers that where the flight caught construction cranes: the Mall's 2014 lidar has two over the
    // African American museum's site, which grew into 25-block log columns)
    const tallest = place.maxTreeM ?? 70;
    for (let z = 1; z < N - 1; z++) for (let x = 1; x < N - 1; x++) { const i = I(x, z), v = h(i); if (v < 2 || v > tallest) continue;
      let k = 0; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if ((dx || dz) && h(I(x + dx, z + dz)) >= 2) k++;
      if (k >= 3) chm[i] = v * sc; } }
  let canopyTop = Math.round(8 * sc); if (chm) { canopyTop = 0; for (const v of chm) if (v > canopyTop) canopyTop = v; }
  // the tallest roof or the tallest crown on the highest ground, whichever is higher (H is already in blocks)
  let roofTop = 0; for (const b of buildings) for (const t of b.tops.values()) if (t > roofTop) roofTop = t;
  const top = Math.max(roofTop, Math.round(hi) - floor + Math.ceil(canopyTop)) + 3;
  // place.sparse (or a volume past 2^31 cells): 16-cube sections allocated as they fill, not one dense array
  const g = new Voxels([N, top, N], { dataVersion: 3955, sparse: place.sparse ?? N * N * top > 2 ** 31 });   // 2 bytes a cell (voxels.mjs), not an object a block

  // the open ground's cover by the aerial photo, cell by cell, then the commonest within 2 blocks: one pixel of sunlit
  // concrete is not a sandpit, and a plaza shouldn't speckle stone, andesite and sand
  const cover = new Array(N * N).fill(null);
  if (air) { const raw = new Array(N * N); for (let i = 0; i < N * N; i++) raw[i] = groundFrom(air.r[i], air.g[i], air.b[i], air.nir[i], { park: !!park[i], dry: !!place.dryGrass });
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const n = new Map(); let best = raw[I(x, z)], bn = 0;
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= N || zz >= N) continue;
        const v = raw[I(xx, zz)]; if (!v) continue; const c = (n.get(v) ?? 0) + 1; n.set(v, c); if (c > bn) { bn = c; best = v; } }
      cover[I(x, z)] = best; } }
  // place.flats { belowM, block }: open ground below that elevation is the tidal flat (wet sand photographs grey and would
  // be paving); vegetation (salt meadow) stays grass
  // flats.blocks [[block, weight], ...]: a mix in broad soft zones (value noise over 40-block cells, dithered at the edges), wet and dry sand
  const fb = place.flats?.blocks, wsum = fb ? fb.reduce((a, b) => a + b[1], 0) : 0;
  const vn = (x, z) => { const h = (a, b) => { let v = Math.imul(a, 73856093) ^ Math.imul(b, 19349663); v ^= v >>> 13; return (Math.imul(v, 1274126177) >>> 0) / 4294967296; };
    const S = 40, gx = Math.floor(x / S), gz = Math.floor(z / S), fx = x / S - gx, fz = z / S - gz, sm = (t) => t * t * (3 - 2 * t);
    const a = h(gx, gz) + (h(gx + 1, gz) - h(gx, gz)) * sm(fx), b = h(gx, gz + 1) + (h(gx + 1, gz + 1) - h(gx, gz + 1)) * sm(fx); return a + (b - a) * sm(fz); };
  // the dither is a full integer mix: x*k1 ^ z*k2 alone laid the grey in straight diagonal streaks across the bay
  const flatBlock = (i) => { if (!fb) return place.flats.block ?? "sand"; const x = i % N, z = (i / N) | 0, j = (() => { let v = Math.imul(x, 0x27d4eb2d) ^ Math.imul(z, 0x165667b1); v ^= v >>> 15; v = Math.imul(v, 0x85ebca6b); v ^= v >>> 13; v = Math.imul(v, 0xc2b2ae35); v ^= v >>> 16; return (v >>> 0) / 4294967296; })(); let t = Math.min(0.999, Math.max(0, vn(x, z) * 0.75 + j * 0.25)) * wsum; for (const [b, w] of fb) { if ((t -= w) <= 0) return b; } return fb.at(-1)[0]; };
  if (place.flats && lid) for (let i = 0; i < N * N; i++) if (flat(i) && cover[i] !== "grass_block") cover[i] = flatBlock(i);
  // fields: a meadow is grass; farmland grass where it's green, else turned earth (the aerial would call it paving)
  for (let i = 0; i < N * N; i++) if (field[i] && cover[i] !== "grass_block") cover[i] = field[i] === 2 ? "grass_block" : "coarse_dirt";
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const y = ground(x, z), i = I(x, z); let low = y - 3;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; low = nx < 0 || nz < 0 || nx >= N || nz >= N ? 0 : Math.min(low, ground(nx, nz) - 1); }
    for (let yy = Math.max(0, low); yy < y; yy++) g.set(x, yy, z, y - yy <= Math.round(3 * sc) ? "dirt" : "stone");
    const d = road[i];
    if (water[i] && d > WALK && !isB[i]) { const deep = Math.max(2, Math.round(2 * sc)); g.set(x, y - deep, z, "clay"); for (let k = 0; k < deep; k++) g.set(x, y - k, z, "water", { level: "0" }); continue; }
    const seen = cover[i];
    // place.mossSlopes: on a grassy slope each one-block terrace shows its side, the grass block's dirt face and the dirt under
    // it, so a hillside reads in orange stripes (Maungawhau's crater); there the step's face is moss, green on every side
    if (place.mossSlopes && (seen ?? "grass_block") === "grass_block" && d > WALK && !isB[i] && !path[i] && !play[i] && low < y - 1) {
      for (let yy = Math.max(0, low + 1); yy <= y; yy++) g.set(x, yy, z, "moss_block"); continue; }
    g.set(x, y, z, d <= ROAD ? "gray_concrete" : d <= WALK && !park[i] ? "smooth_stone" : isB[i] ? "stone" : path[i] ? (path[i] === 3 ? place.lanes.block ?? "cobblestone" : path[i] === 2 ? place.parkPaths.block ?? "andesite" : "andesite") : play[i] ? "packed_mud" : seen ?? "grass_block");
  }
  // place.pathStairs: where a lane or path climbs a block from one cell to the next it steps up by a stair, not a full block
  // (the Mont's lanes and the Grande Rue climb the rock in flights; a column of whole blocks reads as a ramp of terraces)
  if (place.pathStairs) { const STAIR = { cobblestone: "cobblestone_stairs", andesite: "andesite_stairs", stone_bricks: "stone_brick_stairs", smooth_stone: "stone_stairs" };
    for (let z = 1; z < N - 1; z++) for (let x = 1; x < N - 1; x++) { const i = I(x, z); if (!path[i] || isB[i] || water[i] || road[i] <= WALK) continue;
      const y = ground(x, z), down = [[0, 1, "north"], [0, -1, "south"], [1, 0, "west"], [-1, 0, "east"]].find(([dx, dz]) => { const j = I(x + dx, z + dz); return path[j] && !isB[j] && ground(x + dx, z + dz) === y - 1; });
      if (!down) continue; const blk = path[i] === 3 ? place.lanes.block ?? "cobblestone" : path[i] === 2 ? place.parkPaths.block ?? "andesite" : "andesite";
      if (STAIR[blk]) g.set(x, y, z, STAIR[blk], { facing: down[2], half: "bottom", shape: "straight", waterlogged: "false" }); } }
  // hollow masses (walls and roof): placeholders, and a solid town at 2 blocks a metre is millions of blocks
  // a wall where the footprint ends, and a closed roof: each cell from just above its lowest neighbour's roof to its own
  for (const b of buildings) {
    const rec = parcels.get(b.parcel), wall = wallFor(b.id, rec, b.cells.length / (sc * sc));
    // the roof: the median aerial colour over the footprint, matched to a roofing block
    let roof = wall.block;
    if (air) { const px = b.cells.map(([x, z]) => I(x, z)).filter((i) => air.r[i] || air.g[i] || air.b[i]);
      if (px.length) { const med = (a) => { const v = px.map((i) => a[i]).sort((p, q) => p - q); return v[v.length >> 1]; }; roof = roofBlock([med(air.r), med(air.g), med(air.b)]); } }
    Object.assign(b, { wall: wall.block, kind: wall.kind, roof, record: rec ?? null });
    for (const [x, z] of b.cells) { const t = b.tops.get(I(x, z)), nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => I(x + dx, z + dz));
      const edge = nb.some((j) => !b.own.has(j)), from = edge ? ground(x, z) + 1 : Math.min(t, ...nb.map((j) => b.tops.get(j) + 1));
      // walls up to the roof's lowest course here; the top course (and the closing courses inside) are roof
      for (let y = from; y <= t; y++) g.set(x, y, z, edge && y < t ? wall.block : roof); }
    // floors, a front door to the street, windows (fitout.mjs); not on the big civic buildings, which the design pass draws
    if (rec && wall.kind !== "civic or commercial" || /commercial/.test(wall.kind) && b.cells.length / (sc * sc) < 800) Object.assign(b, fitOut(g, b, { I, ground, road, sc })); }

  // the street's dressing (dress.mjs) reads the same layers; palms and specks leave the canopy before the trees grow
  const site = { place, frame, L, N, I, sc, ground, road, ROAD, WALK, water, park, path, isB, lid }, trimmed = chm ? trimCanopy(chm, site, { green: canopyGreen }) : null;
  const open = (x, z) => { const i = I(x, z); return !isB[i] && !water[i] && road[i] > ROAD; };
  let trees;
  if (chm) trees = canopyTrees(g, { chm, n: N, ground, open, scale: sc });
  else { trees = { trees: [] };
    for (const f of L.trees?.features ?? []) { const [fx, fz] = frame.toBlock(...f.geometry.coordinates), x = Math.floor(fx), z = Math.floor(fz);
      if (x < 2 || z < 2 || x >= N - 2 || z >= N - 2 || !open(x, z)) continue; const y0 = ground(x, z);
      for (let y = 1; y <= 5; y++) g.set(x, y0 + y, z, "oak_log", { axis: "y" });
      for (let dy = 3; dy <= 6; dy++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (Math.abs(dx) + Math.abs(dz) <= (dy === 6 ? 1 : 3) && !g.get(x + dx, y0 + dy, z + dz)) g.set(x + dx, y0 + dy, z + dz, "oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" });
      trees.trees.push({ at: [x, z] }); } }
  const dressing = { ...trimmed, ...dress(g, site) };
  // a tree whose ground the dressing turned to sea (a rock or a float the lidar's canopy stood on) floats: its trunk goes,
  // and the leaves no trunk holds up any more
  { const [, Y] = g.size, gone = [], name = (x, y, z) => g.get(x, y, z)?.block ?? "";
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      let w = -1; for (let y = 0; y < Y; y++) if (/water/.test(name(x, y, z))) w = y; if (w < 0) continue;
      let y = w + 1; while (y < w + 6 && !name(x, y, z)) y++;                        // the first thing over the water, if near
      if (!/_log$/.test(name(x, y, z))) continue;
      for (let yy = y; yy < Y && /_log$/.test(name(x, yy, z)); yy++) g.set(x, yy, z, "air"); gone.push([x, y, z]); }
    for (const [cx, cy, cz] of gone) for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) for (let y = cy; y < Math.min(Y, cy + 16); y++) {
      const x = cx + dx, z = cz + dz; if (!/leaves$/.test(name(x, y, z))) continue;
      let held = false; for (let ez = -3; ez <= 3 && !held; ez++) for (let ex = -3; ex <= 3 && !held; ex++) for (let ey = -5; ey <= 2 && !held; ey++) if (/_log$/.test(name(x + ex, y + ey, z + ez))) held = true;
      if (!held) g.set(x, y, z, "air"); } }

  // place.tideM: the sea in at that level over every open cell below it that the sea can reach (a high-tide view of a
  // tidal island): flooded outward from the water already there, never over mapped farmland or meadow (the polders behind
  // the dykes lie below a spring tide too, and their ditches would let it in); decks and
  // piers stand over it
  if (Number.isFinite(place.tideM)) { const ty = Math.round(place.tideM * sc) - floor; let n = 0;
    // a road between two fields or a street between houses is not the sea's either: dry within GAP cells of farmland or a
    // building (a chamfer distance), which also leaves a strip of shore along a polder's seaward edge
    const GAP = Math.round(6 * sc), near = new Float32Array(N * N).fill(1e9);
    for (let i = 0; i < N * N; i++) if (field[i] || isB[i]) near[i] = 0;
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const i = I(x, z); let d = near[i];
      if (x > 0) d = Math.min(d, near[i - 1] + 1); if (z > 0) d = Math.min(d, near[i - N] + 1); if (x > 0 && z > 0) d = Math.min(d, near[i - N - 1] + 1.414); if (x < N - 1 && z > 0) d = Math.min(d, near[i - N + 1] + 1.414); near[i] = d; }
    for (let z = N - 1; z >= 0; z--) for (let x = N - 1; x >= 0; x--) { const i = I(x, z); let d = near[i];
      if (x < N - 1) d = Math.min(d, near[i + 1] + 1); if (z < N - 1) d = Math.min(d, near[i + N] + 1); if (x < N - 1 && z < N - 1) d = Math.min(d, near[i + N + 1] + 1.414); if (x > 0 && z < N - 1) d = Math.min(d, near[i + N - 1] + 1.414); near[i] = d; }
    const land = (j) => near[j] <= GAP;
    const sea = new Uint8Array(N * N), q = [];   // seeded by the water the land already has (the channels, the open sea)
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const b = g.get(x, ground(x, z) + 1, z)?.block ?? g.get(x, ground(x, z), z)?.block ?? "";
      if (/water/.test(b) && !land(I(x, z))) { sea[I(x, z)] = 1; q.push(x, z); } }
    while (q.length) { const z = q.pop(), x = q.pop();
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Z = z + dz; if (X < 0 || Z < 0 || X >= N || Z >= N) continue;
        const j = I(X, Z); if (sea[j] || land(j) || ground(X, Z) >= ty) continue; sea[j] = 1; q.push(X, Z); } }
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const i = I(x, z); if (isB[i] || !sea[i]) continue;
      for (let y = ground(x, z) + 1; y <= ty; y++) if (!g.get(x, y, z) || /grass$|fern$|flower|poppy|dandelion/.test(g.get(x, y, z).block)) { g.set(x, y, z, "water", { level: "0" }); n++; } }
    // IRL_TIDE_MAP=file.pgm: the flood as a picture (white sea, grey farmland, black dry land), to check a dyke holds
    if (process.env.IRL_TIDE_MAP) { const px = Buffer.alloc(N * N); for (let i = 0; i < N * N; i++) px[i] = sea[i] ? 255 : field[i] ? 110 : ground(i % N, (i / N) | 0) < ty ? 50 : 0;
      writeFileSync(process.env.IRL_TIDE_MAP, Buffer.concat([Buffer.from(`P5 ${N} ${N} 255\n`), px])); }
    process.stderr.write(`  tide at ${place.tideM} m (y ${ty}): ${n.toLocaleString()} water blocks\n`); }

  const manifest = { place: place.id, name: place.name, size: g.size, metresPerBlock: 1 / sc, floorElevation: +(floor / sc).toFixed(1), box: frame.box, ground: [+(lo / sc).toFixed(1), +(hi / sc).toFixed(1)],
    streets: [...new Set((L.streets?.features ?? []).map((f) => f.properties.name))], trees: trees.trees.length, dressing,
    buildings: buildings.map(({ cells, k, tops, own, ...b }) => ({ ...b, top: Math.max(...tops.values()), footprint: cells })),
    aerial: L.aerial ? { year: L.aerial.year, tiles: L.aerial.tiles } : null, parcelRollYear: L.parcels?.rollYear ?? null };
  return { grid: g, manifest, ground };
}
