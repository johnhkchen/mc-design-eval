import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE93-0413-8F";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 27, H = 29, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y (rounded)
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);
const groundOf = (x, z) => G.get(`${x},${z}`);
const maxG = Math.max(...G.values());

// Roof at about 17 above lowest ground, clamped inside the 29-high volume
const R = Math.min(22, Math.max(17, maxG + 12));

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance bay on the z=0 face: door at x=13, glass vestibule x=12..14
const ENTRY_X = 13;
const inEntry = (x, z) => z === 0 && x >= ENTRY_X - 1 && x <= ENTRY_X + 1;

for (const [x, z] of cells) {
  const gr = groundOf(x, z);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone");

  const edge = isEdge(x, z);

  // Roof slab on every footprint cell; parapet on the perimeter
  put(x, R, z, "light_gray_concrete");
  if (edge) put(x, R + 1, z, "smooth_quartz");

  for (let y = gr + 1; y <= R - 1; y++) {
    const rel = y - gr - 1;
    const s = Math.floor(rel / 5);   // storey index, 0 = ground floor
    const r = rel % 5;               // row within storey

    if (!edge) {
      // Interior: floor slab per storey, air elsewhere, warm lights behind some windows
      if (r === 0) {
        put(x, y, z, "white_concrete");
      } else if (r === 2 && s >= 1 && x % 4 === 2 && (z === 1 || z === D - 2)) {
        put(x, y, z, "shroomlight");
      } else if (r === 2 && s === 0 && z === 1 && x === ENTRY_X) {
        put(x, y, z, "shroomlight");   // light spilling through the entrance
      }
      continue;
    }

    // Facade
    if (r === 0) {
      // Base/floor band: dark granite at grade, stone above
      put(x, y, z, s === 0 ? "polished_granite" : "polished_andesite");
      continue;
    }
    if (r === 4) {
      // Spandrel band between storeys: warm stone for texture against the glass
      put(x, y, z, "smooth_sandstone");
      continue;
    }

    if (s === 0 && r === 3) {
      put(x, y, z, "smooth_quartz");   // shopfront lintel
      continue;
    }

    // Entrance vestibule: glass between piers, door placed later
    if (s === 0 && inEntry(x, z)) {
      if (x === ENTRY_X - 1 || x === ENTRY_X + 1) {
        put(x, y, z, "smooth_quartz");   // entrance piers
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
      continue;
    }

    // Glass bays with full-height quartz pilasters on every third bay line
    const pilaster = (x + z) % 3 === 0;
    put(x, y, z, pilaster ? "smooth_quartz" : "light_blue_stained_glass");
  }

  // Pilaster capitals just under the parapet
  if (edge && (x + z) % 3 === 0) put(x, R, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance door, lower and upper halves, on the z=0 face
if (has(ENTRY_X, 0)) {
  const gr = groundOf(ENTRY_X, 0);
  put(ENTRY_X, gr + 2, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(ENTRY_X, gr + 3, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Roof penthouse and mechanical screen, sitting on the roof slab
for (let x = 8; x <= 18; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!has(x, z)) continue;
    put(x, R + 1, z, "gray_concrete");
    put(x, R + 2, z, "gray_concrete");
  }
}
for (let x = 12; x <= 14; x++) {
  for (let z = 7; z <= 9; z++) {
    if (!has(x, z)) continue;
    put(x, R + 3, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
