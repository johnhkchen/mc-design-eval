// 6 East 48 Street, 1942 mixed residential and commercial building: a five-storey brick block in the Moderne manner, with
// an andesite base and shopfront band on the 48th Street (north) face, calcite storey lines and cornice, and brick piers
// between recessed glass panes with air behind. Its lidar roof is read as two flat tiers (median-smoothed): a 17-block
// body (five storeys and a cornice) and a 20-block crown (six storeys) on the north-east and south-east, with a three-
// storey penthouse on the south-east crown and a small machine house on the north-west roof. The shopfront has a
// recessed entrance (dark oak door, andesite pilasters, a canopy and a hanging lantern). Warm glowstone sits behind some
// lower panes. Footprint 21 x 26 (low z = north = 48th Street); each cell is solid from y 0 up to its ground (foundation)
// and the storey lines sit on rows 1, 4, 7 ... so every storey and tier stands on the course below. Interiors are hollow:
// air behind each pane, a floor slab per storey, and a solid roof cap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035426.cells.json`, "utf8"));
const X = 21, Y = 32, Z = 26;

const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { g, r }]));
const inF = (x, z) => foot.has(k2(x, z));

// Lidar roof, median of a 5x5 window of footprint cells, then one of two flat tiers (17 body, 20 crown).
const med = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inF(x + dx, z + dz)) v.push(foot.get(k2(x + dx, z + dz)).r);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const topOf = new Map();
for (const [key, { r }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const m = med(x, z);
  let T = m >= 19 ? 20 : 17;
  if (T === 20 && x >= 18 && z >= 20 && z <= 22) T = 23;          // penthouse on the south-east crown
  if (T === 17 && x >= 2 && x <= 4 && z >= 3 && z <= 5) T = 20;   // machine house on the north-west roof
  topOf.set(key, T);
}
const topAt = (x, z) => topOf.get(k2(x, z));
const mechAt = (x, z) => topAt(x, z) === 20 && x >= 2 && x <= 4 && z >= 3 && z <= 5;

const B = new Map();                                              // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(k3(x, y, z), { block, state });
const del = (x, y, z) => B.delete(k3(x, y, z));

// 1. Solid core: base course, foundation to each cell's ground (y 0 is solid everywhere), floor slabs on the
//    storey lines, and a roof cap on the top row of every column.
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  const T = topAt(x, z);
  for (let y = 0; y < T; y++) if (y === 0 || y === T - 1 || y % 3 === 1) put(x, y, z, "stone");
}

// 2. Faces: a column's side faces where its neighbour is outside the footprint (full height) or lower (the setback
//    from the neighbour's roof upward). Face cell = depth 0, glass sits at depth 1 with air behind (depth 2).
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];                  // N (48th Street), S, W, E
const faceAt = (a, b, dx, dz) => inF(a, b) && (!inF(a + dx, b + dz) || topAt(a + dx, b + dz) < topAt(a, b));
const glowCands = [];
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  const T = topAt(x, z);
  for (const [dx, dz] of DIRS) {
    let lo;
    if (!inF(x + dx, z + dz)) lo = 0;
    else if (topAt(x + dx, z + dz) < T) lo = topAt(x + dx, z + dz);
    else continue;
    const ex = dz !== 0 ? [1, 0] : [0, 1];                          // along the face
    const i = dz !== 0 ? x : z;
    const mech = mechAt(x, z);
    const pier = mech || i % 3 === 0 || !faceAt(x + ex[0], z + ex[1], dx, dz) || !faceAt(x - ex[0], z - ex[1], dx, dz);
    const d1 = inF(x - dx, z - dz);
    for (let y = lo; y < T; y++) {
      // Row kinds: 0 base course, T-1 cornice, storey line (y % 3 == 1), else a window row (two per storey).
      let blk = null;
      if (y === 0) blk = "polished_andesite";
      else if (y === T - 1) blk = "calcite";
      else if (y % 3 === 1) blk = y === 1 ? "polished_andesite" : "calcite";
      else if (pier) blk = "bricks";
      if (blk) {
        put(x, y, z, blk);
        if (d1) put(x - dx, y, z - dz, blk);
      } else {
        del(x, y, z);                                                 // recess: air in front of the glass
        if (d1) {
          put(x - dx, y, z - dz, "glass_pane", {});
          if (y % 3 === 2 && inF(x - 2 * dx, z - 2 * dz)) glowCands.push([x - 2 * dx, y, z - 2 * dz, (x * 7 + z * 3 + y) % 11 === 0]);
        }
      }
    }
  }
}
// Warm lights behind the lower panes, on the floor slab (a row of air above a storey line).
for (const [x, y, z, lit] of glowCands) if (lit && !B.has(k3(x, y, z))) put(x, y, z, "glowstone");

// 3. The 48th Street entrance: a recess at x 10 with a dark oak door at depth 1, andesite pilasters, an andesite canopy
//    over both, and a hanging lantern under it. Lower and upper door halves.
for (const x of [9, 11]) for (const y of [1, 2]) { put(x, y, 0, "polished_andesite"); put(x, y, 1, "polished_andesite"); }
del(10, 1, 0); del(10, 2, 0);
put(10, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
for (const x of [9, 10, 11]) for (const z of [0, 1]) put(x, 3, z, "polished_andesite");
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(10, 1, 1, "dark_oak_door", door("lower"));
put(10, 2, 1, "dark_oak_door", door("upper"));

// 4. Glass panes connect to their neighbours in the run (a pane or a full block), as vanilla would connect them.
const FULL = new Set(["bricks", "polished_andesite", "calcite", "stone", "glowstone"]);
const linked = (x, y, z) => { const b = B.get(k3(x, y, z)); return !!b && (b.block === "glass_pane" || FULL.has(b.block)); };
for (const [key, v] of [...B]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  v.state = {
    north: String(linked(x, y, z - 1)), south: String(linked(x, y, z + 1)),
    west: String(linked(x - 1, y, z)), east: String(linked(x + 1, y, z)), waterlogged: "false",
  };
}

// 5. Write the structure.
const g = new Voxels([X, Y, Z]);
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}

// Support check: each exterior block above y 0 stands on a block below it. Floor slabs span their rooms on the walls, so
// they are not checked; the lantern hangs under the canopy and the upper door half stands on the lower.
let loose = 0;
for (const [key, { block }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  if (y === 0 || block === "stone" || block === "lantern" || block === "dark_oak_door") continue;
  if (!B.has(k3(x, y - 1, z))) loose++;
}
const stats = g.save(`${DIR}/NYC1035426.nbt`);
console.log(JSON.stringify({ ...stats, loose, topCounts: Object.fromEntries([...new Set(topOf.values())].map((t) => [t, [...topOf.values()].filter((v) => v === t).length])) }));
