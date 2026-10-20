import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// No record for this building, so it is read as a 1980s Xinyi-district low-rise:
// two storeys of reinforced concrete with pale cladding, a shopfront ground floor,
// window bays on a 3-cell rhythm, a cornice and a plain parapet, and a small plant box on the roof.
// Roof = lowest ground + 11 (2 storeys x 5 blocks + parapet course).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343674";
const W = 19, H = 23, D = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const xmin = Math.min(...cells.map((c) => c[0]));
const xmax = Math.max(...cells.map((c) => c[0]));
const zmin = Math.min(...cells.map((c) => c[1]));
const zmax = Math.max(...cells.map((c) => c[1]));
const cx = (xmin + xmax) / 2;
const cz = (zmin + zmax) / 2;

// bounds-checked setter
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const isPerimeter = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: on the north (z min) face, nearest to the middle of the face
const northCells = cells.filter(([x, z]) => !has(x, z - 1));
const midX = (xmin + xmax) / 2;
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of northCells) {
    const d = Math.abs(x - midX);
    if (d < best) { best = d; entrance = key(x, z); }
  }
}

const DOOR_LOWER = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [x, z, F] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < F; y++) put(x, y, z, "stone");

  const perim = isPerimeter(x, z);
  const cornerCell = (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
  const alongX = !has(x, z - 1) || !has(x, z + 1); // on a north/south face, index runs along x
  const idx = alongX ? x - xmin : z - zmin;
  const pier = cornerCell || idx % 3 === 0;
  const isEntrance = key(x, z) === entrance;

  if (perim) {
    // Base course
    put(x, F, z, "polished_granite");

    // Ground storey
    if (isEntrance) {
      put(x, F, z, "dark_oak_door", DOOR_LOWER);
      put(x, F + 1, z, "dark_oak_door", DOOR_UPPER);
      put(x, F + 2, z, "glass_pane");
      put(x, F + 3, z, "glass_pane");
    } else {
      for (let dy = 1; dy <= 3; dy++) {
        put(x, F + dy, z, pier ? "smooth_quartz" : "glass_pane");
      }
    }

    // Cornice above the shopfronts, spandrel, upper storey
    put(x, F + 4, z, "light_gray_concrete");
    put(x, F + 5, z, "white_concrete");
    for (let dy = 6; dy <= 8; dy++) {
      put(x, F + dy, z, pier ? "smooth_quartz" : "glass_pane");
    }
    put(x, F + 9, z, "light_gray_concrete");
    put(x, F + 10, z, "smooth_quartz"); // parapet, top surface at F + 11

    // Warm light behind some upper windows
    if (!pier && idx % 2 === 1) {
      const inward = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].find(
        ([nx, nz]) => has(nx, nz) && !isPerimeter(nx, nz)
      );
      if (inward) put(inward[0], F + 7, inward[1], "glowstone");
    }
  } else {
    // Interior: floor slab at the storey line, roof slab at the top
    put(x, F + 5, z, "smooth_stone");
    put(x, F + 10, z, "light_gray_concrete");

    // Rooftop plant box, centred
    if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 3) {
      put(x, F + 11, z, "light_gray_concrete");
      put(x, F + 12, z, "smooth_quartz");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
