// 589 Fifth Avenue (1954, commercial & office): an International-style curtain-wall office block on a granite base,
// stepping from a six-storey street wall up to a 21-storey tower with a penthouse. Every footprint cell is a solid
// column from y 0 to its roof, so each storey stands on the one below. Facade ring = glass bays between quartz piers
// and light spandrels, with a one-block air gap behind the glass; floor slabs are the solid storey rows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 41, D = 28, STOREY = 3;
const cells = JSON.parse(readFileSync(`${HERE}/NYC1035427.cells.json`, "utf8"));

// Footprint and lidar roof per cell. Ground is 0 everywhere, so y 0 is the street. A roof of 0 is a missing return:
// it takes the mode of its neighbours.
const fp = Array.from({ length: D }, () => Array(W).fill(false));
const raw = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, , roof] of cells) { fp[z][x] = true; if (roof > 0) raw[z][x] = roof; }
const inFP = (x, z) => x >= 0 && x < W && z >= 0 && z < D && fp[z][x];

// Clean tiers: the lidar roof quantised to whole storeys (3 blocks), then a 3x3 mode so speckle becomes flat tiers.
const TIERS = [[23, 18], [33, 30], [38, 36], [44, 42], [51, 48], [57, 54], [999, 63]];
const tierOf = (r) => TIERS.find(([max]) => r <= max)[1];
const mode = (vals, self) => {
  const c = new Map(); for (const v of vals) c.set(v, (c.get(v) || 0) + 1);
  let best = self, n = c.get(self) || 0;
  for (const [v, k] of c) if (k > n) { best = v; n = k; }
  return best;
};
const around = (grid, x, z) => {
  const out = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, nz = z + dz;
    if (inFP(nx, nz) && grid[nz][nx] != null) out.push(grid[nz][nx]);
  }
  return out;
};
const lv = Array.from({ length: D }, () => Array(W).fill(null));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFP(x, z) && raw[z][x] != null) lv[z][x] = tierOf(raw[z][x]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFP(x, z) && lv[z][x] == null) lv[z][x] = mode(around(lv, x, z), 18);
const H = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFP(x, z)) H[z][x] = mode(around(lv, x, z), lv[z][x]);
const height = (x, z) => (inFP(x, z) ? H[z][x] : 0);

// Exposure: a solid voxel with a horizontal neighbour that is outside the footprint or has no column at that height.
const DIRS = [{ dx: 1, dz: 0, facing: "east" }, { dx: -1, dz: 0, facing: "west" }, { dx: 0, dz: 1, facing: "south" }, { dx: 0, dz: -1, facing: "north" }];
const exposedDir = (x, y, z) => DIRS.find(({ dx, dz }) => { const nx = x + dx, nz = z + dz; return !inFP(nx, nz) || height(nx, nz) <= y; }) || null;
// Depth 1: inside the facade, one block behind an exposed voxel at the same height. Holds the air gap.
const depthOne = (x, y, z) => !exposedDir(x, y, z) && DIRS.some(({ dx, dz }) => { const nx = x + dx, nz = z + dz; return inFP(nx, nz) && height(nx, nz) > y && exposedDir(nx, y, nz); });

// Doors on the street faces: [x, z, facing] for the lower cell of each entrance (the cell must be exposed at y 0).
const DOORS = [[8, 0, "north"], [0, 10, "west"], [36, 27, "south"]];
const doorCells = new Map(DOORS.map(([x, z, facing]) => [`${x},${z}`, facing]));

const g = new Voxels([W, 75, D]);
const glass = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) % 7 === 0 ? "light_blue_stained_glass" : "cyan_stained_glass";
const door = (facing, half) => ["dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" }];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFP(x, z)) continue;
  const h = H[z][x];
  for (let y = 0; y < h; y++) {
    const r = y % STOREY, top = y === h - 1;
    const dir = exposedDir(x, y, z);
    if (dir) {
      const idx = dir.dz !== 0 ? x : z;             // bay index along the face: piers every third block
      const pier = idx % 3 === 0;
      if (top) { g.set(x, y, z, "smooth_stone"); continue; }                                  // cornice
      if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }                           // plinth
      if (y <= 2) {                                                                            // shopfront
        const dk = doorCells.get(`${x},${z}`);
        if (dk && y <= 1) { g.set(x, y, z, ...door(dk, y === 0 ? "lower" : "upper")); continue; }
        if (y === 1 && !pier) { g.set(x, y, z, "glass"); continue; }
        g.set(x, y, z, "polished_granite"); continue;                                          // piers and header
      }
      if (y < 6) { g.set(x, y, z, "polished_granite"); continue; }                             // base course
      if (r === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }                        // spandrel line
      g.set(x, y, z, pier ? "smooth_quartz" : glass(x, y, z));                                 // curtain-wall bay
      continue;
    }
    if (top) { g.set(x, y, z, "gravel"); continue; }                                           // roof
    if (y < 2 && doorInward(x, y, z)) continue;                                                // vestibule behind a door
    if (depthOne(x, y, z) && r > 0) {                                                          // air gap behind glass
      if (y === 2 && (x + z) % 6 === 3) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); }
      else if (y >= 6 && (x * 5 + y * 3 + z) % 11 === 0) { g.set(x, y, z, "glowstone"); }      // warm light in some bays
      continue;
    }
    g.set(x, y, z, "stone");                                                                  // core
  }
}

// Vestibule: the cell inside each door stays open for the two door rows.
function doorInward(x, y, z) {
  return DOORS.some(([dx, dz, facing]) => {
    const inx = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[facing];
    return x === dx + inx[0] && z === dz + inx[1] && y < 2;
  });
}

// Penthouse on the tower roof (roof equipment): a glass-banded box inset from the tower edge, on the roof slab.
const TOP = 63;
for (let z = 14; z <= 17; z++) for (let x = 23; x <= 30; x++) {
  for (let y = TOP; y <= TOP + 5; y++) {
    const ring = x === 23 || x === 30 || z === 14 || z === 17;
    if (y === TOP || y === TOP + 5) g.set(x, y, z, y === TOP ? "light_gray_concrete" : "smooth_stone");
    else if (ring) g.set(x, y, z, (x + z) % 2 ? "smooth_quartz" : "cyan_stained_glass");
  }
}

const counts = g.save(`${HERE}/NYC1035427.nbt`);
console.log(JSON.stringify({ storeysMax: Math.max(...H.flat()) / STOREY, ...counts }));
