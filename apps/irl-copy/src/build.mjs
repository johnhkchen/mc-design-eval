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
import { Voxels } from "./voxels.mjs";
import { cellsIn, distanceTo, along } from "./raster.mjs";
import { groundFromContours } from "./ground.mjs";
import { canopyTrees } from "./trees.mjs";
import { wallFor, roofBlock, groundFrom } from "./materials.mjs";
import { fitOut } from "./fitout.mjs";
import { trimCanopy, dress } from "./dress.mjs";

// widths in metres; everything below is in blocks (metres x the place's scale)
const ROAD_M = 6, WALK_M = 10.5;

export function buildPlace(place, frame, L) {
  const { N } = frame, I = (x, z) => z * N + x, sc = frame.scale ?? 1, ROAD = ROAD_M * sc, WALK = WALK_M * sc;
  const lid = L.lidar?.rasters, air = L.aerial?.rasters;
  // a bridge's deck is not ground: ways tagged bridge (the Golden Gate's sidewalks, a footbridge) would be laid at the level
  // of whatever they cross, the water included; leave them out (a designed module puts the bridge in)
  const onBridge = (f) => { const t = f.properties ?? {}; return (t.bridge && t.bridge !== "no") || (t["min_height"] && parseFloat(t["min_height"]) > 2); };
  for (const k of ["streets", "paths", "barriers", "rails"]) if (L[k]?.features) L = { ...L, [k]: { ...L[k], features: L[k].features.filter((f) => !onBridge(f)) } };
  const parcels = new Map((L.parcels?.features ?? []).map((f) => [f.properties.parcel, f.properties]));
  const H = lid ? Float64Array.from(lid.ground, (m) => m * (frame.scale ?? 1))
    : L.ground ? groundFromContours(frame, L.ground, { field: L.ground.field, unit: L.ground.unit * (frame.scale ?? 1) }) : new Float64Array(N * N);
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
    // the ground returns carry a few centimetres of noise, and rounding that to blocks on a gentle slope leaves ragged
    // one-block terraces over every plaza and car park: relax it over about 3 m (two box passes), water held level
    const r = Math.max(1, Math.round(2 * sc)), tmp = new Float64Array(N * N);
    for (let pass = 0; pass < 2; pass++) for (const [src, dst, ax] of [[H, tmp, 1], [tmp, H, N]]) {
      for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
        const i = ax === 1 ? a * N + b : b * N + a, at = b; if (water[i]) { dst[i] = src[i]; continue; }
        let s = 0, n = 0; for (let d = -r; d <= r; d++) { const t = at + d; if (t < 0 || t >= N) continue; const j = i + d * ax; if (water[j]) continue; s += src[j]; n++; }
        dst[i] = s / n; } }
  }
  for (const f of L.playgrounds?.features ?? []) for (const [x, z] of cellsIn(frame, f.geometry)) play[I(x, z)] = 1;
  // paths 2 m wide
  for (const [fx, fz] of along(frame, L.paths?.features ?? [])) for (let dz = -sc; dz <= sc; dz += 0.5) for (let dx = -sc; dx <= sc; dx += 0.5) {
    if (dx * dx + dz * dz > sc * sc) continue; const x = Math.floor(fx + dx), z = Math.floor(fz + dz); if (x >= 0 && z >= 0 && x < N && z < N) path[I(x, z)] = 1; }
  const road = distanceTo(frame, (L.streets?.features ?? []).map((f) => f.geometry), WALK + 2 * sc);

  let lo = Infinity, hi = -Infinity; for (const h of H) { lo = Math.min(lo, h); hi = Math.max(hi, h); }
  const floor = Math.floor(lo) - Math.round(4 * sc), ground = (x, z) => Math.round(H[I(x, z)]) - floor;
  const buildings = (L.buildings?.features ?? []).map((f, k) => {
    const cells = cellsIn(frame, f.geometry).filter(([x, z]) => road[I(x, z)] > ROAD); if (!cells.length) return null;
    const p = f.properties, base = Math.min(...cells.map(([x, z]) => ground(x, z)));
    // the footprint's height, from its record, else the lidar surface's median over it (Seattle's outlines carry none)
    let hm = p.height; if (!Number.isFinite(hm) && lid) { const v = cells.map(([x, z]) => I(x, z)).filter((i) => lid.count[i] > 0).map((i) => lid.surface[i] - lid.ground[i]).sort((a, b) => a - b); hm = v.length ? v[v.length >> 1] : NaN; }
    const height = Math.max(3, Math.round((Number.isFinite(hm) ? hm : 6) * sc));
    // each cell's roof: the lidar surface there (3x3 median within the footprint), or the footprint's median height
    const own = new Set(cells.map(([x, z]) => I(x, z))), tops = new Map();
    // where the lidar has no roof over a cell, the recorded height; with no record (the height above is the lidar's own
    // median), a single storey, or a tower's outline would stand its full height wherever it reaches past the tower
    const fallback = Number.isFinite(p.height) ? base + height : base + Math.round(3 * sc);
    for (const [x, z] of cells) {
      let t = fallback;
      if (lid) { const v = [];
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const j = I(x + dx, z + dz); if (own.has(j) && lid.count[j] > 0) v.push(lid.surface[j]); }
        if (v.length) { v.sort((a, b) => a - b); let m = Math.round(v[v.length >> 1] * sc) - floor;
          // no higher than the footprint's own peak (a tree over the roof is not roof), 1 m of slack
          if (Number.isFinite(p.peak) && p.peak > 0) m = Math.min(m, base + Math.round((p.peak + 1) * sc));
          if (m > ground(x, z) + Math.round(2 * sc)) t = m; } }
      tops.set(I(x, z), t);
    }
    return { id: p.id, parcel: p.parcel ?? null, name: p.name ?? null, cells, base, height, peak: p.peak, k, tops, own };
  }).filter(Boolean);
  const isB = new Uint8Array(N * N); for (const b of buildings) for (const [x, z] of b.cells) isB[I(x, z)] = 1;
  // the canopy: from the lidar where there is one (returns 2 m above the ground, a block clear of any building, with at
  // least three canopy neighbours so a lamp post isn't a tree), else the canopy map
  let chm = L.canopy?.data ?? null, canopyGreen = null;
  if (lid) { chm = new Float32Array(N * N); const near = new Uint8Array(N * N);
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) if (isB[I(x, z)]) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, zz = z + dz; if (xx >= 0 && zz >= 0 && xx < N && zz < N) near[I(xx, zz)] = 1; }
    // lidar can't tell a crown from a planter box, a lamp post or a cornice past the footprint, but foliage is bright in
    // the aerial photo's near-infrared and stone isn't: trimCanopy (dress.mjs) judges each patch by its green, its size
    // and its height (a bare winter crown is still a tree; a pole or a kiosk isn't)
    const green = (i) => !air || (air.nir[i] - air.r[i]) / (air.nir[i] + air.r[i] + 1e-6) > 0.12; canopyGreen = green;
    const h = (i) => (lid.count[i] && !near[i] ? lid.surface[i] - lid.ground[i] : 0);
    // no tree stands over 70 m (the tallest in either city are about 60): taller returns off a footprint are a tower's
    // reach past its outline (the Space Needle's legs and saucer over its lawn), not a crown
    for (let z = 1; z < N - 1; z++) for (let x = 1; x < N - 1; x++) { const i = I(x, z), v = h(i); if (v < 2 || v > 70) continue;
      let k = 0; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if ((dx || dz) && h(I(x + dx, z + dz)) >= 2) k++;
      if (k >= 3) chm[i] = v * sc; } }
  let canopyTop = Math.round(8 * sc); if (chm) { canopyTop = 0; for (const v of chm) if (v > canopyTop) canopyTop = v; }
  // the tallest roof or the tallest crown on the highest ground, whichever is higher (H is already in blocks)
  let roofTop = 0; for (const b of buildings) for (const t of b.tops.values()) if (t > roofTop) roofTop = t;
  const top = Math.max(roofTop, Math.round(hi) - floor + Math.ceil(canopyTop)) + 3;
  const g = new Voxels([N, top, N], { dataVersion: 3955 });   // 2 bytes a cell (voxels.mjs), not an object a block

  // the open ground's cover by the aerial photo, cell by cell, then the commonest within 2 blocks: one pixel of sunlit
  // concrete is not a sandpit, and a plaza shouldn't speckle stone, andesite and sand
  const cover = new Array(N * N).fill(null);
  if (air) { const raw = new Array(N * N); for (let i = 0; i < N * N; i++) raw[i] = groundFrom(air.r[i], air.g[i], air.b[i], air.nir[i], { park: !!park[i] });
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const n = new Map(); let best = raw[I(x, z)], bn = 0;
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= N || zz >= N) continue;
        const v = raw[I(xx, zz)]; if (!v) continue; const c = (n.get(v) ?? 0) + 1; n.set(v, c); if (c > bn) { bn = c; best = v; } }
      cover[I(x, z)] = best; } }
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const y = ground(x, z), i = I(x, z); let low = y - 3;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; low = nx < 0 || nz < 0 || nx >= N || nz >= N ? 0 : Math.min(low, ground(nx, nz) - 1); }
    for (let yy = Math.max(0, low); yy < y; yy++) g.set(x, yy, z, y - yy <= Math.round(3 * sc) ? "dirt" : "stone");
    const d = road[i];
    if (water[i] && d > WALK && !isB[i]) { const deep = Math.max(2, Math.round(2 * sc)); g.set(x, y - deep, z, "clay"); for (let k = 0; k < deep; k++) g.set(x, y - k, z, "water", { level: "0" }); continue; }
    const seen = cover[i];
    g.set(x, y, z, d <= ROAD ? "gray_concrete" : d <= WALK && !park[i] ? "smooth_stone" : isB[i] ? "stone" : path[i] ? "andesite" : play[i] ? "packed_mud" : seen ?? "grass_block");
  }
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
  const site = { place, frame, L, N, I, sc, ground, road, ROAD, WALK, water, park, path, isB }, trimmed = chm ? trimCanopy(chm, site, { green: canopyGreen }) : null;
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

  const manifest = { place: place.id, name: place.name, size: g.size, metresPerBlock: 1 / sc, floorElevation: +(floor / sc).toFixed(1), box: frame.box, ground: [+(lo / sc).toFixed(1), +(hi / sc).toFixed(1)],
    streets: [...new Set((L.streets?.features ?? []).map((f) => f.properties.name))], trees: trees.trees.length, dressing,
    buildings: buildings.map(({ cells, k, tops, own, ...b }) => ({ ...b, top: Math.max(...tops.values()), footprint: cells })),
    aerial: L.aerial ? { year: L.aerial.year, tiles: L.aerial.tiles } : null, parcelRollYear: L.parcels?.rollYear ?? null };
  return { grid: g, manifest, ground };
}
