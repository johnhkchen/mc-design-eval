import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87151.cells.json`, "utf8"));

const W = 8, H = 29, D = 14;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// ---- footprint record ----
const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of cells) {
  const [x, z, gr, roof] = c;
  cellMap.set(key(x, z), { x, z, gr: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => cellMap.has(key(x, z));
const missingN = (x, z) => !has(x, z - 1);
const missingS = (x, z) => !has(x, z + 1);
const missingW = (x, z) => !has(x - 1, z);
const missingE = (x, z) => !has(x + 1, z);
const shell = (x, z) => missingN(x, z) || missingS(x, z) || missingW(x, z) || missingE(x, z);

// ---- one building-wide storey grid and one flat roof (lidar noise smoothed away) ----
const allCells = [...cellMap.values()];
const gBase = Math.min(...allCells.map(c => c.gr));
const roofVals = allCells.map(c => c.roof).sort((a, b) => a - b);
const roofMed = roofVals[Math.floor(roofVals.length / 2)];
let N = Math.max(3, Math.round((roofMed - gBase) / 3));
while (N > 3 && gBase + 3 * N + 4 > H - 1) N--;
const topY = gBase + 3 * N;           // flat roof deck
const lineRel = y => (y - gBase) % 3; // 0 = storey line (spandrel/floor), 1-2 = glass band

// front (street) face is z = 0; door on the cell nearest x = 3
let doorX = null;
for (const c of allCells) {
  if (c.z !== 0) continue;
  if (doorX === null || Math.abs(c.x - 3) < Math.abs(doorX - 3)) doorX = c.x;
}

// ---- massing: walls, floors, foundation, window grid ----
for (const c of allCells) {
  const { x, z, gr } = c;

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (shell(x, z)) {
    const axisNS = missingN(x, z) || missingS(x, z);
    const idx = axisNS ? x : z;
    const maxIdx = axisNS ? W - 1 : D - 1;
    const isGlass = idx % 2 === 1 && idx > 0 && idx < maxIdx;

    for (let y = gr; y < topY; y++) {
      if (y === gr) { put(x, y, z, "stone_bricks"); continue; }
      const rel = lineRel(y);
      if (rel === 0) { put(x, y, z, "calcite"); continue; }
      if (isGlass) {
        const p = axisNS
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, "light_blue_stained_glass_pane", p);
      } else {
        put(x, y, z, "calcite");
      }
    }
    // cornice, parapet and cap on the flat roof line
    put(x, topY, z, "quartz_block");
    put(x, topY + 1, z, "calcite");
    put(x, topY + 2, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // interior: floor slabs on storey lines, air otherwise (no interiors)
    for (let y = gr; y <= topY; y++) {
      if (y === gr || y === topY || lineRel(y) === 0) put(x, y, z, "smooth_stone");
    }
  }
}

// ---- entrance: lobby glass, canopy trim, double door, hanging lanterns ----
for (const c of allCells) {
  if (c.z !== 0 || c.x === 0 || c.x === W - 1 || c.x === doorX) continue;
  const p = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  put(c.x, c.gr + 1, 0, "light_blue_stained_glass_pane", p);
  put(c.x, c.gr + 2, 0, "light_blue_stained_glass_pane", p);
}

const frontGround = cellMap.get(key(doorX, 0)).gr;
for (let d = -1; d <= 1; d++) {
  if (has(doorX + d, 0)) {
    put(doorX + d, frontGround + 3, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
}
put(doorX, frontGround + 1, 0, "dark_oak_door",
  { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorX, frontGround + 2, 0, "dark_oak_door",
  { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const d of [-1, 1]) {
  if (has(doorX + d, 0)) {
    put(doorX + d, frontGround + 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// ---- warm lights: glowstone behind some glazed bays on alternate storeys ----
for (const c of allCells) {
  const { x, z, gr } = c;
  if (!shell(x, z)) continue;
  const axisNS = missingN(x, z) || missingS(x, z);
  const idx = axisNS ? x : z;
  const maxIdx = axisNS ? W - 1 : D - 1;
  if (!(idx % 2 === 1 && idx > 0 && idx < maxIdx)) continue;
  let ix = null, iz = null;
  if (missingN(x, z)) { ix = x; iz = z + 1; }
  else if (missingS(x, z)) { ix = x; iz = z - 1; }
  else if (missingW(x, z)) { ix = x + 1; iz = z; }
  else if (missingE(x, z)) { ix = x - 1; iz = z; }
  if (ix === null || !has(ix, iz) || shell(ix, iz)) continue;
  if (idx % 4 !== 1) continue;
  for (let y = gr + 1; y < topY; y++) {
    const k = Math.floor((y - gBase) / 3);
    if (lineRel(y) !== 0 && k % 2 === 1 && y % 2 === 0) put(ix, y, iz, "glowstone");
  }
}

// ---- roof: corner lanterns on the parapet ----
for (const c of allCells) {
  const { x, z } = c;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  if (corner) put(x, topY + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- roof: mechanical penthouse, centred on the flat roof ----
const ph = { x0: 2, x1: 5, z0: 4, z1: 9 };
let phOk = true;
for (let x = ph.x0; x <= ph.x1; x++)
  for (let z = ph.z0; z <= ph.z1; z++)
    if (!has(x, z) || shell(x, z)) phOk = false;
if (phOk) {
  for (let x = ph.x0; x <= ph.x1; x++) {
    for (let z = ph.z0; z <= ph.z1; z++) {
      const edge = x === ph.x0 || x === ph.x1 || z === ph.z0 || z === ph.z1;
      for (let dy = 1; dy <= 2; dy++) {
        const y = topY + dy;
        if (!edge) continue;
        if (dy === 1 && (x + z) % 2 === 0) {
          const p = (x === ph.x0 || x === ph.x1)
            ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
            : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
          put(x, y, z, "light_blue_stained_glass_pane", p);
        } else {
          put(x, y, z, "calcite");
        }
      }
      put(x, topY + 3, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/DC87151.nbt`);
