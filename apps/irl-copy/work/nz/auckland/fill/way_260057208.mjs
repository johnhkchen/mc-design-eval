// Harvard 147, Auckland (way 260057208): a 12-storey concrete-frame office block, 1970s-80s, on a polished-basalt plinth.
// The lidar roof heights are snapped to the 4-block storey grid (12 minimum) and mode-filtered over 3x3 so one noisy cell
// takes its neighbours' tier: the main mass at 48 with a 52 core (the setback), lower wings below. Ground storey (up to
// y 8) is a shopfront with a recessed iron-door entrance under a canopy on the front face; each upper storey is a
// 4-block band: a light-grey string course, two rows of tinted glass panes between white concrete piers, and a head
// course. Edge cells carry a white parapet; the core carries a plant room with a lightning rod. Ground under each cell
// is solid from y 0 up to its ground, the building starts at that ground, and interiors are air with a floor slab per
// storey, a glowstone or shroomlight in some windows behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260057208.cells.json", "utf8"));
const W = 72, D = 39, H = 65, GROUND_TOP = 8;
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), RAW = grid(0);                              // G: ground (-1 = not footprint), RAW: lidar roof
for (const [x, z, g, r] of cells) { G[x][z] = g; RAW[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const edgeCell = (x, z) => SIDES.some(([dx, dz]) => !inside(x + dx, z + dz));

// storey-grid tiers, then a 3x3 mode over the footprint so a lone noisy cell adopts its neighbours' tier
const snap = (r) => Math.max(12, Math.round(r / 4) * 4);
const T = grid(0), R = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) T[x][z] = snap(RAW[x][z]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const tally = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) {
    const v = T[x + dx][z + dz]; tally.set(v, (tally.get(v) || 0) + 1);
  }
  let best = T[x][z];
  for (const [v, n] of tally) if (n > (tally.get(best) || 0)) best = v;
  R[x][z] = best;
}
const solid = (x, y, z) => inside(x, z) && y >= 0 && y < R[x][z];                 // ground, foundation and building
const building = (x, y, z) => inside(x, z) && y >= G[x][z] && y < R[x][z];
const topY = (x, z) => R[x][z] - 1;

// the entrance: on the front (north or south) face, the lowest-ground cell nearest the middle of that face's run
const faceRun = (dz) => {
  const cs = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z + dz)) cs.push([x, z]);
  return cs;
};
const northFace = faceRun(-1), southFace = faceRun(1);
const front = northFace.length >= southFace.length ? { cells: northFace, dz: -1 } : { cells: southFace, dz: 1 };
const byX = [...front.cells].sort((a, b) => a[0] - b[0]);
const [doorX, doorZ] = byX[Math.floor(byX.length / 2)];      // the middle of the run, at its own ground level
const door = { x: doorX, z: doorZ, y: G[doorX][doorZ], dz: front.dz };
const isBay = (x, z, dx, dz) => dz === door.dz && z === door.z && Math.abs(x - door.x) <= 1 && dx === 0;

