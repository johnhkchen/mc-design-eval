import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 翠明樓: a 1960s–70s reinforced-concrete shophouse block, two storeys over a shopfront
// ground floor, red-brick infill between white-concrete piers, a white cornice and parapet,
// a flat roof with a small rooftop plant box. Roof sits 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341343908";
const W = 25, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const ground = new Map();
for (const [x, z, gy] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gy));
}
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const exterior = (x, z) =>
  has(x, z) && (!has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1));

// bounds-safe setter
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- entrance: exterior cell on the minimum-z face nearest the centre -----
let minZ = Infinity;
for (const k of ground.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
let entrance = null;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z !== minZ || !exterior(x, z)) continue;
  if (!entrance || Math.abs(x - 12) < Math.abs(entrance.x - 12)) entrance = { x, z };
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ---- pass 1: foundation, floor slabs, roof slab, walls, parapet -------------
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const base = G(x, z);
  const ext = exterior(x, z);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // ground-floor slab (base course at the cell's ground)
  put(x, base, z, ext ? "stone_bricks" : "smooth_stone");

  // storey-2 floor line, roof slab (top of storey 2)
  put(x, base + 5, z, ext ? "white_concrete" : "smooth_stone");
  put(x, base + 10, z, ext ? "white_concrete" : "smooth_stone");

  if (!ext) continue;

  // corners and piers
  const corner = (!has(x + 1, z) || !has(x - 1, z)) && (!has(x, z + 1) || !has(x, z - 1));
  const pier = corner || (x + z) % 3 === 0;

  // default brick infill, full wall height of both storeys
  for (let y = base + 1; y <= base + 9; y++) put(x, y, z, "bricks");

  // ground storey: base course, shopfront glass, lintel
  if (pier) {
    for (let y = base + 1; y <= base + 4; y++) put(x, y, z, "white_concrete");
  } else {
    put(x, base + 1, z, "stone_bricks");
    put(x, base + 2, z, "light_blue_stained_glass");
    put(x, base + 3, z, "light_blue_stained_glass");
    put(x, base + 4, z, "white_concrete");
  }

  // storey line band
  put(x, base + 5, z, "white_concrete");

  // upper storey: spandrel, window glass, head course
  if (pier) {
    for (let y = base + 6; y <= base + 9; y++) put(x, y, z, "white_concrete");
  } else {
    put(x, base + 6, z, "bricks");
    put(x, base + 7, z, "gray_stained_glass");
    put(x, base + 8, z, "gray_stained_glass");
    put(x, base + 9, z, "white_concrete");
  }

  // cornice and parapet
  put(x, base + 10, z, "white_concrete");
  put(x, base + 11, z, "white_concrete");
}

// ---- pass 2: entrance, canopy lantern -------------------------------------
if (entrance) {
  const { x, z } = entrance;
  const base = G(x, z);
  put(x, base + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, base + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, base + 3, z, "lantern", { hanging: "true" });
}

// ---- pass 3: warm lights behind glass, on interior cells -----------------
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!exterior(x, z)) continue;
  if (entrance && x === entrance.x && z === entrance.z) continue;
  const pier = (x + z) % 3 === 0;
  if (pier) continue;
  if (((x * 5 + z * 3) % 4) !== 0) continue;

  // find the interior neighbour behind this window
  let inward = null;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !exterior(nx, nz)) { inward = { x: nx, z: nz }; break; }
  }
  if (!inward) continue;
  const base = G(x, z);
  if (((x + z) % 2) === 0) {
    put(inward.x, base + 7, inward.z, "glowstone");      // storey 2
  } else {
    put(inward.x, base + 2, inward.z, "lantern", { hanging: "false" }); // ground floor
  }
}

// ---- pass 4: rooftop plant room on interior cells -----------------------
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (exterior(x, z)) continue;
  if (x < 9 || x > 13 || z < 6 || z > 9) continue;
  const base = G(x, z);
  put(x, base + 11, z, "light_gray_concrete");
  put(x, base + 12, z, "light_gray_concrete");
  if (x >= 10 && x <= 12 && z >= 7 && z <= 8) {
    put(x, base + 13, z, "green_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
