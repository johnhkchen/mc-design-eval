// 62 West 45th Street, 1911 commercial and office building: a 14-storey (42-block) loft-and-office block in red brick on
// a polished-granite base, with cream terracotta storey lines, quoins and a cornice, and a parapet to 44 round its outer
// ring. The footprint is U-shaped: the lidar sees no roof on the court (cells at 0), so it stays open ground, paved, and
// its walls are courtyard facades. The street face is the north one (low z, the 45th Street frontage): a shopfront row
// on the ground floor, with a single entrance in the middle under a dark awning. The lidar roof is 41 to 44 across the
// whole block with one lone 22 at the north-west corner, which is read as the same roof (smoothed), so the massing is
// one flat tier with a parapet, not setbacks. Rooftop: a water tower on a brick base and a small bulkhead.
// Walls are one block thick: windows are glass panes in that skin with air behind (interior cells), a floor slab at
// the foot of every storey, and columns in the interior. Warm glowstone sits behind some windows and lanterns behind
// two shopfronts.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034237.cells.json`, "utf8"));
const X = 11, Y = 56, Z = 28;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
// Built: a footprint cell the lidar sees a roof on. A footprint cell at lidar 0 is the open court, paved at y 0.
const built = (x, z) => inFoot(x, z) && cell.get(`${x},${z}`).roof > 0;
const court = (x, z) => inFoot(x, z) && !built(x, z);
const NB = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];   // N = low z = 45th Street face
const faces = (x, z) => NB.filter(([, dx, dz]) => !built(x + dx, z + dz)).map(([d]) => d);
const ring = (x, z) => built(x, z) && faces(x, z).length > 0;       // the outer skin, facing outside or the court
const interior = (x, z) => built(x, z) && !ring(x, z);

// Levels (block heights above y 0): storeys of 3 from the granite base; the top band is the cornice at 41, the roof
// deck is 42 on the interior, and the outer ring carries a parapet to 44.
const TOP = 42, PARAPET = 44;
const STONE = "polished_granite", BRICK = "bricks", TERRA = "white_terracotta", FLOOR = "smooth_stone";
const ROOF = "gray_concrete", COURT = "stone_bricks", COLUMN = "stone_bricks";
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows
const ENTRANCE = [4, 5, 6];                                        // the door is x 5; granite pilasters at 4 and 6
const SHOP = [1, 3, 7, 9];                                         // shopfront glass on the street row
const pier = (i) => i % 3 === 2;                                    // a brick pier every third cell: bays of 1 or 2 windows

const g = new Voxels([X, Y, Z]);
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);
const paneState = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }     // a pane on a face along x
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });   // a pane on a face along z
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// A ring cell is a corner when its open faces run both ways (a quoin); a wall with open ground on both sides (the
// one-block west wall beside the court) is a plain wall and takes windows like any other face.
const corner = (fs) => fs.some((d) => d === "N" || d === "S") && fs.some((d) => d === "E" || d === "W");

// 1. Solid mass. Foundation from y 0 to each cell's ground (all 0 here), the ring to its parapet, and the interior as
// floor slabs at every storey's foot with the roof deck over it, air between.
for (const [key, { ground }] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (court(x, z)) { set(x, 0, z, COURT); continue; }
  for (let y = 0; y < ground; y++) set(x, y, z, STONE);
  if (!built(x, z)) continue;
  const fs = faces(x, z), top = ring(x, z) ? PARAPET : TOP;
  for (let y = ground; y < top; y++) {
    if (!ring(x, z)) {
      if (y % 3 === 0 && y < 41) set(x, y, z, FLOOR);
      else if (y === 41) set(x, y, z, ROOF);
      continue;
    }
    if (y === 0) set(x, y, z, STONE);                          // plinth
    else if (y >= 42) set(x, y, z, y === 42 ? BRICK : TERRA);  // parapet and its cap
    else if (y % 3 === 0 || y === 41) set(x, y, z, TERRA);     // storey lines and the cornice
    else {
      if (y <= 2) {                                             // the ground storey
        const d = fs[0];
        if (corner(fs)) set(x, y, z, STONE);
        else if (d === "N" && z === 0 && SHOP.includes(x)) set(x, y, z, "glass");
        else if (d === "N" && z === 0 && ENTRANCE.includes(x)) set(x, y, z, STONE);
        else if (!pier(d === "N" || d === "S" ? x : z) ) set(x, y, z, "glass_pane", paneState(d));
        else set(x, y, z, STONE);
      } else {
        if (corner(fs)) set(x, y, z, TERRA);                   // quoins
        else {
          const d = fs[0], i = d === "N" || d === "S" ? x : z;
          if (pier(i)) set(x, y, z, BRICK);
          else set(x, y, z, "glass_pane", paneState(d));
        }
      }
    }
  }
}

