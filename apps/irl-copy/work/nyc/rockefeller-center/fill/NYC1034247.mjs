// 21 West 45th Street (NYC1034247): a 1920 seven-storey Renaissance-revival mixed-use block on a 6 x 25 lot.
// Cream terracotta body, granite base, quartz bands at each floor line, a cornice and parapet, a shopfront with an
// entrance on the 45th Street face (z 24), and a lidar bulkhead on the east side. The shell is one block thick,
// with air behind the glass and a solid slab at each floor line. Lamps sit behind some of the windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034247.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const W = 6, D = 25, H = 34;
const BASE = "polished_granite", BODY = "white_terracotta", BAND = "smooth_quartz", DECK = "stone", AWN = "black_concrete";
const GLASS_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const GLASS_NS = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

// Lidar roof per cell: no-return cells (0) take the median of their valid neighbours; the 22-block cells are the
// bulkhead, everything else is the one flat roof at 20.
const raw = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const valid = (x, z) => x >= 0 && x < W && z >= 0 && z < D && raw.get(`${x},${z}`) > 0;
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const top = new Map();
for (const [x, z, , r] of cells) {
  let h = r;
  if (!r) {
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => valid(x + dx, z + dz)).map(([dx, dz]) => raw.get(`${x + dx},${z + dz}`));
    h = median(n);
  }
  top.set(`${x},${z}`, h >= 21.5 ? 22 : 20);
}
const topOf = (x, z) => top.get(`${x},${z}`);
const inside = (x, z) => top.has(`${x},${z}`);
// A cell is on the outside when a side of it has no footprint cell next to it.
const exposed = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// What a cell is at height y. Storeys are 3 blocks: the bottom row of each is a band (slab line on the facade),
// the next two are window rows. The ground storey is the shopfront.
function block(x, y, z, t, edge) {
  const front = z === 24, back = z === 0;
  const s = Math.floor(y / 3), row = y % 3;

  if (row === 0 && y <= 18) {                                   // floor lines and the roof deck
    if (!edge) return { block: DECK };
    if (y === 0) return { block: BASE };                         // base course
    if (front && y === 3 && x >= 1 && x <= 4) return { block: AWN };   // shopfront fascia
    return { block: BAND };
  }
  if (t === 22 && y >= 19) {                                    // east bulkhead: solid, glazed on the street-side edge
    if (y === 21) return { block: BAND };
    if (y === 20 && x === 5) return { block: "glass_pane", state: GLASS_NS };
    return { block: BODY };
  }
  if (y === 19) return edge ? { block: BODY } : null;           // parapet
  if (y >= 19) return null;

  const lit = (x, s) => (front || back) && (x + s) % 3 === 0 && row === 1;
  const lamp = (x, s) => (s % 2 === 0 ? { block: "glowstone" } : { block: "lantern", state: { hanging: "false" } });

  if (s === 0) {                                                // shopfront
    if (front) {
      if (x === 0 || x === 5) return { block: BASE };
      if (x === 2) return { block: "dark_oak_door", state: DOOR(row === 1 ? "lower" : "upper") };
      return { block: "glass" };
    }
    if (edge) return { block: BASE };
    if (z === 23 && row === 1 && (x === 1 || x === 4)) return lamp(x, 0);
    return null;
  }

  if (edge) {                                                   // upper storeys
    if (front || back) {
      if (x === 0 || x === 5) return { block: BODY };
      return { block: "glass_pane", state: GLASS_EW };
    }
    if (z % 5 === 0) return { block: BODY };                    // side-wall piers
    return { block: "glass_pane", state: GLASS_NS };
  }
  if ((z === 23 || z === 1) && lit(x, s)) return lamp(x, s);     // lamps behind some windows
  return null;
}

const g = new Voxels([W, H, D]);
for (const [x, z, ground] of cells) {                          // the footprint is not a full rectangle: only its cells
  const t = topOf(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);       // foundation under any slope
  // A cell beside a notch in the footprint is the notch's back wall: solid, so no hole opens into the building.
  const notch = x > 0 && x < 5 && z > 0 && z < 24 && exposed(x, z);
  for (let y = 0; y < t; y++) {
    if (notch) { if (y % 3 === 0 && y <= 18) g.set(x, y, z, y === 0 ? BASE : BAND); else if (y < 19) g.set(x, y, z, BODY); continue; }
    const b = block(x, y, z, t, exposed(x, z));
    if (b) g.set(x, y, z, b.block, b.state);
  }
}
console.log(g.save(`${DIR}/NYC1034247.nbt`));
