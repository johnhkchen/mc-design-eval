import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370157575";
const W = 31, H = 33, D = 68;

// ---- footprint + ground -------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
let minG = Infinity;
for (const [, , g] of raw) minG = Math.min(minG, Math.round(g));
const ground = new Map();
for (const [x, z, g] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.round(g) - minG);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

const g3 = new Voxels([W, H, D]);
// Only writes on footprint cells, inside the box.
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return;
  if (p) g3.set(x, y, z, id, p);
  else g3.set(x, y, z, id);
};

// Storey layout (absolute y): plinth 0, ground shopfronts 1-3, lintel 4,
// storeys with window rows at 6-8, 11-13, 16-18 and spandrels at 9, 14, 19,
// roof slab 20, parapet 21. Roof equipment above.
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 },
  { name: "west", dx: -1, dz: 0 },
];
const FLOOR_LINES = [5, 10, 15];
const ROOF_Y = 20;
const PARAPET_Y = 21;

const lights = [];
const cellList = [...ground.keys()].map(k => k.split(",").map(Number));

// ---- pass 1: foundations, interior, facade ------------------------------
for (const [x, z] of cellList) {
  const g = gr(x, z);

  // Foundation under every cell so nothing floats on the slope.
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  const outs = DIRS.filter(d => !has(x + d.dx, z + d.dz));
  const edge = outs.length > 0;

  if (!edge) {
    // Interior: floor slabs and roof slab only; air gaps otherwise.
    if (g > 0) put(x, g, z, "smooth_stone");
    for (const y of FLOOR_LINES) if (y >= g) put(x, y, z, "smooth_stone");
    put(x, ROOF_Y, z, "smooth_stone");
    continue;
  }

  const face = outs[0];
  const t = face.name === "north" || face.name === "south" ? x : z;

  for (let y = g; y <= PARAPET_Y; y++) {
    if (y === PARAPET_Y) {
      // Crenellated parapet: solid piers with stone-slab caps between them.
      if (t % 4 < 2) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    } else if (y === ROOF_Y) {
      put(x, y, z, "smooth_stone");
    } else if (y === 0) {
      // Darker plinth course.
      put(x, y, z, "stone_bricks");
    } else if (y === 1) {
      put(x, y, z, "polished_andesite");          // stall sill
    } else if (y < 4) {
      // Ground-floor shopfront: glass bays between stone piers.
      put(x, y, z, t % 3 === 0 ? "stone_bricks" : "light_blue_stained_glass");
    } else if (y === 4 || FLOOR_LINES.includes(y)) {
      put(x, y, z, "smooth_stone");                // lintel and storey lines
    } else {
      const k = 5 * Math.floor(y / 5);
      const rel = y - k;                           // 1..4
      if (rel === 4) {
        put(x, y, z, "white_concrete");            // spandrel
      } else if (t % 4 === 0) {
        put(x, y, z, "white_concrete");            // window frame pier
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
        if (rel === 2 && t % 4 === 2 && ((Math.floor(t / 4) + k / 5) % 3 === 0)) {
          const ix = x - face.dx, iz = z - face.dz;
          if (has(ix, iz)) lights.push([ix, y, iz]);
        }
      }
    }
  }
}

// Warm lights behind some windows (second pass so edge walls don't overwrite).
for (const [x, y, z] of lights) put(x, y, z, "glowstone");

// ---- entrance on the north face, near the middle of the frontage --------
let doorX = null, doorZ = null, doorG = 0;
{
  const cands = cellList.filter(([x, z]) => !has(x, z - 1));
  if (cands.length) {
    cands.sort((a, b) => Math.abs(a[0] - 15) - Math.abs(b[0] - 15));
    [doorX, doorZ] = cands[0];
    doorG = gr(doorX, doorZ);
    // Stone surround: piers either side and a lintel band above the door.
    for (let dx = -2; dx <= 2; dx++) {
      const x = doorX + dx;
      if (!has(x, doorZ)) continue;
      put(x, doorG + 2, doorZ, "chiseled_stone_bricks");
      if (Math.abs(dx) === 2) {
        put(x, doorG, doorZ, "stone_bricks");
        put(x, doorG + 1, doorZ, "stone_bricks");
      }
    }
    put(doorX, doorG, doorZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(doorX, doorG + 1, doorZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Warm reveal inside the entrance, behind the glass of the lintel line.
    if (has(doorX, doorZ + 1)) put(doorX, doorG + 3, doorZ + 1, "glowstone");
  }
}

// ---- roof: penthouse and water tank -------------------------------------
for (let x = 10; x <= 20; x++) {
  for (let z = 25; z <= 43; z++) {
    if (!has(x, z)) continue;
    const rim = x === 10 || x === 20 || z === 25 || z === 43;
    // Penthouse floor on the roof slab.
    put(x, 21, z, rim ? "light_gray_concrete" : "smooth_stone");
    if (rim) {
      for (const y of [22, 23]) {
        if (y === 22 && (x + z) % 3 !== 0) put(x, y, z, "light_blue_stained_glass_pane");
        else put(x, y, z, "light_gray_concrete");
      }
    }
  }
}
// Steel water tank in the penthouse, standing on its floor.
for (let x = 13; x <= 16; x++) {
  for (let z = 28; z <= 31; z++) {
    for (let y = 22; y <= 25; y++) put(x, y, z, "iron_block");
    put(x, 26, z, "smooth_stone");
  }
}

g3.save(`${DIR}/${ID}.nbt`);
