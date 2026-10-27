// Way 343886717, Eden Terrace side of Maungawhau's slope: a 1920s-30s brick commercial block, three storeys over a
// stone base, on a site that falls 4 blocks from the north-west to the south-east. Red brick walls with cream plaster
// sills, heads, a cornice and a coping; ground-floor shopfronts with a stone base course and a door on the lowest street
// face; a lower western wing; a plant and stair core on the south-middle roof (lidar 14), with a few roof units.
// Lidar roof readings under 10 are dropouts (0 or 1) and take their neighbours' median; the rest are 3x3-medianed into
// three flat tiers: 12 (wing), 13 (main, with a parapet on its edge), 14 (core, a coping slab on top).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_343886717.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_343886717.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x * 100 + z;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// roof tiers from the smoothed lidar roof
const col = new Map();
for (const [k, { g, r }] of raw) {
  const x = Math.floor(k / 100), z = k % 100;
  const rs = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = raw.get(key(x + dx, z + dz)); if (n && n.r >= 10) rs.push(n.r); }
  const R = rs.length ? med(rs) : r;
  const T = R >= 14 ? 14 : R >= 13 ? 13 : 12;                       // solid rows 0..T-1 (T = roof surface height)
  col.set(k, { x, z, g, T, core: T === 14, perim: false, top: T });
}
// the main tier's edge: a parapet course (13) and a coping slab (14) where it meets the wing, the street or the air
for (const c of col.values()) {
  if (c.T === 13 && DIRS.some(([dx, dz]) => { const n = col.get(key(c.x + dx, c.z + dz)); return !n || n.T < 13; })) c.perim = true;
}
for (const c of col.values()) c.top = c.core || c.perim ? 15 : c.T;
const at = (x, z) => col.get(key(x, z));
const solid = (x, z, y) => { const c = at(x, z); return !!c && y >= 0 && y < c.top; };
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !solid(x + dx, z + dz, y));

// storey bands: the ground floor is [g, 4) on the uphill-to-downhill slope, and the upper floors sit on absolute lines 4, 8, 12
const bandsOf = (c) => {
  const b = [{ b0: c.g, b1: c.g < 4 ? 4 : 8, ground: true }];
  if (c.g < 4) b.push({ b0: 4, b1: 8, ground: false });
  b.push({ b0: 8, b1: 12, ground: false });
  if (c.core) b.push({ b0: 12, b1: 14, ground: false });
  return b;
};

// the street face: the most lowest-ground (g = 0) exposed cells on one side, with a door at the middle of them
const faceCount = new Map();
for (const c of col.values()) {
  if (c.g > 0) continue;
  const ex = exposed(c.x, c.z, 0);
  if (ex.length !== 1) continue;
  const f = FACING[ex[0].join(",")];
  faceCount.set(f, (faceCount.get(f) ?? 0) + 1);
}
const doorFace = [...faceCount].sort((a, b) => b[1] - a[1])[0][0];
const doorDir = Object.entries(FACING).find(([, n]) => n === doorFace)[0].split(",").map(Number);
const u = (x, z, dir) => (dir[0] !== 0 ? z : x);                    // position along a face
const doorCands = [...col.values()].filter((c) => c.g === 0 && exposed(c.x, c.z, 1).length === 1 && exposed(c.x, c.z, 1)[0].join(",") === doorDir.join(","));
const doorU = med(doorCands.map((c) => u(c.x, c.z, doorDir)));
const doorCell = doorCands.reduce((best, c) => (Math.abs(u(c.x, c.z, doorDir) - doorU) < Math.abs(u(best.x, best.z, doorDir) - doorU) ? c : best));

const plan = new Map();
const idx = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => plan.set(idx(x, y, z), { block, state });
const cap = (c) => c.T;                                             // rows from here up are the parapet / core cap

for (const c of col.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < c.top; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }          // foundation under the cell's ground
    const ex = exposed(x, z, y);
    if (!ex.length) {                                               // interior: floor slabs and the roof deck, air between
      if (y === T - 1) put(x, y, z, "stone");                          // a light roof covering, not a dark pit
      else if (y >= T) put(x, y, z, "smooth_stone");
      else if (y === g || y === 4 || y === 8 || (c.core && y === 12)) put(x, y, z, "smooth_stone");
      continue;
    }
    const corner = ex.length >= 2;
    if (y >= cap(c)) {                                              // parapet or core cap
      if (y === c.top - 1) put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      else put(x, y, z, "bricks");
      continue;
    }
    if (y === T - 1) { put(x, y, z, "smooth_quartz"); continue; }   // cornice
    const dir = ex[0];
    const B = bandsOf(c).find((b) => y >= b.b0 && y < b.b1);
    const i = y - B.b0, h = B.b1 - B.b0;
    // the entrance: a door on the street face's middle cell, brick jambs either side, a canopy slab over the head
    const onDoorFace = B.ground && !corner && dir.join(",") === doorDir.join(",");
    const isDoor = onDoorFace && x === doorCell.x && z === doorCell.z;
    if (isDoor && (i === 1 || i === 2)) { put(x, y, z, "oak_door", { facing: doorFace, half: i === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (isDoor && i === 3) { put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
    if (i === 0) { put(x, y, z, B.ground ? "polished_andesite" : "smooth_quartz"); continue; }
    if (i === h - 1 && h >= 2) { put(x, y, z, B.ground ? "smooth_quartz" : "bricks"); continue; }
    if (corner) { put(x, y, z, "smooth_quartz"); continue; }
    if (onDoorFace && Math.abs(u(x, z, dir) - doorU) === 1 && (i === 1 || i === 2)) { put(x, y, z, "bricks"); continue; }
    if (u(x, z, dir) % 3 === 0) { put(x, y, z, "bricks"); continue; }  // piers between the window bays
    put(x, y, z, B.ground ? "glass" : "glass_pane");
  }
}

// a warm light behind some windows: in the air gap just inside the glass
for (const c of col.values()) {
  for (let y = c.g + 1; y < c.T - 1; y++) {
    const ex = exposed(c.x, c.z, y);
    if (ex.length !== 1) continue;
    const e = plan.get(idx(c.x, y, c.z));
    if (!e || (e.block !== "glass" && e.block !== "glass_pane") || hash(c.x, y, c.z) % 5 !== 0) continue;
    const [dx, dz] = ex[0], ix = c.x - dx, iz = c.z - dz;
    if (exposed(ix, iz, y).length || !at(ix, iz) || plan.has(idx(ix, y, iz))) continue;
    put(ix, y, iz, hash(c.x, y, c.z) % 2 ? "glowstone" : "shroomlight");
  }
}

// three roof units on the main roof's interior, standing on the deck
const units = [...col.values()].filter((c) => c.T === 13 && !c.perim && !exposed(c.x, c.z, 12).length)
  .sort((a, b) => hash(a.x, 13, a.z) - hash(b.x, 13, b.z)).slice(0, 3);
for (const c of units) put(c.x, 13, c.z, "iron_block");

const G = new Voxels([21, 27, 23]);
for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  G.set(x, y, z, block, state);
}
const stats = G.save(OUT);
console.log(`way 343886717: ${stats.blocks} blocks, ${stats.palette} palette entries, door on ${doorFace} at (${doorCell.x},${doorCell.z})`);
