// A 1970s concrete office block on a volcanic basalt plinth: four storeys of painted precast concrete panels with
// bronze-tinted glazing, a five-storey tower core stepping up from the podium, and a roof-plant deck between them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237126.cells.json", "utf8"));
const X = 42, Z = 53, H = 34;

// Lidar roof heights become flat tiers (top surface y): 8 = two-storey wing, 16 = four-storey podium,
// 18 = roof-plant deck, 22 = five-storey tower core with a parapet course (lidar 21 + coping).
const tierOf = (r) => (r <= 12 ? 8 : r <= 16 ? 16 : r <= 18 ? 18 : 22);
const tops = Array.from({ length: Z }, () => Array(X).fill(0));
for (const [x, z, , r] of cells) tops[z][x] = tierOf(r);
const top = (x, z) => (x >= 0 && z >= 0 && x < X && z < Z ? tops[z][x] : 0);

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const FACING = { east: "east", west: "west", south: "south", north: "north" };
const isLine = (y) => y % 4 === 0;                               // storey lines at y = 4, 8, 12, 16, 20
const isWindowRow = (y, R) => y >= 1 && !isLine(y) && y < R - 1; // 1-3 shopfront, 5-7, 9-11, 13-15 ... below the cap

// Pass 1: solid massing on every footprint cell, from the plinth up to its tier, with storey lines and a cornice.
const v = new Voxels([X, H, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const R = tops[z][x]; if (!R) continue;
  for (let y = 0; y < R; y++) {
    let b = "light_gray_concrete";
    if (y === 0) b = "polished_deepslate";                        // basalt plinth
    else if (y === R - 1) b = R === 18 && (x + z) % 3 === 0 ? "copper_grate" : "stone_bricks"; // coping; plant louvres on the deck
    else if (isLine(y)) b = "smooth_stone";                       // floor lines / sills
    v.set(x, y, z, b);
  }
}

// Exposed faces: a face is open where the neighbour is absent or lower than this cell at that height.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => y < top(x, z) && y >= top(x + dx, z + dz));
const bay = (x, z, dx) => (dx !== 0 ? z : x);                    // along-face coordinate: 3-block bays with a pier at bay % 3 === 0
const glassFor = (y) => (y < 4 ? "light_blue_stained_glass" : "gray_stained_glass");

// Entrance: the face with the most exposed ground-floor cells, and the two cells at its middle.
const faceLen = Object.fromEntries(DIRS.map(([dx, dz, n]) => [n, 0]));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (top(x, z) < 16) continue;
  for (const [dx, dz, n] of DIRS) if (top(x + dx, z + dz) < 16 && top(x, z) >= 16) faceLen[n]++;
}
const entranceDir = DIRS.find(([, , n]) => n === Object.keys(faceLen).sort((a, b) => faceLen[b] - faceLen[a])[0]);
const [edx, edz, eName] = entranceDir;
const faceCells = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (top(x, z) >= 16 && top(x + edx, z + edz) < 16) faceCells.push([x, z]);
}
faceCells.sort((a, b) => bay(a[0], a[1], edx) - bay(b[0], b[1], edx));
const mid = Math.floor(faceCells.length / 2) - 1;
const doorCell = faceCells[mid], glassCell = faceCells[mid + 1];

// Pass 2: the face articulation (piers, glazing, plant louvres) and the air gaps behind the glass.
const carve = [];
const entrance = new Set([`${doorCell}`, `${glassCell}`]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const R = tops[z][x]; if (!R) continue;
  for (let y = 1; y < R; y++) {
    // the recessed entrance (a corner cell can face two ways, so it is handled once, before the faces)
    if (y <= 3 && entrance.has(`${[x, z]}`) && top(x + edx, z + edz) < 16) {
      const isDoor = [x, z].join() === doorCell.join();
      if (isDoor && y <= 2) v.set(x, y, z, "dark_oak_door", { facing: FACING[eName], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else v.set(x, y, z, glassFor(y));
      carve.push({ at: [x - edx, y, z - edz], lantern: isDoor && y === 3 });
      continue;
    }
    for (const [dx, dz] of exposed(x, z, y)) {
      const p = bay(x, z, dx);
      const inward = [x - dx, y, z - dz];
      if (isLine(y) || y === R - 1) continue;
      if (R === 18 && y === R - 1) { if (p % 3 !== 0) v.set(x, y, z, "copper_grate"); continue; }
      if (p % 3 === 0) { v.set(x, y, z, "white_concrete"); continue; }
      if (!isWindowRow(y, R)) continue;
      v.set(x, y, z, glassFor(y));
      carve.push({ at: inward, lit: y >= 5 && (x * 7 + y * 13 + z * 29) % 7 === 0 });
    }
  }
}

// The air gap behind each window (a floor slab above and below), with warm light in some of them.
for (const c of carve) {
  const [x, y, z] = c.at;
  if (!top(x, z) || y >= top(x, z)) continue;
  if (c.lantern) v.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
  else if (c.lit) v.set(x, y, z, "glowstone");
  else v.set(x, y, z, "air");
}

// Roof equipment on the tower: small plant boxes with louvred tops, set on the 22-high coping.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (top(x, z) !== 22 || x % 6 !== 2 || z % 6 !== 2) continue;
  const inner = [[2, 0], [-2, 0], [0, 2], [0, -2]].every(([dx, dz]) => top(x + dx, z + dz) === 22);
  if (!inner) continue;
  v.set(x, 22, z, "light_gray_concrete"); v.set(x, 23, z, "gray_concrete");
  v.set(x + 1, 22, z, "light_gray_concrete"); v.set(x + 1, 23, z, "gray_concrete");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237126.nbt";
const r = v.save(out);
console.log(`way_332237126: ${r.blocks} blocks, ${r.palette} palette entries, entrance on the ${eName} face`);
