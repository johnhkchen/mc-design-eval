// 9 East 53 Street (NYC1035726): a 1920 five-storey mixed-use block on a 5 x 28 footprint. Lidar roofs 15-19 blocks above the
// ground under the body (cells x 0..4, z 10..27); the z 0..9 strip and the two cells at z 10 are open ground (roof 0), so they stay a
// paved forecourt with an iron railing. Brick walls on a granite shopfront, cream stone belts at each floor line, a cornice and
// parapet, one setback crown (x 1..2) where the lidar reads 18-19, and a roof water tank.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035726.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 5, D = 28;

const byXZ = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const at = (x, z) => byXZ.get(`${x},${z}`);
const built = (x, z) => (at(x, z)?.roof ?? 0) > 0;                       // lidar saw structure above ground here
const exposed = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !built(x + dx, z + dz));
// The lidar's 18-19 over x 1..2 in two runs (z 15..19 and 24..26), smoothed to two rectangles: the setback crown.
const crown = (x, z) => (x === 1 || x === 2) && ((z >= 15 && z <= 19) || (z >= 24 && z <= 26));

const WALL = "bricks", BELT = "smooth_quartz", BASE = "polished_granite", SLAB = "stone", GLASS = "glass_pane";
const ROWS = [4, 5, 7, 8, 10, 11, 13, 14];            // upper window rows; the belts at 3, 6, 9, 12 are the floor lines
const BELTS = [3, 6, 9, 12];
const DOOR_Z = 18;
const longFace = (x) => x === 0 || x === 4;             // the long faces run along z; the two ends are x-wide
const bay = (x, z) => (longFace(x) ? z % 3 !== 0 : x !== 2);       // 3-block piers on the long faces, a pier mid-end
const shopBay = (x, z) => (longFace(x) ? z % 4 !== 0 : x !== 2);   // 4-block shopfront piers
const crownBay = (z) => z % 3 !== 0;
const interior = (x, z) => built(x, z) && !exposed(x, z) && !crown(x, z);

const g = new Voxels([W, 31, D]);

for (const [x, z, ground] of cells) {
  if (!built(x, z)) { g.set(x, 0, z, "stone_bricks"); continue; }     // open forecourt at grade
  for (let y = 0; y < ground; y++) g.set(x, y, z, SLAB);            // foundation (ground is 0 under every cell here)
  for (const y of [0, 3, 6, 9, 12, 15]) g.set(x, y, z, SLAB);       // ground floor, storey floors, roof deck (interior)

  if (crown(x, z)) {
    g.set(x, 16, z, BELT);
    g.set(x, 17, z, crownBay(z) ? GLASS : WALL);
    g.set(x, 18, z, "stone_bricks");
    continue;
  }
  if (!exposed(x, z)) continue;                                     // interior: air, floors and deck only

  for (let y = 0; y <= 14; y++) {
    let b;
    if (y === 0) b = BASE;                                           // bulkhead / plinth
    else if (y <= 2) b = shopBay(x, z) ? (y === 1 ? GLASS : BELT) : BASE;   // shopfront: glass, then transom
    else if (BELTS.includes(y)) b = BELT;
    else b = ROWS.includes(y) && bay(x, z) ? GLASS : WALL;
    g.set(x, y, z, b);
  }
  g.set(x, 15, z, BELT);                                             // cornice
  g.set(x, 16, z, "stone_bricks");                                   // parapet
}

// Warm light behind some glass: glowstone on the interior cell just inside a lit window or shop pane.
const dxIn = (x) => (x === 0 ? 1 : -1);                 // interior side of a long face
for (const [x, z] of cells) {
  if (!built(x, z) || !longFace(x) || !exposed(x, z)) continue;
  const xi = x + dxIn(x);
  if (!interior(xi, z)) continue;
  if (z === 13 || z === 21) g.set(xi, 1, z, "glowstone");           // two shop panes lit at ground level
  for (const y of ROWS) if (bay(x, z) && (z + y) % 5 === 0) g.set(xi, y, z, "glowstone");
}

// Entrance on the west face: a dark oak door between granite piers, a hanging lantern over it.
g.set(0, 0, DOOR_Z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(0, 1, DOOR_Z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(0, 2, DOOR_Z, "lantern", { hanging: "true" });

// Roof water tank: four barrels in a 2 x 2 on the body roof, capped with planks.
for (const x of [2, 3]) for (const z of [21, 22]) {
  g.set(x, 16, z, "barrel"); g.set(x, 17, z, "barrel"); g.set(x, 18, z, "dark_oak_planks");
}

// Railing round the forecourt's street edges (iron bars on the x 0 and x 4 lines and across the north end).
for (let z = 0; z <= 9; z++) for (const x of [0, 4]) {
  if (z === 0) g.set(x, 1, z, "iron_bars", { north: "false", south: "true", east: x === 0 ? "true" : "false", west: x === 4 ? "true" : "false" });
  else g.set(x, 1, z, "iron_bars", { north: "true", south: "true", east: "false", west: "false" });
}
for (let x = 1; x <= 3; x++) g.set(x, 1, 0, "iron_bars", { north: "false", south: "false", east: "true", west: "true" });

const { blocks, palette } = g.save(`${DIR}/NYC1035726.nbt`);
console.log(`NYC1035726.nbt: ${blocks} blocks, ${palette} palette entries`);
