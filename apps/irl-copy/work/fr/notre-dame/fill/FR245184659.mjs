// FR245184659: a residential block of 1900 on the Notre-Dame footprint (22 x 19 cells, 265 of them). Haussmann massing in
// pale limestone: a stone plinth on the lidar's ground, storey string courses of smooth stone, a three-tall window in each
// bay between piers (an air gap behind every pane, glowstone behind some), stone quoins at the corners, a mansard with
// dormers on the tallest cells, flat-topped wings at 30, 25 and 20 blocks where the lidar drops, a front door, and brick
// chimney stacks. Every column stands on its plinth and each storey on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184659.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184659.nbt";

const W = 22, D = 19, H = 52;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const key = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const roofAt = new Map();
for (const [x, z, , r] of cells) roofAt.set(key(x, z), r);
const inFp = (x, z) => roofAt.has(key(x, z));
const median = (a) => [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)];

// Lidar roof, median of its footprint neighbourhood, snapped to four flat tiers: 35 = Haussmann + mansard, 30, 25, 20.
const tierOf = (r) => (r >= 33 ? 35 : r >= 28 ? 30 : r >= 24 ? 25 : 20);
const cell = new Map();
for (const [x, z, g] of cells) {
  const around = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) around.push(roofAt.get(key(x + dx, z + dz)));
  cell.set(key(x, z), { x, z, g, T: tierOf(median(around)), d: 0 });
}

// Distance in cells from the outside of the footprint (1 on the perimeter): the mansard steps in from it.
const queue = [];
for (const c of cell.values()) if (DIRS.some(([dx, dz]) => !inFp(c.x + dx, c.z + dz))) { c.d = 1; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of DIRS) {
    const n = cell.get(key(c.x + dx, c.z + dz));
    if (n && !n.d) { n.d = c.d + 1; queue.push(n); }
  }
}

// The one world: a map of cell -> block, so windows can be cut back into it and panes can look at their neighbours.
const put = new Map();
const set = (x, y, z, block, state) => put.set(k3(x, y, z), { block, state });
const clear = (x, y, z) => put.delete(k3(x, y, z));
const at = (x, y, z) => put.get(k3(x, y, z));
const paneOut = new Map();                                  // a pane's wall normal, for its connections

// What a facade row is: the plinth course at the ground, a string course (storey line, cornice), or a window row.
const rowKind = (y, g) => (y === g ? "base" : y % 5 === 0 || y % 5 === 4 || y === 33 ? "string" : "window");

// The front is the side with the most exposed cells; the door sits in the middle of it, on a tall cell.
const outOf = (c) => DIRS.filter(([dx, dz]) => !inFp(c.x + dx, c.z + dz));
const sides = new Map();
for (const c of cell.values()) { const o = outOf(c); if (o.length === 1) sides.set(o[0].join(), (sides.get(o[0].join()) || 0) + 1); }
const FRONT = [...sides.entries()].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number);
const frontCells = [...cell.values()].filter((c) => { const o = outOf(c); return o.length === 1 && o[0][0] === FRONT[0] && o[0][1] === FRONT[1]; });
const tall = frontCells.filter((c) => c.T >= 30);
const uOf = (c) => (FRONT[1] !== 0 ? c.x : c.z);
const uMid = median((tall.length ? tall : frontCells).map(uOf));
const doorCell = (tall.length ? tall : frontCells).reduce((a, c) => (Math.abs(uOf(c) - uMid) < Math.abs(uOf(a) - uMid) ? c : a));

for (const c of cell.values()) {
  const { x, z, g, T, d } = c;
  const mansard = T === 35;
  const top = mansard ? (d <= 2 ? 34 : 35) : T;             // the mansard: vertical brisis (d=1), a step (d=2), a flat cap

  // plinth on the lowest ground, then the solid column (calcite walls, deepslate mansard, smooth-stone roof surface)
  for (let y = 0; y < g; y++) set(x, y, z, "stone_bricks");
  for (let y = g; y < top; y++) {
    let block = "calcite";
    if (mansard && y >= 30 && d >= 2) block = "deepslate_tiles";
    if (!mansard && y === T - 1) block = "smooth_stone";
    set(x, y, z, block);
  }

  // the facade: each row on the exposed faces (out of the footprint, or against a lower tier)
  for (let y = g; y < top; y++) {
    const outs = DIRS.filter(([dx, dz]) => { const n = cell.get(key(x + dx, z + dz)); return !n || n.T <= y; });
    if (!outs.length) continue;
    const kind = rowKind(y, g);
    if (kind === "string") { set(x, y, z, "smooth_stone"); continue; }
    if (kind === "base" || outs.length >= 2) { set(x, y, z, "stone_bricks"); continue; }   // plinth course, or a quoin at a corner
    const [dx, dz] = outs[0];
    const u = dz !== 0 ? x : z;
    if (u % 4 === 0) { set(x, y, z, "calcite"); continue; }                                  // pier between bays, three-wide windows
    set(x, y, z, "glass_pane");
    paneOut.set(k3(x, y, z), [dx, dz]);
    const ix = x - dx, iz = z - dz;                                                           // the air gap behind the glass
    clear(ix, y, iz);
    if (y % 5 === 2 && (x * 5 + z * 3 + y) % 4 === 0) set(ix, y, iz, "glowstone");           // a warm lamp in some windows
  }

  // a flat roof's parapet on its outer edge
  if (!mansard && outOf(c).length) set(x, T, z, "smooth_stone");
}

// The front door, with its own hinge and facing, on the front's tallest middle cell.
{
  const { x, z, g } = doorCell;
  const facing = FACING[FRONT.join(",")];
  set(x, g + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  set(x, g + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Glass panes: connect sideways to whatever stands in their wall plane (panes or stone), as the game would.
for (const [k, [dx, dz]] of paneOut) {
  if (!put.has(k)) continue;                                // a neighbouring bay's air gap cut this one away
  const [x, y, z] = k.split(",").map(Number);
  const solid = (a, b, c) => !!at(a, b, c);
  const st = dz !== 0
    ? { north: "false", south: "false", east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)) }
    : { north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)), east: "false", west: "false" };
  put.get(k).state = st;
}

// Chimney stacks on the deep parts of the flat roofs and the mansard cap.
for (const c of cell.values()) {
  if (c.d < 3 || c.T === 20 || (c.x * 7 + c.z * 3) % 13 !== 0) continue;
  const top = c.T === 35 ? 35 : c.T;
  for (let y = top; y < top + 3; y++) set(c.x, y, c.z, "bricks");
}

const g = new Voxels([W, H, D]);
for (const [k, v] of put) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const info = g.save(OUT);
console.log(`FR245184659: ${info.blocks} blocks, ${info.palette} palette entries, front ${FRONT}, door at ${doorCell.x},${doorCell.z}`);
