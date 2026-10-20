import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Five-storey Xinyi-district commercial/office block (1980s–90s Taipei):
// light tiled-concrete piers, blue-glass ribbon windows, stone plinth with
// shopfront, cornice and parapet, rooftop plant box and lightning rod.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011410";
const W = 26, H = 38, D = 13;
const ROOF_Y = 25;      // roof slab; roof surface at 26
const PARAPET_TOP = 27;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// footprint: "x,z" -> ground (blocks above y 0)
const fp = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  fp.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gr))));
}

const inF = (x, z) => fp.has(`${x},${z}`);
const gAt = (x, z) => fp.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missing = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const isPerim = (x, z) => missing(x, z).length > 0;

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!inF(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const cellsList = [...fp.keys()].map((k) => k.split(",").map(Number));

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z] of cellsList) {
  const gr = gAt(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Interior structure: ground slab, storey slabs, roof slab across the whole footprint.
for (const [x, z] of cellsList) {
  put(x, 0, z, "stone_bricks");
  for (const y of [5, 10, 15, 20]) put(x, y, z, "light_gray_concrete");
  put(x, ROOF_Y, z, "light_gray_concrete");
}

// Facade block for a perimeter cell at height y.
// u = position along the face; face = "z" (long sides) or "x" (short sides).
function facade(u, face, y, gr) {
  const k = Math.floor(y / 5);
  const r = y % 5;

  if (y === ROOF_Y) return ["smooth_stone"];                       // cornice course
  if (y === 26) return ["white_concrete"];                         // parapet
  if (y === PARAPET_TOP) return ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }];

  if (k === 0) {
    if (y === 0) return ["polished_andesite"];                     // base course
    if (r === 4) return ["stone_bricks"];                          // shopfront lintel / canopy edge
    const entrance = face === "z" && (u === 12 || u === 13);
    if (entrance) return ["light_blue_stained_glass"];             // glazed entrance
    if (u % 3 === 0) return ["smooth_quartz"];                     // shopfront piers
    return ["light_blue_stained_glass"];                           // shop glazing
  }

  if (r === 0 || r === 4) return ["light_gray_concrete"];          // storey lines / spandrels
  if (u % 3 === 0) return ["smooth_quartz"];                       // tiled piers
  return ["light_blue_stained_glass"];                             // ribbon windows
}

// 3. Perimeter walls, cornice, parapet, shopfront.
const perimCells = cellsList.filter(([x, z]) => isPerim(x, z));
for (const [x, z] of perimCells) {
  const gr = gAt(x, z);
  const m = missing(x, z);
  const face = m.some(([, dz]) => dz !== 0) ? "z" : "x";
  const u = face === "z" ? x : z;
  for (let y = gr; y <= PARAPET_TOP; y++) {
    const [id, props] = facade(u, face, y, gr);
    put(x, y, z, id, props);
  }
}

// 4. Warm lights behind selected upper windows and at the entrance.
const inward = (x, z) => {
  const m = missing(x, z);
  if (m.length === 0) return null;
  const [dx, dz] = m[0];
  return [x - dx, z - dz];
};

for (const [x, z] of perimCells) {
  const gr = gAt(x, z);
  const m = missing(x, z);
  const face = m.some(([, dz]) => dz !== 0) ? "z" : "x";
  const u = face === "z" ? x : z;
  const inw = inward(x, z);
  if (!inw || !inF(inw[0], inw[1])) continue;
  const [ix, iz] = inw;

  // Entrance: glowstone on the ground floor just inside the doors.
  if (face === "z" && (u === 12 || u === 13) && 1 >= gr) {
    put(ix, 1, iz, "glowstone");
  }

  // Upper floors: some windows lit from within.
  for (let k = 1; k <= 4; k++) {
    const y = 5 * k + 2;
    if (y < gr) continue;
    if (u % 3 === 0) continue;
    if ((u + 2 * k) % 5 === 1) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// 5. Rooftop plant box and lightning rod on the roof, centred on the footprint.
const plant = { x0: 9, x1: 16, z0: 4, z1: 8 };
let plantOk = true;
for (let x = plant.x0; x <= plant.x1; x++)
  for (let z = plant.z0; z <= plant.z1; z++)
    if (!inF(x, z)) plantOk = false;

if (plantOk) {
  for (let x = plant.x0; x <= plant.x1; x++) {
    for (let z = plant.z0; z <= plant.z1; z++) {
      for (let y = 26; y <= 28; y++) {
        const edge = x === plant.x0 || x === plant.x1 || z === plant.z0 || z === plant.z1;
        // Glass band on the plant's outer faces at mid height; concrete elsewhere.
        if (edge && y === 27 && (x + z) % 2 === 0) put(x, y, z, "light_blue_stained_glass");
        else put(x, y, z, "light_gray_concrete");
      }
      put(x, 29, z, "smooth_stone");
    }
  }
  put(12, 30, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(12, 31, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
