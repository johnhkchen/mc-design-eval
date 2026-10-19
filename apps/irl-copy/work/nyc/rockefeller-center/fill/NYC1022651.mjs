// 150 West 46 Street, 1920: a seven-storey brick office block on a granite base, with a shopfront and entrance on the
// street face (z 0), plain brick side walls, a plain brick back (z 24), and a penthouse stepped in on the west side.
// Lidar roof heights smoothed into two tiers: the body at 22, the penthouse core (x 1..2, z 4..8) at 25.
// Hollow: a one-cell skin, a floor slab per storey, and a deck over the whole footprint; the air behind the glass stays air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1022651.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g]) => [key(x, z), g]));   // footprint cell -> its ground
const inF = (x, z) => foot.has(key(x, z));
const gOf = (x, z) => foot.get(key(x, z));

const PENT = (x, z) => x >= 1 && x <= 2 && z >= 4 && z <= 8;
const topOf = (x, z) => (PENT(x, z) ? 25 : 22);      // exclusive top of each column
const DECK = 21;                                     // the body's roof deck (the cornice sits on its edge)
const PENT_FLOOR = 22, PENT_DECK = 24;

const DIRS = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // on an east/west face
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };  // on a north/south face
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// Which outside faces a cell at this height opens onto: off the footprint, or above a neighbour's roof.
function exposure(x, z, y) {
  const e = {};
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    e[d] = !inF(nx, nz) || y >= topOf(nx, nz);
  }
  return e;
}
const onEdge = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inF(x + dx, z + dz));
const any = (e) => Object.values(e).some(Boolean);

// What the solid at (x, y, z) is, or null for air.
function role(x, z, y) {
  if (!inF(x, z)) return null;
  const g = gOf(x, z), pent = PENT(x, z);
  if (y < g) return { kind: "base", e: exposure(x, z, y) };          // foundation up to the cell's ground
  if (y === DECK || (pent && y === PENT_DECK)) return { kind: "deck", e: exposure(x, z, y) };
  if (pent && y === PENT_FLOOR) return { kind: "slab", e: exposure(x, z, y) };
  if (!pent && y === 22) return onEdge(x, z) ? { kind: "parapet", e: exposure(x, z, y) } : null;
  if (y >= topOf(x, z)) return null;
  if (y < DECK && (y - g) % 3 === 0) return { kind: "slab", e: exposure(x, z, y) };   // storey floors
  const e = exposure(x, z, y);
  return any(e) ? { kind: "wall", e, g } : null;
}

const g = new Voxels([9, 36, 25]);
const lamps = [];   // [x, y, z] glowstone behind glass, placed only into interior air

// Shopfront and upper storeys: piers at these columns on the street face (x 0 and 7 are the corners).
const STREET_PIERS = [0, 3, 6, 7];

function wallBlock(x, z, y, e, gr) {
  const s = Math.floor((y - gr) / 3), row = (y - gr) % 3;     // storey index, and row within it (1, 2 = glazing)
  const ns = e.N || e.S, ew = e.E || e.W;
  if (ns && ew) return ["bricks"];                              // corner pier
  if (e.N && z === 0) {                                         // the street face
    if (x === 3 && s === 0) {                                   // the entrance: door, then a glass transom
      if (row === 2) return ["glass_pane", PANE_EW];
      return ["dark_oak_door", door(y === gr ? "lower" : "upper")];
    }
    if (s === 0 && x === 3 && row === 2) return ["glass_pane", PANE_EW];
    if (s === 0 && STREET_PIERS.includes(x)) return ["polished_granite"];
    if (s > 0 && STREET_PIERS.includes(x)) return ["bricks"];
    if (row === 2 && (x + s) % 4 === 1) lamps.push([x, y, 1]);
    return ["glass_pane", PANE_EW];
  }
  if (e.S) {                                                    // the rear face: brick with a window every other column
    if (x % 2 === 0) return ["bricks"];
    return ["glass_pane", PANE_EW];
  }
  if (ew) {                                                     // side walls: piers every third column
    if (z % 3 === 0) return ["bricks"];
    if (row === 2 && (z + 2 * s) % 5 === 1) lamps.push([e.E ? x - 1 : x + 1, y, z]);
    return ["glass_pane", PANE_NS];
  }
  return ["bricks"];
}

for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= 25; y++) {
    const r = role(x, z, y);
    if (!r) continue;
    const { kind, e } = r;
    const outside = e && any(e);
    if (kind === "base") g.set(x, y, z, outside ? "polished_granite" : "stone");
    else if (kind === "deck") g.set(x, y, z, outside ? "stone_bricks" : "deepslate_tiles");     // cornice on the edge
    else if (kind === "parapet") g.set(x, y, z, "stone_brick_wall");
    else if (kind === "slab") {
      if (z === 0 && x >= 2 && x <= 4 && y === gOf(x, z) + 3) g.set(x, y, z, "green_wool"); // canvas awning over the entrance
      else if (z === 0 && y === gOf(x, z) && outside) g.set(x, y, z, "polished_granite");       // base course on the street
      else g.set(x, y, z, "smooth_stone");
    } else if (kind === "wall") {
      const [b, st] = wallBlock(x, z, y, e, r.g);
      g.set(x, y, z, b, st);
    }
  }
}

// Penthouse on the west: glazed on every outside face, a stone bulkhead on its roof.
for (let y = PENT_FLOOR + 1; y < PENT_DECK; y++) {
  for (let z = 4; z <= 8; z++) for (let x = 1; x <= 2; x++) {
    if (!inF(x, z)) continue;
    const e = exposure(x, z, y);
    if (!any(e)) continue;
    if ((e.E || e.W) && (e.N || e.S)) g.set(x, y, z, "stone_bricks");
    else if (e.E || e.W) g.set(x, y, z, "glass_pane", PANE_NS);
    else g.set(x, y, z, "glass_pane", PANE_EW);
  }
}
g.set(1, 25, 6, "stone_bricks");
g.set(2, 25, 6, "stone_bricks");
g.set(2, 25, 7, "stone_brick_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });

// Warm light behind the glass: only where the cell is air (the room behind the window).
for (const [x, y, z] of lamps) {
  if (!inF(x, z) || role(x, z, y)) continue;
  g.set(x, y, z, y % 2 === 0 ? "glowstone" : "shroomlight");
}

g.save(`${dir}/NYC1022651.nbt`);
