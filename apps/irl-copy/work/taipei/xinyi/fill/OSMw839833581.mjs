import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833581";
const W = 22, H = 23, D = 21;
const ROOF = 11; // roof level above lowest ground (lidar record)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Outward normals of the footprint edge at (x, z); empty for interior cells
const outward = (x, z) => {
  const o = [];
  if (!has(x - 1, z)) o.push([-1, 0]);
  if (!has(x + 1, z)) o.push([1, 0]);
  if (!has(x, z - 1)) o.push([0, -1]);
  if (!has(x, z + 1)) o.push([0, 1]);
  return o;
};
const isPerim = (x, z) => outward(x, z).length > 0;

// Materials: a 1960s-80s Taipei mid-rise commercial block, pale concrete with
// dark tinted glazing, a stone-brick belt course and a dark shopfront band.
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const WALL = "light_gray_concrete";
const MULL = "white_concrete";
const GLASS = "light_blue_stained_glass";
const BELT = "stone_bricks";
const SIGN = "dark_oak_planks";
const DECK = "smooth_stone";
const CAP = "stone_brick_slab";
const LIGHT = "glowstone";
const AC = "iron_block";

for (const [x, z, gr] of cells) {
  const b = gr + 1;                       // first body row above the ground
  const rc = Math.max(ROOF, gr + 3);      // roof deck level for this cell
  const out = outward(x, z);
  const perim = out.length > 0;
  const corner = out.length >= 2;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, FOUND);

  // Roof deck and storey floor slabs (air gap between them)
  g.set(x, rc, z, DECK);
  g.set(x, b, z, FLOOR);
  if (b + 5 < rc) g.set(x, b + 5, z, FLOOR);

  if (!perim) {
    // Interior: rooftop plant on a few cells
    if (x % 7 === 3 && z % 6 === 2) g.set(x, rc + 1, z, AC);
    continue;
  }

  const [ox, oz] = out[0];
  const facing = ox === -1 ? "west" : ox === 1 ? "east" : oz === -1 ? "north" : "south";
  const idx = oz !== 0 ? x : z;           // position along the wall
  const mull = corner || idx % 3 === 0;   // mullion or corner pier

  // Wall rows: k is the offset above the ground-floor slab at b
  for (let k = 0; b + k < rc; k++) {
    const y = b + k;
    let blk = WALL;
    if (k === 0 || k === 5 || k === 9) blk = BELT;          // floor / storey lines
    else if (k === 4) blk = SIGN;                           // shopfront fascia
    else if ((k >= 1 && k <= 3) || (k >= 6 && k <= 8)) {
      blk = mull ? MULL : GLASS;                            // window grid
    }
    g.set(x, y, z, blk);
  }

  // Entrance: one door on the south face of the ground floor
  if (facing === "south" && x === 10) {
    g.set(x, b + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, b + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Warm light behind some upper-floor windows
  if (!corner && idx % 6 === 2) {
    const ix = x - ox, iz = z - oz;
    if (has(ix, iz) && !isPerim(ix, iz) && ground.get(`${ix},${iz}`) === gr && b + 7 < rc) {
      g.set(ix, b + 7, iz, LIGHT);
    }
  }

  // Parapet and coping on the roof edge
  g.set(x, rc, z, BELT);
  g.set(x, rc + 1, z, WALL);
  g.set(x, rc + 2, z, CAP, { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
