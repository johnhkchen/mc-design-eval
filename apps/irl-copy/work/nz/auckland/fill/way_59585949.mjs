// Crombie Lockwood Centre, Auckland CBD edge (way 59585949): a 1970s-80s concrete-and-tinted-glass office block.
// Massing from the lidar roof record: a four-storey podium (top at y 18) with a five-storey tower core (top at y 22)
// stepping back on a two-block terrace ring, and a plant room on the tower's crown (lidar 24).
// Every storey is a 4-block module: a floor slab, a white spandrel, two rows of glazing, then the next slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_59585949.cells.json", "utf8"));
const key = (x, z) => `${x},${z}`;
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const inFP = (x, z) => roof.has(key(x, z));
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

// Tower mask: lidar roof at or above 20. Its distance inward from the non-tower cells (outside the footprint or podium)
// sets the setback: the core (distance 3 and more) is five storeys, the two-block ring around it stays on the podium.
const isTower = (x, z) => inFP(x, z) && roof.get(key(x, z)) >= 20;
const dist = new Map();
const queue = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!isTower(x, z)) { dist.set(key(x, z), 0); queue.push([x, z]); }
}
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (isTower(x, z) && DIRS.some(([dx, dz]) => !inFP(x + dx, z + dz))) { dist.set(key(x, z), 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz, nk = key(nx, nz);
    if (isTower(nx, nz) && !dist.has(nk)) { dist.set(nk, d + 1); queue.push([nx, nz]); }
  }
}

// Storeys per cell: 4 on the podium and ring, 5 in the tower core. Roof deck at y = 4N + 1, parapet at 4N + 2.
const storeys = (x, z) => (isTower(x, z) && dist.get(key(x, z)) >= 3 ? 5 : 4);
// Plant room: the crown of the core where the lidar reads 24 (two blocks above the tower's 22).
const plant = (x, z) => storeys(x, z) === 5 && dist.get(key(x, z)) >= 4 && roof.get(key(x, z)) >= 23;

// A wall face is exposed where the neighbour is outside the footprint or its deck sits below this level.
const exposedDir = (x, z, y) => {
  for (const [dx, dz, name] of DIRS) {
    if (!inFP(x + dx, z + dz)) return name;
    if (storeys(x + dx, z + dz) * 4 + 1 < y) return name;
  }
  return null;
};
// The parapet crowns the outer edge of each tier: outside the footprint, or beside a lower tier.
const parapetExposed = (x, z) => DIRS.some(([dx, dz]) => !inFP(x + dx, z + dz) || storeys(x + dx, z + dz) < storeys(x, z));

// Entrances: a few ground-floor bays on the outer wall, one block-wide door with a stone hood above.
const isDoor = (x, z) => exposedDir(x, z, 2) !== null && (x * 5 + z * 3) % 61 === 0;
const isMullion = (x, z) => (x + z) % 3 === 0;
const doorFacing = (x, z) => exposedDir(x, z, 2);

// Warm light: a hanging lantern in the room behind a glazed bay, off the glazing row's inner face.
const lanternBehindGlass = (x, z, y) => {
  if (exposedDir(x, z, y)) return false;
  const k = Math.floor((y - 1) / 4);
  if ((x * 7 + z * 11 + k * 3) % 6 !== 0) return false;
  return DIRS.some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return inFP(nx, nz) && exposedDir(nx, nz, y) && !isMullion(nx, nz) && !isDoor(nx, nz) && storeys(nx, nz) * 4 + 1 >= y;
  });
};

const g = new Voxels([80, 37, 130]);
const counts = { stone: 0, slab: 0, spandrel: 0, glass: 0, mullion: 0, door: 0, lantern: 0, plant: 0, parapet: 0 };

for (const [x, , z] of cells.map(([x, z]) => [x, 0, z])) {
  const N = storeys(x, z), deck = 4 * N + 1;
  const put = (y, block, state) => { g.set(x, y, z, block, state); };
  // foundation under the whole footprint
  put(0, "stone_bricks"); counts.stone++;
  if (plant(x, z)) {
    put(22, "gray_concrete"); put(23, "light_gray_concrete"); counts.plant++;
  }
  for (let y = 1; y <= deck; y++) {
    if (plant(x, z) && (y === 22 || y === 23)) continue;
    const k = Math.floor((y - 1) / 4), r = (y - 1) % 4;
    if (r === 0) {                                  // floor slab (the storey line); the plinth at y 1 on the outer edge
      if (k === 0 && exposedDir(x, z, y)) { put(y, "stone_bricks"); counts.stone++; }
      else { put(y, "light_gray_concrete"); counts.slab++; }
      continue;
    }
    const dir = exposedDir(x, z, y);
    if (!dir) {                                     // interior air, except the lanterns hung from each ceiling
      if (r === 3 && lanternBehindGlass(x, z, y)) { put(y, "lantern", { hanging: "true", waterlogged: "false" }); counts.lantern++; }
      continue;
    }
    if (k === 0 && isDoor(x, z)) {                  // entrance: door at y 2-3, a stone hood at y 4
      if (r === 1) put(y, "dark_oak_door", { facing: doorFacing(x, z), half: "lower", hinge: "left", open: "false", powered: "false" });
      if (r === 2) put(y, "dark_oak_door", { facing: doorFacing(x, z), half: "upper", hinge: "left", open: "false", powered: "false" });
      if (r === 3) put(y, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      counts.door++;
      continue;
    }
    if (r === 1) {                                  // spandrel panel, or the base course on the ground floor
      if (k === 0) put(y, "polished_andesite");
      else put(y, "white_concrete");
      counts.spandrel++;
      continue;
    }
    if (isMullion(x, z)) { put(y, "gray_concrete"); counts.mullion++; }
    else { put(y, "light_blue_stained_glass"); counts.glass++; }
  }
  if (parapetExposed(x, z) && deck + 1 <= 36 && !plant(x, z)) { put(deck + 1, "light_gray_concrete"); counts.parapet++; }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_59585949.nbt");
const tiers = { podium: 0, core: 0, ring: 0 };
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (storeys(x, z) === 5) tiers.core++;
  else if (isTower(x, z)) tiers.ring++;
  else tiers.podium++;
}
console.log(JSON.stringify({ cells: cells.length, tiers, counts, saved: info }));