// shell: the building's outer skin, one block thick (the air behind the glass is the cell just inside it)
const faces = (x, y, z) => SIDES.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const isTop = (x, y, z) => !solid(x, y + 1, z);
const shell = new Set();
const key = (x, y, z) => `${x},${y},${z}`;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) for (let y = G[x][z]; y < R[x][z]; y++) {
  if (faces(x, y, z).length || isTop(x, y, z)) shell.add(key(x, y, z));
}

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const glass = new Map();                                        // "x,y,z" -> { plane: "x" | "z", dx, dz } (its exposed side)
const pane = (plane, x, y, z) => {
  const s = { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" };
  const same = (dx, dz) => glass.get(key(x + dx, y, z + dz))?.plane === plane;
  if (plane === "x") { if (same(0, -1)) s.north = "true"; if (same(0, 1)) s.south = "true"; }
  else { if (same(-1, 0)) s.west = "true"; if (same(1, 0)) s.east = "true"; }
  return s;
};
const lit = (x, y, z) => ((x * 7 + z * 13 + y * 3) % 9 === 0);  // a fixed one window in nine warm

// 1. foundation, then the building column by column
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const g = G[x][z], r = R[x][z];
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  const top = topY(x, z);
  for (let y = g; y < r; y++) {
    const isShell = shell.has(key(x, y, z));
    if (!isShell) {                                              // interior: a floor slab per storey, air between
      if (y === g || (y >= GROUND_TOP && (y - GROUND_TOP) % 4 === 0)) put(x, y, z, "light_gray_concrete");
      continue;
    }
    const fs = faces(x, y, z);
    if (isTop(x, y, z)) { put(x, y, z, edgeCell(x, z) ? "white_concrete" : "light_gray_concrete"); continue; }
    const [dx, dz] = fs[0];                                                // the first exposed side carries the skin (a stepped diagonal edge has no true corners)
    const along = dx !== 0 ? z : x;
    const pier = along % 3 === 0;
    const plane = dx !== 0 ? "x" : "z";
    const bay = isBay(x, z, dx, dz);
    if (bay && x === door.x && (y === door.y || y === door.y + 1)) {       // the iron door, in the entrance bay
      put(x, y, z, "iron_door", { facing: dz < 0 ? "north" : "south", half: y === door.y ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === g) { put(x, y, z, "polished_basalt"); continue; }             // base course
    if (bay) {                                                             // recessed entrance under a canopy
      if (y === GROUND_TOP - 1) { put(x, y, z, "smooth_stone"); continue; }
      glass.set(key(x, y, z), { plane, dx, dz });
      put(x, y, z, "light_blue_stained_glass_pane");
      continue;
    }
    if (y < GROUND_TOP) {                                                  // ground storey: shopfront
      if (y === GROUND_TOP - 1) { put(x, y, z, "light_gray_concrete"); continue; }
    } else {
      const p = (y - GROUND_TOP) % 4;
      if (p === 0 || p === 3) { put(x, y, z, "light_gray_concrete"); continue; }   // string course and head course
    }
    if (pier) { put(x, y, z, "white_concrete"); continue; }
    glass.set(key(x, y, z), { plane, dx, dz });
    put(x, y, z, "light_blue_stained_glass_pane");
  }
  // parapet on the edge, one block above the roof
  if (edgeCell(x, z)) put(x, r, z, "white_concrete");
}

// 2. panes now that every glass cell is known: they join their neighbours in the same wall
for (const [k, { plane }] of glass) {
  const [x, y, z] = k.split(",").map(Number);
  put(x, y, z, "light_blue_stained_glass_pane", pane(plane, x, y, z));
}
// 3. warm light behind some glass: glowstone upstairs, shroomlight in the shopfronts; the cell just inside the pane
for (const [k, { dx, dz }] of glass) {
  const [x, y, z] = k.split(",").map(Number);
  const [ix, iy, iz] = [x - dx, y, z - dz];
  if (!inside(ix, iz) || shell.has(key(ix, iy, iz)) || !building(ix, iy, iz)) continue;
  if (!lit(x, y, z)) continue;
  put(ix, iy, iz, y < GROUND_TOP ? "shroomlight" : "glowstone");
}

// 4. the plant room on the core: the largest 9x5 patch at the top tier nearest the footprint's centre
const tiers = [...new Set(R.flat().filter((r) => r > 0))];
const maxR = Math.max(...tiers);
let best = null;
const cx = (W - 1) / 2, cz = (D - 1) / 2;
for (let x = 4; x < W - 4; x++) for (let z = 2; z < D - 2; z++) {
  let ok = true;
  for (let dx = -4; dx <= 4 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) if (!inside(x + dx, z + dz) || R[x + dx][z + dz] !== maxR) ok = false;
  if (ok) { const d = Math.hypot(x - cx, z - cz); if (!best || d < best.d) best = { x, z, d }; }
}
if (best) {
  for (let dx = -4; dx <= 4; dx++) for (let dz = -2; dz <= 2; dz++) {
    const x = best.x + dx, z = best.z + dz;
    for (let y = maxR; y < maxR + 3; y++) put(x, y, z, "light_gray_concrete");
    put(x, maxR + 2, z, edgeCell(x, z) ? "white_concrete" : "light_gray_concrete");
  }
  put(best.x, maxR + 3, best.z, "lightning_rod");
}

const { blocks, palette } = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260057208.nbt");
console.log(`way_260057208: ${blocks} blocks, palette ${palette}, roof tiers ${tiers.sort((a, b) => a - b).join("/")}, entrance at x ${door.x} z ${door.z}`);
