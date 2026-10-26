// FR245184482: a Haussmann-era residential block (built 1800, six storeys, cut limestone walls, zinc-grey mansard). The
// footprint is the lidar's cell list; the massing follows its roof height, snapped to storey lines so the tiers are
// flat. Walls are one shell deep, every window has an air pocket behind its glass, and the interior is solid stone, so
// nothing floats: every block stands on the block under it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184482.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..28, z 0..20

const SIZE = [29, 45, 21];
const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const OPPOSITE = { north: "south", south: "north", west: "east", east: "west" };

// The lidar roof snapped to a storey line: the main block (roof 27 and up) is 29, with setbacks at 26, 22, 18 and so on.
function tierOf(roof, ground) {
  const h = roof >= 27 ? 29 : roof >= 24 ? 26 : roof >= 20 ? 22 : roof >= 16 ? 18 : roof >= 12 ? 14 : roof >= 8 ? 10 : 6;
  return Math.max(h, ground + 3);
}

// one record per footprint cell: g = ground, H = tier, top = column height (the ring of the main block steps down a block)
const rec = new Map();
for (const [x, z, g, r] of cells) rec.set(k2(x, z), { x, z, g, H: tierOf(r, g) });
for (const c of rec.values()) {
  c.ring = DIRS.some(([, dx, dz]) => !rec.has(k2(c.x + dx, c.z + dz)));
  c.top = c.H === 29 && c.ring ? 28 : c.H;
}
const topAt = (x, z) => { const c = rec.get(k2(x, z)); return c ? c.top : 0; };
// the horizontal directions in which the block at y has air beside it (outside the footprint, or the neighbour column ends below y)
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y);

// an air pocket behind a window: the cell one step inward from the glass, enclosed (not exposed) and below its cap
function pocketFor(x, z, y, outward) {
  const [, ox, oz] = DIRS.find(([n]) => n === outward);
  const p = rec.get(k2(x - ox, z - oz));
  if (!p || p.g > y || y >= p.top - 1 || exposed(p.x, p.z, y).length) return null;
  return p;
}

const pockets = new Set(), windows = new Set();
let door = null;

// the entrance: a ring cell at the ground floor with one open side and a pocket inside it; the most southerly, nearest the middle
{
  const xs = [...rec.values()].map((c) => c.x), mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  let best = null;
  for (const c of rec.values()) {
    if (!c.ring || c.g > 3 || c.top < 7) continue;
    const e = exposed(c.x, c.z, 3);
    if (e.length !== 1) continue;
    const outward = e[0][0];
    if (!pocketFor(c.x, c.z, 3, outward) || !pocketFor(c.x, c.z, 4, outward)) continue;
    const score = c.z * 100 - Math.abs(c.x - mx);
    if (!best || score > best.score) best = { c, outward, score };
  }
  if (best) {
    door = { x: best.c.x, z: best.c.z, facing: best.outward };
    for (const y of [3, 4]) { const p = pocketFor(door.x, door.z, y, door.facing); pockets.add(k3(p.x, y, p.z)); }
  }
}

// windows: on the facade, every other cell of a window row, where the cell behind is a pocket; the setback's ring gets
// a dormer every sixth cell on its mansard course
for (const c of rec.values()) {
  for (let y = c.g; y < c.top; y++) {
    const row = (y - 2) % 4;
    const dormer = c.H === 29 && c.ring && y === c.top - 1;
    if (!dormer && (y < 3 || (row !== 1 && row !== 2))) continue;
    if (dormer ? (c.x + c.z) % 6 : (c.x + c.z) % 2) continue;
    const e = exposed(c.x, c.z, y);
    if (!e.length || (door && c.x === door.x && c.z === door.z)) continue;
    const p = pocketFor(c.x, c.z, y, e[0][0]);
    if (!p) continue;
    windows.add(k3(c.x, y, c.z));
    pockets.add(k3(p.x, y, p.z));
  }
}

// the block at a cell's height (null for air, which the file leaves out)
function blockAt(c, y) {
  if (y < c.g) return ["stone_bricks"];                                               // foundation up to the ground
  if (pockets.has(k3(c.x, y, c.z))) return (y >= 7 && (c.x * 3 + c.z * 5 + y) % 8 === 0) ? ["glowstone"] : null;   // lit or dark air
  if (y >= c.top) return null;
  if (door && c.x === door.x && c.z === door.z && (y === 3 || y === 4)) {
    return ["dark_oak_door", { facing: door.facing, half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  const e = exposed(c.x, c.z, y);
  const win = windows.has(k3(c.x, y, c.z));
  if (y === c.top - 1) {                                                              // the top course: roof or parapet
    if (c.H === 29) return win ? ["glass_pane"] : ["deepslate_tiles"];                // mansard, with dormers
    return e.length ? ["smooth_stone"] : ["deepslate_tiles"];
  }
  if (!e.length) return ["stone"];                                                    // interior: solid, so every floor is a slab
  if (y <= 2) return ["stone_bricks"];                                                // plinth and the ground-floor base course
  const row = (y - 2) % 4;
  if (row === 0) return ["smooth_stone"];                                            // string course at each storey line
  if (row === 3) return win ? ["smooth_stone"] : ["calcite"];                        // lintel over each window
  if (win) return y === 7 ? ["iron_bars"] : ["glass_pane"];                          // piano nobile balcony rail, then glass
  return ["calcite"];
}

const placed = new Map();   // "x,y,z" -> [block, state]
const put = (x, y, z, b, s) => placed.set(k3(x, y, z), [b, s]);
for (const c of rec.values()) {
  for (let y = 0; y < c.top; y++) {
    const b = blockAt(c, y);
    if (b) put(c.x, y, c.z, b[0], b[1]);
  }
}
// chimneys: brick stacks on the main block's solid roof, standing on the cap
for (const c of rec.values()) {
  if (c.H !== 29 || c.ring || c.x % 7 !== 3 || c.z % 5 !== 1 || exposed(c.x, c.z, 28).length) continue;
  put(c.x, 29, c.z, "bricks"); put(c.x, 30, c.z, "bricks");
}

// glass panes and iron bars join the neighbours they stand against (solid blocks and other panes), as in the game
const occupied = (x, y, z) => placed.has(k3(x, y, z)) && placed.get(k3(x, y, z))[0] !== "dark_oak_door";
const joins = (x, y, z) => ({ north: occupied(x, y, z - 1), south: occupied(x, y, z + 1), west: occupied(x - 1, y, z), east: occupied(x + 1, y, z) });
const bool = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v ? "true" : "false"]));
for (const [key, [b]] of placed) {
  if (b !== "glass_pane" && b !== "iron_bars") continue;
  const [x, y, z] = key.split(",").map(Number);
  placed.set(key, [b, bool(joins(x, y, z))]);
}

const g = new Voxels(SIZE);
for (const [key, [b, s]] of placed) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, b, s);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184482.nbt";
const info = g.save(out);
console.log(`FR245184482: ${placed.size} blocks, ${info.palette} palette entries, ${windows.size} windows, ${pockets.size} air pockets, door ${door ? "yes" : "none"}`);
