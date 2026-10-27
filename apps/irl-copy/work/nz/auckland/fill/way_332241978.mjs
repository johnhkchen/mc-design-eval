// Way 332241978, Auckland (Mt Eden side). Read from the lidar record: a 49 x 56 block footprint, a flat roof at
// about 16 blocks over its lowest ground, and wings at 8 to 12. Reads as a 1930s brick stripped-classical shop-and-flats
// block: red brick walls, cream string courses and pillars, a dark-framed shopfront on the ground storey under a striped
// awning, glazed bays between brick piers, a cornice and parapet, and a stair and lift tower on the roof.
// Interior: an air gap behind each pane, a floor slab on every storey, a roof membrane. Some windows have a lamp standing
// on the floor slab behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const OUT = `${DIR}/way_332241978.nbt`;
const cells = JSON.parse(readFileSync(`${DIR}/way_332241978.cells.json`, "utf8"));
const SIZE = [49, 30, 56];
const [X, , Z] = SIZE;
const vox = new Voxels(SIZE);

// Lidar roof snapped to 4-block storey tiers (13-14 and up go to the 16 tier), never lower than one storey above the ground.
const key = (x, z) => `${x},${z}`;
const plan = new Map();
for (const [x, z, gr, roof] of cells) {
  const tier = Math.floor((roof + 2) / 4) * 4;
  plan.set(key(x, z), { gr, top: Math.max(tier, 4 * Math.floor(gr / 4) + 4) });
}
const at = (x, z) => plan.get(key(x, z));
const inM = (x, y, z) => { const c = at(x, z); return !!c && y >= 0 && y < c.top; };

// [name, dx, dz, facing]: N and S walls run east-west (along x); E and W walls run along z
const DIRS = [["N", 0, -1, "north"], ["S", 0, 1, "south"], ["W", -1, 0, "west"], ["E", 1, 0, "east"]];
const exposures = (x, y, z) => DIRS.filter(([, dx, dz]) => !inM(x + dx, y, z + dz));   // air beside this voxel
const planDirs = (x, z) => DIRS.filter(([, dx, dz]) => !at(x + dx, z + dz));           // faces on the outside of the footprint
const planRing = (x, z) => planDirs(x, z).length > 0;
const isShell = (x, y, z) => inM(x, y, z) && (!inM(x, y + 1, z) || exposures(x, y, z).length > 0);
// Solid: the foundation below each cell's ground, the outer shell, and one floor slab per storey (y = 4k-1), so every
// wall and tier sits on something solid.
const solid = (x, y, z) => {
  const c = at(x, z); if (!c || y < 0 || y >= c.top) return false;
  return y < c.gr || isShell(x, y, z) || (y % 4 === 3 && y >= 3 && y < c.top - 1);
};
const hash = (x, y, z) => Math.abs(Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791));

// The entrance: the front is the outside face with most ring cells; its door sits mid-run on a ground-storey window bay.
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (const [k] of plan) {
  const [x, z] = k.split(",").map(Number); const pd = planDirs(x, z);
  if (pd.length === 1) faceCount[pd[0][0]]++;
}
const front = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0][0];
const doorCands = [];
for (const [k, c] of plan) {
  const [x, z] = k.split(",").map(Number); const pd = planDirs(x, z);
  if (pd.length !== 1 || pd[0][0] !== front || c.gr % 4 !== 0) continue;
  const s = pd[0][2] !== 0 ? x : z;
  if (s % 4 === 1 || s % 4 === 2) doorCands.push({ x, z, s, facing: pd[0][3] });
}
doorCands.sort((a, b) => a.s - b.s);
const door = doorCands.length ? doorCands[Math.floor(doorCands.length / 2)] : null;

const DARK = "dark_oak_planks", BRICK = "bricks", QUARTZ = "quartz_block", STONE_B = "stone_bricks";
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const paneState = ([, dx]) => (dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const doorState = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

// What a solid voxel is made of. Ring voxels (with an exposed side) are the facade; the rest is roof or floor.
function facade(x, y, z, ex, c) {
  const { gr, top } = c;
  if (y < gr) return { block: ex.length ? STONE_B : "stone" };
  if (!ex.length) return { block: y === top - 1 ? "gray_concrete" : "smooth_stone" };
  // the footprint's edge is a staircase, so a cell can see two sides: the facade follows its first exposed side
  const s = ex[0][2] !== 0 ? x : z;                                               // position along the face
  const pillar = s % 4 === 0;
  const sb = 4 * Math.floor(gr / 4), awning = sb + 3;
  const isDoor = door && x === door.x && z === door.z;
  if (y < sb + 4) {                                                               // ground storey: shopfront
    if (y === awning) return { block: s % 2 ? "white_concrete" : "red_concrete" };
    if (isDoor && y === gr) return { block: "dark_oak_door", state: doorState(door.facing, "lower") };
    if (isDoor && y === gr + 1) return { block: "dark_oak_door", state: doorState(door.facing, "upper") };
    if (isDoor && y === awning - 1) return { block: "lantern", state: { hanging: "true", waterlogged: "false" } };
    if (pillar) return { block: DARK };
    if (y === gr) return { block: STONE_B };                                      // base course
    if (y === awning - 1) return { block: DARK };                                 // transom
    return { block: "glass_pane", state: paneState(ex[0]), glass: { lampY: gr, lamp: "shroomlight", every: 3 } };
  }
  const k = y % 4;                                                                // upper storeys: 4-block bands
  if (pillar) return { block: QUARTZ };
  if (k === 0) return { block: "quartz_slab", state: SLAB_BOTTOM };               // string course / sill
  if (k === 3 || s % 4 === 3) return { block: BRICK };                            // header and pier
  return { block: "glass_pane", state: paneState(ex[0]), glass: { lampY: y - k, lamp: "glowstone", every: 4 } };
}

function lampBehind(x, y, z, [, dx, dz], { lampY, lamp, every }) {
  const bx = x - dx, bz = z - dz;                                                  // the cell just inside the glass
  if (!inM(bx, lampY, bz) || solid(bx, lampY, bz)) return;                         // only in the air gap
  if (lampY > 0 && !solid(bx, lampY - 1, bz)) return;                              // stands on a floor slab
  if (hash(x, y, z) % every === 0) vox.set(bx, lampY, bz, lamp);
}

// The building shell, storey by storey, with the parapet above the plan edge.
for (const [k, c] of plan) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.top; y++) {
    if (!solid(x, y, z)) continue;
    const ex = exposures(x, y, z);
    const f = facade(x, y, z, ex, c);
    vox.set(x, y, z, f.block, f.state);
    if (f.glass && ex.length) lampBehind(x, y, z, ex[0], f.glass);
  }
  if (planRing(x, z)) {
    vox.set(x, c.top, z, "quartz_slab", SLAB_BOTTOM);
    vox.set(x, c.top + 1, z, BRICK);
    vox.set(x, c.top + 2, z, "stone_brick_slab", SLAB_BOTTOM);
  }
}

