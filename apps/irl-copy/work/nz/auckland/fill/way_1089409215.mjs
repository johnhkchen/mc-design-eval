// Life Apartments, Auckland (Mt Eden end of the CBD): a 1990s-2000s concrete-frame apartment block. Fifteen storeys of
// white concrete with light-grey storey belts and dark mullions, blue-tinted glazing, a lower wing on the western side, a
// lift core above the tower roof, and a glazed lobby on the south face. Storey lines are absolute (every 4 blocks), so
// the floors line up across the slope; each column stands on the fill beneath it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1089409215.cells.json`, "utf8"));

const WALL = "white_concrete", BELT = "light_gray_concrete", FRAME = "white_concrete", GLASS = "light_blue_stained_glass_pane";
const BASE = "stone_bricks", FOUND = "stone", DECK = "polished_andesite", PLANT = "light_gray_concrete";
const LIGHTS = ["glowstone", "shroomlight"];
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];                // N, E, S, W (z grows south)
const DIR_KEY = ["north", "east", "south", "west"];
const key = (x, z) => `${x},${z}`;

// The lidar roof smoothed into flat tiers: wing 53, tower 63, lift core 65. Stray readings (2, 4, 14, 52...) take the
// tier most of their neighbours have, 63 if none do.
const tierOf = (r) => (r >= 60 ? (r === 65 ? 65 : 63) : r >= 50 && r <= 56 ? 53 : null);
const first = new Map(cells.map(([x, z, gnd, roof]) => [key(x, z), { x, z, gnd, roof: tierOf(roof) }]));
const cellsList = [];
for (const c of first.values()) {
  let R = c.roof;
  if (R === null) {
    const votes = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const t = first.get(key(c.x + dx, c.z + dz))?.roof;
      if (t != null) votes.set(t, (votes.get(t) || 0) + 1);
    }
    R = votes.size ? [...votes].sort((a, b) => b[1] - a[1])[0][0] : 63;
  }
  cellsList.push({ x: c.x, z: c.z, gnd: c.gnd, R });
}
const at = new Map(cellsList.map((c) => [key(c.x, c.z), c]));

// a face is exposed at height y if the air beside it is outside the footprint or lower than y
const exposed = (c, y, d) => {
  const n = at.get(key(c.x + DIRS[d][0], c.z + DIRS[d][1]));
  return !n || n.R <= y;
};
const isWall = (c, y) => [0, 1, 2, 3].some((d) => exposed(c, y, d));

// the role of the block at (c, y) for a standing building column; null is air
function roleAt(c, y) {
  const ex = [0, 1, 2, 3].map((d) => exposed(c, y, d));
  const wall = ex.some(Boolean);
  if (y === c.gnd) return wall ? BASE : BELT;                     // base course; floor slab inside
  if (y === c.R - 1) return wall ? WALL : DECK;                   // parapet ring; roof deck inside
  if (y === c.R - 2 && wall) return BELT;                         // cornice line
  const row = y % 4;                                              // storey: 0 slab, 1-2 glass, 3 spandrel
  if (!wall) return row === 0 ? BELT : null;
  if (row === 0) return BELT;
  if (row === 3) return WALL;
  const corner = (ex[0] || ex[2]) && (ex[1] || ex[3]);
  const bay = ex[0] || ex[2] ? c.x : c.z;                         // a mullion every third bay along the face
  return corner || bay % 3 === 0 ? FRAME : GLASS;
}

// the lobby: the south-face wall cell at ground level nearest the middle of the building, lowest ground first
const southFace = cellsList.filter((c) => exposed(c, c.gnd, 2));
const minGnd = Math.min(...southFace.map((c) => c.gnd));
const entrance = southFace.filter((c) => c.gnd === minGnd).sort((a, b) => Math.abs(a.x - 16) - Math.abs(b.x - 16))[0];

const v = new Voxels([32, 78, 31]);
const glass = [];
for (const c of cellsList) {
  for (let y = 0; y < c.gnd; y++) v.set(c.x, y, c.z, FOUND);       // fill under the ground
  for (let y = c.gnd; y < c.R; y++) {
    const role = roleAt(c, y);
    if (role === GLASS) glass.push([c, y]);
    if (role) v.set(c.x, y, c.z, role);
  }
}

// behind some windows, a warm light in the first interior cell (the air gap behind the glass)
for (const [c, y] of glass) {
  if ((c.x * 31 + y * 17 + c.z * 7) % 9 !== 0) continue;
  const d = [0, 1, 2, 3].find((i) => exposed(c, y, i));
  if (d === undefined) continue;
  const inner = at.get(key(c.x + DIRS[(d + 2) % 4][0], c.z + DIRS[(d + 2) % 4][1]));
  if (!inner || inner.gnd > y || inner.R <= y || isWall(inner, y)) continue;
  v.set(inner.x, y, inner.z, LIGHTS[(c.x + y) % LIGHTS.length]);
}

// the lobby door (lower and upper half) and a lintel over it
{
  const { x, z, gnd } = entrance;
  const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
  v.set(x, gnd, z, "iron_door", { ...door, half: "lower" });
  v.set(x, gnd + 1, z, "iron_door", { ...door, half: "upper" });
  v.set(x, gnd + 2, z, BELT);
}

// roof plant on the wing and the tower roofs: a single box two blocks high on the deck, in the interior
for (const c of cellsList) {
  if (c.R !== 53 && c.R !== 63) continue;
  if (c.x % 9 !== 4 || c.z % 9 !== 4) continue;
  const inside = [0, 1, 2, 3].every((i) => at.get(key(c.x + DIRS[i][0], c.z + DIRS[i][1]))?.R >= c.R);
  if (!inside) continue;
  v.set(c.x, c.R, c.z, PLANT);
  v.set(c.x, c.R + 1, c.z, PLANT);
}

// glass panes connect to whatever they touch, as a pane does in the world
for (const [c, y] of glass) {
  const state = { waterlogged: "false" };
  DIRS.forEach(([dx, dz], i) => {
    state[DIR_KEY[i]] = v.get(c.x + dx, y, c.z + dz) ? "true" : "false";
  });
  v.set(c.x, y, c.z, GLASS, state);
}

const out = v.save(`${DIR}/way_1089409215.nbt`);
console.log(`Life Apartments: ${cellsList.length} cells, ${out.blocks} blocks, ${out.palette} palette entries`);
