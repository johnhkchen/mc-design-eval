import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341031402";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 10, H = 19, D = 4;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height (clamped so the roof and cornice stay inside the volume)
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(gr, H - 10)));
}
const has = (x, z) => ground.has(`${x},${z}`);

// Which outward face an edge cell sits on (z = 0 is the street-facing north front)
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

const FOUNDATION = "stone_bricks";
const BASE = "stone_bricks";
const PIER = "light_gray_concrete";
const SPANDREL = "white_concrete";
const GLASS = "light_blue_stained_glass";
const SHOP_GLASS = "cyan_stained_glass";
const LINTEL = "smooth_quartz";
const PARAPET = "smooth_quartz";
const ROOF = "light_gray_concrete";
const FLOOR = "smooth_stone";

// Pass 1: foundations, walls, floors, roof, parapet
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const face = faceOf(x, z);
  const edge = face !== null;
  const front = face === "N";

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, FOUNDATION);

  // Floor slab between the two storeys (interior only; edges carry the spandrel)
  if (!edge) g.set(x, gr + 4, z, FLOOR);

  // Roof deck at the top of the body, parapet on the edge
  const roofY = gr + 7;
  g.set(x, roofY, z, edge ? PARAPET : ROOF);

  if (!edge) continue;

  // Along-wall index: x for north/south faces, z for east/west faces
  const i = (face === "N" || face === "S") ? x : z;
  const doorCol = front && (i === 4 || i === 5);
  const pier = i % 3 === 0;

  // Base course (ground level), door opening left as air
  if (!doorCol) g.set(x, gr + 1, z, BASE);

  // Shopfront glazing with stone piers, door opening through
  if (!doorCol) {
    g.set(x, gr + 2, z, pier ? BASE : SHOP_GLASS);
  }

  // Lintel / canopy band over the shopfronts and door
  g.set(x, gr + 3, z, LINTEL);

  // Spandrel at the upper floor line
  g.set(x, gr + 4, z, SPANDREL);

  // Upper storey windows with light-grey mullions
  g.set(x, gr + 5, z, pier ? PIER : GLASS);
  g.set(x, gr + 6, z, pier ? PIER : GLASS);
}

// Pass 2: warm light behind some upper windows, and a rooftop mechanical box
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const face = faceOf(x, z);

  // Warm glowstone just inside a few front windows (interior cell at z = 1)
  if (face === "N" && x % 6 === 1 && has(x, 1) && faceOf(x, 1) === null) {
    g.set(x, gr + 5, 1, "glowstone");
  }
}

// Rooftop plant box sitting on the roof slab of one interior cell
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (faceOf(x, z) === null && x === 4 && z === 2) {
    g.set(x, gr + 8, z, "gray_concrete");
    g.set(x + 1, gr + 8, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
