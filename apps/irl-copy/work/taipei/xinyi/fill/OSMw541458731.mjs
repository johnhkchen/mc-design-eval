import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-90s Xinyi shophouse: two storeys over a shopfront, white tiled
// walls, pale quartz frames, dark-oak entrance, glass windows with warm lights,
// flat roof with parapet and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458731";
const W = 16, H = 23, D = 39;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let minG = Infinity;
for (const [x, z, gy] of cells) {
  const b = Math.round(gy);
  ground.set(`${x},${z}`, b);
  if (b < minG) minG = b;
}
const inF = (x, z) => ground.has(`${x},${z}`);
const baseOf = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Absolute storey lines, shared by every cell so the roof is flat.
const F1 = minG;          // ground floor slab
const F2 = minG + 5;      // second floor slab / string course
const ROOF = minG + 10;   // roof slab / cornice
const PAR = minG + 11;    // parapet top (~11 blocks above lowest ground)

// Perimeter: a footprint cell with at least one neighbour outside the footprint.
const outward = { w: [-1, 0], e: [1, 0], n: [0, -1], s: [0, 1] };
const faceDir = { w: "west", e: "east", n: "north", s: "south" };
const perimeter = new Set();
const facesOf = new Map();
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const faces = [];
  if (!inF(x - 1, z)) faces.push("w");
  if (!inF(x + 1, z)) faces.push("e");
  if (!inF(x, z - 1)) faces.push("n");
  if (!inF(x, z + 1)) faces.push("s");
  facesOf.set(`${x},${z}`, faces);
  if (faces.length) perimeter.add(`${x},${z}`);
}

function facadeAt(face, idx, y, x, z) {
  const along = face === "w" || face === "e" ? D : W;
  const mid = Math.floor(along / 2);
  const pillar = idx === 0 || idx === along - 1 || idx % 3 === 0;

  if (y === PAR || y === ROOF || y === F2) return ["smooth_quartz"];

  if (y >= F1 && y <= F1 + 4) {          // ground-floor shopfront
    if (y === F1 + 4) return ["smooth_quartz"];   // fascia lintel
    if (pillar) return ["smooth_quartz"];
    if (idx === mid) {                             // recessed entrance
      if (y === F1) return ["dark_oak_door", { facing: faceDir[face], half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === F1 + 1) return ["dark_oak_door", { facing: faceDir[face], half: "upper", hinge: "left", open: "false", powered: "false" }];
      return ["smooth_quartz"];
    }
    return ["light_blue_stained_glass"];
  }

  if (y === F2 + 1 || y === F2 + 4) return ["white_concrete"]; // spandrels
  if (pillar) return ["smooth_quartz"];                         // window mullions
  return ["light_blue_stained_glass"];
}

const lights = [];

// Pass 1: foundation, floors, walls, roof.
for (const [key, B] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation up to this cell's ground.
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at storey lines (only where above ground).
  for (const y of [F1, F2]) if (y >= B) put(x, y, z, "smooth_stone");
  if (ROOF >= B) put(x, ROOF, z, "gray_concrete");

  if (!perimeter.has(key)) continue;

  const faces = facesOf.get(key);
  const corner = faces.length > 1;

  for (let y = B; y <= PAR; y++) {
    if (corner) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    const face = faces[0];
    const idx = face === "w" || face === "e" ? z : x;
    const [id, props] = facadeAt(face, idx, y, x, z);
    put(x, y, z, id, props);

    // Mark glass cells that may carry a warm light behind them.
    if (id === "light_blue_stained_glass" && y !== F1 + 3 && ((idx * 5 + y * 7) % 4 === 0)) {
      const [ox, oz] = outward[face];
      lights.push({ x, y, z, ox, oz, B });
    }
  }
}

// Pass 2: glowstone just inside some lit windows (air gap behind the glass).
for (const { x, y, z, ox, oz } of lights) {
  const ix = x - ox, iz = z - oz;
  const innerKey = `${ix},${iz}`;
  if (!inF(ix, iz) || perimeter.has(innerKey)) continue;
  if (y < baseOf(ix, iz)) continue;
  put(ix, y, iz, "glowstone");
}

// Pass 3: rooftop plant on the roof slab, inside the parapet.
const plant = [
  [3, 6, 10, 14, 2],   // air handling units
  [9, 11, 22, 25, 1],  // small plant box
];
for (const [x0, x1, z0, z1, h] of plant) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!inF(x, z) || perimeter.has(`${x},${z}`)) continue;
      for (let k = 0; k < h; k++) put(x, PAR + k, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
