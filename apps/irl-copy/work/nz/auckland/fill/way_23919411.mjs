// A 1980s precast-clad office tower on a stone podium, Auckland CBD edge: a 17-storey core (roof 68) with a 15-storey
// shoulder (60), a 4-storey wing (16) and a 3-storey podium (12). Cream precast spandrels and light-grey piers frame
// blue-green glass, the ground floor is a dark andesite plinth with a glazed shopfront and a dark oak entrance, and
// the lidar's noisy roof is smoothed into the four flat tiers. Storeys are 4 blocks on absolute lines, so every floor
// slab and spandrel lines up across the site. Warm lamps sit behind some panes; plant and a mast crown the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23919411.cells.json", "utf8"));
const W = 56, H = 80, D = 47;
const ANDESITE = "polished_andesite", CORNICE = "smooth_stone", SPANDREL = "white_concrete", PIER = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane", SHOP = "glass", ROOF = "gray_concrete", FLOOR = "light_gray_concrete";
const DOOR = "dark_oak_door", LINTEL = "smooth_stone_slab", ROD = "lightning_rod";
const TIERS = [[14, 12], [18, 16], [40, 40], [62, 60], [Infinity, 68]];   // smoothed lidar roof -> flat tier top
const BAY = 3;                                                            // interior structural grid
const K = (x, z) => `${x},${z}`;
// [side, dx, dz, run]: run is the axis the wall runs along on that side
const DIRS = [["north", 0, -1, "x"], ["south", 0, 1, "x"], ["east", 1, 0, "z"], ["west", -1, 0, "z"]];
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const fp = new Map();
for (const [x, z, g, R] of cells) fp.set(K(x, z), { x, z, g, R });
const at2 = (x, z) => fp.get(K(x, z));

// Smooth the roof over a 5 x 5 window of footprint cells, then snap it to a tier (never below one storey above ground)
for (const c of fp.values()) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const o = at2(c.x + dx, c.z + dz); if (o) { s += o.R; n++; } }
  c.S = s / n;
  c.T = Math.max((TIERS.find(([lim]) => c.S <= lim) ?? [, 68])[1], c.g + 4);
}

// The sides of a cell at height y that face open air: off the footprint, or beside a column that stands lower than y
const openSides = (c, y) => DIRS.filter(([, dx, dz]) => { const o = at2(c.x + dx, c.z + dz); return !o || y >= o.T; });

// Steps in from the outside edge of the footprint (0 = on the edge)
const depth = new Map(), queue = [];
for (const c of fp.values()) if (DIRS.some(([, dx, dz]) => !at2(c.x + dx, c.z + dz))) { depth.set(K(c.x, c.z), 0); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(K(c.x, c.z));
  for (const [, dx, dz] of DIRS) { const o = at2(c.x + dx, c.z + dz); if (o && !depth.has(K(o.x, o.z))) { depth.set(K(o.x, o.z), d + 1); queue.push(o); } }
}
const depthOf = (c) => depth.get(K(c.x, c.z));

// The whole volume is planned first (so neighbours can be read for pane links), then written out in one pass
const P = new Map();
const put = (x, y, z, b, o = {}) => { if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return; P.set(`${x},${y},${z}`, { x, y, z, b, ...o }); };
const has = (x, y, z) => P.has(`${x},${y},${z}`);
const get = (x, y, z) => P.get(`${x},${y},${z}`);

for (const c of fp.values()) {
  const { x, z, T } = c;
  const pillar = x % BAY === 0 && z % BAY === 0;
  for (let y = 0; y < T; y++) {
    const open = openSides(c, y);
    if (!open.length) {                                              // interior: air behind the glass, a slab per storey
      if (y === T - 1) put(x, y, z, ROOF);
      else if (y % 4 === 0) put(x, y, z, FLOOR);
      else if (pillar) put(x, y, z, PIER);
      continue;
    }
    const run = open[0][3];
    if (y === T - 1) { put(x, y, z, CORNICE); continue; }             // cornice on the top of the wall
    if (y < 4) {                                                     // ground storey: plinth, shopfront, fascia
      if (y === 0) put(x, y, z, ANDESITE);
      else if (y === 3) put(x, y, z, CORNICE);
      else put(x, y, z, open.length > 1 || (run === "x" ? x : z) % 3 === 0 ? ANDESITE : SHOP);
      continue;
    }
    const row = y % 4;                                               // upper storeys: spandrel, glass, glass, spandrel
    if (row === 0 || row === 3) put(x, y, z, SPANDREL);
    else if (open.length > 1 || (run === "x" ? x : z) % 3 === 0) put(x, y, z, PIER);
    else put(x, y, z, GLASS, { run });
  }
}

