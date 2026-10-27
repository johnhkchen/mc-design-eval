// way 858381069: a 1970s-80s Auckland CBD office tower, 17 storeys on a diagonal footprint, with a low
// one-storey wing. Volcanic basalt base course, precast concrete frame and spandrels, tinted glass panes,
// a stair cornice, a lift overrun and a lightning rod. Solid core behind a one-cell air gap at the panes.
// Massing: the lidar roof per cell is snapped to four tiers (low wing, podium 20, setback 36, tower 68),
// all on 4-block storey lines so every storey sits on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_858381069.cells.json`, "utf8"));
const SIZE = [42, 81, 15];

const FOUND = "stone";
const BASE = "polished_basalt";
const FRAME = "white_concrete";
const SPAND = "light_gray_concrete";
const CORE = "light_gray_concrete";
const PANE = "cyan_stained_glass_pane";
const PANE_DARK = "gray_stained_glass_pane";
const CORNICE = "smooth_quartz_stairs";
const DOOR = "iron_door";
const GLOW = "glowstone";

// Lidar roof (absolute y of the top surface) snapped to tiers on the 4-block storey grid.
function tierTop(roof, ground) {
  if (roof <= 9) return 4 * Math.ceil(Math.max(roof, ground + 1) / 4); // low one-storey wing
  if (roof <= 30) return 20; // podium, 5 storeys
  if (roof <= 50) return 36; // setback, 9 storeys
  return 68; // tower, 17 storeys
}

const F = new Map();
for (const [x, z, g, roof] of cells) F.set(`${x},${z}`, { x, z, g, top: tierTop(roof, g) });
const inF = (x, z) => F.has(`${x},${z}`);
const DIRS = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
const outward = (x, z) => DIRS.filter(([, dx, dz]) => !inF(x + dx, z + dz));
const isShell = (x, z) => outward(x, z).length > 0;

const grid = new Map();
const put = (x, y, z, block, state) => grid.set(`${x},${y},${z}`, { block, state });
const get = (x, y, z) => grid.get(`${x},${y},${z}`);
const hash = (x, y, z) => (x * 31 + y * 17 + z * 7) % 11;

// Pass A: foundation, shell (base, spandrels, panes, piers, head bands), and the panes' positions.
const paneAt = new Set();
for (const { x, z, g, top } of F.values()) {
  const shell = isShell(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, FOUND);
  const groundTop = 4 * Math.floor(g / 4) + 4;
  for (let y = g; y < top; y++) {
    const rel = y % 4;
    const ground = y < groundTop;
    if (!shell) continue; // interior handled in pass B
    if (ground && y === g) put(x, y, z, BASE);
    else if (rel === 3) put(x, y, z, FRAME); // head band
    else if (rel === 0) put(x, y, z, SPAND); // storey line
    else if ((x + z) % 3 === 0) put(x, y, z, FRAME); // pier
    else {
      const dark = hash(x, y, z) % 3 === 0;
      put(x, y, z, dark ? PANE_DARK : PANE);
      paneAt.add(`${x},${y},${z}`);
    }
  }
}

// Pass B: interior is solid core and floor slabs; the cell directly behind a pane at window rows is air (the gap).
const gaps = [];
for (const { x, z, g, top } of F.values()) {
  if (isShell(x, z)) continue;
  for (let y = g; y < top; y++) {
    const rel = y % 4;
    const behindPane = y !== g && (rel === 1 || rel === 2) && y < top - 1 &&
      DIRS.some(([, dx, dz]) => paneAt.has(`${x + dx},${y},${z + dz}`));
    if (behindPane) gaps.push([x, y, z]);
    else put(x, y, z, y === top - 1 ? FRAME : CORE); // roof deck at the top, solid core and floor slabs elsewhere
  }
}
for (const [x, y, z] of gaps) if (hash(x, y, z) === 0) put(x, y, z, GLOW); // warm lamp behind some panes

// Entrance: a lobby door on the south face of the lowest shell cells, median along x, with a lintel above.
const shellCells = [...F.values()].filter(c => isShell(c.x, c.z));
const minG = Math.min(...shellCells.map(c => c.g));
let front = shellCells.filter(c => c.g === minG && outward(c.x, c.z).some(([n]) => n === "south"));
if (!front.length) front = shellCells.filter(c => c.g === minG);
front.sort((a, b) => a.x - b.x);
const door = front[Math.floor(front.length / 2)];
const doorFacing = outward(door.x, door.z)[0][0];
const doorState = half => ({ facing: doorFacing, half, hinge: "left", open: "false", powered: "false" });
put(door.x, door.g, door.z, DOOR, doorState("lower"));
put(door.x, door.g + 1, door.z, DOOR, doorState("upper"));
put(door.x, door.g + 2, door.z, FRAME); // lintel
// glow inside the lobby behind the door, on the core floor
const lx = door.x + (doorFacing === "east" ? -1 : doorFacing === "west" ? 1 : 0);
const lz = door.z + (doorFacing === "south" ? -1 : doorFacing === "north" ? 1 : 0);
if (inF(lx, lz)) put(lx, door.g + 1, lz, GLOW);

// Cornice: a stair course on top of every shell cell, its low lip facing out.
for (const c of shellCells) {
  const [facing] = outward(c.x, c.z)[0];
  put(c.x, c.top, c.z, CORNICE, { facing, half: "bottom", shape: "straight", waterlogged: "false" });
}

// Lift overrun on the tower's roof, standing on the roof deck, with a lightning rod on top.
const overrun = [...F.values()].filter(c => c.top === 68 && !isShell(c.x, c.z) && c.x >= 18 && c.x <= 24 && c.z >= 6 && c.z <= 10);
for (const c of overrun) {
  for (let y = 68; y <= 70; y++) put(c.x, y, c.z, FRAME);
  put(c.x, 71, c.z, "smooth_stone");
}
if (overrun.length) {
  const mid = overrun[Math.floor(overrun.length / 2)];
  for (let y = 72; y <= 74; y++) put(mid.x, y, mid.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Pane connections: a pane joins a neighbouring pane, pier or spandrel in its own storey row.
for (const k of paneAt) {
  const [x, y, z] = k.split(",").map(Number);
  const c = get(x, y, z);
  if (!c || (c.block !== PANE && c.block !== PANE_DARK)) continue;
  const conn = {};
  for (const [name, dx, dz] of DIRS) {
    const n = get(x + dx, y, z + dz);
    conn[name] = n && n.block !== GLOW ? "true" : "false";
  }
  c.state = { ...conn, waterlogged: "false" };
}

const out = new Voxels(SIZE);
for (const [k, { block, state }] of grid) {
  const [x, y, z] = k.split(",").map(Number);
  out.set(x, y, z, block, state);
}
const { blocks, palette } = out.save(`${dir}/way_858381069.nbt`);
console.log(`way_858381069: ${blocks} blocks, ${palette} palette entries, door at (${door.x}, ${door.z}), overrun ${overrun.length} cells`);
