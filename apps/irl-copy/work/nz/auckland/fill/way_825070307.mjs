import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Nugent Rise: a 1970s concrete-frame flat-roofed apartment block. A plinth on the slope, storeys of 4 blocks on
// one floor line, a flat deck with a cornice, a recessed entrance. Shell: skin (the outer cells), an air gap
// behind the glass, a solid core, a floor slab per storey.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_825070307.cells.json", "utf8"));
const g = new Voxels([52, 46, 86]);
const FOUND = 6;                                   // the ground-floor slab row; the plinth is below it
const key = (x, z) => `${x},${z}`;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const GLASS = ["light_blue_stained_glass"];

// Each footprint cell: its ground, and its deck row snapped to a storey line (lidar noise smoothed to 4-block tiers).
const plan = new Map();
for (const [x, z, ground, roof] of cells) {
  const n = Math.max(0, Math.round((roof - 8) / 4));
  plan.set(key(x, z), { x, z, ground, deck: FOUND + 4 * n, out: false, lower: [], depth: 0 });
}
for (const c of plan.values()) for (const [dx, dz] of NB) {
  const o = plan.get(key(c.x + dx, c.z + dz));
  if (!o) c.out = true; else if (o.deck < c.deck) c.lower.push(o.deck);
}
// depth 1 is the skin (outside edge, or a step down to a lower tier), 2 the air gap, 3+ the solid core
const queue = [];
for (const c of plan.values()) if (c.out || c.lower.length) { c.depth = 1; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of NB) { const o = plan.get(key(c.x + dx, c.z + dz)); if (o && !o.depth) { o.depth = c.depth + 1; queue.push(o); } }
}
const cells_ = [...plan.values()];
const cx = cells_.reduce((s, c) => s + c.x, 0) / cells_.length, cz = cells_.reduce((s, c) => s + c.z, 0) / cells_.length;
const maxDeck = Math.max(...cells_.map((c) => c.deck));

// A skin cell is exposed to air at row y if it faces outside, or it rises above a lower neighbour's parapet.
const exposed = (c, y) => c.out || c.lower.some((dk) => y > dk + 1);
const glassAt = (c) => (c.x + c.z) % 4 === 1 || (c.x + c.z) % 4 === 2;     // two glazed bays, two piers, per 4 cells
const plantBox = (c) => c.deck === maxDeck && c.depth >= 3 && Math.abs(c.x - cx) <= 7 && Math.abs(c.z - cz) <= 9;
// a warm light in the air gap behind a glazed bay, on some windows
const lampAt = (c, y) => {
  if (y % 4 !== 0 || c.depth !== 2) return null;
  const behind = NB.some(([dx, dz]) => { const o = plan.get(key(c.x + dx, c.z + dz)); return o && o.depth === 1 && exposed(o, y) && glassAt(o); });
  if (!behind) return null;
  const h = (c.x * 7 + c.z * 13 + y * 3) % 9;
  return h === 0 ? ["glowstone"] : h === 4 ? ["shroomlight"] : null;
};

// The block at one cell and row, or null for air (nothing set).
function block(c, y) {
  const d = c.depth, gr = c.ground, D = c.deck;
  if (y < gr) return ["stone"];                                              // foundation, up to the ground
  if (y < FOUND) {                                                            // plinth: base course, and the downhill side's basement glazing
    if (y === FOUND - 1) return ["polished_andesite"];
    if (y === FOUND - 2) return ["light_gray_concrete"];
    if ((y === 2 || y === 3) && y > gr && d === 1 && exposed(c, y)) return glassAt(c) ? GLASS : ["stone_bricks"];
    if ((y === 2 || y === 3) && y > gr && d === 2) return null;
    return ["stone_bricks"];
  }
  if (y === D + 1) {                                                          // cornice, and the roof plant
    if (plantBox(c)) return ["light_gray_concrete"];
    return d === 1 && exposed(c, y) ? ["light_gray_concrete"] : null;
  }
  if (y === D + 2) return plantBox(c) ? ["white_concrete"] : null;
  if (y > D + 1) return null;
  if (y === D) return ["smooth_stone"];                                       // flat roof
  if (y % 4 === 2) return ["light_gray_concrete"];                           // storey line: floor slab
  if (y % 4 === 1) {                                                          // spandrel above each glazed band
    if (d === 1 && exposed(c, y)) return ["light_gray_concrete"];
    return d === 2 ? null : ["white_concrete"];
  }
  // the glazed band: panes in piers of concrete on the skin, air behind them, lamps in some bays
  if (d === 1 && exposed(c, y)) return glassAt(c) ? GLASS : ["white_concrete"];
  if (d === 2) { const l = lampAt(c, y); return l; }
  return ["white_concrete"];
}

for (const c of cells_) for (let y = 0; y < 46; y++) {
  const b = block(c, y);
  if (b) g.set(c.x, y, c.z, b[0], b[1]);
}

// Recessed entrance on the front (lowest z) skin, at street level, with a lintel canopy over the bay.
const front = Math.min(...cells_.filter((c) => c.out).map((c) => c.z));
const door = cells_
  .filter((c) => c.out && c.depth === 1 && c.ground >= 5 && c.ground <= 6)
  .sort((a, b) => (a.z - front) * 1000 + Math.abs(a.x - cx) - ((b.z - front) * 1000 + Math.abs(b.x - cx)))[0];
if (door) {
  for (const dx of [-1, 0, 1]) {
    const c = plan.get(key(door.x + dx, door.z));
    if (c && c.out && c.depth === 1) g.set(c.x, 9, c.z, "smooth_stone");
  }
  g.set(door.x, 7, door.z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, 8, door.z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_825070307.nbt");
console.log(`way_825070307: ${cells_.length} columns, decks ${[...new Set(cells_.map((c) => c.deck))].sort((a, b) => a - b).join("/")}, ${r.blocks} blocks, ${r.palette} palette entries, door at ${door ? `${door.x},${door.z}` : "none"}`);
