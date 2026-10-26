// DC74828: 1775 Massachusetts Ave NW, Commercial-Office-Large, 11 x 17 footprint.
// Read as a 1920s brick office with limestone trim: a shopfront ground storey, storeys on bands of stone, wings to 13
// and a core that stands to 15 as a set-back penthouse. Solid massing, then the faces are cut into the storey pattern;
// each window is glass with an air pocket behind it, bounded by the floor slabs above and below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC74828.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 11, D = 17, H = 27;
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const has = (x, z) => cell.has(key(x, z));
// lidar roof: 13 for the wings, 15 for the core. Only a core cell with four core neighbours rises to 15 (the penthouse);
// the core's outer ring steps down to the wing roof, which is the set-back.
const isCore = (x, z) => has(x, z) && cell.get(key(x, z)).r >= 14;
const roofOf = new Map();
for (const c of cell.values()) {
  const inner = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => isCore(c.x + dx, c.z + dz));
  roofOf.set(key(c.x, c.z), c.r >= 14 && inner ? 15 : 13);
}
const T = (x, z) => roofOf.get(key(x, z));

// outward normals; a face is exposed where the neighbour is off the footprint or stands lower than this cell
const DIRS = [
  { dx: 0, dz: -1, name: "N" }, { dx: 0, dz: 1, name: "S" },
  { dx: -1, dz: 0, name: "W" }, { dx: 1, dz: 0, name: "E" },
];
const exposedDirs = (x, z) => {
  const t = T(x, z);
  return DIRS.filter(({ dx, dz }) => !has(x + dx, z + dz) || T(x + dx, z + dz) < t);
};
const lowOf = (x, z, { dx, dz }) => (has(x + dx, z + dz) ? T(x + dx, z + dz) : 0);

// one storey pattern, by absolute height: 0 base, 1 granite plinth, 2-3 shopfront, 4 lintel, 5/8/11 storey lines,
// 6-7 and 9-10 windows, 12 wing cornice; the penthouse (roof 15) has a window row at 13 and its cornice at 14
function kindAt(y, t) {
  if (y === 0) return "base";
  if (y === 1) return "plinth";
  if (y <= 3) return "shop";
  if (y === 4) return "lintel";
  if (y === 5 || y === 8 || y === 11) return "belt";
  if (y === 6 || y === 7 || y === 9 || y === 10) return "win";
  if (y === 12) return t === 13 ? "cornice" : "belt";
  if (y === 13) return "win";
  return "cornice";
}
const GLASS_KINDS = new Set(["shop", "win"]);
const LOWER_WINDOW_ROWS = new Set([2, 6, 9, 13]);

const g = new Voxels([W, H, D]);

// 1. solid massing: every cell from y 0 up to its roof (the ground foundation is the same column)
for (const c of cell.values()) {
  const t = T(c.x, c.z);
  for (let y = 0; y < t; y++) g.set(c.x, y, c.z, y === t - 1 ? "smooth_stone" : "bricks");
}

// 2. the faces: every exposed face row takes its storey pattern. Along a face, every second cell is glass and the
// others are piers. The footprint is stair-stepped, so most edge cells face two ways: they keep the rhythm of their
// first face rather than becoming quoins, which would turn the walls to calcite.
const isGlassCol = (dir, c) => (dir.name === "N" || dir.name === "S" ? c.x : c.z) % 2 === 1;
const glassState = (dir) => (dir.name === "N" || dir.name === "S"
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" });
const pockets = [];   // { x, z, dir, y } glass rows to back with an air pocket (or a light)

for (const c of cell.values()) {
  const { x, z } = c, t = T(x, z);
  const faces = exposedDirs(x, z);
  if (!faces.length) continue;
  for (let y = 0; y < t; y++) {
    const dir = faces.find((d) => y >= lowOf(x, z, d));
    if (!dir) continue;
    const k = kindAt(y, t);
    let block = "bricks", state = null;
    if (k === "base") block = "stone_bricks";
    else if (k === "plinth") block = "polished_granite";
    else if (k === "lintel" || k === "belt" || k === "cornice") block = "calcite";
    else if (GLASS_KINDS.has(k)) {
      if (isGlassCol(dir, c)) { block = "glass_pane"; state = glassState(dir); }
      else block = k === "shop" ? "dark_oak_planks" : "bricks";
    }
    g.set(x, y, z, block, state);
    if (GLASS_KINDS.has(k) && state) pockets.push({ x, z, dir, y });
  }
}

// 3. air pockets behind the glass (the storey's floor slab bounds each one); a window's lower row sometimes holds a lamp
const light = (x, z, y) => ((x * 3 + z * 5 + y) % 3 === 0 ? "glowstone" : "air");
for (const p of pockets) {
  const ix = p.x - p.dir.dx, iz = p.z - p.dir.dz;
  if (!has(ix, iz) || exposedDirs(ix, iz).length) continue;   // a thin wall has no room behind it
  const row = p.y;
  if (LOWER_WINDOW_ROWS.has(row)) g.set(ix, row, iz, light(p.x, p.z, row));
  else g.set(ix, row, iz, "air");
}

// 4. the entrance on the south front: a dark oak door in the shop row, with the lintel above and an air pocket inside
g.set(6, 2, 16, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(6, 3, 16, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(6, 2, 15, "air");
g.set(6, 3, 15, "air");

// 5. roof equipment on the wing roof: a few plant boxes on interior wing cells
for (const c of cell.values()) {
  if (T(c.x, c.z) !== 13 || exposedDirs(c.x, c.z).length) continue;
  if ((c.x + c.z) % 5 === 2) g.set(c.x, 13, c.z, "light_gray_concrete");
}

const out = `${DIR}/DC74828.nbt`;
const res = g.save(out);
console.log(`DC74828: ${res.blocks} blocks, ${res.palette} palette entries -> ${out}`);
