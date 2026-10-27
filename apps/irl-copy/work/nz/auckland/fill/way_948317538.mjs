import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317538.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..29, z 0..27

// The record: an Edwardian brick commercial block on a Mt Eden/Newton street: shopfronts on the ground floor, sash-
// style upper windows, a stone string course at the upper floor and a cornice and parapet, a flat roof. The lidar
// roof is median-smoothed over each cell's neighbours and snapped to two clean tiers: one storey (top 4) or two (top 8).
// Each column is solid from y 0 to its ground, then a floor slab, a shell of brick with glazing, a roof slab; the
// interior between is air with a glowing light behind some panes.
const X = 30, Y = 21, Z = 28;
const k = (x, z) => x + "," + z;
const raw = new Map(cells.map(([x, z, g, r]) => [k(x, z), { g, r }]));
const at = (x, z) => cell.get(k(x, z));
const cell = new Map();
for (const [x, z, g] of cells) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = raw.get(k(x + dx, z + dz)); if (c) near.push(c.r); }
  near.sort((a, b) => a - b);
  const med = near[Math.floor(near.length / 2)];
  cell.set(k(x, z), { x, z, g, H: med >= 6 ? 8 : 4 });
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the sides of a cell open to the air at height y: no neighbour, or a neighbour whose top is at or below y
const faces = (c, y) => Object.keys(DIRS).filter((d) => { const n = at(c.x + DIRS[d][0], c.z + DIRS[d][1]); return !n || n.H <= y; });
// the sides open to the air over the whole cell: no neighbour, or a lower neighbour (a setback edge)
const edge = (c) => Object.keys(DIRS).filter((d) => { const n = at(c.x + DIRS[d][0], c.z + DIRS[d][1]); return !n || n.H < c.H; });
// an interior cell at height y: inside the shell, between the floor and roof slabs, not on the upper floor line
const air = (c, y) => c && y > c.g && y < c.H - 1 && !(c.H === 8 && y === 4) && faces(c, y).length === 0;

// the block of a cell at height y (null: air)
function blockAt(c, y) {
  const { x, z, g, H } = c;
  if (y < g) return { name: "stone_bricks" };                                  // foundation under the lowest ground
  if (y === g) return { name: edge(c).length ? "stone_bricks" : "oak_planks" }; // base course / ground-floor slab
  if (y === H) {                                                              // parapet on the edge, roof kit inside
    if (edge(c).length) return { name: "stone_bricks" };
    return x % 6 === 2 && z % 6 === 3 ? { name: "iron_block" } : null;          // a few plant units, not a speckle
  }
  if (y === H - 1) return { name: faces(c, y).length ? "smooth_stone" : "stone" }; // cornice / roof covering
  if (H === 8 && y === 4) return { name: faces(c, y).length ? "smooth_stone" : "oak_planks" }; // storey line / upper floor
  const ex = faces(c, y);
  if (!ex.length) return null;                                                // interior air
  // facade: the outward side first (a missing neighbour), else the side facing the lower neighbour
  const f = ex.find((d) => !at(c.x + DIRS[d][0], c.z + DIRS[d][1])) ?? ex[0];
  const [dx, dz] = DIRS[f], u = dx === 0 ? x : z;
  const b0 = y < 4 ? g : 4, b1 = H === 8 && y >= 4 ? 7 : 3;                    // storey band: sill row, lintel row
  if (y === b1) return { name: "smooth_stone" };                                 // lintel / storey top
  const inward = at(x - dx, z - dz);
  const window = y > b0 && y < b1 && u % 2 === 1 && air(inward, y);            // a glazed bay with air behind it
  if (window) {
    // a warm light stands on the floor behind the lowest pane of some bays (never in mid-air)
    const light = y === b0 + 1 && (x * 7 + z * 13 + y * 5) % 3 === 0 ? { x: inward.x, z: inward.z, name: y < 4 ? "lantern" : "glowstone" } : null;
    if (y < 4) return { name: "glass", light };                                 // shopfront glazing
    const along = dx === 0 ? { east: "true", west: "true", north: "false", south: "false" } : { east: "false", west: "false", north: "true", south: "true" };
    return { name: "glass_pane", state: { ...along, waterlogged: "false" }, light };
  }
  return { name: "bricks" };                                                    // pier / spandrel
}

const g = new Voxels([X, Y, Z]);
// the entrance: a door on the south face of the ground storey, nearest the middle of the street face
const southDoor = cells.map(([x, z]) => at(x, z)).filter((c) => c.g <= 0 && c.H >= 4 && !at(c.x, c.z + 1))
  .sort((a, b) => Math.abs(a.x - 15) - Math.abs(b.x - 15))[0];

for (const c of cell.values()) {
  for (let y = 0; y <= c.H; y++) {
    if (southDoor && c === southDoor && (y === c.g + 1 || y === c.g + 2)) {
      g.set(c.x, y, c.z, "oak_door", { facing: "south", half: y === c.g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const b = blockAt(c, y);
    if (!b) continue;
    g.set(c.x, y, c.z, b.name, b.state);
    if (b.light) g.set(b.light.x, y, b.light.z, b.light.name);                  // the light in the air cell behind the pane
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317538.nbt");
