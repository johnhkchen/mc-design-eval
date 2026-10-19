// DRESSING THE STREETS: the street-level detail between the buildings, from the same data the land came from, so a place
// reads as a lived-in street at a glance and not as raw layers (a grey expanse, a dark band, blobs). Runs after the
// land, the masses and the trees (build.mjs); every element comes from a mapped feature or a rule over the layers:
//   piers      OSM man_made=pier: a level deck where the lidar left water or ragged returns (planks when floating=yes);
//              timber fender piles along its edge; specks of "land" out in the bay (boats, floats the lidar caught, not
//              on a pier or a building) go back to water
//   seawall    land against water: a stone face down to the bed in place of the bare dirt, and a railing along the top
//   greens     OSM lawns, gardens, parks, scrub: grass (flowers in gardens), over whatever paving the aerial guessed
//   paving     one paving block in place of the aerial's speckle (shade and people read as dark paving), scored with
//              joints: across the walk every few metres along a street, a grid in an open plaza; place.dress.paving
//              boxes set a pattern where the place's own (checker, bands) is known
//   roads      the carriageway half a block below the kerb (slabs), a centre line and dashed lane lines away from the
//              junctions, zebra crossings on OSM crossings (footway=crossing ways, highway=crossing nodes)
//   transit    OSM tram rails (not in tunnels) as rails on a stone bed; platforms raised a slab, with a canopy when
//              shelter/covered (a barrel vault over a tram stop, a white roof over a ferry gate)
//   barriers   OSM fences, railings, walls, hedges
//   furniture  OSM street lamps (an artwork lamp as a tall pillar), benches facing the water or the street, bins,
//              bike racks, picnic tables, bollards; and lamps where none are mapped: along both kerbs of every street
//              and along the waterfront, a lamp every ~22 m
//   palms      OSM trees tagged as palms, drawn as palms at the height the canopy measured over them (their crowns
//              taken out of the canopy first, trimCanopy, so the canopy grower doesn't also make them round trees)
// trimCanopy also judges the lidar's canopy patch by patch (green, size, height), so poles, lamp heads, kiosks and
// cornices don't grow as trees while a bare winter crown still does. drawTree is the one place a tree is drawn from a
// point, so a better grower can take it over.
//   trimCanopy(chm, site, { green }) -> counts       before canopyTrees; site as dress
//   dress(g, site) -> counts                          site: { place, frame, L, N, I, sc, ground, road, ROAD, WALK,
//                                                     water, park, path, isB }
import { growTree } from "./trees.mjs";
import { cellsIn, along, lines } from "./raster.mjs";

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = (dx, dz) => (dx > 0 ? "east" : dx < 0 ? "west" : dz > 0 ? "south" : "north");
const LEAF = { persistent: "true", distance: "1", waterlogged: "false" };
const hash = (x, z) => { let h = Math.imul(x, 73856093) ^ Math.imul(z, 19349663); h ^= h >>> 13; return (Math.imul(h, 1274126177) >>> 0) / 4294967296; };
const tags = (f) => f.properties ?? {};
export const isPalm = (t) => /palm|arecaceae|phoenix|washingtonia|syagrus|trachycarpus|cocos/i.test([t.taxon, t["taxon:en"], t.genus, t.species, t["species:en"], t.leaf_type].filter(Boolean).join(" "));
const PAVING = /^minecraft:(smooth_stone|andesite|polished_andesite|stone)$/;

/** A tree from a point: the hook a canopy grower can take over. y is the ground's top block; height in blocks. */
export function drawTree(g, x, y, z, { species = "palm", height = 12, scale = 1 } = {}) {
  // grown by the tree helper (trees.mjs), like the canopy's trees: a palm's leaning trunk and drooping fronds, or a crown
  // grown into a dome; nothing that's already there is overwritten
  return growTree(g, { at: [x, z], base: y, height, species, scale });
}

/** Palms out of the canopy (drawn by dress), and patches that aren't trees dropped. Mutates chm; notes the palms.
 *  green: (i) -> foliage in the aerial's near-infrared there (null: no aerial, every patch is judged by size alone). */
