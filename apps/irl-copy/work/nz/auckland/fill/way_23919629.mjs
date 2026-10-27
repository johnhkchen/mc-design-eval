// Saint Patrick's Cathedral, Auckland (Wyndham Street, Gothic Revival, 1907), as read from the lidar record.
// Massing: the lidar's roof heights, 3x3-median smoothed and quantised into flat tiers. The tall west tower
// (smoothed roof 36+) sits on a podium and sets back twice, its spire tapers to the record's ~42 blocks; the nave
// is a 20-block tier, the aisles and east end step down to 16, 12 and 8. Walls are pale stone (Oamaru-style) with
// calcite dressing; roofs are dark slate. Every column is solid from 0 up to its ground; storey floors are slabs
// on the lines g + 4k; the shell is one block thick, so the interior is open air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23919629.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 64, D = 47, H = 55;

const PLINTH = "polished_andesite", WALL = "stone_bricks", DRESS = "calcite", ROOF = "deepslate_tiles";
const GLASS = "light_blue_stained_glass_pane", LIGHT = "glowstone", DOOR = "dark_oak_door", PARAPET = "stone_brick_wall";

// ---- footprint: ground g, roof r, and the smoothed roof s (3x3 median of the present cells) ----
const fp = Array.from({ length: D }, () => new Array(W).fill(null));
for (const [x, z, g, r] of cells) fp[z][x] = { g, r };
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && fp[z][x] !== null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = fp[z][x]; if (!c) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) v.push(fp[z + dz][x + dx].r);
  v.sort((a, b) => a - b);
  c.s = v[v.length >> 1];
  // the tier: flat steps, the tower core at 36, its setback at 32, the podium 24, nave 20, aisles 16, 12, 8
  c.T = c.s >= 36 ? 36 : c.s >= 30 ? 32 : c.s >= 22 ? 24 : c.s >= 16 ? 20 : c.s >= 12 ? 16 : c.s >= 8 ? 12 : 8;
}

// ---- block grid: key "x,y,z" -> { block, state, axis, out } ----
const B = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, extra = {}) => B.set(key(x, y, z), { block, ...extra });
const at = (x, y, z) => B.get(key(x, y, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = fp[z][x]; if (!c) continue;
  const { g, T } = c;
  // foundation, then the ground floor slab on g (so every storey stands on something)
  for (let y = 0; y < g; y++) put(x, y, z, PLINTH);
  for (let y = g; y <= T - 2; y++) {
    const rel = y - g;
    // exposed: a face onto outside the footprint, or onto air above a lower neighbour
    const faces = DIRS.filter(([dx, dz]) => {
      const nx = x + dx, nz = z + dz;
      return !inFp(nx, nz) || y >= fp[nz][nx].T;
    });
    const floor = rel % 4 === 0;
    if (floor) { put(x, y, z, faces.length ? DRESS : WALL); continue; }   // string course outside, slab inside
    if (!faces.length) continue;                                             // interior air
    // the outward face: prefer one onto outside the footprint (the street side)
    const out = faces.find(([dx, dz]) => !inFp(x + dx, z + dz)) ?? faces[0];
    const u = out[0] !== 0 ? z : x;                                          // position along the wall
    const shell = { out, axis: out[0] !== 0 ? "x" : "z", u };
    if (y === T - 2) put(x, y, z, DRESS, shell);                             // cornice
    else if (u % 6 === 0) put(x, y, z, DRESS, shell);                        // pilaster bays of 6
    else if ((rel % 4 === 1 || rel % 4 === 2) && [1, 2, 4, 5].includes(u % 6)) put(x, y, z, GLASS, shell);
    else put(x, y, z, WALL, shell);
  }
  // roof covering on every cell, parapet and pinnacles on the street edge
  put(x, T - 1, z, ROOF);
  const street = DIRS.find(([dx, dz]) => !inFp(x + dx, z + dz));
  if (street) {
    const u = street[0] !== 0 ? z : x;
    if (u % 2 === 0) put(x, T, z, PARAPET);
    if (u % 6 === 0) { put(x, T, z, DRESS); put(x, T + 1, z, DRESS); }
  }
}

// ---- the tower's spire: the core's bounding box, shrinking to a point at 42 ----
{
  const core = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (fp[z][x]?.T === 36) core.push([x, z]);
  const minx = Math.min(...core.map((p) => p[0])), maxx = Math.max(...core.map((p) => p[0]));
  const minz = Math.min(...core.map((p) => p[1])), maxz = Math.max(...core.map((p) => p[1]));
  const cx = (minx + maxx + 1) / 2, cz = (minz + maxz + 1) / 2;
  const hx = (maxx - minx + 1) / 2, hz = (maxz - minz + 1) / 2;
  for (let y = 36; y <= 40; y++) {
    const rx = (hx * (42 - y)) / 6, rz = (hz * (42 - y)) / 6;
    for (const [x, z] of core) {
      if (Math.abs(x + 0.5 - cx) <= rx && Math.abs(z + 0.5 - cz) <= rz) put(x, y, z, ROOF);
    }
  }
}

// ---- entrance: the outward face of the street side with the highest roof, two doors wide, ground floor ----
{
  let best = null;
  for (const [k, b] of B) {
    if (!b.out || b.out[0] === 0 && b.out[1] === 0) continue;
    const [x, y, z] = k.split(",").map(Number);
    if (y !== fp[z][x].g + 1 || b.axis === undefined) continue;
    if (inFp(x + b.out[0], z + b.out[1])) continue;
    const s = fp[z][x].s;
    if (!best || s > best.s) best = { x, y, z, s, out: b.out, u: b.u };
  }
  if (best) {
    const facing = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" }[best.out.join(",")];
    // the door's two leaves run along the wall (u and u+1), with the lintel above
    const along = best.out[0] !== 0 ? [0, 1] : [1, 0];
    for (let leaf = 0; leaf < 2; leaf++) {
      const x = best.x + along[0] * leaf, z = best.z + along[1] * leaf;
      const hinge = leaf === 0 ? "left" : "right";
      put(x, best.y, z, DOOR, { state: { facing, half: "lower", hinge, open: "false", powered: "false" } });
      put(x, best.y + 1, z, DOOR, { state: { facing, half: "upper", hinge, open: "false", powered: "false" } });
    }
  }
}

// ---- stained glass: a pane connects along its wall plane to anything solid beside it ----
for (const [k, b] of B) {
  if (b.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  // wall in the x-y plane (axis z) connects east/west; wall in the z-y plane connects north/south
  const on = (dx, dz) => (at(x + dx, y, z + dz) ? "true" : "false");
  b.state = b.axis === "z"
    ? { east: on(1, 0), west: on(-1, 0), north: "false", south: "false" }
    : { north: on(0, -1), south: on(0, 1), east: "false", west: "false" };
}

// ---- warm light: glowstone just inside some window bays ----
for (const [k, b] of B) {
  if (b.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  if ((x * 7 + y * 13 + z * 31) % 4 !== 0) continue;
  const ix = x - b.out[0], iz = z - b.out[1];
  if (inFp(ix, iz) && !at(ix, y, iz)) put(ix, y, iz, LIGHT);
}

// ---- write ----
const g = new Voxels([W, H, D]);
for (const [k, b] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const out = `${DIR}/way_23919629.nbt`;
const res = g.save(out);
console.log(`wrote ${out}: ${res.blocks} blocks, palette ${res.palette}`);
