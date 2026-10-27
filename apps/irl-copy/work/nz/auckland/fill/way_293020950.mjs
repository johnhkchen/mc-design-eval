// Auckland, way 293020950 (Mt Eden / Newton edge): a 1930s reinforced-concrete commercial block, three storeys over
// a shopfront, with a stepped core rising to the lidar roof (about 16 blocks), a plant room on the podium and a
// hollow interior (air behind the glass, a floor slab per storey). Facade: cream plaster, dark steel-sash glazing, a
// stone base where the ground falls away, lanterns behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020950.cells.json", "utf8"));

const WALL = "smooth_quartz", BAND = "light_gray_concrete", FRAME = "gray_concrete", GLASS = "light_blue_stained_glass";
const FOUND = "stone_bricks", BASE = "polished_andesite", COPING = "polished_andesite", FLOOR = "smooth_stone", DECK = "gray_concrete";
const SHOP = "polished_andesite";

// the footprint, by cell
const C = new Map();
for (const [x, z, ground, roof] of cells) C.set(`${x},${z}`, { x, z, g: ground, r: roof });
const at = (x, z) => C.get(`${x},${z}`);
const NB = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// depth: 0 on the outer ring, one more per cell inward
const depth = new Map(); const queue = [];
for (const c of C.values()) if (NB.some(([, dx, dz]) => !at(c.x + dx, c.z + dz))) { depth.set(`${c.x},${c.z}`, 0); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(`${c.x},${c.z}`);
  for (const [, dx, dz] of NB) { const n = at(c.x + dx, c.z + dz); if (n && !depth.has(`${n.x},${n.z}`)) { depth.set(`${n.x},${n.z}`, d + 1); queue.push(n); } }
}

// tiers: a 16-block core set back two cells from the edge, a 12-block podium, an 8-block wing (lidar roofs snapped to tiers)
for (const c of C.values()) c.d = depth.get(`${c.x},${c.z}`);
// the core is one mass, not lidar spikes: drop core cells with fewer than two core neighbours (a cell never rises above its lidar roof)
const coreNB = (c) => NB.filter(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && n.core; }).length;
for (const c of C.values()) c.core = c.r >= 14 && c.d >= 2;
for (const c of C.values()) if (c.core && coreNB(c) < 2) c.core = false;
for (const c of C.values()) c.T = c.core ? 16 : c.r >= 10 ? 12 : 8;

// exposed faces: outward to nothing, or down to a lower neighbour (a setback). Outer faces take precedence.
for (const c of C.values()) {
  const outer = NB.filter(([, dx, dz]) => !at(c.x + dx, c.z + dz)).map(([n]) => n);
  const setb = NB.filter(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && n.T < c.T; }).map(([n]) => n);
  c.faces = [...outer, ...setb];
  c.envelope = c.faces.length > 0;
}

// the front: the south face (+z), where the shopfront and the entrance go
const front = [...C.values()].filter(c => c.envelope && c.faces.includes("S") && c.T >= 8 && c.d === 0);
const frontSorted = front.sort((a, b) => a.x - b.x);
const doorCell = frontSorted[Math.floor(frontSorted.length / 2)];

const g = new Voxels([23, 28, 37]);

// the floor levels of a column: its ground, every storey line above it, and the roof deck
const floors = (c) => { const s = new Set([c.g]); for (let y = 4; y < c.T; y += 4) if (y > c.g) s.add(y); return s; };

for (const c of C.values()) {
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, FOUND);
  if (!c.envelope) {
    // interior: floor slabs at each storey line, the roof deck on top, air between
    const F = floors(c);
    for (let y = c.g; y < c.T; y++) {
      if (F.has(y)) g.set(c.x, y, c.z, FLOOR);
      else if (y === c.T - 1) g.set(c.x, y, c.z, DECK);
    }
    continue;
  }
  // the envelope: the face it shows (outer before setback) decides which way its window bays run
  const face = c.faces[0], along = face === "N" || face === "S" ? c.x : c.z;
  for (let y = c.g; y < c.T; y++) {
    const o = y % 4;
    let b;
    if (y === c.T - 1) b = COPING;                                           // parapet
    else if (y === c.g && c.g < 4) b = BASE;                                  // base course where the ground meets the wall
    else if (face === "S" && c.d === 0 && y >= 4 && y < 8) {                  // shopfront under the front
      if (y === 4) b = SHOP;
      else if (y === 7) b = BAND;
      else b = along % 4 === 0 ? FRAME : GLASS;
      if (c === doorCell) {
        if (y === 4) b = { name: "oak_door", state: { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" } };
        if (y === 5) b = { name: "oak_door", state: { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" } };
      }
    }
    else if (o === 0) b = BAND;                                              // storey line
    else if (o === 3) b = WALL;                                              // spandrel
    else b = along % 3 === 0 ? FRAME : GLASS;                                // a window bay: two panes, a frame
    if (typeof b === "object") g.set(c.x, y, c.z, b.name, b.state);
    else g.set(c.x, y, c.z, b);
  }
}

// lanterns behind some windows: the cell inside a glazed bay, on a floor
let n = 0;
for (const c of C.values()) {
  if (!c.envelope || c.faces[0] !== "S" && c.faces[0] !== "N" && c.faces[0] !== "E" && c.faces[0] !== "W") continue;
  const face = c.faces[0], [dx, dz] = face === "N" ? [0, 1] : face === "S" ? [0, -1] : face === "W" ? [1, 0] : [-1, 0];
  const inner = at(c.x + dx, c.z + dz);
  if (!inner || inner.envelope) continue;
  for (let y = c.g; y < c.T; y++) {
    if (y % 4 !== 1 && y % 4 !== 2) continue;
    const along = face === "N" || face === "S" ? c.x : c.z;
    if (along % 3 === 0 || y >= inner.T) continue;
    if (y >= 4 && y < 8 && face === "S") continue;                           // shopfront stays clear
    if (((c.x * 7 + y * 13 + c.z * 31) % 5) !== 0) continue;
    const below = y - 1;
    if (!(floors(inner).has(below) || below < inner.g)) continue;
    g.set(inner.x, y, inner.z, "lantern", { hanging: "false", waterlogged: "false" });
    n++;
  }
}

// a plant room on the podium deck: a 3x3 block of tier-12 interior cells (never the core)
const plantOK = (c) => c && c.T === 12 && !c.envelope;
let plant = null;
for (const c of C.values()) {
  const cells9 = []; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) cells9.push(at(c.x + dx, c.z + dz));
  if (cells9.every(plantOK)) { plant = cells9; break; }
}
if (plant) for (const p of plant) for (let y = 12; y <= 13; y++) g.set(p.x, y, p.z, BAND);

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020950.nbt");
console.log(`built: ${g.count()} blocks, ${g.palette.length - 1} kinds, ${n} lanterns, door at (${doorCell.x},${doorCell.z}), plant room ${plant ? "yes" : "no"}`);
