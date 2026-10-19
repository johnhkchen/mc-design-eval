// DC62442: Commercial-Office-Large at 500 C St SW, DC 20024, as a 1.21.1 module.
// Read as a 1960s-70s Southwest office block: a brick-and-Portland-stone commercial slab with a central tower.
// Lidar roof heights are 3x3 median smoothed and snapped to three tiers: 12 (a three-storey wing with a cornice
// and parapet), 14 (an attic band over the ring), 15 (the tower, one storey above the ring, with roof plant).
// Storeys are 4 rows: a floor line (quartz), two window rows (glass panes in piers and bays), a spandrel (brick).
// Every cell is solid from y 0 up to its tier; the window rows are air behind the glass, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62442.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62442.nbt";

const key = (x, z) => `${x},${z}`;
const RAW = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];          // N, E, S, W

// Smoothed roof (3x3 median over the footprint), then snapped to the three tiers.
const tier = (r) => (r >= 15 ? 15 : r >= 13 ? 14 : 12);
const C = new Map();
for (const c of RAW.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = RAW.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  C.set(key(c.x, c.z), { x: c.x, z: c.z, H: tier(vals[vals.length >> 1]) });
}
const cellAt = (x, z) => C.get(key(x, z));

// Exposed faces of a cell at height y: a neighbour that is absent or lower than y leaves that side open.
const exposures = (c, y) => DIRS.filter(([dx, dz]) => { const n = cellAt(c.x + dx, c.z + dz); return !n || n.H <= y; });

const g = new Voxels([24, 27, 45]);
const PANE = (dz) => (dz !== 0
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Facade block for an exposed face: plinth, shopfront and door at grade, then piers, floor lines, spandrels, glass.
function facade(c, y, E) {
  if (y === 0) return ["stone_bricks"];                       // plinth
  if (y === c.H - 1 || E.length > 1) return ["smooth_quartz"]; // cornice / corner pier
  const [dx, dz] = E[0];
  const along = dz !== 0 ? c.x : c.z;                         // a z-facing wall runs along x
  const m = y % 4;
  if (y < 4) {                                                 // ground storey
    if (m === 3) return ["smooth_quartz"];                     // fascia over the shopfront and entrance
    if (c.z === 0 && dz === -1 && (along === 4 || along === 5)) {  // double entrance, north face
      const hinge = along === 4 ? "left" : "right";
      return ["dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge, open: "false", powered: "false" }];
    }
    if (y === 2 && c.z === 0 && dz === -1 && (along === 1 || along === 7)) {
      return ["lantern", { hanging: "true", waterlogged: "false" }];
    }
    if (along % 3 === 0) return ["smooth_quartz"];            // pier
    return ["light_blue_stained_glass"];                      // shop glass
  }
  if (m === 0) return ["smooth_quartz"];                      // floor line
  if (m === 3) return ["bricks"];                             // spandrel
  if (along % 3 === 0) return ["smooth_quartz"];              // pier
  return ["light_blue_stained_glass_pane", PANE(dz)];         // window
}

const windowRow = (y) => y >= 4 && (y % 4 === 1 || y % 4 === 2);
const behind = [];
for (const c of C.values()) {
  for (let y = 0; y < c.H; y++) {
    const E = exposures(c, y);
    if (E.length) {
      const [b, s] = facade(c, y, E);
      g.set(c.x, y, c.z, b, s);
      if (windowRow(y) && E.length === 1 && y !== c.H - 1) {
        // Warm light behind about one window in four, on the interior cell just inside the glass.
        const [dx, dz] = E[0];
        const along = dz !== 0 ? c.x : c.z;
        if ((along + y) % 4 === 1) behind.push([c.x - dx, y, c.z - dz]);
      }
    } else if (y === c.H - 1) {
      g.set(c.x, y, c.z, "stone");                            // roof membrane
    } else if (!(y % 4 === 1 || y % 4 === 2)) {
      g.set(c.x, y, c.z, "stone");                            // floor slabs and the solid core
    }                                                          // else: air behind the glass
  }
}

// Glowstone behind the glass, only where the cell really is interior (no open side at that height).
for (const [x, y, z] of behind) {
  const c = cellAt(x, z);
  if (c && y < c.H - 1 && exposures(c, y).length === 0) g.set(x, y, z, "glowstone");
}

// Parapets on the true outer edge of each tier, and a few units of roof plant.
for (const c of C.values()) {
  const outer = DIRS.some(([dx, dz]) => !cellAt(c.x + dx, c.z + dz));
  if (outer) g.set(c.x, c.H, c.z, "bricks");
  const open = exposures(c, c.H - 1).length > 0;
  if (c.H === 12 && !open && (c.x * 5 + c.z * 7) % 13 === 0) g.set(c.x, c.H, c.z, "oxidized_copper");
  if (c.H === 15 && !open && (c.x * 3 + c.z * 5) % 7 === 0) g.set(c.x, c.H, c.z, "oxidized_copper");
}

console.log(g.save(OUT));
