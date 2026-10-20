import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341337590";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 19, D = 8;
const ROOF_Y = 6;          // top of the building body (about 7 blocks above lowest ground)
const BAND_Y = 4;          // red terracotta sign band
const CORNICE_Y = 5;       // light stone cornice course
const g = new Voxels([W, H, D]);

// ground per footprint cell, clamped so the body always fits under the roof line
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(5, Math.round(gr))));
}

const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exteriorFaces = (x, z) =>
  Object.keys(DIRS).filter((f) => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });

// Entrance: the south-facing exterior cell nearest the middle of that run
const southCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !has(x, z + 1))
  .sort((a, b) => a[0] - b[0]);
const doorCell = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = exteriorFaces(x, z);
  const exterior = faces.length > 0;

  // foundation fill up to the cell's ground, then floor slab at ground level
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  g.set(x, gr, z, exterior ? "stone_bricks" : "smooth_stone");

  if (!exterior) {
    // interior: air storey above the floor, roof slab closing the body
    g.set(x, ROOF_Y, z, "gray_concrete");
    continue;
  }

  const face = faces.includes("south") ? "south" : faces[0];
  const [dx, dz] = DIRS[face];
  const u = dz !== 0 ? x : z;             // coordinate along the exposed face
  const corner = faces.length >= 2;
  const pier = corner || u % 3 === 0;     // white piers between shopfront glazing

  for (let y = gr + 1; y <= 5; y++) {
    if (y === BAND_Y) g.set(x, y, z, "red_terracotta");
    else if (y === CORNICE_Y) g.set(x, y, z, "light_gray_concrete");
    else g.set(x, y, z, pier ? "white_concrete" : "glass");
  }

  // parapet on the exterior ring
  g.set(x, ROOF_Y, z, "stone_bricks");

  // entrance door with a lit frame on the south facade
  if (doorCell && x === doorCell[0] && z === doorCell[1] && face === "south") {
    g.set(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
    g.set(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
    g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // warm light behind some shopfront glass (interior air cell inside)
  if (!pier && u % 6 === 1) {
    const ix = x - dx, iz = z - dz;
    const yl = gr + 2;
    if (has(ix, iz) && exteriorFaces(ix, iz).length === 0 && yl > ground.get(`${ix},${iz}`)) {
      g.set(ix, yl, iz, "glowstone");
    }
  }
}

// rooftop plant on a couple of interior roof cells
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (exteriorFaces(x, z).length === 0 && (x === 6 || x === 15) && z === 3) {
    g.set(x, ROOF_Y + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
