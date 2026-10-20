import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339999087";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 11 x 24 x 11. Roof at y 11 (cornice band), penthouse to y 14.
const W = 11, H = 24, D = 11;
const TOP = 11;            // last building row under the roof slab
const FLOOR_2 = 5;         // second-storey floor line
const SPAND = 10;          // upper spandrel / cornice band line

const ground = new Map();  // "x,z" -> ground (clamped)
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(Math.max(0, Math.round(gr)), TOP - 1));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Roof slab / cornice at TOP.
  if (edge) put(x, TOP, z, "smooth_quartz");
  else put(x, TOP, z, "light_gray_concrete");

  for (let y = gr; y < TOP; y++) {
    if (!edge) {
      // Interior: floor slabs only, air gap otherwise (no interiors).
      if (y === gr || y === FLOOR_2 || y === SPAND) put(x, y, z, "smooth_stone");
      continue;
    }

    // Exterior wall faces.
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }       // base course
    if (y === SPAND) { put(x, y, z, "white_concrete"); continue; }  // storey line / cornice band
    if (y === FLOOR_2) { put(x, y, z, "white_concrete"); continue; }
    if (y === TOP - 1) { put(x, y, z, "smooth_quartz"); continue; }

    // Mullions every third bay; corners always solid.
    const mullion = isCorner(x, z) || (x + z) % 3 === 0;
    if (mullion) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }

    // Ground floor on the south face (z = D-1): entrance and shopfronts.
    if (y <= gr + 1 && z === D - 1 && x >= 4 && x <= 6) {
      if (x === 5) {
        if (y === gr) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
      continue;
    }

    // Canopy over the entrance.
    if (y === gr + 2 && z >= D - 2 && x >= 4 && x <= 6 && edge) {
      put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Windows: warm glowstone behind glass on some bays, otherwise blue glass.
    const warm = (x * 3 + z * 5 + y) % 7 === 0;
    put(x, y, z, warm ? "glowstone" : "light_blue_stained_glass");
  }
}

// Rooftop mechanical penthouse on the central 3x3, standing on the roof slab at y 11.
for (let x = 4; x <= 6; x++) {
  for (let z = 4; z <= 6; z++) {
    if (!has(x, z)) continue;
    const edge = x === 4 || x === 6 || z === 4 || z === 6;
    for (let y = 12; y <= 13; y++) {
      if (!edge) continue;
      if (y === 12) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "white_concrete");
    }
    if (edge) put(x, 14, z, "smooth_quartz");
    else put(x, 14, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
