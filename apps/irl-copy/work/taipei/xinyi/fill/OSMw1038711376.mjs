import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-style 1970s-80s mid-rise: four storeys of 5 blocks, shopfront ground floor,
// white-tiled concrete bays with light-blue glass, light-grey floor bands and cornice,
// one-block parapet, plant room and water tank on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711376";
const W = 24, D = 16, H = 33;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy ?? 0);

const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const base = Math.min(...ground.values());          // lowest ground = storey 0 datum
const ROOF_TOP = base + 20;                          // parapet block (height ~21 above datum)

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!inFp(x, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const FACING = { n: "north", s: "south", e: "east", w: "west" };

// Exposed faces per footprint cell
const exposures = new Map();
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const ex = [];
  for (const d of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[d];
    if (!inFp(x + dx, z + dz)) ex.push(d);
  }
  if (ex.length) exposures.set(key, ex);
}
const isPerim = (x, z) => exposures.has(`${x},${z}`);

// Facade extents per face direction (u = x on n/s faces, z on e/w faces)
const range = {};
for (const [key, ex] of exposures) {
  const [x, z] = key.split(",").map(Number);
  for (const d of ex) {
    const u = (d === "n" || d === "s") ? x : z;
    if (!range[d]) range[d] = { min: u, max: u };
    range[d].min = Math.min(range[d].min, u);
    range[d].max = Math.max(range[d].max, u);
  }
}
// Entrance centred on the south (street) face
const cxF = range.s ? Math.round((range.s.min + range.s.max) / 2) : null;

// Absolute floor lines: storey starts plus the roof ceiling slab
const FLOOR_R = new Set([0, 5, 10, 15, 19]);

const facadeEl = (d, x, z, y, r, corner) => {
  const [dx, dz] = DIRS[d];
  const u = (d === "n" || d === "s") ? x : z;
  const rg = range[d];
  const k = Math.floor(r / 5);
  const off = r % 5;

  if (r === 20) return { id: "white_concrete" };                 // parapet
  if (off === 0) return { id: k === 0 ? "stone_bricks" : "light_gray_concrete" };
  if (off === 4) {
    return { id: k === 0 ? "smooth_stone" : (k === 3 ? "light_gray_concrete" : "white_concrete") };
  }

  // Window zone (offsets 1..3)
  const pillar = corner || u === rg.min || u === rg.max || (u - rg.min) % 3 === 0;
  const isEntranceCol = d === "s" && k === 0 && u === cxF;
  if (isEntranceCol && off === 1) {
    return { id: "dark_oak_door", p: { facing: FACING[d], half: "lower", hinge: "left", open: "false", powered: "false" } };
  }
  if (isEntranceCol && off === 2) {
    return { id: "dark_oak_door", p: { facing: FACING[d], half: "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (pillar) return { id: k === 0 ? "polished_andesite" : "white_concrete" };

  // Warm light behind glass on some bays
  if (off === 2 && ((u - rg.min) + k) % 6 === 1) {
    const ix = x - dx, iz = z - dz;
    if (inFp(ix, iz) && !isPerim(ix, iz)) put(ix, y, iz, "glowstone");
  }

  if (k === 0) return { id: "cyan_stained_glass" };
  // Panes connect along the wall they sit in
  const alongEW = (d === "n" || d === "s");
  return {
    id: "light_blue_stained_glass_pane",
    p: alongEW
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
  };
};

// 1. Foundations from y 0 up to each cell's ground
for (const [key, g0] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");
}

// 2. Walls, floor slabs and interior air per storey
for (const [key, g0] of ground) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposures.get(key);
  const corner = ex ? ex.length >= 2 : false;
  for (let y = g0; y <= ROOF_TOP; y++) {
    const r = y - base;
    if (r < 0) continue;
    if (ex) {
      // Use the first exposed face to decide; corners are pillars via the corner flag
      const el = facadeEl(ex[0], x, z, y, r, corner);
      if (el) put(x, y, z, el.id, el.p);
    } else if (FLOOR_R.has(r)) {
      put(x, y, z, "light_gray_concrete");
    }
  }
}

// 3. Roof plant room and water tank (sit on the roof slab at base+20)
const roofY = base + 20;
for (let x = 7; x <= 16; x++)
  for (let z = 5; z <= 10; z++)
    for (let y = roofY; y <= roofY + 2; y++)
      put(x, y, z, y === roofY + 2 ? "smooth_stone" : "light_gray_concrete");

for (let x = 2; x <= 3; x++)
  for (let z = 2; z <= 3; z++)
    for (let y = roofY; y <= roofY + 3; y++)
      put(x, y, z, y === roofY + 3 ? "smooth_stone" : "iron_block");

// Antenna mast on the back corner
put(20, roofY, 4, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
for (let y = roofY + 1; y <= roofY + 3; y++) put(20, y, 4, "iron_bars");

g.save(`${DIR}/${ID}.nbt`);
