// 1717 Massachusetts Ave NW: a 1960s-70s Modernist office block (Commercial-Office-Large). Granite plinth and lintels on
// a smooth-quartz (Indiana-limestone-like) frame, a glazed storey ribbon every second block with a light storey-deck
// line, a stepped massing from the lidar roof (11 wings, 13 ring, 14 core) and a crown of plant on the core.
// Storeys are two blocks (a deck and a glass band); the ground floor is a shopfront band with a lobby door.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62573.cells.json", "utf8"));
const W = 18, D = 21, H = 26;

// footprint and lidar roof, with the lidar's 1-block noise smoothed to the mode of each 3x3 neighbourhood
const k2 = (x, z) => `${x},${z}`;
const raw = new Map(); for (const [x, z, , r] of cells) raw.set(k2(x, z), r);
const inFP = (x, z) => raw.has(k2(x, z));
const roofMode = (x, z) => {
  const n = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFP(x + dx, z + dz)) { const r = raw.get(k2(x + dx, z + dz)); n.set(r, (n.get(r) || 0) + 1); }
  let best = -1, bestN = -1; for (const [r, c] of n) if (c > bestN || (c === bestN && r > best)) { best = r; bestN = c; }
  return best;
};
const roofOf = new Map(); for (const k of raw.keys()) { const [x, z] = k.split(",").map(Number); roofOf.set(k, roofMode(x, z)); }
const roof = (x, z) => roofOf.get(k2(x, z));

// faces of a cell at height y that are open to the air: outside the footprint, or the neighbour's roof is below y
const DIRS = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !inFP(x + dx, z + dz) || roof(x + dx, z + dz) <= y);

const plan = new Map();
const put = (x, y, z, block, state, face) => plan.set(`${x},${y},${z}`, { block, state, face });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

const PANE = "light_blue_stained_glass_pane";
const DOOR = "dark_oak_door";
const ENTRANCE = [8, 0];             // north face of the cell at x 8, z 0 (the lobby door)

// one block of the shell: returns { block, state?, face? } or null (air: an interior bay behind the glass)
function shell(x, z, y) {
  const r = roof(x, z);
  if (y === 0) return { block: "stone_bricks" };                        // plinth course
  const open = exposed(x, z, y);
  if (y === r - 1) return open.length ? { block: "polished_andesite" } : { block: "smooth_stone" };   // cornice / roof
  if (y >= 4 && y % 2 === 0) return { block: "white_concrete" };         // floor deck: the storey line
  if (y === 3) return open.length ? { block: "stone_bricks" } : null;   // ground-floor lintel
  const glazed = y === 1 || y === 2 || (y >= 5 && y % 2 === 1);       // glass band
  if (glazed && open.length) {
    const [face, dx] = open[0];
    const u = dx ? z : x;                                             // position along the face
    if (u % 3 === 0) return { block: "smooth_quartz" };                // mullion
    return { block: PANE, face };
  }
  return null;                                                        // interior air
}

for (const [x, z] of raw.keys().map(k => k.split(",").map(Number))) {
  const r = roof(x, z);
  for (let y = 0; y < r; y++) {
    const s = shell(x, z, y);
    if (s) put(x, y, z, s.block, null, s.face);
  }
  // the cap of each cell (roof surface or cornice) is already above; warm light behind the glazing
  for (let y = 5; y < r - 1; y += 2) {
    const open = exposed(x, z, y);
    if (!open.length) continue;
    const [, dx, dz] = open[0];
    const u = dx ? z : x;
    const inX = x - dx, inZ = z - dz;
    if (u % 6 === 2 && inFP(inX, inZ) && !exposed(inX, inZ, y).length && !at(inX, y, inZ)) put(inX, y, inZ, "glowstone");
  }
  // lobby lanterns on the plinth, inside the shopfront
  if (r > 0 && !exposed(x, z, 1).length && (x + z) % 7 === 3) put(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// the lobby door in the north face of ENTRANCE, under the lintel
const [ex, ez] = ENTRANCE;
put(ex, 1, ez, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, 2, ez, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// roof plant: iron units on the wing roofs (11) and a stepped penthouse of quartz on the core (14)
for (const [x, z] of raw.keys().map(k => k.split(",").map(Number))) {
  const r = roof(x, z);
  const interior = !exposed(x, z, r - 1).length;
  if (!interior) continue;
  if (r === 11 && (x + 2 * z) % 6 === 1) put(x, r, z, "iron_block");
  if (r === 14 && x % 3 !== 0) { put(x, r, z, "smooth_quartz"); put(x, r + 1, z, "light_gray_concrete"); }
}

// panes join their in-plane neighbours (other panes, mullions, walls), never the air or the glazing behind them
const solid = (p) => p && !["glowstone", "lantern", DOOR].includes(p.block);
for (const [key, p] of plan) {
  if (p.block !== PANE) continue;
  const [x, y, z] = key.split(",").map(Number);
  const inPlane = p.face === "east" || p.face === "west" ? [["north", 0, -1], ["south", 0, 1]] : [["east", 1, 0], ["west", -1, 0]];
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const [d, dx, dz] of inPlane) if (solid(at(x + dx, y, z + dz)) || at(x + dx, y, z + dz)?.block === PANE) st[d] = "true";
  p.state = st;
}

const g = new Voxels([W, H, D]);
for (const [key, p] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, p.block, p.state);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62573.nbt");
console.log("DC62573 built:", out);
