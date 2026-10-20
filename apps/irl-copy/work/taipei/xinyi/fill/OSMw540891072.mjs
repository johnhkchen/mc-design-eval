import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540891072.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540891072.nbt";

const W = 18, H = 23, D = 10;
const CORNICE = 10;   // roof slab / cornice course, top surface at 11
const PARAPET = 11;   // parapet course above the roof

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(CORNICE, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);

// Outward normals: N = -z (street frontage), S = +z, W = -x, E = +x
const NORM = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ORDER = ["N", "S", "W", "E"];

const exposedFaces = (x, z) =>
  ORDER.filter((f) => {
    const [nx, nz] = NORM[f];
    return !has(x + nx, z + nz);
  });

// Per-face extents along the wall, used for window rhythm and door placement
const faceRange = {};
for (const f of ORDER) faceRange[f] = { min: Infinity, max: -Infinity, us: [] };
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  for (const f of exposedFaces(x, z)) {
    const u = f === "N" || f === "S" ? x : z;
    faceRange[f].min = Math.min(faceRange[f].min, u);
    faceRange[f].max = Math.max(faceRange[f].max, u);
    faceRange[f].us.push(u);
  }
}

// Entrance: median x of the street (N) frontage
const nUs = faceRange.N.us.slice().sort((a, b) => a - b);
const doorX = nUs.length ? nUs[Math.floor(nUs.length / 2)] : -1;

const g = new Voxels([W, H, D]);

const isWindowCol = (face, u) => {
  const r = faceRange[face];
  const rel = u - r.min;
  return rel % 3 === 1 && u < r.max;
};

for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const gr = gOf(x, z);
  const faces = exposedFaces(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (faces.length === 0) {
    // Interior: floor slabs only, air behind the glass
    g.set(x, gr, z, "smooth_stone");
    if (gr <= 5) g.set(x, 5, z, "smooth_stone");
    if (gr <= CORNICE) g.set(x, CORNICE, z, "light_gray_concrete");
    continue;
  }

  // Boundary cell: pick the highest-priority exposed face for its facade pattern
  const face = faces[0];
  const u = face === "N" || face === "S" ? x : z;
  const win = isWindowCol(face, u);
  const rel = u - faceRange[face].min;
  const isDoorCell = face === "N" && x === doorX && gr + 1 <= 3;

  for (let y = gr; y <= CORNICE; y++) {
    let b;
    if (y === gr) b = "stone_bricks";                                  // base course
    else if (y <= 3) b = win ? "cyan_stained_glass" : "smooth_stone"; // shopfront
    else if (y === 4) b = face === "N" ? "red_concrete" : "light_gray_concrete"; // fascia
    else if (y === 5) b = "light_gray_concrete";                       // storey line
    else if (y <= 8) b = win ? "light_blue_stained_glass" : "white_concrete";  // upper glazing
    else if (y === 9) b = win ? "light_gray_concrete" : "white_concrete";      // sills
    else b = "light_gray_concrete";                                    // cornice
    g.set(x, y, z, b);
  }

  // Entrance door on the street frontage
  if (isDoorCell) {
    g.set(x, gr, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Warm light behind some upper windows, inside the air gap
  if (win && gr <= 7 && rel % 6 === 1) {
    const [nx, nz] = NORM[face];
    const ix = x - nx, iz = z - nz;
    if (has(ix, iz) && exposedFaces(ix, iz).length === 0) {
      g.set(ix, 7, iz, "shroomlight");
    }
  }

  // Parapet on the outer edge of the roof
  g.set(x, PARAPET, z, "white_concrete");
}

// Roof plant: a small service block on the roof, away from the edges
for (let x = 4; x <= 6; x++) {
  for (let z = 3; z <= 5; z++) {
    if (!has(x, z) || exposedFaces(x, z).length !== 0) continue;
    if (gOf(x, z) > CORNICE) continue;
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "gray_concrete");
  }
}
// Two exhaust stacks on the plant
if (has(5, 4) && exposedFaces(5, 4).length === 0) {
  g.set(5, PARAPET + 2, 4, "iron_block");
}

g.save(OUT);
