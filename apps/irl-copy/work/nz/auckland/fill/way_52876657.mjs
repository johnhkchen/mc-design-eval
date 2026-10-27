// Number 5 Khyber Reservoir: a covered-reservoir building of the Auckland Water Board era, reinforced concrete, pale
// rendered walls on a rubble plinth, pilaster bays, storey bands, a flat deck with a parapet and vent stacks. The lidar
// roof is one flat tier at 8 blocks above y0 (2422 of 2428 cells read 8; the six low readings are edge noise), so the
// massing is a single box with the parapet at 9. The downhill side shows its foundation (ground 0..3).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_52876657.cells.json", "utf8"));
const W = 64, D = 58, H = 21;
const DECK = 7;            // top course of the walls, the roof deck is the top of this row (roof 8)
const PARAPET = 8;         // one course of parapet above the deck: 9 blocks above y0 as the record says
const G = Array.from({ length: D }, () => new Array(W).fill(null));
for (const [x, z, g] of cells) G[z][x] = g;
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[z][x] !== null;
const isExt = (x, z) => inFp(x, z) && (!inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1));

// depth from the outside edge: 0 on the facade, 1 behind it, and so on (BFS over the footprint)
const depth = Array.from({ length: D }, () => new Array(W).fill(-1));
const queue = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (isExt(x, z)) { depth[z][x] = 0; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inFp(nx, nz) && depth[nz][nx] < 0) { depth[nz][nx] = depth[z][x] + 1; queue.push([nx, nz]); }
  }
}

// which way a facade cell faces (the missing neighbour), the way inward, and its bay index along that face
function face(x, z) {
  if (!inFp(x - 1, z)) return { ix: 1, iz: 0, b: z };
  if (!inFp(x + 1, z)) return { ix: -1, iz: 0, b: z };
  if (!inFp(x, z - 1)) return { ix: 0, iz: 1, b: x };
  return { ix: 0, iz: -1, b: x };
}

// entrance: a west-face cell nearest the middle of the building's west side (z 30)
let door = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!isExt(x, z) || inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x + 2, z)) continue;
  if (!door || Math.abs(z - 30) < Math.abs(door.z - 30)) door = { x, z };
}
const doorInward = { x: door.x + 1, z: door.z };
const doorG = G[door.z][door.x];

// facade windows: storey 1 rows (g+1..3) and storey 2 rows (5..6); two-wide glazing every four bays, between piers
const pocketAir = new Set(), pocketGlow = new Set(), windowAt = new Set();
const key = (x, y, z) => `${x},${y},${z}`;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!isExt(x, z)) continue;
  if (door.x === x && door.z === z) continue;
  const g = G[z][x], { ix, iz, b } = face(x, z);
  if (b % 4 !== 2 && b % 4 !== 3) continue;
  const px = x + ix, pz = z + iz;
  if (!inFp(px, pz) || isExt(px, pz)) continue;     // no room behind the glass: keep it wall
  for (let y = g + 1; y <= 6; y++) {
    if (!(y <= 3 || y >= 5)) continue;
    windowAt.add(key(x, y, z));
    const lit = ((b >> 2) * 7 + y) % 3 === 0;      // about a third of the windows carry a warm light
    if (lit) pocketGlow.add(key(px, y, pz)); else pocketAir.add(key(px, y, pz));
  }
}

// vestibule behind the door: air for the two door rows, a lintel slab over it, a hanging lantern
const vest = { x: doorInward.x, z: doorInward.z };
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const g = new Voxels([W, H, D]);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const gr = G[z][x];
  if (gr === null) continue;
  const ext = isExt(x, z);
  const { b } = ext ? face(x, z) : { b: 0 };
  // foundation: solid from y0 up to this cell's ground, so nothing floats on the slope
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (!ext) {
    for (let y = gr; y <= DECK; y++) {
      const k = key(x, y, z);
      if (pocketAir.has(k)) continue;
      put(x, y, z, pocketGlow.has(k) ? "glowstone" : "light_gray_concrete");
    }
    continue;
  }
  // facade: plinth course on the ground, wall, storey band at 4, pilasters every 8 bays, cornice and parapet
  put(x, gr, z, "smooth_stone");
  for (let y = gr + 1; y <= DECK; y++) {
    let block = "light_gray_concrete";
    if (y === 4 || y === DECK) block = "white_concrete";
    else if (b % 8 === 0) block = "white_concrete";
    if (windowAt.has(key(x, y, z))) block = "gray_stained_glass";
    put(x, y, z, block);
  }
  put(x, PARAPET, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// the door: stepped plinth, two door rows, a lintel over, the vestibule open behind (the interior fill keeps the rest)
const dx = door.x, dz = door.z, dg = doorG;
put(dx, dg, dz, "stone_brick_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
put(dx, dg + 1, dz, "iron_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx, dg + 2, dz, "iron_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
put(dx, dg + 3, dz, "white_concrete");
for (const y of [dg + 1, dg + 2]) put(vest.x, y, vest.z, "air");
put(vest.x, dg, vest.z, "smooth_stone");
put(vest.x, dg + 3, vest.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
put(vest.x, dg + 2, vest.z, "lantern", { hanging: "true", waterlogged: "false" });
put(dx, dg + 3, dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

// vent stacks on the deck: 2x2 columns two high, set well in from the edge
for (let z = 4; z + 1 < D - 4; z += 12) for (let x = 4; x + 1 < W - 4; x += 12) {
  const cols = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cols.every(([cx, cz]) => inFp(cx, cz) && depth[cz][cx] >= 3)) continue;
  for (const [cx, cz] of cols) for (const y of [PARAPET, PARAPET + 1]) put(cx, y, cz, "stone_bricks");
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_52876657.nbt");
console.log(JSON.stringify({ door, blocks: out.blocks, palette: out.palette }));
