// Mt Eden / Eden Terrace: a two-storey Edwardian brick shop with a plastered string course, cornice and parapet.
// Footprint from way_1095572181.cells.json (7 x 11, ground 0 everywhere, lidar roof 10 blocks above y 0).
// Front = the north (-z) face: shopfront with a dark-timber fascia and a door; other faces are brick with sash windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_1095572181.cells.json`, "utf8"));

const fp = new Map();                                    // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof });
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));

// one storey line per 4 blocks: floor slabs at y 0 and 4, cornice at y 8, parapet to y 9 (roof 10)
const ROOF = Math.max(...cells.map((c) => c[3]));        // 10
const TOP = ROOF - 1;                                    // highest block the massing uses
const g = new Voxels([7, 23, 11]);

const WINDOW_LIGHT = new Set();                          // cells (y=5) whose glass has a lamp behind it
const glass = new Set();                                 // "x,y,z" of glass panes, for connections
const SHOP = (x, z) => exposed(x, z).includes("n");
const DOOR = [4, 0];

for (const [x, z, ground] of cells) {
  const ex = exposed(x, z), perim = ex.length > 0;
  // no quoins: the wedge's stepped edges are mostly corners, so a quoin column on each would read as a cream block
  const corner = false;
  // ground: plinth on the walls, floor slab across the whole footprint
  g.set(x, ground, z, perim ? "stone_bricks" : "smooth_stone");
  if (!perim) { // interior: floor slab at y 4 (string course at the edge), roof deck at y 8, air between
    g.set(x, 4, z, "smooth_stone");
    g.set(x, 8, z, "smooth_stone");
    continue;
  }
  const u = ex.includes("n") || ex.includes("s") ? x : z;   // position along the face
  const front = SHOP(x, z);
  // storey walls: y 1-3 ground, y 5-7 upper; the string course y 4 and cornice y 8 run round the whole perimeter
  g.set(x, 4, z, "smooth_quartz");
  g.set(x, 8, z, "smooth_quartz");
  g.set(x, 9, z, "bricks");   // parapet
  for (const y of [1, 2, 3, 5, 6, 7]) {
    g.set(x, y, z, "bricks");
  }
  // shopfront and fascia on the north face; sash windows on the other faces (odd bays), quartz lintels
  if (front) {
    g.set(x, 3, z, "dark_oak_planks");
    if (x === DOOR[0] && z === DOOR[1]) {
      g.set(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      for (const y of [1, 2]) { g.set(x, y, z, "glass_pane"); glass.add(`${x},${y},${z}`); }
    }
  } else if (!corner && u % 2 === 1) {
    for (const y of [5, 6]) { g.set(x, y, z, "glass_pane"); glass.add(`${x},${y},${z}`); }
    g.set(x, 7, z, "smooth_quartz");
    g.set(x, 3, z, "smooth_quartz");
    for (const y of [1, 2]) { g.set(x, y, z, "glass_pane"); glass.add(`${x},${y},${z}`); }
    WINDOW_LIGHT.add(`${x},${z}`);
  }
}

// the parapet's roof deck is the y 8 course; a plant box on the roof, and a warm lamp behind a few upper windows
const inner = cells.filter(([x, z]) => exposed(x, z).length === 0).map(([x, z]) => [x, z]);
if (inner.length) g.set(inner[0][0], 9, inner[0][1], "iron_block");
for (const [x, z] of inner) {
  const lit = Object.values(DIRS).some(([dx, dz]) => WINDOW_LIGHT.has(`${x + dx},${z + dz}`));
  if (lit) g.set(x, 5, z, "shroomlight");
}

// pane connections: a pane joins the solid or pane neighbour along its wall plane
for (const key of glass) {
  const [x, y, z] = key.split(",").map(Number);
  const side = (dx, dz) => { const n = g.get(x + dx, y, z + dz); return !!n && n.block !== "minecraft:air"; };
  const st = { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0) };
  const pane = Object.fromEntries(Object.entries(st).map(([k, v]) => [k, v ? "true" : "false"]));
  g.set(x, y, z, "glass_pane", pane);
}

const { blocks, palette } = g.save(`${HERE}/way_1095572181.nbt`);
console.log(`saved ${blocks} blocks, palette ${palette}`);
