// Way 326736312: a two-storey Edwardian brick shop-top on a flat parapet roof, Mt Eden / Eden Terrace.
// The lidar footprint is 9 x 16 with ragged steps and a roof of 10 blocks (one 9 cell, smoothed away).
// Storeys: shopfront ground floor (y 0-3), upper floor of sash windows (y 4-7), cornice (y 8), parapet (y 9-10).
// Walls are the perimeter cells of the footprint; interior cells hold only the floor/ceiling slabs and the air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_326736312.cells.json`, "utf8"));
const W = 9, D = 16, Y = 23;

const fp = new Map();                                    // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof });
const inFp = (x, z) => fp.has(`${x},${z}`);

// lidar noise smoothed into one flat roof tier: the median roof height (10), and the lowest ground (y0)
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const H = roofs[Math.floor(roofs.length / 2)];
const deck = H - 1;                                      // top of the roof deck and of the parapet walls

const faces = (x, z) => {
  const f = [];
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x + 1, z)) f.push("E");
  return f;
};
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// the street front is the east face; the door sits mid-run on it
const DOOR = { x: 6, z: 8 };
const STOREY = { plinth: 0, shopTop: 3, string: 4, upTop: 7, cornice: 8 };

const g = new Voxels([W, Y, D]);
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);

// a wall bay is a single-face cell whose along-face coordinate is not a pier (every third cell is a pier)
const bayOf = (x, z, f) => f.length === 1 && (f[0] === "N" || f[0] === "S" ? x % 3 !== 0 : z % 3 !== 0);

for (const [x, z, ground] of cells) {
  const f = faces(x, z);
  const wall = f.length > 0;
  const front = f.includes("E");
  const bay = bayOf(x, z, f);

  // foundation under the cell, from y0 up to its ground (none here: the lot is flat)
  for (let y = 0; y < ground; y++) set(x, y, z, "stone_bricks");

  if (!wall) {
    // interior: floor slabs, the ceiling of each storey and the roof deck; air everywhere else
    for (const y of [0, STOREY.string, STOREY.cornice, deck]) set(x, y, z, "smooth_stone");
    continue;
  }

  // perimeter walls, y 0 up to the parapet coping at H
  set(x, STOREY.plinth, z, "polished_andesite");
  for (let y = 1; y <= H; y++) {
    let b = "bricks";
    if (y === 1) b = front ? "dark_oak_planks" : "bricks";
    else if (y <= STOREY.shopTop) {
      if (front) b = bay ? "glass" : y === 3 ? "dark_oak_planks" : "bricks";
      else b = bay && y >= 2 ? "glass_pane" : "bricks";
    }
    else if (y === STOREY.string || y === STOREY.cornice || y === H) b = "smooth_quartz";
    else if (y <= STOREY.upTop) b = bay ? "glass_pane" : "bricks";
    // y = deck (9) is parapet brick, y = H (10) is the coping; both sit on the cornice
    set(x, y, z, b);
  }
  // the door: a dark-oak door on the east front, lower half at y1 and upper at y2
  if (x === DOOR.x && z === DOOR.z) {
    set(x, 1, z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, 2, z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  // warm light: a standing lantern inside the shop behind some front bays; hanging lanterns in the upper
  // rooms behind some sash windows. The air gap behind each glass stays open except for the lamp itself.
  if (bay && f.length === 1) {
    const [dx, dz] = inward[f[0]];
    const ix = x + dx, iz = z + dz;
    if (inFp(ix, iz) && !faces(ix, iz).length) {
      if (front && z % 6 === 2) set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
      if (!front && z % 6 === 1) set(ix, 6, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// roof plant: a light-grey housing for the lift motor and two cooling units, on the roof deck
for (const x of [2, 3]) for (const z of [10, 11]) {
  set(x, H, z, "light_gray_concrete");
  set(x, H + 1, z, "light_gray_concrete");
}

g.save(`${DIR}/way_326736312.nbt`);
console.log(`way_326736312: ${g.count()} blocks, ${g.palette.length - 1} kinds, roof ${H} blocks`);
