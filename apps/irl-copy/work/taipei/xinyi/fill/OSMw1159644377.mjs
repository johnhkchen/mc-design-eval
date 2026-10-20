import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1159644377";
const W = 19, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function exposed(x, z) {
  return Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));
}

// Count exposed faces per direction to find the main (street) facade.
const dirCount = { north: 0, south: 0, east: 0, west: 0 };
const perim = new Map();
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const e = exposed(x, z);
  if (e.length) perim.set(key, e);
  for (const d of e) dirCount[d]++;
}
let mainDir = "south";
for (const d of ["north", "south", "east", "west"]) {
  if (dirCount[d] > dirCount[mainDir]) mainDir = d;
}

// Entrance: the main-facade cell closest to the median along that face (non-corner).
const mainCells = [...perim.entries()]
  .filter(([, e]) => e.length === 1 && e[0] === mainDir)
  .map(([k]) => k.split(",").map(Number));
let entrance = null;
if (mainCells.length) {
  const alongIdx = ([x, z]) => (mainDir === "north" || mainDir === "south" ? x : z);
  const vals = mainCells.map(alongIdx).sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  entrance = mainCells.reduce((best, c) =>
    Math.abs(alongIdx(c) - med) < Math.abs(alongIdx(best) - med) ? c : best
  );
}
const entKey = entrance ? entrance.join(",") : null;

const NS = (d) => d === "north" || d === "south";
const glassProps = (face) =>
  NS(face)
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const b = Math.round(gr);

  // Foundation from y0 up to the cell's ground, then floor slab at ground level.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");
  put(x, b, z, "smooth_stone");

  // Floor slabs at storey lines (interior air otherwise).
  put(x, b + 5, z, "smooth_stone");
  put(x, b + 10, z, "smooth_stone");

  const e = perim.get(`${x},${z}`);
  if (!e) continue;

  const corner = e.length >= 2;
  const face = corner ? null : e[0];
  const idx = face ? (NS(face) ? x : z) : 0;
  const pier = corner || idx % 3 === 0;

  // Parapet and cornice common to all perimeter cells.
  put(x, b + 10, z, "smooth_quartz");
  put(x, b + 11, z, "white_concrete");

  if (pier) {
    put(x, b + 1, z, "stone_bricks");
    for (let y = b + 2; y <= b + 9; y++) put(x, y, z, "white_concrete");
    continue;
  }

  const isEnt = entKey === `${x},${z}` && face === mainDir;
  const gp = glassProps(face);

  // Base course and shopfront.
  put(x, b + 1, z, "stone_bricks");
  put(x, b + 2, z, "glass_pane", gp);
  put(x, b + 3, z, "glass_pane", gp);
  put(x, b + 4, z, "light_gray_concrete");

  // Storey-two spandrel and windows.
  put(x, b + 5, z, "light_gray_concrete");
  put(x, b + 6, z, "light_gray_concrete");
  put(x, b + 7, z, "glass_pane", gp);
  put(x, b + 8, z, "glass_pane", gp);
  put(x, b + 9, z, "light_gray_concrete");

  // Warm light behind some windows, in the air gap just inside the wall.
  const inward = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] }[face];
  const ix = x + inward[0], iz = z + inward[1];
  const interiorOk = has(ix, iz) && exposed(ix, iz).length === 0;
  if (interiorOk && idx % 6 === 2) {
    put(ix, b + 2, iz, "glowstone");
    put(ix, b + 7, iz, "glowstone");
  }

  if (isEnt) {
    // Entrance: double-height door, bronze lintel, lit interior behind the glass.
    put(x, b + 1, z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
    put(x, b + 2, z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
    put(x, b + 3, z, "glass_pane", gp);
    put(x, b + 4, z, "copper_block");
    if (interiorOk) put(ix, b + 2, iz, "sea_lantern");
  }
}

// Roof equipment on the interior roof deck.
for (const [x, z, gr] of cells) {
  const b = Math.round(gr);
  if (perim.has(`${x},${z}`)) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    put(x, b + 11, z, "iron_block");
    put(x, b + 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
