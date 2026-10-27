// Kenneth Myers Centre (way 23907824): a 1970s-80s concrete-frame office block on Maungawhau's flank. Pale
// concrete piers and spandrels, blue-glass curtain bays, a stepped massing from the lidar roof (a 6-storey base,
// 7 and 8-storey wings, a 10-storey tier, a 12-storey tier, and a 14-storey core), parapets, plant boxes, and a
// lightning-rod mast on the core. Storey lines sit on absolute y multiples of 4 so every tier lines up.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907824.cells.json", "utf8"));
const W = 47, D = 39, H = 70;
const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inF = (x, z) => foot.has(key(x, z));

// Lidar roof -> clean flat tiers (surface heights; a storey is 4 blocks, so tiers are multiples of 4 apart)
const tierTop = (r) => (r >= 49 ? 57 : r >= 41 ? 48 : r >= 35 ? 40 : r >= 29 ? 32 : r >= 26 ? 28 : 24);
const floorLine = (g) => Math.ceil(g / 4) * 4;          // first storey line at or above a cell's ground
const topAt = (x, z) => (inF(x, z) ? tierTop(foot.get(key(x, z)).r) : -Infinity);

// A face of cell (x, z) is open at height y when the neighbour there is missing, or its roof is below y
const FACES = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const openFaces = (x, z, y) => FACES.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);

const M = {
  foundation: "stone_bricks",
  band: "polished_andesite",    // floor lines
  pier: "white_concrete",       // mullions
  glass: "light_blue_stained_glass",
  spandrel: "light_gray_concrete",
  floor: "smooth_stone",        // interior slabs
  roof: "gray_concrete",
  parapet: "stone_bricks",
  plant: "light_gray_concrete",
};

// Doors on the lowest cells: the north edge (street side) and the west edge
const DOORS = new Map([[key(37, 0), "north"], [key(0, 10), "west"]]);
const doorState = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Pass 1: the massing, cell by cell, from y 0 up to the tier top
for (const [k, { g: gr, r }] of foot) {
  const [x, z] = k.split(",").map(Number);
  const T = tierTop(r), fl = floorLine(gr), door = DOORS.get(k);
  for (let y = 0; y < T; y++) {
    if (y < gr) { put(x, y, z, M.foundation); continue; }                 // plinth on the slope
    if (y === T - 1) { put(x, y, z, M.roof); continue; }                  // roof surface
    const ex = openFaces(x, z, y);
    if (!ex.length) {                                                     // interior: solid to the first storey, then slabs
      if (y < fl) put(x, y, z, M.foundation);
      else if (y % 4 === 0) put(x, y, z, M.floor);
      continue;
    }
    // Facade: the mullion grid runs along the face (x on north/south, z on east/west)
    const [dx, dz] = ex[0];
    const u = dz !== 0 ? x : z;
    const pier = u % 3 === 0 && y >= 4;
    if (door && (y === gr || y === gr + 1)) { put(x, y, z, "oak_door", doorState(door, y === gr ? "lower" : "upper")); continue; }
    if (door && y === gr + 3) { put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }  // canopy lintel
    if (y % 4 === 0) put(x, y, z, M.band);
    else if (y % 4 === 3) put(x, y, z, M.spandrel);
    else if (y < 4 || !pier) put(x, y, z, M.glass);
    else put(x, y, z, M.pier);
  }
  if (openFaces(x, z, T - 1).length) put(x, T, z, M.parapet);             // parapet on every exposed roof edge
}

// Pass 2: warm light in the air gap behind some glazing (never on a floor line); plant boxes on the setback roofs;
// corner lanterns and a lightning-rod mast on the core
for (const [k, { g: gr, r }] of foot) {
  const [x, z] = k.split(",").map(Number);
  const T = tierTop(r), fl = floorLine(gr);
  for (let y = Math.max(fl, 4); y < T - 1; y++) {
    if (y % 4 !== 1 && y % 4 !== 2) continue;
    const ex = openFaces(x, z, y);
    if (!ex.length) continue;
    const [dx, dz] = ex[0];
    const inx = x - dx, inz = z - dz;                                     // the cell behind the glass
    if (!inF(inx, inz) || openFaces(inx, inz, y).length) continue;
    const h = (x * 7 + z * 13 + y * 5) % 11;
    if (h === 0) put(inx, y, inz, "glowstone");
    else if (h === 4) put(inx, y, inz, "shroomlight");
  }
  const isSetbackTop = T < 57 && T >= 28 && !openFaces(x, z, T - 1).length && FACES.every(([dx, dz]) => topAt(x + dx, z + dz) <= T);
  if (isSetbackTop && x % 4 === 1 && z % 4 === 1) { put(x, T, z, M.plant); put(x, T + 1, z, M.plant); }
  if (T === 57 && (x === 22 || x === 24) && (z === 17 || z === 18)) put(x, 57, z, "lantern", { hanging: "false", waterlogged: "false" });
}
for (let y = 57; y <= 60; y++) put(23, y, 17, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907824.nbt");
console.log("saved", stats);