// Entrance: the lowest street frontage on the south side (else any), three bays wide: a dark oak door in the centre,
// andesite pillars either side, and a stone lintel over the bay (the canopy).
const exposed = [...fp.values()].filter((c) => openSides(c, 0).length);
const minT = Math.min(...exposed.map((c) => c.T));
const low = exposed.filter((c) => c.T === minT);
const southern = low.filter((c) => openSides(c, 0).some(([s]) => s === "south"));
const front = (southern.length ? southern : low).sort((a, b) => a.x - b.x || a.z - b.z);
const d = front[Math.floor(front.length / 2)];
const [side, , , doorRun] = openSides(d, 0).find(([s]) => s === "south") ?? openSides(d, 0)[0];
for (let i = -1; i <= 1; i++) {
  const ex = doorRun === "x" ? d.x + i : d.x, ez = doorRun === "x" ? d.z : d.z + i;
  if (!at2(ex, ez)) continue;
  put(ex, 0, ez, ANDESITE); put(ex, 1, ez, ANDESITE); put(ex, 2, ez, LINTEL, { st: { type: "bottom", waterlogged: "false" } });
  if (i === 0) {
    const st = (half) => ({ facing: side, half, hinge: "left", open: "false", powered: "false" });
    put(ex, 0, ez, DOOR, { st: st("lower") }); put(ex, 1, ez, DOOR, { st: st("upper") });
  }
}

// The core's plant room: a concrete box with a roof, two cells in from the core's edge, and a mast on top
const core = [...fp.values()].filter((c) => c.T === 68 && depthOf(c) >= 3);
if (core.length) {
  const cx = core.reduce((s, c) => s + c.x, 0) / core.length, cz = core.reduce((s, c) => s + c.z, 0) / core.length;
  const room = core.filter((c) => Math.abs(c.x - cx) <= 4 && Math.abs(c.z - cz) <= 3);
  const inRoom = new Set(room.map((c) => K(c.x, c.z)));
  for (const c of room) {
    const ring = DIRS.some(([, dx, dz]) => !inRoom.has(K(c.x + dx, c.z + dz)));
    for (let y = 68; y < 71; y++) if (ring) put(c.x, y, c.z, PIER);
    put(c.x, 71, c.z, ROOF);
  }
  const mid = room.find((c) => Math.abs(c.x - cx) < 1 && Math.abs(c.z - cz) < 1) ?? room[0];
  if (mid) put(mid.x, 72, mid.z, ROD);
}

// Roof equipment on the podium and the wing: small plant boxes, two blocks tall, on the roof cap or cornice
for (const c of fp.values()) if ((c.T === 12 || c.T === 16) && depthOf(c) >= 2 && hash(c.x, c.T, c.z) % 5 === 0) {
  put(c.x, c.T, c.z, PIER); put(c.x, c.T + 1, c.z, PIER);
}

// Warm lamps on the inside of some glass, one cell back with the interior air between
for (const [key, p] of [...P.entries()]) {
  if (p.b !== GLASS) continue;
  const c = at2(p.x, p.z);
  const out = openSides(c, p.y)[0];
  if (!out) continue;
  const h = hash(p.x, p.y, p.z);
  const lamp = h % 9 === 0 ? "glowstone" : h % 41 === 0 ? "shroomlight" : null;
  const ix = p.x - out[1], iz = p.z - out[2];
  if (lamp && at2(ix, iz) && !has(ix, p.y, iz)) put(ix, p.y, iz, lamp);
}

// Panes join their neighbours along the wall's run
const v = new Voxels([W, H, D]);
for (const p of P.values()) {
  let st = p.st;
  if (p.b === GLASS) {
    const link = (dx, dz) => (has(p.x + dx, p.y, p.z + dz) ? "true" : "false");
    st = p.run === "x"
      ? { north: "false", south: "false", east: link(1, 0), west: link(-1, 0), waterlogged: "false" }
      : { north: link(0, -1), south: link(0, 1), east: "false", west: "false", waterlogged: "false" };
  }
  v.set(p.x, p.y, p.z, p.b, st);
}
console.log(v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23919411.nbt"));
