import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1042397472";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 25, H = 38, D = 20;
const ROOF = 25;            // roof slab; parapet sits at ROOF+1 (about 26 above lowest ground)
const FL = [0, 5, 10, 15, 20, 25];   // storey lines, 5 blocks per storey, five storeys

const g = new Voxels([W, H, D]);

// ---- footprint ------------------------------------------------------------
const cellMap = new Map();
const key = (x, z) => `${x},${z}`;
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cellMap.set(key(x, z), Math.round(gr));
}
const minG = Math.min(...cellMap.values());
for (const [k, v] of cellMap) cellMap.set(k, Math.min(24, v - minG));

const has = (x, z) => cellMap.has(key(x, z));
const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// ---- helpers ----------------------------------------------------------------
function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// ---- entrance: north face cell nearest the middle, not a pillar -------------
const xs = [...cellMap.keys()].map(k => Number(k.split(",")[0]));
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
let door = null;
for (const [k] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const mN = !has(x, z - 1), mS = !has(x, z + 1), mW = !has(x - 1, z), mE = !has(x + 1, z);
  if (!mN || mS || mW || mE) {
    // only plain north-face cells (not corners) qualify
    if (!mN || mS || mW || mE) {
      if (mN && !mW && !mE && x % 3 !== 0) {
        if (!door || Math.abs(x - midX) < Math.abs(door.x - midX)) door = { x, z };
      }
    }
  }
}

// ---- main build ---------------------------------------------------------------
for (const [k, gr] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const mN = !has(x, z - 1), mS = !has(x, z + 1), mW = !has(x - 1, z), mE = !has(x + 1, z);
  const edge = mN || mS || mW || mE;
  const corner = (mN || mS) && (mW || mE);
  const alongX = mN || mS;           // wall runs east-west on this cell
  const idx = alongX ? x : z;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const floors = new Set([gr, ...FL.filter(f => f > gr)]);

  for (let y = gr; y <= ROOF; y++) {
    if (floors.has(y)) {
      if (!edge) put(x, y, z, "smooth_stone");                       // floor slab
      else put(x, y, z, y === gr ? "stone_bricks" : "light_gray_concrete"); // base course / storey line
      continue;
    }
    if (!edge) continue;                                              // air behind glass
    if (floors.has(y + 1)) {                                          // spandrel above windows
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (corner) { put(x, y, z, "white_concrete"); continue; }         // corner columns
    if (idx % 3 === 0) { put(x, y, z, "white_concrete"); continue; }  // mullions

    const isDoorCell = door && door.x === x && door.z === z;
    if (isDoorCell && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoorCell && y === gr + 3) { put(x, y, z, "light_gray_concrete"); continue; }

    // glass pane window, connected along the wall
    const paneProps = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
    put(x, y, z, "light_blue_stained_glass_pane", paneProps);

    // warm light just inside some windows
    if ((x * 5 + y * 3 + z) % 7 === 0) {
      const dx = mW ? 1 : mE ? -1 : 0;
      const dz = mN ? 1 : mS ? -1 : 0;
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }

  // parapet on the roof edge
  if (edge) put(x, ROOF + 1, z, "white_concrete");
}

// ---- roof equipment -------------------------------------------------------------
for (let x = 5; x <= 7; x++) {
  for (let z = 5; z <= 6; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    put(x, ROOF + 1, z, "iron_block");
    put(x, ROOF + 2, z, "iron_block");
  }
}
if (has(12, 10) && !isEdge(12, 10)) {
  put(12, ROOF + 1, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${dir}/${id}.nbt`);