export function trimCanopy(chm, site, { green = null } = {}) {
  const { frame, L, N, I, sc, isB } = site, palms = [], inside = (x, z) => x >= 0 && z >= 0 && x < N && z < N;
  for (const f of L.trees?.features ?? []) {
    if (f.geometry?.type !== "Point" || !isPalm(tags(f))) continue;
    const [fx, fz] = frame.toBlock(...f.geometry.coordinates), x = Math.floor(fx), z = Math.floor(fz); if (x < 1 || z < 1 || x >= N - 1 || z >= N - 1) continue;
    // its height: the tallest canopy near the point (the crown), else 12 m; then its crown (~6 m across) leaves the canopy
    const r = Math.round(4.5 * sc), near = Math.round(2.5 * sc); let h = 0;
    for (let dz = -near; dz <= near; dz++) for (let dx = -near; dx <= near; dx++) if (inside(x + dx, z + dz)) h = Math.max(h, chm[I(x + dx, z + dz)]);
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dz * dz <= r * r && inside(x + dx, z + dz)) chm[I(x + dx, z + dz)] = 0;
    palms.push({ at: [x, z], height: Math.round(h > 4 * sc ? h : 12 * sc) });
  }
  // each 8-connected patch: under 8 m2 is a pole or a lamp head; with no foliage at all it's a tree only when it's
  // crown-sized (30 m2), tree-tall (4 m) and clear of the buildings (2 blocks: a cornice, an awning) and of a mapped lamp
  // (the Ferry Building plaza's artwork lamps stand 16 m); with foliage, the crown is its green cells and what lies
  // within 2 m of them (the shaded side of a crown reads dark too), and the rest of the patch (a kiosk it touches) goes
  const lamps = new Set(); for (const f of L.furniture?.features ?? []) if (tags(f).highway === "street_lamp") { const [x, z] = frame.toBlock(...f.geometry.coordinates).map(Math.floor);
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, z + dz)) lamps.add(I(x + dx, z + dz)); }
  // (and no tree grows on a ferry float: what stands on one is a boat or a shelter)
  const float = new Uint8Array(N * N); for (const f of L.piers?.features ?? []) { const t = tags(f); if (t.ferry === "yes" || t.floating === "yes") for (const [x, z] of cellsIn(frame, f.geometry)) float[I(x, z)] = 1; }
  const byB = (x, z) => { for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, z + dz) && isB[I(x + dx, z + dz)]) return true; return false; };
  const seen = new Uint8Array(N * N), m2 = sc * sc, reach = Math.round(2 * sc); let dropped = 0, kept = 0;
  for (let s = 0; s < N * N; s++) { if (seen[s] || !(chm[s] > 0)) continue;
    const comp = [s]; seen[s] = 1;
    for (let k = 0; k < comp.length; k++) { const i = comp[k], x = i % N, z = (i / N) | 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, zz = z + dz, j = zz * N + xx;
        if (inside(xx, zz) && !seen[j] && chm[j] > 0) { seen[j] = 1; comp.push(j); } } }
    const leafy = green ? comp.filter((i) => green(i)) : comp, top = comp.reduce((m, i) => Math.max(m, chm[i]), -Infinity) / sc;
    const bare = !leafy.length && (comp.length < 30 * m2 || top < 4 || comp.some((i) => lamps.has(i) || byB(i % N, (i / N) | 0)));
    if (comp.length < 8 * m2 || bare || comp.filter((i) => float[i]).length * 2 > comp.length) { for (const i of comp) chm[i] = 0; dropped++; continue; }
    kept++; if (!leafy.length || leafy.length === comp.length) continue;
    const near = new Uint8Array(N * N); for (const i of leafy) { const x = i % N, z = (i / N) | 0;
      for (let dz = -reach; dz <= reach; dz++) for (let dx = -reach; dx <= reach; dx++) if (inside(x + dx, z + dz)) near[I(x + dx, z + dz)] = 1; }
    for (const i of comp) if (!near[i]) chm[i] = 0; }
  site.palms = palms;
  return { palms: palms.length, canopyPatchesKept: kept, canopyPatchesDropped: dropped };
}

/** Per cell, the nearest of these lines: distance d, distance along its polyline s, its unit direction (ux, uz) and which
 *  feature (k), out to reach. */
export function lineField(frame, features, reach) {
  const { N, toBlock } = frame, d = new Float32Array(N * N).fill(Infinity), s = new Float32Array(N * N), ux = new Float32Array(N * N), uz = new Float32Array(N * N), k = new Int32Array(N * N).fill(-1);
  features.forEach((f, fi) => { for (const line of lines(f.geometry)) { let cum = 0;
    for (let i = 1; i < line.length; i++) {
      const [ax, az] = toBlock(...line[i - 1]), [bx, bz] = toBlock(...line[i]), dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1e-9;
      for (let z = Math.max(0, Math.floor(Math.min(az, bz) - reach)); z <= Math.min(N - 1, Math.ceil(Math.max(az, bz) + reach)); z++)
        for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - reach)); x <= Math.min(N - 1, Math.ceil(Math.max(ax, bx) + reach)); x++) {
          const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (z + 0.5 - az) * dz) / (len * len))), v = Math.hypot(x + 0.5 - ax - t * dx, z + 0.5 - az - t * dz), j = z * N + x;
          if (v < d[j]) { d[j] = v; s[j] = cum + t * len; ux[j] = dx / len; uz[j] = dz / len; k[j] = fi; } }
      cum += len; } } });
  return { d, s, ux, uz, k };
}