// 2. Entrance: a single door in the middle of the street row, granite pilasters either side, and a dark awning
// (stairs, top half, sloping out over the door) at the storey line above, supported on the interior floor behind it.
set(5, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
set(5, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of ENTRANCE) set(x, 3, 0, "dark_oak_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });

// 3. Warm light: glowstone in the interior behind some windows, and lanterns inside two shopfronts.
for (const [key] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (!ring(x, z)) continue;
  const fs = faces(x, z);
  if (fs.length !== 1) continue;
  const d = fs[0], [dx, dz] = DIRS[d], i = d === "N" || d === "S" ? x : z;
  for (let y = 1; y < 41; y++) {
    if (y % 3 === 0 || pier(i) || y === 41) continue;
    if (!interior(x - dx, z - dz) || !lit(i, y, z)) continue;
    set(x - dx, y, z - dz, "glowstone");
  }
}
for (const x of [1, 9]) set(x, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

// 4. Roof plant. A water tower on a brick tower base, and a bulkhead, both on interior roof cells (the deck at 41).
const tryBlock = (cx, cz, w, d) => {
  const cells2 = [];
  for (let dz = 0; dz < d; dz++) for (let dx = 0; dx < w; dx++) {
    if (!interior(cx + dx, cz + dz)) return null;
    cells2.push([cx + dx, cz + dz]);
  }
  return cells2;
};
const nearest = (w, d, tx, tz, avoid = []) => {
  let best = null;
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const sq = tryBlock(x, z, w, d);
    if (!sq || sq.some(([a, b]) => avoid.some(([c, e]) => c === a && e === b))) continue;
    const dist = Math.hypot(x + (w - 1) / 2 - tx, z + (d - 1) / 2 - tz);
    if (!best || dist < best.dist) best = { x, z, dist };
  }
  return best;
};
const tank = nearest(3, 3, 5, 6);
for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) {
  const x = tank.x + dx, z = tank.z + dz;
  set(x, 42, z, BRICK); set(x, 43, z, BRICK);
  for (const y of [44, 45, 46]) set(x, y, z, "spruce_planks");
  set(x, 47, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}
const tankCells = [];
for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) tankCells.push([tank.x + dx, tank.z + dz]);
const hut = nearest(2, 2, 9, 3, tankCells);
for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) {
  const x = hut.x + dx, z = hut.z + dz;
  for (const y of [42, 43, 44]) set(x, y, z, BRICK);
  set(x, 45, z, TERRA);
}

// 5. Interior columns, off the walls and clear of the window cells, so the floors span no more than three blocks.
for (const [key] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (!interior(x, z) || x % 3 !== 1 || z % 3 !== 1) continue;
  if (NB.some(([, dx, dz]) => !interior(x + dx, z + dz))) continue;
  for (let y = 0; y < 42; y++) set(x, y, z, COLUMN);
}

const stats = g.save(`${DIR}/NYC1034237.nbt`);
console.log("NYC1034237", stats, { tank, hut });
