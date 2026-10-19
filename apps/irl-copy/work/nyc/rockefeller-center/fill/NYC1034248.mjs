// 17 West 45th Street, 1911: a twelve-storey Midtown loft-office on a granite base, brick walls with stone belt courses
// at every storey line, a stone cornice and parapet, glass-and-brick ribbon windows on the street and rear faces, a
// recessed granite entrance with a dark canopy, a one-storey rear wing, and a water tower and stair bulkhead on the roof.
// The side walls are windowless party walls, as on a midblock lot.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034248.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 12, Z = 27, Y = 50;
const TOP = 36, LOW = 6, SETBACK = 21;        // main roof, rear wing, one setback cell; roof height in blocks above y 0
const STREET_Z = 26;                          // the 45th Street front is the z = 26 face (the 12-wide side)

// Tiers from the lidar roof, smoothed into flat levels. 0 is no return: a hole inside the roof reads as the roof, on the
// north edge (z 2) as the low link, and the north stub (x 0..1, z 0..1) is the one-storey rear wing.
const tierOf = (x, z, r) => {
  if (x <= 1 && z <= 1) return LOW;
  if (r === 0) return z === 2 ? LOW : TOP;
  if (r < 15) return LOW;
  if (r <= 25) return SETBACK;
  return TOP;
};
const H = new Map();
for (const [x, z, , r] of cells) H.set(`${x},${z}`, tierOf(x, z, r));
const hAt = (x, z) => H.get(`${x},${z}`) ?? 0;   // off the footprint is 0: open to the air at every height

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const open = (x, z, y, d) => { const [dx, dz] = DIRS[d]; return hAt(x + dx, z + dz) <= y; };
const perimeter = (x, z) => ["n", "s", "w", "e"].some((d) => open(x, z, TOP - 1, d));
const faceOf = (x, z, y) => {
  if (z === STREET_Z && open(x, z, y, "s")) return "street";
  if (open(x, z, y, "n") || open(x, z, y, "s")) return "rear";
  if (open(x, z, y, "w") || open(x, z, y, "e")) return "side";
  return null;
};

// Bays: piers at x = 0, 3, 6, 9 and the corner at 11; two-bay windows between them.
const WINDOW = (x) => x % 3 !== 0 && x !== 11;
const GLASS = { block: "glass_pane", state: { north: "false", south: "false", east: "true", west: "true" } };   // arms run into piers
const doorHalf = (half) => ({ block: "dark_oak_door", state: { facing: "south", half, hinge: "left", open: "false", powered: "false" } });

function wallAt(x, y, z, face) {
  if (y === 0) return { block: "polished_granite" };                                 // base course
  if (y === TOP - 1) return { block: "smooth_sandstone" };                           // cornice band
  if (face === "street" && y === 3 && x >= 4 && x <= 6) return { block: "black_concrete" };   // entrance canopy
  if (y % 3 === 0) return { block: "smooth_sandstone" };                             // storey belt course
  if (face === "street" && y < 3) {                                                   // shopfront
    if (x === 5) return doorHalf(y === 1 ? "lower" : "upper");
    if (x === 4 || x === 6 || !WINDOW(x)) return { block: "polished_granite" };
  }
  if ((face === "street" || face === "rear") && WINDOW(x)) return GLASS;
  return { block: "bricks" };
}

const g = new Voxels([X, Y, Z]);
const footprint = [...H.keys()].map((k) => k.split(",").map(Number));

for (const [x, z] of footprint) {
  const top = hAt(x, z);
  for (let y = 0; y < top; y++) {
    const face = faceOf(x, z, y);
    if (face) {
      const b = wallAt(x, y, z, face);
      g.set(x, y, z, b.block, b.state);
    } else if (y % 3 === 0) g.set(x, y, z, "smooth_stone");              // floor slab per storey; air between
  }
  if (top === TOP && perimeter(x, z)) {                                   // parapet and coping on the main roof edge
    g.set(x, TOP, z, "bricks");
    g.set(x, TOP + 1, z, "smooth_sandstone_slab", { type: "bottom" });
  } else g.set(x, top, z, "smooth_stone");                                // roof deck
}

// Warm light behind some street windows (in the air gap, on the floor slab).
for (let s = 0; s < 12; s++) {
  const y = 3 * s + 1;
  for (const x of [8, ...(s % 2 === 1 ? [2] : [])]) g.set(x, y, STREET_Z - 1, "glowstone");
}

// Stair and elevator bulkhead on the roof, 3 x 4, brick with a stone cap.
for (let x = 2; x <= 4; x++) for (let z = 19; z <= 22; z++) {
  for (let y = TOP + 1; y <= TOP + 3; y++) g.set(x, y, z, "bricks");
  g.set(x, TOP + 4, z, "smooth_sandstone_slab", { type: "bottom" });
}

// Water tower: an iron cage on the roof, a spruce cask with its corners cut, and a flat cap.
const [tx, tz] = [8, 15];
const corner = (dx, dz) => Math.abs(dx) === 1 && Math.abs(dz) === 1;
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  const state = { north: String(dz > -1), south: String(dz < 1), east: String(dx < 1), west: String(dx > -1) };
  for (let y = TOP + 1; y <= TOP + 3; y++) g.set(tx + dx, y, tz + dz, "iron_bars", state);
  if (corner(dx, dz)) continue;
  for (let y = TOP + 4; y <= TOP + 7; y++) g.set(tx + dx, y, tz + dz, "spruce_planks");
  g.set(tx + dx, TOP + 8, tz + dz, "spruce_slab", { type: "bottom" });
}

const { blocks, palette } = g.save(`${DIR}/NYC1034248.nbt`);
console.log(`NYC1034248.nbt: ${blocks} blocks, palette ${palette}`);