// Roof stair and lift tower: 5 x 5 on the main roof, away from the edge, with glazed centres and a slab cap.
const TY = 16;
const top16 = [...plan].map(([k, c]) => [...k.split(",").map(Number), c.top]).filter(([, , t]) => t === TY);
const cx = top16.reduce((a, [x]) => a + x, 0) / top16.length, cz = top16.reduce((a, [, z]) => a + z, 0) / top16.length;
let tower = null;
for (let ax = 0; ax + 5 <= X; ax++) for (let az = 0; az + 5 <= Z; az++) {
  let ok = true;
  for (let i = 0; i < 5 && ok; i++) for (let j = 0; j < 5 && ok; j++) ok = at(ax + i, az + j)?.top === TY && !planRing(ax + i, az + j);
  if (!ok) continue;
  const d = (ax + 2 - cx) ** 2 + (az + 2 - cz) ** 2;
  if (!tower || d < tower.d) tower = { ax, az, d };
}
if (tower) {
  const { ax: TX, az: TZ } = tower;
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const edgeX = i === 0 || i === 4, edgeZ = j === 0 || j === 4;
    if (!edgeX && !edgeZ) continue;
    for (let dy = 0; dy < 5; dy++) {
      const y = TY + dy, corner = edgeX && edgeZ;
      if (corner) { vox.set(TX + i, y, TZ + j, QUARTZ); continue; }
      const win = (dy === 1 || dy === 2) && ((edgeZ && i === 2) || (edgeX && j === 2));
      if (win) vox.set(TX + i, y, TZ + j, "glass_pane", edgeZ ? paneState(DIRS[0]) : paneState(DIRS[2]));
      else vox.set(TX + i, y, TZ + j, BRICK);
    }
    vox.set(TX + i, TY + 5, TZ + j, "stone_brick_slab", SLAB_BOTTOM);
  }
  vox.set(TX + 2, TY, TZ + 2, "glowstone");                                          // lamp on the tower floor
}

// Roof plant on the main roof, and a garden bed on the lower tier.
const inTower = (x, z) => tower && x >= tower.ax - 1 && x <= tower.ax + 5 && z >= tower.az - 1 && z <= tower.az + 5;
for (const [k, c] of plan) {
  const [x, z] = k.split(",").map(Number);
  const quad = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => [x + a, z + b]);
  const sameTop = quad.every(([a, b]) => at(a, b)?.top === c.top && !planRing(a, b));
  if (!sameTop) continue;
  if (c.top === TY && x % 11 === 5 && z % 11 === 5 && !quad.some(([a, b]) => inTower(a, b))) {
    for (const [a, b] of quad) vox.set(a, TY, b, "light_gray_concrete");
  }
  if (c.top === 12 && x % 6 >= 2 && x % 6 <= 3 && z % 6 >= 2 && z % 6 <= 3) {
    for (const [a, b] of quad) vox.set(a, 12, b, "moss_block");
  }
}

// Every wall, tier and parapet block above y 0 must stand on a block. Only the floor slabs and roof membrane span the
// storey air between walls (they are carried by the walls around them), so those are counted apart.
let floating = 0, spanning = 0;
for (let x = 0; x < X; x++) for (let y = 1; y < SIZE[1]; y++) for (let z = 0; z < Z; z++) {
  const b = vox.get(x, y, z); if (!b || vox.get(x, y - 1, z)) continue;
  if (b.block === "minecraft:smooth_stone" || b.block === "minecraft:gray_concrete") spanning++; else floating++;
}

const stats = vox.save(OUT);
const tops = {}; for (const [, c] of plan) tops[c.top] = (tops[c.top] || 0) + 1;
console.log(JSON.stringify({ front, door, tower: tower && { ax: tower.ax, az: tower.az }, floating, spanning, tops, ...stats }));
