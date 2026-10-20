import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded building, 26 x 32 footprint, roof ~11 blocks above lowest ground.
// Read as a 1990s Xinyi commercial block: two storeys of 5 blocks, a stone plinth,
// cream quartz piers, tinted glass bays, a light-grey storey line and a plain parapet.
// Ground floor is a shopfront with a dark-oak entrance; a few upper windows are lit.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414359";
const W = 26, D = 32, H = 23;
const ROOF_Y = 10; // top of parapet layer; roof sits about 11 above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

// Build only on footprint cells, and never below a cell's own ground except foundations.
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (y < gAt(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces of a perimeter cell.
function facesOf(x, z) {
  const f = [];
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  return f;
}

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs, ground floor, storey line and roof deck on every footprint cell.
for (const [x, z, gy] of cells) {
  put(x, gy, z, "polished_andesite");          // ground floor
  put(x, 5, z, "light_gray_concrete");         // first floor / storey line
  put(x, ROOF_Y, z, "gray_concrete");          // roof deck
}

// Facade material by level. Piers and windows alternate in bays of 3.
function facadeId(y, gy, pier) {
  if (y === gy) return "smooth_stone";          // base course / plinth
  if (y === 4) return "smooth_quartz";          // ground-storey lintel
  if (y === 5) return "light_gray_concrete";    // storey line
  if (y === 9) return "light_gray_concrete";    // upper spandrel
  if (y === ROOF_Y) return "smooth_stone";      // parapet cap
  if (pier) return "smooth_quartz";
  return "light_blue_stained_glass";
}

// 3. Perimeter walls, windows and lit rooms behind some glass.
const INWARD = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };

for (const [x, z, gy] of cells) {
  const faces = facesOf(x, z);
  if (faces.length === 0) continue;
  const face = faces[0];
  const alongX = face === "N" || face === "S";
  const idx = alongX ? x : z;
  const lim = alongX ? W - 1 : D - 1;
  const pier = idx === 0 || idx === lim || idx % 3 === 0;

  for (let y = gy; y <= ROOF_Y; y++) {
    const id = facadeId(y, gy, pier);
    put(x, y, z, id);

    // Warm light in some upper or ground windows, glowstone one bay behind the glass.
    if (id === "light_blue_stained_glass" && (y === 2 || y === 7) && ((x * 5 + z * 7) % 6 === 0)) {
      const [dx, dz] = INWARD[face];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && y >= gAt(ix, iz)) g.set(ix, y, iz, "glowstone");
    }
  }
}

// 4. Roof equipment: a plant box with a smaller cooling unit on top, kept on footprint cells.
for (let x = 9; x <= 16; x++) {
  for (let z = 11; z <= 20; z++) {
    put(x, ROOF_Y + 1, z, "light_gray_concrete");
    if (x >= 11 && x <= 14 && z >= 14 && z <= 17) put(x, ROOF_Y + 2, z, "white_concrete");
  }
}

// 5. Entrance on the south face, as near the centre as possible, with a glazed header and warm lobby light.
const doorCands = cells
  .filter(([x, z, gy]) => !has(x, z + 1) && gy <= 2)
  .sort((a, b) => Math.abs(a[0] - Math.floor(W / 2)) - Math.abs(b[0] - Math.floor(W / 2)));

if (doorCands.length > 0) {
  const [dx, dz, dg] = doorCands[0];
  g.set(dx, dg, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, dg + 1, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(dx, dg + 2, dz, "smooth_quartz");       // canopy header over the door
  if (has(dx, dz - 1)) g.set(dx, dg + 1, dz - 1, "glowstone"); // lit lobby behind the door
}

g.save(`${DIR}/${ID}.nbt`);
