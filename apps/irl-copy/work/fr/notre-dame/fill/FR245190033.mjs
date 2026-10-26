// FR245190033: a Gothic chapel of the Palais de Justice (Sainte-Chapelle's type): a plinth of stone, a lower chapel with
// small windows, a tall upper chapel of pale limestone with stained-glass bays under a steep slate hip roof, and a spire
// tower at the west end where the lidar reads 51 blocks. Walls are a hollow shell (air behind the glass, a floor slab per
// storey); the roof is built as stepped stairs on the footprint's distance from its edge, so it reads pitched, not a prism.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245190033.cells.json`, "utf8"));

const X = 13, Z = 20, Y = 67;
const g = new Voxels([X, Y, Z]);

const STONE = "stone_bricks", LIMESTONE = "smooth_quartz", TRIM = "chiseled_stone_bricks", SLATE = "deepslate_tiles";
const SLATE_STAIRS = "deepslate_tile_stairs";
const EAVE = 36, STRING = 11, SPIRE = 51;
const GLASS = ["blue", "blue", "light_blue", "purple", "red", "blue"];

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { ground, roof });
const inMask = (x, z) => cell.has(key(x, z));
// [dx, dz, facing]: north is -z, south +z, east +x, west -x
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

// the lidar roof, median-smoothed over the 3x3 neighbourhood, clamped to clean tiers (lower wings stay low)
const med = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = cell.get(key(x + dx, z + dz)); if (c) v.push(c.roof); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};

// the spire: a 3x3 tower on the west end where the lidar roof is 51
const TOWER = new Set();
for (let z = 8; z <= 10; z++) for (let x = 0; x <= 2; x++) if (inMask(x, z)) TOWER.add(key(x, z));
const TOWER_CENTRE = [1, 9];

const perimeterFacing = (x, z) => DIRS.filter(([dx, dz]) => !inMask(x + dx, z + dz)).map(([, , f]) => f);
const isPerimeter = (x, z) => perimeterFacing(x, z).length > 0;

// distance from the outside, 1 on the edge: the hip roof climbs one block per cell in
const dist = new Map(); const queue = [];
for (const k of cell.keys()) { const [x, z] = k.split(",").map(Number); if (isPerimeter(x, z)) { dist.set(k, 1); queue.push([x, z]); } }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i]; const d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) { const k = key(x + dx, z + dz); if (inMask(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); } }
}

const topOf = (x, z) => {
  if (TOWER.has(key(x, z))) return SPIRE;
  const t = Math.min(44, Math.max(14, med(x, z)));
  return t >= EAVE + 1 ? Math.min(t, EAVE + dist.get(key(x, z))) : t;   // hall: hip climbs from the eave; wing: flat top
};
const isHall = (x, z) => !TOWER.has(key(x, z)) && Math.min(44, Math.max(14, med(x, z))) >= EAVE + 1;

const pane = (colour, facing) => {
  const along = facing === "north" || facing === "south";   // wall runs east-west: connect east and west
  return [`${colour}_stained_glass_pane`, { north: String(!along), south: String(!along), east: String(along), west: String(along), waterlogged: "false" }];
};

// the wall's own blocks at a height, by storey: plinth, lower chapel (small windows), string course, tall upper bays
const wallAt = (x, z, y, gr, facing, hall) => {
  const bay = (x + z) % 3 !== 0;   // a pier every third cell
  if (y === gr) return [STONE];
  if (y < STRING) {
    if (bay && y >= gr + 2 && y <= gr + 5) return pane("gray", facing);
    return [LIMESTONE];
  }
  if (y === STRING) return [TRIM];
  if (y === 12 || y === 34) return [STONE];
  if (hall && y === EAVE - 1) return [TRIM];   // cornice course
  if (y >= 13 && y <= 33 && bay) return pane(GLASS[(x * 5 + z * 3) % GLASS.length], facing);
  return [y >= 13 && y <= 33 ? STONE : LIMESTONE];
};

// roof stair: the step faces the neighbour one block lower (or the outside on the edge), else a full slate block
const stepFacing = (x, z, top) => {
  for (const [dx, dz, f] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inMask(nx, nz)) { if (top - 1 === EAVE) return f; continue; }
    if (TOWER.has(key(nx, nz))) continue;
    if (topOf(nx, nz) === top - 1) return f;
  }
  return null;
};

for (const k of cell.keys()) {
  const [x, z] = k.split(",").map(Number);
  const { ground: gr } = cell.get(k);
  const perim = isPerimeter(x, z), facings = perimeterFacing(x, z);
  const hall = isHall(x, z), top = topOf(x, z);
  const wallTop = TOWER.has(k) ? EAVE : hall ? EAVE : top - 1;

  for (let y = 0; y < gr; y++) g.set(x, y, z, STONE);   // foundation under the lower ground
  g.set(x, gr, z, STONE);                                 // ground floor, or the plinth on the edge
  if (!TOWER.has(k)) for (let y = gr + 1; y < wallTop; y++) {
    if (perim) { const [b, st] = wallAt(x, z, y, gr, facings[0], hall); g.set(x, y, z, b, st); }
    else if (y === STRING) g.set(x, y, z, LIMESTONE);     // interior storey floor
  }
  if (!perim && !TOWER.has(k) && STRING > gr) g.set(x, STRING, z, LIMESTONE);

  if (TOWER.has(k)) {
    for (let y = EAVE; y < 43; y++) g.set(x, y, z, LIMESTONE);
    const outward = [x === 0 ? "west" : x === 2 ? "east" : null, z === 8 ? "north" : z === 10 ? "south" : null].filter(Boolean);
    if (x === TOWER_CENTRE[0] && z === TOWER_CENTRE[1]) g.set(x, 43, z, SLATE);
    else g.set(x, 43, z, SLATE_STAIRS, { facing: outward[0] ?? outward[1], half: "bottom", shape: "straight", waterlogged: "false" });
    continue;
  }

  if (hall) {
    for (let y = EAVE; y < top; y++) {
      const f = y === top - 1 ? stepFacing(x, z, top) : null;
      if (f) g.set(x, y, z, SLATE_STAIRS, { facing: f, half: "bottom", shape: "straight", waterlogged: "false" });
      else g.set(x, y, z, SLATE);
    }
    // warm light: lanterns hung from the vault, glowstone on the upper floor under some bays
    if (!perim && (dist.get(k) ?? 0) >= 2) {
      if ((x * 5 + z * 3) % 11 === 0) g.set(x, EAVE - 1, z, "lantern", { hanging: "true", waterlogged: "false" });
      if ((x + 2 * z) % 7 === 0) g.set(x, 12, z, "glowstone");
    }
  } else {
    g.set(x, top - 1, z, SLATE);   // lower wing: a flat slate roof
  }
}

// spire: a 1x1 needle up to the lidar's 51, a lightning rod at the tip
const [sx, sz] = TOWER_CENTRE;
for (let y = 44; y < SPIRE - 1; y++) g.set(sx, y, sz, SLATE);
g.set(sx, SPIRE - 1, sz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// the west entrance on the north edge: a dark oak door under a stone arch
g.set(3, 0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(3, 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 2; x <= 4; x++) g.set(x, 2, 0, TRIM);

const { blocks, palette } = g.save(`${DIR}/FR245190033.nbt`);
console.log(`FR245190033.nbt: ${blocks} blocks, ${palette} palette entries`);
