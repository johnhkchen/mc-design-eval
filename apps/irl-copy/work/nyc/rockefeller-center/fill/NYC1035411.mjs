// 5 East 47th Street (1916): an eight-storey brick commercial loft on a two-storey street-front base, with a stepped
// lidar massing (a 25-block west spine, a 24-block ring round a 21-block setback, a 6-block street wing, a 12-block stair
// tower in a court). Brick walls, limestone (smooth quartz) belts, cornice and quoins, polished granite base, glass
// panes in iron-barred frames set one block deep with air behind, a shopfront with a centre door under a dark awning,
// warm lanterns in some windows, and a wooden water tank on a roof deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035411.cells.json`, "utf8"));
const W = 7, D = 26, Y = 37;

// Lidar roof per footprint cell (-1 = outside). Every ground is 0, so y 0 is the street.
const raw = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, ground, roof] of cells) {
  if (ground !== 0) throw new Error(`ground ${ground} at ${x},${z}: expected 0`);
  raw[x][z] = roof;
}

const median = (v) => { const s = [...v].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const around = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const r = raw[x + dx]?.[z + dz]; if (r > 0) v.push(r); }
  return v;
};

// Flat tiers from the lidar: 0 = light court (open), 6 = street wing, 12 = stair tower, 21 = setback, 24 = main ring,
// 25 = west spine. The 3x3 median smooths the +-1 noise inside the 21-24 band.
const H = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const r = raw[x][z];
  if (r <= 0) continue;
  if (r >= 25) { H[x][z] = 25; continue; }
  if (r === 12) { H[x][z] = 12; continue; }
  const m = median(around(x, z));
  H[x][z] = m <= 8 ? 6 : m <= 22 ? 21 : 24;
}

const solid = (x, y, z) => x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < H[x][z];
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

const g = new Voxels([W, Y, D]);
const pockets = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const h = H[x][z];
  if (raw[x][z] < 0) continue;
  if (h === 0) { g.set(x, 0, z, "stone_bricks"); continue; }               // light court floor
  const top = h - 1, cornTop = h >= 22 ? h - 2 : h - 1;                     // two cornice rows on the tall tiers
  for (let y = 0; y < h; y++) {
    const ex = exposed(x, y, z);
    const s = Math.floor(y / 3);
    let b = "bricks";
    if (y === top) b = ex.length ? "smooth_quartz" : "smooth_stone";       // parapet coping / gravel roof
    else if (y >= cornTop) b = ex.length ? "smooth_quartz" : "bricks";      // cornice
    else if (ex.length === 0) b = "bricks";                                // core
    else if (y === 0) b = "polished_granite";                              // base course
    else if (y % 3 === 0) b = "smooth_quartz";                             // storey belt
    else if (ex.length >= 2) b = "smooth_quartz";                          // limestone quoins
    else {
      const [dx, dz] = ex[0];
      const frontFace = dx === 0 && dz === -1;
      if (frontFace && z === 0 && x === 3 && y < 3) b = "dark_oak_door";   // the centre entrance
      else if (frontFace && z === 0 && (x === 2 || x === 4) && y === 2) b = "lantern";
      else if (dx !== 0) {                                                 // side faces: pier at z%4 = 0, bars at 2
        const a = z % 4;
        b = a === 0 ? "bricks" : a === 2 ? "iron_bars" : "glass";
      } else {                                                             // street and back faces: piers at x 0, 6
        b = x === 0 || x === 6 ? "bricks" : x === 2 || x === 4 ? "iron_bars" : "glass";
      }
      if (b === "glass" || b === "dark_oak_door") pockets.push({ x, y, z, s, dx, dz, door: b === "dark_oak_door" });
    }
    g.set(x, y, z, b, b === "dark_oak_door" ? { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }
      : b === "lantern" ? { hanging: "true", waterlogged: "false" } : undefined);
  }
}

// Air behind each glass pane and the door: one block deep into the core, only where that cell is closed above, below and
// on its sides (so no pocket opens into a court). Some upper-storey panes get a lantern on the pocket floor.
for (const p of pockets) {
  const px = p.x - p.dx, pz = p.z - p.dz;
  if (!solid(px, p.y, pz) || p.y === 0 || H[px][pz] <= p.y + 1 || exposed(px, p.y, pz).length) continue;
  g.set(px, p.y, pz, "air");
  if (!p.door && p.s >= 1 && p.y % 3 === 1 && (p.x + p.z + p.s) % 5 === 0) {
    g.set(px, p.y, pz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// The entrance: a dark awning over the door (the door's vestibule is already air behind it).
for (const x of [2, 3, 4]) g.set(x, 3, 0, "dark_oak_planks");

// Roof equipment: a spruce deck on a 3x3 patch of the 21-block setback, and a wooden water tank on it.
let deck = null;
for (let x0 = 0; x0 <= W - 3; x0++) for (let z0 = 0; z0 <= D - 3; z0++) {
  let ok = true;
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) if (H[x0 + dx][z0 + dz] !== 21) ok = false;
  if (!ok) continue;
  const score = Math.abs(x0 + 1 - 3) + Math.abs(z0 + 1 - 13);
  if (!deck || score < deck.score) deck = { x0, z0, score };
}
if (deck) {
  const { x0, z0 } = deck;
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) g.set(x0 + dx, 21, z0 + dz, "spruce_planks");
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    g.set(x0 + dx, 22, z0 + dz, "oak_planks");
    g.set(x0 + dx, 23, z0 + dz, "oak_planks");
    g.set(x0 + dx, 24, z0 + dz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

console.log(`${g.save(`${DIR}/NYC1035411.nbt`).blocks} blocks written`);
