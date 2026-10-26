// FR245184455: a residential block of 1900 on the Paris footprint (12 x 11 cells, flat ground). Haussmann massing: a plinth,
// a rusticated ground floor, four floors of limestone between stone string courses, the lidar's flat 29-block roof read
// as a mansard that steps in one cell per row, with dormers and chimney stacks rising to 33. The central bay projects
// one cell onto the street and carries the entrance. Every column stands on the plinth and each storey on a full floor.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184455.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184455.nbt";

const W = 12, D = 11, H = 36;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const FLOORS = [0, 5, 9, 13, 17, 21, 25];   // floor slabs: ground, then every 4 rows above the 5-row ground storey
const MANSARD = 26;                          // rows 26-28 step in; the flat top is at 29
const TOP = 29;
const PLINTH = "polished_andesite", STONE = "smooth_stone", STRING = "smooth_sandstone", RUSTIC = "stone_bricks";
const LIMESTONE = "calcite", ROOF = "deepslate_tiles", ROOF_STAIR = "deepslate_tile_stairs", PANE = "glass_pane";
const key = (x, z) => `${x},${z}`;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]
const inFp = (x, z) => cellRoof.has(key(x, z));
const cellRoof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));

// Lidar roof: the 3x3 median of each cell's footprint neighbourhood. Every median here is 26 or more (the west edge's
// low single readings are edge noise), so the roof is one flat tier at 29. The record's 33 is carried by the chimneys.
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const roofTier = (x, z) => {
  const around = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) around.push(cellRoof.get(key(x + dx, z + dz)));
  return median(around) >= 26 ? TOP : median(around);
};

// Distance from the street edge: 1 on the perimeter, one more per cell inward (breadth-first over the footprint).
const dist = new Map();
let queue = [];
for (const [k] of cellRoof) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz))) { dist.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const k = key(x + dx, z + dz);
    if (inFp(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}

// Exposed sides: the neighbours outside the footprint (the facade faces).
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const isShell = (x, z) => inFp(x, z) && dist.get(key(x, z)) === 1;

const g = new Voxels([W, H, D]);
const storeyBase = (y) => FLOORS.filter((f) => f <= y).pop();

// Pane and bar connections: a window joins the wall or window cells beside it in its own plane.
const planeStates = (x, z, ex) => {
  const [dx, dz] = ex[0];
  const join = (a, b) => (isShell(a, b) ? "true" : "false");
  if (dx !== 0) return { north: join(x, z - 1), south: join(x, z + 1), east: "false", west: "false" };
  return { north: "false", south: "false", east: join(x + 1, z), west: join(x - 1, z) };
};

for (const [k, r] of cellRoof) {
  const [x, z] = k.split(",").map(Number), d = dist.get(k), tier = roofTier(x, z), ex = exposed(x, z);
  const xFace = ex.some(([dx]) => dx !== 0), zFace = ex.some(([, dz]) => dz !== 0);
  const corner = xFace && zFace;
  const along = xFace ? z : x;

  // plinth and floor slabs run across the whole footprint; the shell's are the plinth's and the string courses' faces
  g.set(x, 0, z, d === 1 ? PLINTH : STONE);
  for (const f of FLOORS.slice(1)) g.set(x, f, z, d === 1 ? STRING : STONE);

  // mansard: the step in row j is the ring j cell (ring 0 is the eave); cells inside it are solid, outside it open
  for (let y = MANSARD; y < tier; y++) {
    const j = y - MANSARD, ring = d - 1;
    if (ring < j) continue;
    if (ring > j) { g.set(x, y, z, ROOF); continue; }
    const out = DIRS.find(([dx, dz]) => !inFp(x + dx, z + dz) || dist.get(key(x + dx, z + dz)) < d);
    if (out) g.set(x, y, z, ROOF_STAIR, { facing: FACING[out.join(",")], half: "bottom", shape: "straight", waterlogged: "false" });
    else g.set(x, y, z, ROOF);
  }

  // walls: the shell only; the interior stays air behind the glass
  if (d !== 1) continue;
  for (let y = 1; y < MANSARD; y++) {
    if (FLOORS.includes(y)) continue;
    const b = storeyBase(y), o = y - b, ground = b === 0;
    if (corner) { g.set(x, y, z, ground ? RUSTIC : STRING); continue; }
    const win = along % 3 !== 0;                                     // 2-wide windows between 1-wide piers
    if (ground) {
      if (o === 4) g.set(x, y, z, RUSTIC);                           // rusticated lintel
      else if (win) g.set(x, y, z, PANE, planeStates(x, z, ex));
      else g.set(x, y, z, RUSTIC);
      continue;
    }
    if (o === 3) g.set(x, y, z, LIMESTONE);                          // lintel
    else if (win && (o === 1 || o === 2)) {
      if (b === 9 && o === 1) g.set(x, y, z, "iron_bars", planeStates(x, z, ex));   // 2nd-floor balconette rail
      else g.set(x, y, z, PANE, planeStates(x, z, ex));
    } else g.set(x, y, z, LIMESTONE);
  }
}

// Entrance: a dark oak door in the projecting central bay, its transom glazed, and a lantern standing in the hall.
const door = { x: 6, z: 0 }, facing = "north";
g.set(door.x, 1, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(door.x, 2, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(door.x, 3, door.z, PANE, { north: "false", south: "false", east: "false", west: "false" });
g.set(door.x, 1, door.z + 1, "lantern", { hanging: "false", waterlogged: "false" });

// Warm lights: a lantern or glowstone standing on the floor just inside some first-floor windows.
for (const [k] of cellRoof) {
  const [x, z] = k.split(",").map(Number);
  if (!isShell(x, z)) continue;
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const [dx, dz] = ex[0], along = dx !== 0 ? z : x;
  for (const b of [9, 13, 17, 21]) {
    if (along % 3 === 0) continue;
    const ix = x - dx, iz = z - dz;
    if (!inFp(ix, iz) || dist.get(key(ix, iz)) === 1) continue;
    if (g.val(ix, b + 1, iz) !== 0) continue;
    if (b === 9 && along % 6 === 1) g.set(ix, b + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    if (b === 13 && along % 6 === 4) g.set(ix, b + 1, iz, "glowstone");
    if (b === 17 && along % 6 === 1) g.set(ix, b + 1, iz, "glowstone");
    if (b === 21 && along % 6 === 4) g.set(ix, b + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Dormers: panes in the second mansard step on the street faces, and chimney stacks rising from the flat top.
for (const [k] of cellRoof) {
  const [x, z] = k.split(",").map(Number), d = dist.get(k), ex = exposed(x, z);
  if (d !== 2 || ex.length || !DIRS.some(([dx, dz]) => dist.get(key(x + dx, z + dz)) === 1)) continue;
  const out = DIRS.find(([dx, dz]) => dist.get(key(x + dx, z + dz)) === 1);
  const along = out[0] !== 0 ? z : x;
  if (along % 6 === 4) g.set(x, MANSARD + 1, z, PANE, { north: "false", south: "false", east: "false", west: "false" });
}
for (const [x, z] of [[3, 4], [8, 4], [5, 7]]) {
  if (dist.get(key(x, z)) < 4) continue;
  g.set(x, TOP, z, "stone_bricks"); g.set(x, TOP + 1, z, "stone_bricks"); g.set(x, TOP + 2, z, "stone_bricks");
  g.set(x, TOP + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const info = g.save(OUT);
console.log(`built ${OUT}: ${info.blocks} blocks, palette ${info.palette}`);
