import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540098127.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540098127.nbt";

const W = 22, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// ---- footprint -------------------------------------------------------------
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map(); // "x,z" -> ground y
for (const c of raw) {
  const [x, z, gy] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, Math.round(gy));
}
const inF = (x, z) => ground.has(`${x},${z}`);
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const outDirs = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const isEdge = (x, z) => outDirs(x, z).length > 0;

const grounds = [...ground.values()];
const minG = Math.min(...grounds);
const maxG = Math.max(...grounds);

// Roof about 11 blocks above lowest ground: two storeys of 5 plus a 1-block parapet.
let roofY = Math.max(minG + 11, maxG + 6);
roofY = Math.min(roofY, H - 3); // leave room for roof plant above the deck

const setIf = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- per-cell construction -------------------------------------------------
for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation up to this cell's ground
  for (let y = 0; y < gy; y++) setIf(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    const od = outDirs(x, z)[0];
    const along = od[0] !== 0 ? z : x; // index along the facade for the bay grid
    const isPillar = along % 3 === 0;
    for (let y = gy; y <= roofY - 1; y++) {
      const o = y - gy;
      const s = Math.floor(o / 5);
      const r = o % 5;
      if (y === roofY - 1) {
        setIf(x, y, z, "light_gray_concrete"); // parapet cap
      } else if (o === 0) {
        setIf(x, y, z, "polished_andesite"); // base course
      } else if (r === 0 || r === 4) {
        setIf(x, y, z, "light_gray_concrete"); // storey line / spandrel
      } else if (isPillar) {
        setIf(x, y, z, "quartz_pillar");
      } else if (s === 0) {
        setIf(x, y, z, "gray_stained_glass"); // shopfront glazing
      } else {
        setIf(x, y, z, "light_blue_stained_glass"); // office windows
      }
    }
  } else {
    for (let y = gy; y <= roofY - 1; y++) {
      const o = y - gy;
      if (y === roofY - 1) setIf(x, y, z, "smooth_stone"); // roof deck
      else if (o % 5 === 0) setIf(x, y, z, "light_gray_concrete"); // floor slab
      // else: air gap behind the glass
    }
  }
}

// ---- warm lights behind some windows --------------------------------------
for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const od = outDirs(x, z)[0];
  const along = od[0] !== 0 ? z : x;
  if (along % 3 === 0) continue; // pillar, not a window
  const o = 0; // examine each window row
  for (let y = gy + 1; y <= roofY - 3; y++) {
    const r = (y - gy) % 5;
    if (r < 1 || r > 3) continue;
    if (r !== 2) continue; // mid-window height only
    if ((x * 7 + z * 3 + y) % 4 !== 0) continue;
    const ix = x - od[0], iz = z - od[1];
    if (inF(ix, iz) && !isEdge(ix, iz)) setIf(ix, y, iz, "glowstone");
  }
}

// ---- entrance on the street-facing side ------------------------------------
const edgeCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => isEdge(x, z));
let front = edgeCells.filter(([x, z]) => outDirs(x, z).some(([dx, dz]) => dz === -1));
if (front.length === 0) front = edgeCells;
const minZ = Math.min(...front.map(([, z]) => z));
const frontRow = front.filter(([, z]) => z === minZ).sort((a, b) => a[0] - b[0]);
const [ex, ez] = frontRow[Math.floor(frontRow.length / 2)];
const eg = ground.get(`${ex},${ez}`);
const eDir = outDirs(ex, ez)[0];
const facing = eDir[2];

// lintel / canopy over the door on the shopfront
for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
  const nx = ex + dx, nz = ez + dz;
  if (!inF(nx, nz)) continue;
  if (dx !== 0 && eDir[0] === 0) continue; // only along the facade
  if (dz !== 0 && eDir[1] === 0) continue;
  setIf(nx, eg + 4, nz, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// double-height door
setIf(ex, eg, ez, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
setIf(ex, eg + 1, ez, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });

// ---- roof plant ------------------------------------------------------------
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (x >= 6 && x <= 14 && z >= 5 && z <= 10) {
    setIf(x, roofY, z, "gray_concrete");
    setIf(x, roofY + 1, z, "light_gray_concrete");
  }
}

g.save(OUT);
