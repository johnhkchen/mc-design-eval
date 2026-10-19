// 631 Fifth Avenue, a 1910 NYC individual landmark in public-institution use: a six-storey Beaux-Arts block in buff
// limestone on a granite base, with a corner pavilion and a stepped-down south wing, a flat tar roof behind a
// parapet, and a mechanical penthouse on the wing. The record gives 1910, public institution, and the Fifth Avenue
// address, so the frontage is the x = 0 face (the Fifth Avenue side, the entrance at its centre) and the cross street
// is the z = 0 face (a second door, mid-frontage). Footprint 7 x 9; lidar roof read as clean tiers: 19 for the six-
// storey main block, 21 for the corner pavilion (lidar 21 at x 0-1, z 6-8), 12 for the four-storey setbacks, 4 for
// the one-storey wings on the east side. Lidar 6-8 cells inside the main block and the 2-4 gaps in the z 2 row read as
// noise and are carried into the tier they sit among. Walls are a shell: a solid floor slab every third block, air
// in each storey behind a glass-and-pier grid, a roof on each top. Lanterns sit behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1090615.cells.json`, "utf8"));
const X = 7, Y = 33, Z = 9;
const SLAB = 3;                                    // one floor slab every third block; storeys are two air blocks

// Lidar roof to tier. The 6 and 8 cells are noise between tiers; the 2-4 cells east of the main block are the wings.
const OVERRIDE = { "1,1": 19, "1,2": 19, "2,2": 19, "4,2": 19, "1,6": 19 };
const tierOf = (roof) => (roof >= 20 ? 21 : roof >= 16 ? 19 : roof >= 7 ? 12 : 4);

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const topOf = (x, z) => (inFoot(x, z) ? OVERRIDE[`${x},${z}`] ?? tierOf(cell.get(`${x},${z}`).roof) : 0);

// [dx, dz] points out of the building. A block at height y is on the outside when the cell next to it is outside the
// footprint or has its roof at or below y.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, y, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return topOf(x + dx, z + dz) <= y; });

// Materials: buff limestone walls and piers, a granite base, a chiseled parapet, a tar roof, clear glass in the bays.
const WALL = "smooth_quartz", BASE = "stone_bricks", CAP = "chiseled_stone_bricks", ROOF = "stone", SLABM = "stone";
const PANE = "glass_pane";
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const DOOR = { hinge: "left", open: "false", powered: "false" };

const g = new Voxels([X, Y, Z]);

// Shell: each footprint cell from y 0 to its top. The top layer is roof (parapet where it is on the edge); every
// third row is a floor slab; the two rows between are a storey: glass in the odd bays on the outside, piers in the
// even ones, and air behind.
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
for (const [x, z] of cols) {
  const top = topOf(x, z);
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, y, z);
    if (y === top - 1) { g.set(x, y, z, ex.length ? CAP : ROOF); continue; }
    if (y % SLAB === 0) { g.set(x, y, z, !ex.length ? SLABM : y === 0 ? BASE : WALL); continue; }
    if (!ex.length) continue;                       // interior storey air
    if (ex.length > 1) { g.set(x, y, z, WALL); continue; }   // corner pier
    const d = ex[0], along = d === "W" || d === "E" ? z : x;
    g.set(x, y, z, along % 2 === 1 ? PANE : WALL, along % 2 === 1 ? (d === "W" || d === "E" ? EW : NS) : undefined);
  }
}

// Entrances: the Fifth Avenue door at the centre of the x = 0 face (z 7) and a cross-street door on the z = 0 face
// (x 3). Both sit between the piers, two blocks high, with a stone lintel where the slab row closes them.
const door = (x, z, facing) => {
  g.set(x, 1, z, "iron_door", { facing, half: "lower", ...DOOR, hinge: "left" });
  g.set(x, 2, z, "iron_door", { facing, half: "upper", ...DOOR, hinge: "left" });
};
door(0, 7, "east");
door(3, 0, "south");

// Warm lanterns just inside some lit windows, standing on the storey floor.
for (const [x, z] of cols) {
  for (let y = 1; y < topOf(x, z); y += SLAB) {
    const ex = exposed(x, y, z);
    if (ex.length !== 1 || !g.get(x, y, z) || g.get(x, y, z).block !== "minecraft:glass_pane") continue;
    if (!((x * 5 + y * 7 + z * 3) % 11 === 0 || (x * 3 + y + z * 7) % 9 === 0)) continue;
    const [dx, dz] = DIRS[ex[0]];
    const ix = x - dx, iz = z - dz;
    if (!inFoot(ix, iz) || topOf(ix, iz) <= y || g.get(ix, y, iz)) continue;
    g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Mechanical penthouse on the four-storey setback at x 3-4, z 6, and two lanterns on the pavilion roof.
for (const x of [3, 4]) for (let y = 12; y < 14; y++) g.set(x, y, 6, WALL);
g.set(3, 14, 6, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
g.set(4, 14, 6, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
g.set(0, 21, 7, "lantern", { hanging: "false", waterlogged: "false" });
g.set(0, 21, 8, "lantern", { hanging: "false", waterlogged: "false" });

const r = g.save(`${DIR}/NYC1090615.nbt`);
console.log(JSON.stringify(r));
