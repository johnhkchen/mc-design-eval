// Way 170800699, Eden Terrace / Newton edge: a 1970s reinforced-concrete office-apartment block, ten storeys on a
// stone plinth. Three flat tiers follow the lidar roof: a podium (roof 14), a mid block (roof 34) and a tower on the
// south-west core (roof 42, the lidar's 39-42 cells). The shell is solid concrete with a one-block air gap behind the
// glass, a floor band every storey, piers between window bays, a cornice on each tier, and a canopied entrance on the
// north face. A few windows show warm light from behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_170800699.cells.json`, "utf8"));

const [W, H, D] = [17, 55, 19];
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const roofAt = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const inF = (x, z) => roofAt.has(key(x, z));
// the north and east edges step back to the podium: a one-cell terrace at the fourth storey's roof
const onNorthOrEast = (x, z) => !inF(x, z - 1) || !inF(x + 1, z);
const mid = (x, z) => inF(x, z) && roofAt.get(key(x, z)) >= 35 && !onNorthOrEast(x, z);
const tower = (x, z) => mid(x, z) && roofAt.get(key(x, z)) >= 39 && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => mid(x + a, z + b));

// the top row of each cell's tier (its roof deck): 14 podium, 34 mid block, 42 tower; -1 outside the footprint
const top = (x, z) => (!inF(x, z) ? -1 : tower(x, z) ? 42 : mid(x, z) ? 34 : 14);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the sides of a cell at height y that face air (outside the footprint, or onto a lower tier)
const exposed = (x, y, z) => DIRS.filter(([a, b]) => top(x + a, z + b) < y);

// the door: north face, two cells wide-ish, on the lower storey
const DOOR_X = 4, DOOR_Z = 0;
const isDoor = (x, y, z) => x === DOOR_X && z === DOOR_Z && (y === 3 || y === 4);

// the air gap behind each window: the cell just inside a glass cell, two rows tall
const gaps = new Set();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  for (let y = 3; y <= top(x, z) - 1; y++) {
    const r = (y - 2) % 4;
    if (r !== 1 && r !== 2) continue;
    const ex = exposed(x, y, z);
    if (!ex.length || isPier(x, y, z) || isDoor(x, y, z)) continue;
    const [dx, dz] = ex[0];
    const ix = x - dx, iz = z - dz;
    if (inF(ix, iz) && top(ix, iz) >= y && !exposed(ix, y, iz).length) gaps.add(`${ix},${y},${iz}`);
  }
}

// piers: every third cell along a face, and every corner
function isPier(x, y, z) {
  const ex = exposed(x, y, z);
  if (ex.length >= 2) return true;
  const [dx] = ex[0] ?? [0];
  return dx !== 0 ? z % 3 === 0 : x % 3 === 0;
}

function skin(x, y, z) {
  const t = top(x, z);
  const ex = exposed(x, y, z);
  if (y === t) return ex.length ? ["smooth_stone"] : ["gray_concrete"];   // cornice or roof deck
  if (y < 2) return ex.length ? ["stone_bricks"] : ["stone"];              // plinth and foundation
  if (!ex.length) return ["stone"];                                        // solid core
  if (y === 2) return ["stone_bricks"];                                    // base course
  const r = (y - 2) % 4;
  if (r === 0) return ["smooth_stone"];                                     // floor band
  if (r === 3) return ["light_gray_concrete"];                              // spandrel
  if (isDoor(x, y, z)) return ["door"];
  if (isPier(x, y, z)) return ["white_concrete"];
  return ["glass"];
}

const place = (x, y, z, b, state) => g.set(x, y, z, b, state);

// roof plant: a 3 x 3 box on the tower deck, where the tower is widest
const towerCells = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (tower(x, z)) towerCells.push([x, z]);
let plant = null;
for (const [cx, cz] of towerCells) {
  const box = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) box.push([cx + dx, cz + dz]);
  if (box.every(([x, z]) => tower(x, z)) && (!plant || cz > plant[1])) plant = [cx, cz];
}

// the building: every footprint cell from the foundation to its tier's deck
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const t = top(x, z);
  for (let y = 0; y <= t; y++) {
    const ex = exposed(x, y, z);
    if (y >= 2 && y <= t - 1 && gaps.has(`${x},${y},${z}`)) {
      // warm light behind some windows: glowstone low, a hanging lantern high
      const r = (y - 2) % 4;
      if (r === 1 && (x + z + Math.floor(y / 4)) % 4 === 0) place(x, y, z, "glowstone");
      else if (r === 2 && (x * 3 + z + Math.floor(y / 4)) % 7 === 0) place(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;   // the rest of the gap is air
    }
    if (isDoor(x, y, z)) {
      place(x, y, z, "dark_oak_door", { facing: "north", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const s = skin(x, y, z);
    if (s[0] === "door") continue;
    if (s[0] === "glass") place(x, y, z, "light_blue_stained_glass");
    else place(x, y, z, s[0]);
  }
  // the terraces: a rail on the outer edge of a podium roof
  if (t === 14) for (const [a, b] of exposed(x, 15, z)) {
    if (!inF(x + a, z + b)) place(x, 15, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
}

// the entrance canopy: a cantilevered slab over the door, two deep, with a lantern hanging under it
for (let x = DOOR_X - 1; x <= DOOR_X + 1; x++) for (let z = -2; z <= -1; z++) place(x, 5, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
place(DOOR_X, 4, -1, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant on the tower
if (plant) for (let y = 43; y <= 44; y++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) place(plant[0] + dx, y, plant[1] + dz, "light_gray_concrete");

// support check: every block has a solid block below it or beside it, from the foundation up
const solid = (x, y, z) => { if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return false; return g.get(x, y, z) !== null; };
let floating = 0;
for (let y = 1; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!solid(x, y, z)) continue;
  const side = DIRS.some(([a, b]) => solid(x + a, y, z + b));
  if (!solid(x, y - 1, z) && !side) floating++;
}

const out = g.save(`${DIR}/way_170800699.nbt`);
console.log(JSON.stringify({ cells: cells.length, tower: towerCells.length, gaps: gaps.size, floating, ...out }));
