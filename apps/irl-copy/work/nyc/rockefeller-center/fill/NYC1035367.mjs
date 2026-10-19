// 3 East 44th Street, a 1940 commercial and office building: a stone-faced Moderne block, six storeys on a granite
// base with a seventh-storey crown set back on its party walls. Footprint 6 x 10 (x across, low z = north, the rear;
// high z = south, the 44th Street front). Lidar read as clean tiers, not cell by cell: a two-storey wing on the north
// five rows (roof 8), a 19-block tower on the south four (lidar 24, cut back to 19 at the east and west edges), a 4 x 4
// crown on the tower's middle (roof 24, the lidar peak), a 2 x 2 penthouse on it. The south row (lidar 1, nothing above
// the ground) is a one-storey shopfront with a central entrance under a canopy. Every storey is 3 blocks: a floor line,
// a glass row, a head row. Glass sits in the outer wall with air behind it and a floor slab per storey (no interiors).
// Warm lanterns stand behind some panes. Blocks: pale calcite walls, quartz piers, dark deepslate spandrels, light-blue
// glass, granite base.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035367.cells.json`, "utf8"));
const X = 6, Y = 35, Z = 10;

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFoot = (x, z) => ground.has(`${x},${z}`);

// Tiers in priority order. A tier owns the cells in its rectangle for heights from `from` up to `top` (exclusive).
// `floors` are the storey floor lines; the row above each is the glass row, the one above that the head row, and
// `top - 1` is the cap (roof slab or cornice).
const TIERS = [
  { name: "crown", x: [1, 4], z: [5, 8], from: 19, floors: [19], top: 24 },
  { name: "tower", x: [0, 5], z: [5, 8], from: 0, floors: [1, 4, 7, 10, 13, 16], top: 19 },
  { name: "wing", x: [0, 5], z: [0, 4], from: 0, floors: [1, 4], top: 8 },
  { name: "shop", x: [0, 5], z: [9, 9], from: 0, floors: [1], top: 4 },
];
const tierAt = (x, y, z) =>
  TIERS.find((t) => x >= t.x[0] && x <= t.x[1] && z >= t.z[0] && z <= t.z[1] && y >= t.from && y < t.top) ?? null;
const perimeter = (t, x, z) => x === t.x[0] || x === t.x[1] || z === t.z[0] || z === t.z[1];

// Pier columns: the corners, and every third cell along a face (two panes between fins).
const pier = (t, x, z) => {
  if (t.name === "shop") return x === 0 || x === 5;
  const onZFace = z === t.z[0] || z === t.z[1];
  const i = onZFace ? x - t.x[0] : z - t.z[0];
  const n = onZFace ? t.x[1] - t.x[0] : t.z[1] - t.z[0];
  return i % 3 === 0 || i === n;
};

// Outward direction of a non-corner perimeter cell.
const outward = (t, x, z) => (z === t.z[0] ? [0, -1] : z === t.z[1] ? [0, 1] : x === t.x[0] ? [-1, 0] : [1, 0]);

// What a cell is at height y: out, foundation, air, or a part of a tier.
function kind(x, y, z) {
  if (!inFoot(x, z)) return "out";
  if (y < ground.get(`${x},${z}`)) return "foundation";
  // The shopfront's air gap behind its glass: one row of air between the shop and the tower's south wall.
  if (y === 2 && z === 8 && x >= 1 && x <= 4) return "air";
  const t = tierAt(x, y, z);
  if (!t) return "air";
  if (y === t.top - 1) return "cap";
  if (y < t.floors[0]) return perimeter(t, x, z) ? "base" : "air";
  const s = Math.max(...t.floors.filter((f) => f <= y));
  if (y === s) return perimeter(t, x, z) ? (s === 1 ? "base" : "spandrel") : "floor";
  if (!perimeter(t, x, z)) return "air";
  return y === s + 1 ? "glassrow" : "head";
}

const V = new Voxels([X, Y, Z]);
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lamps = [];
const panes = [];

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  for (let y = 0; y < Y; y++) {
    const k = kind(x, y, z);
    if (k === "out" || k === "air") continue;
    const t = tierAt(x, y, z) ?? TIERS[3];
    if (k === "foundation" || k === "base") V.set(x, y, z, "polished_granite");
    else if (k === "spandrel") V.set(x, y, z, "polished_deepslate");
    else if (k === "floor") V.set(x, y, z, "smooth_stone");
    else if (k === "cap") V.set(x, y, z, "smooth_stone");
    else if (k === "head") V.set(x, y, z, pier(t, x, z) ? "smooth_quartz" : "calcite");
    else if (k === "glassrow") {
      if (pier(t, x, z)) { V.set(x, y, z, "smooth_quartz"); continue; }
      const [dx, dz] = outward(t, x, z);
      const exposed = ["out", "air"].includes(kind(x + dx, y, z + dz));
      const inside = kind(x - dx, y, z - dz) === "air";
      if (exposed && inside) {
        V.set(x, y, z, "light_blue_stained_glass_pane", dz ? EW : NS);
        panes.push([x, y, z, dx, dz]);
      } else V.set(x, y, z, "calcite");
    }
  }
}

// Warm lanterns standing on the floor slab, one block inside some panes, plus two in the shopfront gap.
for (const [x, y, z, dx, dz] of panes) {
  if ((x * 7 + z * 3 + y) % 6 !== 0) continue;
  const [ix, iz] = [x - dx, z - dz];
  if (V.get(ix, y, iz) === null) { V.set(ix, y, iz, "lantern", { hanging: "false" }); lamps.push([ix, y, iz]); }
}
for (const [x, z] of [[1, 8], [4, 8]]) { V.set(x, 2, z, "lantern", { hanging: "false" }); lamps.push([x, 2, z]); }

// Entrance: a double dark-oak door in the middle of the shopfront, under a granite canopy on the shop's roof.
for (const x of [2, 3]) {
  const hinge = x === 2 ? "left" : "right";
  V.set(x, 1, 9, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  V.set(x, 2, 9, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
  V.set(x, 4, 9, "polished_granite_slab", { type: "bottom", waterlogged: "false" });
}

// Roof: a penthouse on the crown, lanterns on its top, small plant boxes on the tower's setback ledges, and a
// spruce water tower on the wing roof.
for (let y = 24; y <= 25; y++) for (const x of [2, 3]) for (const z of [6, 7]) V.set(x, y, z, "smooth_stone");
V.set(2, 26, 6, "lantern", { hanging: "false" }); V.set(3, 26, 7, "lantern", { hanging: "false" });
V.set(0, 19, 6, "stone_bricks"); V.set(5, 19, 7, "stone_bricks");
for (let y = 8; y <= 9; y++) for (const x of [1, 2]) for (const z of [1, 2]) V.set(x, y, z, "spruce_planks");
for (const x of [1, 2]) for (const z of [1, 2]) V.set(x, 10, z, "spruce_slab", { type: "bottom", waterlogged: "false" });

const report = V.save(`${DIR}/NYC1035367.nbt`);
console.log(`blocks ${report.blocks}, palette ${report.palette}, lanterns ${lamps.length}, panes ${panes.length}`);
