// 1803 Connecticut Ave NW: a c. 1910s red-brick commercial block (Dupont-Kalorama corner-shop type) with a
// shopfront on the Connecticut side (+z face), limestone plinth, storey band and cornice. The lidar roof is quantised
// to three flat tiers (8 on the tall west/core, 6 on the shoulders, 4 on the low east wing) so the massing steps
// down rather than rolling. Every footprint column is solid from its ground (y = g) to its tier top, with floor
// slabs at the ground floor and at y 4, so nothing floats; the exposed faces are the facade, the interior is air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC79154.cells.json`, "utf8"));

const W = 13, H = 20, D = 11;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const tier = (roof) => (roof >= 7 ? 8 : roof >= 5 ? 6 : 4);
const col = new Map();                                   // "x,z" -> { g: ground, t: tier top (exclusive) }
for (const [x, z, ground, roof] of cells) col.set(key(x, z), { g: ground, t: tier(roof) });
const solid = (x, y, z) => { const c = col.get(key(x, z)); return !!c && y >= c.g && y < c.t; };

// Directions of the four walls; a face is exposed where its neighbour is outside the envelope at that row.
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const FRONT = (dx, dz, z) => dz === 1 && z === D - 1;     // the Connecticut Avenue face, south (+z)
const DOOR_X = 5;
const panes = new Map();                                 // "x,y,z" -> the axis the pane runs along
const pk = (x, y, z) => `${x},${y},${z}`;

const BRICK = "bricks", STONE = "stone_bricks", SLAB = "stone_brick_slab", DECK = "smooth_stone";
const GLASS = "glass_pane";
const BAND = 4;                                          // the storey line on the 8-block tiers

// Window rows: the ground storey (g+1..g+2) and the upper storey, under the cornice, skipping the storey band.
const windowRow = (y, c) => y >= c.g + 1 && y <= c.t - 2 && !(c.t === 8 && y === BAND);

// The face a row presents: exposed sides (horizontal), and whether the row is the top or the plinth.
function exposed(x, y, z) { return DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz)); }

// Pane or wall for a shell cell on one exposed face.
function faceBlock(x, y, z, [dx, dz], c) {
  const along = dx !== 0 ? z : x;
  if (FRONT(dx, dz, z)) {
    if (y >= c.g + 1 && y <= c.g + 2) {                   // shopfront: glass between brick piers, the door bay open
      if (x % 4 === 0) return BRICK;
      if (x === DOOR_X) return null;
      return "pane";
    }
  }
  if (!windowRow(y, c)) return BRICK;
  if (along % 3 === 1) return "pane";
  return BRICK;
}

// ---- foundation: solid from y 0 up to each cell's ground ----
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.g; y++) g.set(x, y, z, STONE);
}

// ---- envelope: shell walls on exposed faces, floor slabs and air inside ----
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.g; y < c.t; y++) {
    const ex = exposed(x, y, z);
    const shell = ex.length > 0;
    if (y === c.t - 1) {                                  // roof: cornice cap on the shell, a deck inside
      if (shell) g.set(x, y, z, SLAB, { type: "top", waterlogged: "false" });
      else g.set(x, y, z, DECK);
      continue;
    }
    if (y === c.g) {                                      // plinth on the shell, ground-floor slab inside
      g.set(x, y, z, shell ? STONE : DECK);
      continue;
    }
    if (!shell) {                                         // interior: the upper floor slab, else air
      if (y === BAND && y < c.t - 1) g.set(x, y, z, DECK);
      continue;
    }
    if (ex.length >= 2 || (c.t === 8 && y === BAND)) {    // quoins at the corners; the storey band on the 8s
      g.set(x, y, z, STONE);
      continue;
    }
    const b = faceBlock(x, y, z, ex[0], c);
    if (b === "pane") {
      const alongZ = ex[0][0] !== 0;                      // an x-facing wall runs along z: the pane joins north/south
      const onOff = (v) => (v ? "true" : "false");
      g.set(x, y, z, GLASS, { north: onOff(alongZ), south: onOff(alongZ), east: onOff(!alongZ), west: onOff(!alongZ), waterlogged: "false" });
      panes.set(pk(x, y, z), true);
    } else if (b) g.set(x, y, z, b);
    // b === null: the door bay (set below)
  }
}

// ---- sills: the brick course under each pane's bottom row is a top-half slab ----
for (const k of panes.keys()) {
  const [x, y, z] = k.split(",").map(Number);
  if (panes.has(pk(x, y - 1, z))) continue;
  const c = col.get(key(x, z));
  if (y - 1 < c.g + 1) continue;                          // not on the plinth
  const ex = exposed(x, y - 1, z);
  if (ex.length !== 1) continue;
  g.set(x, y - 1, z, SLAB, { type: "top", waterlogged: "false" });
}

// ---- entrance: a door on the shopfront, its lintel band, a hanging lantern inside ----
const doorC = col.get(key(DOOR_X, D - 1));
const doorBase = doorC.g + 1;
const doorStates = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(DOOR_X, doorBase, D - 1, "dark_oak_door", doorStates("lower"));
g.set(DOOR_X, doorBase + 1, D - 1, "dark_oak_door", doorStates("upper"));
// the door-bay lintel: a dark timber fascia across the bay above the door (a shopfront canopy, inset in the footprint)
for (let x = DOOR_X - 1; x <= DOOR_X + 1; x++) g.set(x, doorBase + 2, D - 1, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
g.set(DOOR_X, doorBase + 1, D - 2, "lantern", { hanging: "true", waterlogged: "false" });

// ---- interior lights: lanterns standing on the floor slabs behind selected windows ----
const lamp = (x, y, z) => g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
for (const x of [2, 8, 11]) {
  const c = col.get(key(x, D - 1));
  if (c && c.t >= 6) lamp(x, c.g + 1, D - 2);             // ground floor, behind the shopfront
}
for (const [x, z] of [[9, 6], [8, 8]]) {
  const c = col.get(key(x, z));
  if (c && c.t === 8) lamp(x, 5, z);                      // upper floor, standing on the y 4 slab
}

// ---- roof: mechanical boxes on the 8-block tier (above the cornice cap) ----
for (let x = 5; x <= 6; x++) for (let z = 7; z <= 8; z++) g.set(x, 8, z, "light_gray_concrete");
g.set(5, 9, 7, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });

g.save(`${DIR}/DC79154.nbt`);
