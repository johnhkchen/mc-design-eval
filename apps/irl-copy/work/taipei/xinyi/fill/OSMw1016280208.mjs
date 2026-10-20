import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise commercial/residential block, roughly 1980s-1990s Taipei: four storeys
// of 5 blocks, quartz-clad facade on a stone base, flat roof with parapet and
// a centred mechanical penthouse. Walls rise from each cell's own ground to a
// common roof line at y 20, so downhill sides show their extra storeys.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280208";
const W = 21, H = 33, D = 18;
const ROOF = 20;      // roof slab top level
const TOP = 22;       // parapet cap

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.round(gy)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: on the north (min z) face, nearest the middle of the frontage.
let door = null;
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (has(x, z - 1)) continue;
  if (!isPerim(x, z)) continue;
  if (!door || Math.abs(x - 10) < Math.abs(door.x - 10)) door = { x, z };
}

const g = new Voxels([W, H, D]);

for (const [key, gc] of ground) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);
  const colPattern = (x + z) % 3 === 0;   // pilaster / mullion column
  const isDoorCell = door && door.x === x && door.z === z;

  for (let y = 0; y < H; y++) {
    // Foundation: solid from y 0 up to this cell's ground.
    if (y < gc) { g.set(x, y, z, "stone_bricks"); continue; }

    // Roof and above.
    if (y > ROOF) {
      if (!perim) {
        // Mechanical penthouse, centred on the roof.
        const inPH = x >= 5 && x <= 15 && z >= 4 && z <= 13;
        if (inPH && y <= 23) {
          if (y === 23) g.set(x, y, z, "smooth_stone_slab", { type: "bottom" });
          else if (y === 22 && x % 3 === 0) g.set(x, y, z, "iron_bars");
          else g.set(x, y, z, "light_gray_concrete");
        }
        if (inPH && x === 10 && z === 8 && y === 24) {
          g.set(x, y, z, "lantern", { hanging: "false" });
        }
      } else if (y <= 21) {
        g.set(x, y, z, "smooth_quartz");
      } else if (y === TOP) {
        g.set(x, y, z, "smooth_stone_slab", { type: "bottom" });
      }
      continue;
    }

    if (y === ROOF) {
      g.set(x, y, z, perim ? "smooth_stone" : "smooth_stone");
      continue;
    }

    // Storey lines: every 5 blocks, full slab (floor) on every cell.
    const r = y % 5;
    const s = Math.floor(y / 5);

    if (!perim) {
      // Interior: floor slabs only, air otherwise; warm lights behind the glass ring.
      if (r === 0) g.set(x, y, z, "smooth_stone");
      else if (r === 2 && ((x * 5 + z * 3 + s * 7) % 6 === 0)) g.set(x, y, z, "glowstone");
      continue;
    }

    // Perimeter facade.
    if (r === 0) { g.set(x, y, z, "smooth_stone"); continue; }

    if (s === 0) {
      // Ground-floor shopfront: stone plinth, glass, pilasters, lintel.
      if (isDoorCell && y === gc) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (isDoorCell && y === gc + 1) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (r === 4) { g.set(x, y, z, "smooth_quartz"); continue; }
      if (r === 1) { g.set(x, y, z, "stone_bricks"); continue; }
      if (colPattern) { g.set(x, y, z, "stone_bricks"); continue; }
      g.set(x, y, z, "glass");
      continue;
    }

    // Upper storeys: window grid with sills, glass, mullions, transoms.
    if (r === 4) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (colPattern) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (r === 1) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, "glass");
  }

  // Parapet and cap on perimeter cells above the roof slab.
  if (perim) {
    g.set(x, 21, z, "smooth_quartz");
    g.set(x, 22, z, "smooth_stone_slab", { type: "bottom" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