/** Cells a line passes through, 4-connected (a diagonal step goes round a corner), in order. */
export function trace(points) {
  const out = []; let px = null, pz = null;
  for (const [fx, fz] of points) { const x = Math.floor(fx), z = Math.floor(fz); if (x === px && z === pz) continue;
    if (px !== null && x !== px && z !== pz) out.push([x, pz]);
    out.push([x, z]); px = x; pz = z; }
  return out;
}

/** A rail's shape from which of its four neighbours are rail too. */
export function railShape(n, s, e, w) {
  if ((n || s) && (e || w) && !(n && s) && !(e && w)) return `${n ? "north" : "south"}_${e ? "east" : "west"}`;
  return (e || w) && !(n && s) ? "east_west" : "north_south";
}

/** Fence, bars and wall sides from neighbours in the same set (a structure file stores them; nothing recomputes them). */
const sides = (has, x, z, on, off) => ({ east: has(x + 1, z) ? on : off, west: has(x - 1, z) ? on : off, south: has(x, z + 1) ? on : off, north: has(x, z - 1) ? on : off });

export function dress(g, site) {
  const { place, frame, L, N, I, sc, ground, road, ROAD, WALK, water, path, isB } = site, opt = place.dress ?? {}, Y = g.size[1];
  const m = (v) => Math.max(1, Math.round(v * sc));                                    // metres -> blocks
  const inside = (x, z) => x >= 0 && z >= 0 && x < N && z < N;
  const top = Int16Array.from({ length: N * N }, (_, i) => ground(i % N, (i / N) | 0)), wet = Uint8Array.from(water);
  const name = (x, y, z) => g.get(x, y, z)?.block ?? null;
  const empty = (x, y, z) => !g.get(x, y, z);
  const count = {};
  const tally = (k, n = 1) => { count[k] = (count[k] ?? 0) + n; };
  const deep = Math.max(2, Math.round(2 * sc));

  // ---- piers, specks in the bay, the sea's level
  const levels = new Map(); for (let i = 0; i < N * N; i++) if (wet[i] === 2) levels.set(top[i], (levels.get(top[i]) ?? 0) + 1);
  const seaY = levels.size ? [...levels].sort((a, b) => b[1] - a[1])[0][0] : null;
  const pier = new Uint8Array(N * N), hollow = new Uint8Array(N * N);                   // hollow: a deck over open water
  for (const f of L.piers?.features ?? []) {
    const t = tags(f); if (t.building && t.building !== "no") continue;                   // a pier shed is a building
    const cells = cellsIn(frame, f.geometry).filter(([x, z]) => !isB[I(x, z)]); if (!cells.length) continue;
    const land = cells.filter(([x, z]) => !wet[I(x, z)]).map(([x, z]) => top[I(x, z)]).sort((a, b) => a - b);
    const water0 = cells.find(([x, z]) => wet[I(x, z)]), wy = water0 ? top[I(...water0)] : seaY ?? 0;
    const deckY = Math.max(wy + 1, land.length ? land[land.length >> 1] : wy + 1), deck = t.floating === "yes" ? "spruce_planks" : "smooth_stone";
    const ferry = t.ferry === "yes" || t.floating === "yes";                              // a ferry float is flat: the lidar's bumps on it are boats
    for (const [x, z] of cells) { const i = I(x, z); pier[i] = 1;
      if (wet[i]) { for (let y = top[i] + 1; y < deckY; y++) g.set(x, y, z, "air"); g.set(x, deckY, z, deck); wet[i] = 0; hollow[i] = 1; top[i] = deckY; tally("pier deck"); }
      // lidar ragged on a deck: up to 3 m above it is boats and gear; below it, returns that fell through the deck's edge
      else if (top[i] !== deckY && (top[i] - deckY <= m(3) || ferry) && deckY - top[i] <= m(8)) {
        for (let y = Math.min(top[i], deckY); y <= Math.max(top[i], deckY) + 2; y++) { const b = name(x, y, z); if (b && /leaves$|_log$/.test(b) && !ferry) continue; g.set(x, y, z, y < deckY ? "stone" : y === deckY ? deck : "air"); }
        top[i] = deckY; } }
  }
  const toSea = (i) => { const x = i % N, z = (i / N) | 0;
    for (let y = seaY + 1; y <= Math.min(Y - 1, top[i] + m(8)); y++) g.set(x, y, z, "air");
    g.set(x, seaY - deep, z, "clay"); for (let k = 0; k < deep; k++) g.set(x, seaY - k, z, "water", { level: "0" });
    wet[i] = 2; top[i] = seaY; };
  // ledges at the sea's own level along the shore (returns off a fender or a float, not a quay) are sea
  if (seaY !== null) for (let pass = 0; pass < m(2); pass++) { const go = [];
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const i = I(x, z); if (wet[i] || isB[i] || pier[i] || top[i] > seaY) continue;
      if (N4.some(([dx, dz]) => inside(x + dx, z + dz) && wet[I(x + dx, z + dz)] === 2)) go.push(i); }
    for (const i of go) toSea(i); tally("sea ledges cleared", go.length); }
  if (seaY !== null) { const seen = new Uint8Array(N * N), small = Math.round(200 * sc * sc);
    for (let s = 0; s < N * N; s++) { if (seen[s] || wet[s]) continue;
      const comp = [s]; seen[s] = 1; let ok = true;
      for (let k = 0; k < comp.length && comp.length < small; k++) { const i = comp[k], x = i % N, z = (i / N) | 0; if (isB[i] || pier[i]) ok = false;
        for (const [dx, dz] of N4) { const xx = x + dx, zz = z + dz; if (!inside(xx, zz)) continue; const j = I(xx, zz);
          if (wet[j] && wet[j] !== 2) ok = false; if (!wet[j] && !seen[j]) { seen[j] = 1; comp.push(j); } } }
      if (!ok || comp.length >= small) continue;
      for (const i of comp) toSea(i);
      tally("bay specks cleared"); } }

  // ---- faces: under paving, a step's bare side (a retaining wall, a deck's edge) is stone, not dirt; grass banks stay
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const i = I(x, z); if (wet[i] || hollow[i] || isB[i] || /grass_block|dirt|sand/.test(name(x, top[i], z) ?? "dirt")) continue;
    let low = top[i]; for (const [dx, dz] of N4) if (inside(x + dx, z + dz)) { const j = I(x + dx, z + dz); if (!wet[j] && !hollow[j]) low = Math.min(low, top[j]); }
    for (let y = top[i] - 1; y > low; y--) if (name(x, y, z) === "minecraft:dirt") g.set(x, y, z, pier[i] ? "polished_andesite" : "stone_bricks"); }
  // ---- seawall faces and fender piles (a face wherever the land's side shows: against water or under a hollow deck)
  const edge = new Uint8Array(N * N);
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const i = I(x, z); if (wet[i] || isB[i]) continue;
    let byWater = null, shows = false; for (const [dx, dz] of N4) if (inside(x + dx, z + dz)) { const j = I(x + dx, z + dz); if (wet[j]) byWater = [dx, dz]; if (wet[j] || hollow[j]) shows = true; }
    // a quay (paved to the water: a railing, a stone face) and not a natural bank (grass or sand to the water's edge)
    if (!shows || /grass_block|sand|dirt|mud/.test(name(x, top[i], z) ?? "")) continue; edge[i] = byWater ? 1 : 0;
    if (!hollow[i]) for (let y = top[i] - 1; y >= Math.max(0, top[i] - m(10)); y--) { const b = name(x, y, z); if (b && /dirt|stone$|clay/.test(b)) g.set(x, y, z, pier[i] ? "polished_andesite" : "stone_bricks"); }
    if (!byWater) continue;
    // a pile every few blocks along a pier's edge, out in the water from the bed to the deck
    if (pier[i] && (x + z) % 3 === 0) { const [dx, dz] = byWater, wx = x + dx, wz = z + dz, wt = top[I(wx, wz)];
      for (let y = wt - deep + 1; y < top[i]; y++) g.set(wx, y, wz, "spruce_log", { axis: "y" }); tally("fender piles"); } }

  // ---- greens: mapped lawns and gardens over the aerial's guess
  const greenAt = new Uint8Array(N * N);
  for (const f of L.greens?.features ?? []) { const t = tags(f), garden = /garden|flowerbed/.test(t.leisure ?? t.landuse ?? "");
    for (const [x, z] of cellsIn(frame, f.geometry)) { const i = I(x, z); if (wet[i] || isB[i] || road[i] <= ROAD || path[i] || greenAt[i]) continue;
      const b = name(x, top[i], z); if (!b || !(PAVING.test(b) || /sand|grass_block|packed_mud/.test(b))) continue;
      if (!(t.leisure === "park" && b !== "minecraft:grass_block")) { g.set(x, top[i], z, "grass_block", { snowy: "false" }); greenAt[i] = garden ? 2 : 1; } } }
  for (let i = 0; i < N * N; i++) { if (!greenAt[i]) continue; const x = i % N, z = (i / N) | 0, r = hash(x, z), y = top[i] + 1; if (!empty(x, y, z)) continue;
    if (greenAt[i] === 2 && r < 0.18) g.set(x, y, z, ["poppy", "dandelion", "allium", "azure_bluet", "oxeye_daisy", "cornflower", "red_tulip", "pink_tulip"][Math.floor(r * 44) % 8]);
    else if (r < 0.07) g.set(x, y, z, "short_grass"); }

  // ---- paving: one block, scored; a place's own patterns where it knows them
  const st = lineField(frame, L.streets?.features ?? [], WALK + m(2));
  const P = m(4), G = m(7), joint = opt.joint ?? "polished_andesite", base = opt.pave ?? "smooth_stone";
  const boxes = (opt.paving ?? []).map((p) => ({ ...p, size: p.size ?? 4 }));
  // a footway mapped across paving is the paving (a strip of rougher stone through a plaza isn't there); in a park it stays
  const nearGrass = (x, z) => { for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, z + dz) && name(x + dx, top[I(x + dx, z + dz)], z + dz) === "minecraft:grass_block") return true; return false; };
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const i = I(x, z); if (wet[i] || isB[i] || path[i] && nearGrass(x, z) || pier[i] && name(x, top[i], z) === "minecraft:spruce_planks" || road[i] <= ROAD) continue;
    const b = name(x, top[i], z); if (!b || !PAVING.test(b)) continue;
    const box = boxes.find((p) => x >= p.box[0] && x <= p.box[2] && z >= p.box[1] && z <= p.box[3]);
    let blk;
    if (box) { const [a, c] = box.blocks, sz = Array.isArray(box.size) ? box.size : [box.size, box.size], u = Math.floor((x - box.box[0]) / sz[0]), v = Math.floor((z - box.box[1]) / sz[1]);
      blk = box.pattern === "bands" ? ((box.axis === "x" ? u : v) % 2 ? c : a) : (u + v) % 2 ? c : a; }
    else if (road[i] <= WALK) blk = Math.floor(st.s[i]) % P === 0 ? joint : base;    // joints across the walk
    else blk = x % G === 0 || z % G === 0 ? joint : base;                               // a plaza's grid
    g.set(x, top[i], z, blk); }

  // ---- roads: half a block below the kerb, lines, crossings
  const ends = []; for (const f of L.streets?.features ?? []) for (const line of lines(f.geometry)) for (const p of [line[0], line.at(-1)]) ends.push(frame.toBlock(...p));
  const nearEnd = (x, z, r) => ends.some(([ex, ez]) => (ex - x - 0.5) ** 2 + (ez - z - 0.5) ** 2 < r * r);
  const asphalt = opt.asphalt ?? "polished_deepslate_slab", slab = { type: "bottom", waterlogged: "false" };
  const isRoad = (i) => road[i] <= ROAD && !wet[i] && !isB[i];
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const i = I(x, z); if (!isRoad(i)) continue;
    let blk = asphalt; const d = st.d[i];
    if (d <= ROAD && !nearEnd(x, z, ROAD + m(3))) {
      if (d < 0.6) blk = "smooth_sandstone_slab";                                       // the centre line
      else if (Math.abs(d - ROAD / 2) < 0.5 && st.s[i] % m(9) < m(3)) blk = "smooth_quartz_slab";   // dashed lanes
    }
    g.set(x, top[i], z, blk, slab); }
  // zebras: bars along the traffic, across the walker's way (a bar every other block)
  const zebra = new Uint8Array(N * N);
  const stamp = (cx, cz, half) => { for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) { const x = Math.floor(cx + dx), z = Math.floor(cz + dz); if (inside(x, z) && isRoad(I(x, z))) zebra[I(x, z)] = 1; } };
  const crossings = (L.paths?.features ?? []).filter((f) => tags(f).footway === "crossing");
  for (const [fx, fz] of along(frame, crossings)) stamp(fx, fz, m(1.5));
  for (const f of L.furniture?.features ?? []) { if (tags(f).highway !== "crossing") continue;
    const [fx, fz] = frame.toBlock(...f.geometry.coordinates), x = Math.floor(fx), z = Math.floor(fz); if (!inside(x, z) || zebra[I(x, z)] || !isRoad(I(x, z))) continue;
    const i = I(x, z), px = -st.uz[i], pz = st.ux[i]; for (let k = -2 * ROAD; k <= 2 * ROAD; k += 0.5) stamp(fx + px * k, fz + pz * k, m(1.5)); }
  for (let i = 0; i < N * N; i++) { if (!zebra[i]) continue; const x = i % N, z = (i / N) | 0, c = (x + 0.5) * -st.uz[i] + (z + 0.5) * st.ux[i];
    g.set(x, top[i], z, Math.floor(c) % 2 === 0 ? "smooth_quartz_slab" : asphalt, slab); tally("crossing cells"); }

  // ---- transit: platforms and their canopies, then rails
  const raised = new Uint8Array(N * N);
  for (const f of L.platforms?.features ?? []) { const t = tags(f);
    const cells = cellsIn(frame, f.geometry).filter(([x, z]) => !isB[I(x, z)]); if (!cells.length) continue;
    const ferry = t.ferry === "yes" || t.man_made === "pier";
    if (!ferry) for (const [x, z] of cells) { const i = I(x, z); if (wet[i] || !empty(x, top[i] + 1, z)) continue; g.set(x, top[i] + 1, z, "smooth_stone_slab", slab); raised[i] = 1; }
    if (t.shelter !== "yes" && t.covered !== "yes") continue;
    // the roof: the platform (a block wider for a tram stop), stairs round its edge rising inward so it reads as a vault
    const own = new Set(cells.map(([x, z]) => I(x, z))), roof = new Set(own);
    if (!ferry) for (const i of own) for (const [dx, dz] of N4) { const x = (i % N) + dx, z = ((i / N) | 0) + dz; if (inside(x, z) && !isB[I(x, z)]) roof.add(I(x, z)); }
    const ys = cells.map(([x, z]) => top[I(x, z)]).sort((a, b) => a - b), ry = ys[ys.length >> 1] + m(3.2) + 1;
    const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]), longZ = Math.max(...zs) - Math.min(...zs) >= Math.max(...xs) - Math.min(...xs);
    const mid = longZ ? Math.round((Math.min(...xs) + Math.max(...xs)) / 2) : Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
    for (const i of roof) { const x = i % N, z = (i / N) | 0; if (!empty(x, ry, z)) continue;
      if (ferry) { g.set(x, ry, z, "smooth_quartz_slab", slab); continue; }
      const out = N4.find(([dx, dz]) => !roof.has(I(x + dx, z + dz)) && (longZ ? dx : dz));
      if (out) g.set(x, ry, z, "deepslate_tile_stairs", { facing: FACING(-out[0], -out[1]), half: "bottom", shape: "straight", waterlogged: "false" });
      else g.set(x, ry, z, "deepslate_tile_slab", { type: "top", waterlogged: "false" }); }
    for (const [x, z] of cells) { const along_ = longZ ? z : x, across = longZ ? x : z; if (across !== mid || along_ % m(4) !== 1) continue;
      for (let y = top[I(x, z)] + 1; y < ry; y++) g.set(x, y, z, ferry ? "iron_bars" : "polished_blackstone_wall", ferry ? undefined : { up: "true", east: "none", west: "none", north: "none", south: "none", waterlogged: "false" }); }
    tally(ferry ? "ferry canopies" : "platform canopies"); }
  const tracks = (L.rails?.features ?? []).filter((f) => { const t = tags(f); return (!t.tunnel || t.tunnel === "no") && !(+t.layer < 0) && f.geometry?.type === "LineString"; });
  const rail = new Set(); for (const f of tracks) for (const [x, z] of trace(along(frame, [f]).map(([fx, fz]) => [fx, fz]))) if (inside(x, z)) rail.add(I(x, z));
  const bed = opt.trackBed ?? "andesite";
  for (const i of rail) { const x = i % N, z = (i / N) | 0;
    for (const [dx, dz] of [[0, 0], ...N4]) { const xx = x + dx, zz = z + dz; if (!inside(xx, zz)) continue; const j = I(xx, zz);
      if (!wet[j] && !isB[j] && !isRoad(j) && !raised[j] && PAVING.test(name(xx, top[j], zz) ?? "")) g.set(xx, top[j], zz, bed); } }
  for (const i of rail) { const x = i % N, z = (i / N) | 0; if (wet[i] || isB[i] || isRoad(i) || raised[i] || !empty(x, top[i] + 1, z)) continue;
    const has = (xx, zz) => inside(xx, zz) && rail.has(I(xx, zz));
    g.set(x, top[i] + 1, z, "rail", { shape: railShape(has(x, z - 1), has(x, z + 1), has(x + 1, z), has(x - 1, z)), waterlogged: "false" }); tally("rail"); }

  // ---- barriers, and a railing along every edge against the water
  const bars = new Set();
  const barrier = (cells, kind) => { for (const [x, z] of cells) { const i = I(x, z); if (!inside(x, z) || wet[i] || isB[i] || isRoad(i) || !empty(x, top[i] + 1, z)) continue;
    if (kind === "wall") g.set(x, top[i] + 1, z, "smooth_stone"); else if (kind === "hedge") g.set(x, top[i] + 1, z, "oak_leaves", LEAF); else bars.add(i); } };
  for (const f of L.barriers?.features ?? []) { const t = tags(f), kind = /wall/.test(t.barrier) ? "wall" : t.barrier === "hedge" ? "hedge" : "bars";
    barrier(trace(along(frame, [f])).filter(([x, z]) => inside(x, z)), kind); tally(`barrier ${kind}`); }
  for (let i = 0; i < N * N; i++) if (edge[i]) { const x = i % N, z = (i / N) | 0; if (empty(x, top[i] + 1, z)) bars.add(i); }
  const hasBar = (x, z) => inside(x, z) && bars.has(I(x, z));
  for (const i of bars) { const x = i % N, z = (i / N) | 0; g.set(x, top[i] + 1, z, "iron_bars", { ...sides(hasBar, x, z, "true", "false"), waterlogged: "false" }); }
  tally("railing", bars.size);

  // ---- furniture
  const lamps = [];
  const free = (x, z, h = 2) => { if (!inside(x, z)) return false; const i = I(x, z); if (wet[i] || isB[i] || isRoad(i) || raised[i] || rail.has(i) || bars.has(i)) return false;
    for (let y = top[i] + 1; y <= Math.min(Y - 1, top[i] + h); y++) if (!empty(x, y, z)) return false; return true; };
  const post = { up: "true", east: "none", west: "none", north: "none", south: "none", waterlogged: "false" };
  const lamp = (x, z, { arm = null, monument = false } = {}) => {
    const y = top[I(x, z)], h = monument ? m(9) : m(4.5); if (y + h + 3 >= Y) return false;
    if (monument) { g.set(x, y + 1, z, "polished_blackstone"); for (let k = 2; k <= h; k++) g.set(x, y + k, z, "polished_blackstone_wall", post);
      g.set(x, y + h + 1, z, "polished_blackstone"); g.set(x, y + h + 2, z, "glowstone");
      for (const [dx, dz] of N4) { g.set(x + dx, y + h + 1, z + dz, "polished_blackstone_slab", { type: "top", waterlogged: "false" }); g.set(x + dx, y + h, z + dz, "lantern", { hanging: "true", waterlogged: "false" }); }
      g.set(x, y + h + 3, z, "polished_blackstone_slab", slab); }
    else { for (let k = 1; k <= h; k++) g.set(x, y + k, z, "polished_blackstone_wall", k === h && arm ? { ...post, ...(arm[0] ? { east: "low", west: "low" } : { north: "low", south: "low" }) } : post);
      if (arm) for (const s of [1, -1]) { const ax = x + arm[0] * s, az = z + arm[1] * s; if (!empty(ax, y + h, az)) continue;
        g.set(ax, y + h, az, "polished_blackstone_wall", { up: "false", east: "none", west: "none", north: "none", south: "none", waterlogged: "false", ...(arm[0] ? { [s > 0 ? "west" : "east"]: "low" } : { [s > 0 ? "north" : "south"]: "low" }) });
        g.set(ax, y + h - 1, az, "lantern", { hanging: "true", waterlogged: "false" }); }
      else g.set(x, y + h + 1, z, "lantern", { hanging: "false", waterlogged: "false" }); }
    lamps.push([x, z]); tally(monument ? "monument lamps" : "lamps"); return true; };
  const lampNear = (x, z, r) => lamps.some(([lx, lz]) => (lx - x) ** 2 + (lz - z) ** 2 < r * r);
  // which way a seat looks: at the water if it's close, else at the street, else at the nearest path
  const view = (x, z) => { for (let k = 1; k <= m(6); k++) for (const [dx, dz] of N4) if (inside(x + dx * k, z + dz * k) && wet[I(x + dx * k, z + dz * k)]) return [dx, dz];
    let best = null, bd = road[I(x, z)]; for (const [dx, dz] of N4) { const xx = x + dx * 2, zz = z + dz * 2; if (inside(xx, zz) && road[I(xx, zz)] < bd) { bd = road[I(xx, zz)]; best = [dx, dz]; } }
    return best ?? [0, 1]; };
  for (const f of L.furniture?.features ?? []) { const t = tags(f), [fx, fz] = frame.toBlock(...f.geometry.coordinates), x = Math.floor(fx), z = Math.floor(fz);
    if (t.highway === "crossing" || !free(x, z, t.highway === "street_lamp" ? m(9) + 3 : 2)) continue; const y = top[I(x, z)] + 1;
    if (t.highway === "street_lamp") lamp(x, z, { monument: t.tourism === "artwork" });
    else if (t.amenity === "bench") { const [vx, vz] = view(x, z), px = -vz, pz = vx, sp = { facing: FACING(-vx, -vz), half: "bottom", shape: "straight", waterlogged: "false" };
      g.set(x, y, z, "spruce_stairs", sp); if (free(x + px, z + pz)) g.set(x + px, y, z + pz, "spruce_stairs", sp); tally("benches"); }
    else if (t.amenity === "waste_basket") { g.set(x, y, z, "cauldron"); tally("bins"); }
    else if (t.amenity === "bicycle_parking") { const has = (xx, zz) => xx === x && (zz === z || zz === z + 1);
      for (const zz of [z, z + 1]) if (free(x, zz)) g.set(x, y, zz, "iron_bars", { ...sides(has, x, zz, "true", "false"), waterlogged: "false" }); tally("bike racks"); }
    else if (t.leisure === "picnic_table") { g.set(x, y, z, "spruce_fence", { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" }); g.set(x, y + 1, z, "spruce_pressure_plate", { powered: "false" });
      for (const s of [1, -1]) if (free(x + s, z)) g.set(x + s, y, z, "spruce_stairs", { facing: s > 0 ? "east" : "west", half: "bottom", shape: "straight", waterlogged: "false" }); tally("picnic tables"); }
    else if (t.barrier === "bollard" || t.amenity === "drinking_water") { g.set(x, y, z, t.barrier === "bollard" ? "polished_blackstone_wall" : "stone_brick_wall", post); tally(t.barrier ?? t.amenity); }
  }
  // lamps where none are mapped: both kerbs of every street, then the waterfront, one every ~22 m
  const SP = m(opt.lampSpacing ?? 22);
  for (const f of L.streets?.features ?? []) for (const [fx, fz] of along(frame, [f])) {
    const x0 = Math.floor(fx), z0 = Math.floor(fz); if (!inside(x0, z0)) continue; const i0 = I(x0, z0), px = -st.uz[i0], pz = st.ux[i0];
    for (const s of [1, -1]) { const x = Math.floor(fx + px * s * (ROAD + 1.5)), z = Math.floor(fz + pz * s * (ROAD + 1.5));
      if (!free(x, z, m(5) + 3) || lampNear(x, z, SP) || !PAVING.test(name(x, top[I(x, z)], z) ?? "")) continue;
      lamp(x, z, { arm: Math.abs(px) > Math.abs(pz) ? [1, 0] : [0, 1] }); } }
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { if (!edge[I(x, z)]) continue;
    for (const [dx, dz] of N4) { if (!inside(x - dx * 2, z - dz * 2) || !wet[I(x + dx, z + dz)] || wet[I(x - dx * 2, z - dz * 2)]) continue;
      const lx = x - dx * 2, lz = z - dz * 2; if (free(lx, lz, m(5) + 3) && !lampNear(lx, lz, SP) && PAVING.test(name(lx, top[I(lx, lz)], lz) ?? "")) lamp(lx, lz); break; } }

  // ---- palms from the tree points
  const palms = site.palms ?? (L.trees?.features ?? []).filter((f) => f.geometry?.type === "Point" && isPalm(tags(f))).map((f) => ({ at: frame.toBlock(...f.geometry.coordinates).map(Math.floor), height: m(12) }));
  for (const p of palms) { const [x, z] = p.at; if (!inside(x, z)) continue; const i = I(x, z); if (wet[i] || isB[i] || isRoad(i) || rail.has(i) || !empty(x, top[i] + 1, z)) continue;
    drawTree(g, x, top[i], z, { species: "palm", height: Math.min(p.height, Y - top[i] - 4), scale: sc }); tally("palms"); }
  return count;
}
