import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738194";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, D = 22, H = 33;
const ROOF_Y = 20;   // roof slab
const PARAPET_Y = 21; // cornice / parapet course
const STOREY = 5;    // blocks per storey
const FLOORS = 4;    // 4 storeys: floor lines at y = 0,5,10,15

// ---- footprint lookup ----
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let gmin = Infinity;
for (const [x, z, g] of cells) {
  ground.set(key(x, z), g);
  if (g < gmin) gmin = g;
}
const has = (x, z) => ground.has(key(x, z));
const groundRel = (x, z) => ground.get(key(x, z)) - gmin;
const isPerim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Exterior faces: ew = wall runs along x (north/south face exposed),
// ns = wall runs along z (east/west face exposed).
const runsEW = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const runsNS = (x, z) => !has(x - 1, z) || !has(x + 1, z);

// Front = +z side, entrance centred on x = 11.
const ENTRY_X = Math.floor(W / 2);
let entryZ = -1;
for (const [x, z] of cells) {
  if (x === ENTRY_X && z > entryZ) entryZ = z;
}
const isEntry = (x, z) => x === ENTRY_X && z === entryZ;

// Interior neighbour (toward footprint centre) for lantern placement.
const cx = (W - 1) / 2, cz = (D - 1) / 2;
function inward(x, z) {
  const ox = cx - x, oz = cz - z;
  if (Math.abs(ox) >= Math.abs(oz)) return [x + Math.sign(ox), z];
  return [x, z + Math.sign(oz)];
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- per-cell construction ----
for (const [x, z, gr] of cells) {
  const G = gr - gmin;
  const per = isPerim(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  if (G > PARAPET_Y) continue;

  // Roof slab over every footprint cell.
  if (G <= ROOF_Y) put(x, ROOF_Y, z, "smooth_stone");

  // Roof equipment: a penthouse block on the interior roof.
  if (!per && x >= 8 && x <= 14 && z >= 7 && z <= 14 && G <= ROOF_Y) {
    put(x, 21, z, "light_gray_concrete");
    put(x, 22, z, "light_gray_concrete");
    if (x >= 10 && x <= 12 && z >= 9 && z <= 12) {
      put(x, 23, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }

  // Interior cells: only a floor slab per storey (no fit-out).
  if (!per) {
    for (let k = 0; k < FLOORS; k++) {
      const fy = k * STOREY;
      if (fy >= G && fy <= ROOF_Y) put(x, fy, z, "smooth_stone");
    }
    continue;
  }

  // Perimeter: cornice course.
  if (G <= PARAPET_Y) {
    put(x, PARAPET_Y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  const ew = runsEW(x, z);
  const ns = runsNS(x, z);
  const corner = ew && ns;
  const along = ew ? x : z;
  const pillar = corner || along % 3 === 0;

  // Entrance: door, wall above, canopy slab.
  if (isEntry(x, z)) {
    put(x, G, z, "oak_door", {
      facing: "south", half: "lower", hinge: "left",
      open: "false", powered: "false",
    });
    put(x, G + 1, z, "oak_door", {
      facing: "south", half: "upper", hinge: "left",
      open: "false", powered: "false",
    });
    put(x, G + 2, z, "smooth_quartz");
    put(x, G + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }

  for (let y = G; y < PARAPET_Y; y++) {
    if (y === ROOF_Y) continue; // already placed as roof slab
    if (isEntry(x, z) && y >= G && y <= G + 3) continue; // entrance handled above
    const k = Math.floor(y / STOREY);
    const r = y % STOREY;

    if (r === 0) {
      // Storey line: base course on ground floor, band otherwise.
      put(x, y, z, k === 0 ? "polished_granite" : "smooth_stone");
      continue;
    }
    if (r === 4) {
      // Spandrel below the next storey line.
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Window rows r = 1..3.
    if (pillar) {
      put(x, y, z, k === 0 ? "white_concrete" : "smooth_quartz");
      continue;
    }
    if (k === 0) {
      // Shopfront glazing on the ground storey.
      put(x, y, z, "light_blue_stained_glass");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", {
        east: ew ? "true" : "false",
        west: ew ? "true" : "false",
        north: ns ? "true" : "false",
        south: ns ? "true" : "false",
        waterlogged: "false",
      });
    }

    // Warm lights just inside some windows (interior air cell).
    if (r === 2 && (x + z + k) % 3 === 0) {
      const [ix, iz] = inward(x, z);
      if (has(ix, iz) && !isPerim(ix, iz) && groundRel(ix, iz) <= y) {
        put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
