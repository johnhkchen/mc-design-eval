// 1999 K Street NW, Commercial-Office-Large: a 1980s-90s pale-stone office block on a granite-and-concrete base. A tall
// core (lidar roof 20) rises from a podium wing (18) and steps down to a 3-storey annex (12) and a low corner (16).
// Storey lines sit on absolute heights (every 4 blocks) so the floors run level across the stepped tiers; a penthouse
// with a glazed band crowns the core; HVAC boxes sit on the wing. The shell is one block thick with an air gap behind
// the glass and a floor slab per storey; a few windows carry glowstone behind the pane.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65108.cells.json", "utf8"));

// lidar roof heights, snapped to the tiers the massing actually steps through (noise such as 19 or 14-17 is smoothed)
const SNAP = { 12: 12, 14: 12, 15: 16, 16: 16, 17: 16, 18: 18, 19: 20, 20: 20 };
const X = 12, Y = 32, Z = 28;
const cols = new Map();
for (const [x, z, g, r] of cells) cols.set(`${x},${z}`, { g, r: SNAP[r] ?? r });
const col = (x, z) => cols.get(`${x},${z}`);

// the penthouse on the core: x 4..7, z 9..17, y 20..22 (its ring is shell, its interior air above the roof slab)
const inPent = (x, y, z) => x >= 4 && x <= 7 && z >= 9 && z <= 17 && y >= 20 && y <= 22;
const inMass = (x, y, z) => { const c = col(x, z); return !!c && y >= c.g && y < c.r; };
const shape = (x, y, z) => inPent(x, y, z) || inMass(x, y, z);

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => { if (x >= 0 && x < X && y >= 0 && y < Y && z >= 0 && z < Z) g.set(x, y, z, block, state); };

const PANE = "light_blue_stained_glass_pane";
const GLASS = "glass";
const WALL = "smooth_quartz";
const FRAME = "stone";
const SPANDREL = "smooth_quartz";
const FLOOR = "light_gray_concrete";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const CORNICE = "stone_bricks";
const CAP = "smooth_stone";
const DOOR = "dark_oak_door";
const SURROUND = "polished_granite";

// the wall face's material for a voxel on a horizontal exposure; u runs along the face (z on an x-face, x on a z-face)
// returns { block, state?, lit? } and records the glass so its pane connects along the face
function facade(x, y, z, dir) {
  const u = dir === "E" || dir === "W" ? z : x;
  const alongZ = dir === "E" || dir === "W";
  const k = ((y % 4) + 4) % 4;
  if (y < 4) {                                     // ground storey: shopfronts, a recessed door on the street face
    if (dir === "W" && z === 12 && y === 1) return { block: DOOR, state: { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (dir === "W" && z === 12 && y === 2) return { block: DOOR, state: { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (dir === "W" && y === 3 && z >= 11 && z <= 14) return { block: SURROUND };
    if (y === 3) return { block: FLOOR };
    if (u % 3 === 0) return { block: FRAME };
    return { block: GLASS };
  }
  if (k === 0 || k === 3) return { block: SPANDREL };
  if (u % 3 === 0) return { block: FRAME };
  return { block: PANE, state: alongZ ? { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" } : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }, pane: true };
}

const lights = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const c = col(x, z);
  if (!c) continue;
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < c.g; y++) put(x, y, z, FOUND);
}

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const c = col(x, z);
  if (!c) continue;
  for (let y = c.g; y < c.r; y++) placeMass(x, y, z, c);
}
for (let y = 20; y <= 22; y++) for (let x = 4; x <= 7; x++) for (let z = 9; z <= 17; z++) if (inPent(x, y, z)) placeMass(x, y, z, { g: -1, r: 23 });

function placeMass(x, y, z, c) {
  const top = inPent(x, y, z) ? 22 : c.r - 1;
  const ex = { E: !shape(x + 1, y, z), W: !shape(x - 1, y, z), N: !shape(x, y, z - 1), S: !shape(x, y, z + 1) };
  const exposed = ex.E || ex.W || ex.N || ex.S;
  if (y === c.g) return put(x, y, z, BASE);                 // base course on the grade
  if (y === top) return put(x, y, z, CAP);                  // roof
  if (y === top - 1 && !inPent(x, y, z)) return put(x, y, z, CORNICE);   // cornice band under the roof
  if (exposed) {
    const dir = ex.W ? "W" : ex.E ? "E" : ex.N ? "N" : "S";
    const f = facade(x, y, z, dir);
    put(x, y, z, f.block, f.state);
    if (f.pane && (x * 5 + z * 3 + y) % 9 === 0) {
      // glowstone behind the pane, on the interior side
      const ix = dir === "W" ? x + 1 : dir === "E" ? x - 1 : x;
      const iz = dir === "N" ? z + 1 : dir === "S" ? z - 1 : z;
      lights.push([ix, y, iz]);
    }
    return;
  }
  if (y % 4 === 0) return put(x, y, z, FLOOR);              // a floor slab in the interior
  // otherwise interior air: the gap behind the glass
}

// roof equipment on the wing, and the glowstone behind the chosen panes (only into interior air)
for (let x = 0; x <= 1; x++) for (let z = 5; z <= 6; z++) for (let y = 18; y <= 19; y++) put(x, y, z, "iron_block");
for (const [x, y, z] of lights) if (shape(x, y, z) && g.val(x, y, z) === 0) put(x, y, z, "glowstone");

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65108.nbt");
console.log(JSON.stringify(res));
