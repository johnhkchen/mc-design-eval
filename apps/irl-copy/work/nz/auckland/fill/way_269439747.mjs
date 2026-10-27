// Way 269439747: a two-storey brick commercial block (c. 1930s Auckland), flat parapet roof, white pilasters and a
// string course at the upper floor line, glazed bays on the ground floor, one lit door. The massing follows the lidar
// roof heights (cells 6-8 are one-storey wings, 9-11 the two-storey block), quantised into two flat tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439747.cells.json", "utf8"));   // [x, z, ground, roof]

const FOUND = "stone", PLINTH = "stone_bricks", BRICK = "bricks", TRIM = "white_concrete", CAP = "smooth_stone";
const PANE = "glass_pane", LIGHT = "glowstone";
const SIDES = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

const plan = new Map();
for (const [x, z, ground, roof] of cells) plan.set(`${x},${z}`, { x, z, g: ground, T: roof <= 8 ? 8 : 11 });
const at = (x, z) => plan.get(`${x},${z}`);

// Smooth the lidar tiers: a lone tall cell is noise (a spike), a short cell boxed in by tall ones is a dip.
{
  const flip = [];
  for (const c of plan.values()) {
    const tall = SIDES.filter(([dx, dz]) => at(c.x + dx, c.z + dz)?.T === 11).length;
    if (c.T === 11 && tall <= 1) flip.push([c, 8]);
    if (c.T === 8 && tall >= 3) flip.push([c, 11]);
  }
  for (const [c, T] of flip) c.T = T;
}

// The side a cell shows: outside the footprint first, else a lower tier (a setback), else none (interior).
function faceOf(c) {
  for (const [dx, dz, name] of SIDES) if (!at(c.x + dx, c.z + dz)) return { dx, dz, name, outside: true };
  for (const [dx, dz, name] of SIDES) if (at(c.x + dx, c.z + dz).T < c.T) return { dx, dz, name, outside: false };
  return null;
}

// The facade block at height y on a shown side. Bays by position along the face: 0 pilaster, 3 solid brick, 1-2 window.
function facade(c, face, y) {
  const a = (face.dx ? c.z : c.x) % 4;
  if (y === c.g) return PLINTH;
  if (c.T === 11 && y === 7) return TRIM;                         // string course at the upper floor line
  if (a === 0) return TRIM;
  if (a === 3) return BRICK;
  if (y === 6) return TRIM;                                       // lintel over the bays
  const lit = (c.x * 7 + c.z * 3 + y) % 11 === 0;                 // about one window in eleven lit
  if (y > c.g && y <= 5) return lit ? LIGHT : PANE;               // shopfront glass
  if (c.T === 11 && y === 8) return CAP;                          // upper sill
  if (c.T === 11 && y === 9) return lit ? LIGHT : PANE;           // upper glass
  return BRICK;
}

const doors = [];
const g = new Voxels([51, 24, 38]);
for (const c of plan.values()) {
  c.face = faceOf(c);
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, FOUND);       // solid from y 0 up to the ground
  const top = c.T - 1;                                            // the cap layer: parapet or roof deck
  if (!c.face) {
    if (c.T === 11) g.set(c.x, 7, c.z, CAP);                      // upper floor slab
    g.set(c.x, top, c.z, CAP);                                    // roof deck
    continue;
  }
  const panes = c.face.dx
    ? { north: "true", south: "true", east: "false", west: "false" }
    : { east: "true", west: "true", north: "false", south: "false" };
  for (let y = c.g; y < top; y++) {
    const b = facade(c, c.face, y);
    if (b === PANE || b === LIGHT) g.set(c.x, y, c.z, b, panes);
    else g.set(c.x, y, c.z, b);
  }
  g.set(c.x, top, c.z, CAP);                                      // parapet cap
  if (c.face.outside && c.T === 11 && c.g <= 4 && (c.x % 4 === 1 || c.x % 4 === 2 || c.z % 4 === 1 || c.z % 4 === 2)) doors.push(c);
}

// One entrance: the lowest street-level bay on the footprint's edge, door in the glazed bay with a lamp over it.
doors.sort((p, q) => p.g - q.g || p.z - q.z || p.x - q.x);
const d = doors[0];
if (d) {
  const st = (half) => ({ facing: d.face.name, half, hinge: "left", open: "false", powered: "false" });
  g.set(d.x, d.g + 1, d.z, "dark_oak_door", st("lower"));
  g.set(d.x, d.g + 2, d.z, "dark_oak_door", st("upper"));
  g.set(d.x, d.g + 3, d.z, "lantern", { hanging: "true" });
}

// Roof: plant boxes on the interior roof, lanterns along the parapet.
for (const c of plan.values()) {
  if (c.T !== 11) continue;
  if (!c.face) {
    if ((c.x * 5 + c.z * 3) % 13 === 0) g.set(c.x, 11, c.z, "iron_block");
  } else if (c.face.outside && (c.face.dx ? c.z : c.x) % 8 === 4) {
    g.set(c.x, 11, c.z, "lantern", { hanging: "false" });
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439747.nbt";
console.log(g.save(out), { door: d ? [d.x, d.g, d.z] : null });
