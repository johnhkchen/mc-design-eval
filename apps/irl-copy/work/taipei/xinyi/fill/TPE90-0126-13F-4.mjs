import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE90-0126-13F-4";
const W = 52, H = 76, D = 21;

// Footprint: [x, z, ground] per cell
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

function put(x, y, z, id, st) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
}

// Building: 12 storeys of 5 blocks above ground, roof deck at +60,
// parapet and rooftop plant to +63 (64 blocks above lowest ground).
const STOREYS = 12;
const PITCH = 5;
const CX = 26, CZ = 10;

// Entrance: on the north face (z-1 missing), nearest the centre line
let door = null;
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (has(x, z - 1)) continue;
  if (!door || Math.abs(x - CX) < Math.abs(door.x - CX)) door = { x, z };
}
// Cells flanking the door on the same face get quartz pilasters
const pilaster = new Set();
if (door) {
  pilaster.add(`${door.x - 1},${door.z}`);
  pilaster.add(`${door.x + 1},${door.z}`);
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const xFace = !has(x - 1, z) || !has(x + 1, z); // east/west faces
  const zFace = !has(x, z - 1) || !has(x, z + 1); // north/south faces
  const perimeter = xFace || zFace;
  // Mullion piers: on east/west faces every 3rd z-bay, on north/south faces every 3rd x-bay
  const mullion = (xFace && z % 3 === 0) || (zFace && x % 3 === 0);
  const isDoor = door && door.x === x && door.z === z;
  const isPilaster = pilaster.has(`${x},${z}`);

  for (let s = 0; s < STOREYS; s++) {
    const F = gr + PITCH * s;

    // Floor slab per storey (full cell)
    if (perimeter) put(x, F, z, s === 0 ? "stone_bricks" : "white_concrete");
    else put(x, F, z, "light_gray_concrete");

    if (!perimeter) continue;

    if (s === 0) {
      // Shopfront: recessed glazing, stone piers, entrance door with quartz pilasters
      if (isDoor) {
        put(x, F + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, F + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, F + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (isPilaster) {
        for (let k = 1; k <= 3; k++) put(x, F + k, z, "smooth_quartz");
      } else {
        for (let k = 1; k <= 3; k++) {
          put(x, F + k, z, mullion ? "stone_bricks" : "light_blue_stained_glass_pane");
        }
      }
      put(x, F + 4, z, "smooth_quartz");
    } else {
      // Typical storey: tinted glazing set between projecting white piers
      const warm = !mullion && (((x + z + s) % 7) === 0);
      for (let k = 1; k <= 3; k++) {
        if (mullion) put(x, F + k, z, "white_concrete");
        else if (warm && k === 2) put(x, F + k, z, "shroomlight");
        else put(x, F + k, z, "cyan_stained_glass_pane");
      }
      // Storey line: spandrel band in smooth stone, piers capped with quartz
      put(x, F + 4, z, mullion ? "smooth_quartz" : "smooth_stone");
    }
  }

  // Roof deck at +60
  const R = gr + PITCH * STOREYS;
  if (perimeter) {
    put(x, R, z, "polished_andesite");          // cornice
    put(x, R + 1, z, "smooth_quartz");          // cornice band, reads as a projected line
    put(x, R + 2, z, "white_concrete");         // parapet
    put(x, R + 3, z, "smooth_quartz");          // parapet cap
  } else {
    put(x, R, z, "light_gray_concrete");        // roof deck
    // Rooftop plant room, central, on the deck
    if (Math.abs(x - CX) <= 6 && Math.abs(z - CZ) <= 4) {
      for (let k = 1; k <= 2; k++) put(x, R + k, z, "light_gray_concrete");
      put(x, R + 3, z, "iron_bars");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
