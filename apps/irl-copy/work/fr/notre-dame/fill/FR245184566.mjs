// FR245184566: a commercial Haussmann-era block (c. 1860-1880, four storeys over a shopfront, cream render or limestone, a
// mansard-less parapet under a slate-grey roof) on the Ile de la Cite / Latin Quarter footprint. The lidar tops are 21 blocks
// across the body, with edge noise at 20 and one 13 at the NW tip: they snap to one clean tier of 21 (no setback).
// The walls are a one-cell ring round an open interior with a floor slab per storey and a roof cap on top, so every window
// has air behind it; a few lamps sit inside the glass. The ground floor is a shopfront with a door on the street side.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184566.cells.json", "utf8"));

const BODY = "calcite";            // cream render between the windows and on the piers
const BAND = "smooth_sandstone";   // belt courses, lintels and the cornice
const BASE = "stone_bricks";       // base course
const FLOOR = "smooth_stone";      // storey slabs and the ground slab
const SHOP = "dark_oak_planks";    // shopfront frame, fascia and door lintel
const SLATE = "deepslate_tiles";   // roof cap and parapet
const BRICK = "bricks";            // chimney stacks
const LAMP = "glowstone";          // warm light just inside an upper window
const DOOR = "dark_oak_door";
const LANTERN = "lantern";         // a lit lantern just inside the shop glass

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, r });
const inFp = (x, z) => byXZ.has(`${x},${z}`);
const faces = (x, z) => [
  ["north", !inFp(x, z - 1)], ["south", !inFp(x, z + 1)], ["west", !inFp(x - 1, z)], ["east", !inFp(x + 1, z)],
].filter(([, out]) => out).map(([f]) => f);

// Lidar tops -> one clean tier: everything 18 and up is the main body (21); the lone 13 at the tip is edge noise
const TOP = 21;
const top = (r) => (r >= 18 ? TOP : r);

// Storey rows, absolute y: shopfront 0-4, then storeys of five with a belt at the floor line and a lintel at the top
const ROOF = TOP - 1;              // the cap layer, y 20
const FLOORS = [0, 5, 10, 15];     // interior floor slabs (ground slab and the three above it)
const BELTS = [5, 10, 15];         // belt courses at the floor lines
const LINTELS = [9, 14, 19];       // lintel rows over the upper windows (19 doubles as the cornice)
const UPPER_GLASS = (y) => [6, 7, 8, 11, 12, 13, 16, 17, 18].includes(y);
const SHOP_GLASS = (y) => y >= 1 && y <= 3;

// A window bay: two glass cells, two piers, along each wall. The footprint's diagonal runs are stepped, so a cell can
// face two ways on one axis (still a wall, counted by its axis); only a true corner (north or south with east or west) is a pier.
const bayWindow = (x, z, out) => {
  const ns = out.some((f) => f === "north" || f === "south");
  const ew = out.some((f) => f === "east" || f === "west");
  if (ns && ew) return false;
  const along = ns ? x : z;
  return [1, 2].includes(((along % 4) + 4) % 4);
};

// The door: the single-face ring cell nearest the middle of the street front (the footprint's south-east side)
let door = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(([x, z]) => [x, z])) {
    const out = faces(x, z);
    if (out.length !== 1) continue;
    const d = Math.abs(x - 6.5) + Math.abs(z - 17) * 0.5;
    if (d < best) { best = d; door = { x, z, facing: opposite(out[0]) }; }
  }
}
function opposite(f) { return { north: "south", south: "north", east: "west", west: "east" }[f]; }

const g = new Voxels([14, 37, 18]);

for (const [x, z, gr, r] of cells) {
  const T = top(r);
  const out = faces(x, z);
  const isRing = out.length > 0;
  const isDoor = door && door.x === x && door.z === z;

  // the fill: from y 0 up to the cell's own top (ground is 0 everywhere in this footprint)
  for (let y = 0; y < T; y++) {
    if (!isRing) {
      // interior: a slab for each floor and the roof cap; air between, behind the glass
      if (FLOORS.includes(y)) g.set(x, y, z, FLOOR);
      else if (y === ROOF) g.set(x, y, z, SLATE);
      continue;
    }
    if (y === ROOF) { g.set(x, y, z, SLATE); continue; }  // parapet
    if (y === 0) { g.set(x, y, z, BASE); continue; }      // base course
    if (isDoor && (y === 1 || y === 2)) {
      g.set(x, y, z, DOOR, { facing: door.facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y <= 3) {                          // shopfront: glass in the bays, dark frame on the piers
      g.set(x, y, z, SHOP_GLASS(y) && bayWindow(x, z, out) ? "glass" : SHOP);
      continue;
    }
    if (y === 4 || LINTELS.includes(y)) { g.set(x, y, z, y === 4 ? SHOP : BAND); continue; }
    if (BELTS.includes(y)) { g.set(x, y, z, BAND); continue; }
    if (UPPER_GLASS(y)) { g.set(x, y, z, bayWindow(x, z, out) ? "glass" : BODY); continue; }
    g.set(x, y, z, BODY);
  }

  // roof: the cap is at y 20 and the parapet on the ring; the top three cells of the interior are then air
}

// Lamps just inside the glass: one per few cells, standing on the floor below (never floating)
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (faces(x, z).length > 0) continue;
  if (g.get(x, 0, z) === null) continue;
  if ((x + 2 * z) % 7 === 0) g.set(x, 6, z, LAMP);
  if ((x + 2 * z) % 7 === 3) g.set(x, 11, z, LAMP);
  if ((x * 3 + z) % 9 === 2) g.set(x, 16, z, LAMP);
  if ((x + z) % 6 === 1) g.set(x, 1, z, LANTERN, { hanging: "false" });
}

// Two chimney stacks rising from the roof cap, on interior cells well inside the parapet
const stacks = [[4, 8], [7, 12]];
for (const [x, z] of stacks) {
  if (!inFp(x, z) || faces(x, z).length > 0) continue;
  for (let y = TOP; y <= TOP + 2; y++) g.set(x, y, z, BRICK);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184566.nbt");
