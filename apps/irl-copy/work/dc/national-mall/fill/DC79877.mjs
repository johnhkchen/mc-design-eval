import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 770 P St NW: a 1920s-30s commercial block in red brick on a granite base, with limestone (calcite) string courses,
// window heads and cornice. A shopfront on the P Street (north) face; five storeys on the west half, four on the east,
// a one-storey terrace and a stepped-down east wing. Storeys are 3 blocks; the ground floor is 3 blocks too.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC79877.cells.json`, "utf8"));

const W = 19, H = 28, D = 40;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });

// Massing: the lidar roof averaged over a 3x3 window, snapped to storey tops (4 = one storey, then 7, 10, 13, 16).
const TIERS = [4, 7, 10, 13, 16];
const snap = (v) => TIERS.reduce((b, t) => (Math.abs(t - v) < Math.abs(b - v) ? t : b));
const col = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const o = raw.get(key(x + dx, z + dz));
      if (o) { sum += o.roof; n++; }
    }
  col.set(k, { gr: c.gr, top: snap(sum / n) });
}
const at = (x, z) => col.get(key(x, z));

// The faces a cell is open on at height y: the footprint edge, or a neighbour whose roof is at or below y.
// A neighbour's storeys below its roof are inside the building and do not count.
const DIRS = [[0, -1, "n"], [0, 1, "s"], [-1, 0, "w"], [1, 0, "e"]];
const exposed = (x, z, y) => {
  const out = [];
  for (const [dx, dz, face] of DIRS) {
    const o = at(x + dx, z + dz);
    if (!o || y >= o.top) out.push(face);
  }
  return out;
};

const paneOn = (face) => (face === "n" || face === "s")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// The massing layer: what a cell holds at height y, or null for air.
const base = (x, y, z) => {
  const c = at(x, z);
  if (y < c.gr) return { b: "stone_bricks" };                                     // foundation under the ground
  const E = exposed(x, z, y);
  const edge = DIRS.some(([dx, dz]) => !at(x + dx, z + dz));
  if (y >= c.top) return edge && y === c.top ? { b: "stone_brick_wall" } : null;  // parapet on the footprint edge
  if (y === c.top - 1) return { b: E.length ? "calcite" : "stone" };             // cornice, or roof covering
  if (y === c.gr) return { b: E.length ? "polished_granite" : "smooth_stone" };  // base course, or ground floor slab
  if (y % 3 === 0) return { b: E.length ? "calcite" : "smooth_stone" };         // string course, or floor slab
  if (!E.length) return null;                                                    // air behind the glass
  const face = E[0];
  const p = face === "n" || face === "s" ? x : z;
  const pier = p % 3 === 0;
  if (y < 3) {                                                                   // shopfront
    if (pier) return { b: "calcite" };
    return face === "n" ? { b: "glass" } : { b: "glass_pane", s: paneOn(face) };
  }
  if (y % 3 === 1) return pier ? { b: "bricks" } : { b: "glass_pane", s: paneOn(face) };
  return pier ? { b: "bricks" } : { b: "calcite" };                              // window head
};

// Overrides on top of the massing: the entrance and its canopy, a penthouse, and warm lights behind some glass.
const over = new Map();
const put = (x, y, z, b, s) => over.set(`${key(x, z)},${y}`, { b, s });
const spec = (x, y, z) => over.get(`${key(x, z)},${y}`) ?? base(x, y, z);

// Entrance on the P Street face, on a pier, with a dark canopy over it.
const DOOR_X = 6;
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(DOOR_X, 1, 0, "dark_oak_door", doorState("lower"));
put(DOOR_X, 2, 0, "dark_oak_door", doorState("upper"));
for (let x = DOOR_X - 1; x <= DOOR_X + 1; x++) put(x, 3, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// Penthouse: a plant box on the west block's 16-high roof, set in from the edge, two blocks high, cornice on top.
for (let x = 3; x <= 6; x++)
  for (let z = 14; z <= 18; z++) {
    if (at(x, z)?.top !== 16) continue;
    put(x, 16, z, "stone_bricks");
    put(x, 17, z, x === 3 || x === 6 || z === 14 || z === 18 ? "calcite" : "stone_bricks");
  }

// Warm light in the air gap just behind some glass: a lantern in each shopfront bay, a glowstone in some upper windows.
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.gr + 1; y < c.top - 1; y++) {
    if (!(y < 3 || y % 3 === 1)) continue;
    const E = exposed(x, z, y);
    if (!E.length || over.has(`${key(x, z)},${y}`)) continue;
    const face = E[0];
    const onGlass = base(x, y, z)?.b.includes("glass");
    if (!onGlass) continue;
    const p = face === "n" || face === "s" ? x : z;
    if (y < 3 ? p % 3 !== 1 : (x + y) % 4 !== 0) continue;
    const [dx, dz] = DIRS.find(([, , f]) => f === face);
    const ix = x - dx, iz = z - dz;
    if (!at(ix, iz) || base(ix, y, iz) !== null || base(ix, y - 1, iz) === null) continue;
    if (over.has(`${key(ix, iz)},${y}`)) continue;
    if (y < 3) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else put(ix, y, iz, "glowstone");
  }
}

// Fill: every footprint cell from y 0 up through its roof, parapet and penthouse, with the layers above.
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= Math.min(c.top + 1, H - 1); y++) {
    const s = spec(x, y, z);
    if (s) g.set(x, y, z, s.b, s.s);
  }
}

const info = g.save(`${DIR}/DC79877.nbt`);
console.log("saved", `${DIR}/DC79877.nbt`, info);
