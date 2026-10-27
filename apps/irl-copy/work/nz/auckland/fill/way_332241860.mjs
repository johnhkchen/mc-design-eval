// Way 332241860: a 1920s-style brick commercial block on Mt Eden / Newton's lower slope (roof ~13 blocks = three
// storeys of 4 under a cornice and parapet). Massing follows the lidar roof per cell; the ring of cells on the
// outside (or stepping down by 2+) is the facade: a plinth, glass shopfront / office windows in brick bays with
// cream pilasters, storey lintels, a cornice and a stone parapet. The core is solid; behind each window is one
// air cell (the air gap), and some windows hold a warm light.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241860.cells.json", "utf8"));
const [W, H, D] = [18, 25, 21];
const g = new Voxels([W, H, D]);

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, roof });
const at = (x, z) => cell.get(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

// A side is facade when the neighbour is off the footprint or stands two or more blocks lower (a stepped tier).
const open = (x, z, c, d) => { const [dx, dz] = DIRS[d]; const n = at(x + dx, z + dz); return !n || n.roof < c.roof - 1; };
const ringSides = (x, z, c) => Object.keys(DIRS).filter((d) => open(x, z, c, d));
const sideBay = (x, z, sides) => {
  const ns = sides.some((d) => d === "N" || d === "S"), ew = sides.some((d) => d === "E" || d === "W");
  if (ns && ew) return null;                       // a corner of the stepped outline: brick with piers, no glass
  return ns ? x : z;                               // a north/south face is set out along x; an east/west face along z
};

// Facade rows for a ring cell of roof height R (solid below R; the top row is the cornice).
const GLASS = new Set([2, 3, 6, 7, 10]);
function facadeBlock(y, R, pier, glass) {
  const top = R - 1;
  if (y === 0) return "stone_bricks";              // foundation / plinth
  if (y === top) return "smooth_quartz";           // cornice or roof edge
  if (y === 1) return "polished_andesite";         // base course at street level
  if (GLASS.has(y)) return pier ? (y <= 3 ? "polished_andesite" : "smooth_quartz") : glass ? "glass_pane" : "bricks";
  return pier ? "smooth_quartz" : "bricks";        // lintel and sill rows, and the brick wall between the glass
}

const LIT = { 2: "glowstone", 6: "shroomlight", 10: "glowstone" };

// 1. Core: solid from the foundation (y 0) up to each cell's roof; the deck is smooth stone.
const info = [];
for (const [x, z, ground, roof] of cells) {
  const c = { ground, roof }, sides = ringSides(x, z, c), ring = sides.length > 0;
  info.push({ x, z, c, sides, ring, bay: sideBay(x, z, sides) });
  for (let y = 0; y < roof; y++) g.set(x, y, z, y === roof - 1 ? "smooth_stone" : "stone_bricks");
}

// 2. Facade: the ring cells, bay by bay (a pier every third bay), glass in the others.
for (const f of info) {
  if (!f.ring) continue;
  const { x, z, c } = f, R = c.roof;
  const pier = f.bay === null ? (x + z) % 3 === 0 : f.bay % 3 === 0;
  for (let y = 0; y < R; y++) g.set(x, y, z, facadeBlock(y, R, pier, f.bay !== null));
  if (R >= 12) g.set(x, 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });  // parapet
}

// 3. Air gap behind each window, and a warm light in some of them.
for (const f of info) {
  if (!f.ring || f.bay === null || f.bay % 3 === 0) continue;
  const { x, z, c, sides } = f;
  const d = sides[0], [dx, dz] = DIRS[d];
  const ix = x - dx, iz = z - dz;                  // the cell inward from the glass
  const inner = info.find((q) => q.x === ix && q.z === iz);
  if (!inner || inner.ring) continue;
  for (const y of GLASS) if (y < c.roof - 1) g.set(ix, y, iz, "air");
  for (const y of [2, 6, 10]) if (y < c.roof - 1 && (f.bay + (d === "N" ? 1 : 0)) % 4 === 1) g.set(ix, y, iz, LIT[y]);
}

// 4. The front door: lower and upper halves on the north face, a lintel above, and a hanging lantern in the lobby.
// The door: the south-most window bay on a single outer side of the main roof (a street-facing bay), the lower and
// upper halves in the glass, a stone lintel above, and a hanging lantern just inside, under the floor at y 4.
const doorCands = info.filter((f) => f.ring && f.c.roof === 12 && f.sides.length === 1 && f.bay !== null && f.bay % 3 !== 0);
const door = doorCands.sort((a, b) => (b.z - a.z) || Math.abs(a.x - 8) - Math.abs(b.x - 8))[0];
const dside = door.sides[0], [ddx, ddz] = DIRS[dside], facing = { N: "north", S: "south", E: "east", W: "west" }[dside];
const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
g.set(door.x, 1, door.z, "dark_oak_door", doorState("lower"));
g.set(door.x, 2, door.z, "dark_oak_door", doorState("upper"));
g.set(door.x, 3, door.z, "smooth_quartz");
const lobby = [door.x - ddx, door.z - ddz];
g.set(lobby[0], 1, lobby[1], "air"); g.set(lobby[0], 2, lobby[1], "air");
g.set(lobby[0], 3, lobby[1], "lantern", { hanging: "true", waterlogged: "false" });   // hangs from the storey-two floor at y 4

// 5. Roof: a stair-access bulkhead with a slab cap on the deck, at the middle of the three-storey roof.
for (const [x, z] of [[10, 9], [11, 9], [10, 10], [11, 10]]) {
  g.set(x, 12, z, "stone_bricks"); g.set(x, 13, z, "stone_bricks");
  g.set(x, 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241860.nbt");
console.log(JSON.stringify(res));
