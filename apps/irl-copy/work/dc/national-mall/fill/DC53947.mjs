import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1000 H St NW, Hotel-Large: a brick hotel on a stone base, the lidar roof record read as three flat tiers.
// Wings (the whole footprint) top out at 17, the body (inset 2) at 19, and a 1-block roof deck over the centre at 20.
// Storeys are 3-block modules: a string course, two rows of window between piers, then the next string course.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC53947.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 26, D = 33, Y = 32;
const g = new Voxels([W, Y, D]);

// each tier stands on the one below: wings at y 0..16, body at y 0..18, crown deck at y 19
const WINGS = { name: "wings", x0: 0, x1: 25, z0: 0, z1: 32, y0: 0, H: 17 };
const MAIN = { name: "main", x0: 2, x1: 23, z0: 2, z1: 30, y0: 0, H: 19 };
const CROWN = { name: "crown", x0: 8, x1: 18, z0: 6, z1: 28, y0: 19, H: 20 };
const TIERS = [WINGS, MAIN, CROWN];
const ENTRY = { x0: 10, x1: 15 }; // the portico bay on the wings' z = 0 front (the street face)

// glass panes join along their wall: east-west on a z face, north-south on an x face
const pane = (onZ) => (onZ ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });
const door = (x, y) => ({ id: "dark_oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 12 ? "left" : "right", open: "false", powered: "false" } });
// the cell just inside a perimeter cell: where a lit window's glowstone goes, in the air gap behind the glass
const inward = (t, x, z) => (z === t.z0 ? [x, z + 1] : z === t.z1 ? [x, z - 1] : x === t.x0 ? [x + 1, z] : [x - 1, z]);

// the portico: a recessed entrance of two doors between pilasters, sidelights, and a canopy at y 4
function portico(t, x, y, z) {
  if (t !== WINGS || z > 1 || x < ENTRY.x0 || x > ENTRY.x1) return null;
  if (y === 4) return { id: "smooth_sandstone" };
  if (z === 1 || y === 0 || y > 2) return null;
  if (x === ENTRY.x0 || x === ENTRY.x1) return { id: "smooth_sandstone" };
  if (x === 12 || x === 13) return door(x, y);
  return { id: "glass_pane", state: pane(true), lit: y === 1 };
}

// a facade cell: quoined corners, brick piers, and glass between them
function facade(t, x, y, z) {
  const corner = (x === t.x0 || x === t.x1) && (z === t.z0 || z === t.z1);
  if (corner) return { id: "smooth_sandstone" };
  const onZ = z === t.z0 || z === t.z1;
  const i = onZ ? x - t.x0 : z - t.z0; // along the face
  if (i % 3 === 0) return { id: "bricks" };
  return { id: "glass_pane", state: pane(onZ), lit: y % 3 === 1 && (i + Math.floor(y / 3)) % 4 === 1 };
}

// what a tier puts in one cell, or null for air: a perimeter shell, floor slabs and a roof deck, with air between
function block(t, x, y, z) {
  const p = portico(t, x, y, z);
  if (p) return p;
  const edge = x === t.x0 || x === t.x1 || z === t.z0 || z === t.z1;
  if (y === t.H - 1) return { id: edge ? "smooth_sandstone" : t === CROWN ? "smooth_stone" : "stone" }; // cornice ring, roof deck
  if (!edge) return y % 3 === 0 ? { id: "smooth_stone" } : null; // floor slab; the air above is the gap behind the glass
  if (y === 0) return { id: "stone_bricks" }; // base course
  if (y % 3 === 0) return { id: "smooth_sandstone" }; // storey string course
  return facade(t, x, y, z);
}

const put = (x, y, z, id, state) => g.set(x, y, z, id, state);

// the ground: solid from y 0 up to each cell's ground, so nothing floats on the slope
for (const [x, z, ground] of cells) for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

const lights = [];
for (const t of TIERS) for (let x = t.x0; x <= t.x1; x++) for (let z = t.z0; z <= t.z1; z++) for (let y = t.y0; y < t.H; y++) {
  const b = block(t, x, y, z);
  if (!b) continue;
  put(x, y, z, b.id, b.state);
  if (b.lit) lights.push([...inward(t, x, z), y]);
}
// warm light in some windows: glowstone just inside the glass (only where that air cell is still empty)
for (const [x, z, y] of lights) if (!g.get(x, y, z)) put(x, y, z, "glowstone");

// the crown's corner lanterns, and rooftop plant on the body's roof
for (const [x, z] of [[8, 6], [18, 6], [8, 28], [18, 28]]) put(x, 20, z, "lantern", { hanging: "false", waterlogged: "false" });
for (const [x0, z0] of [[4, 4], [4, 25], [20, 4]]) for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) for (let y = 19; y <= 20; y++) put(x, y, z, "iron_block");

// checks: nothing hangs in the air, and the built top follows the lidar roof record
const hanging = [];
for (let y = 1; y < Y; y++) for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (g.get(x, y, z) && !g.get(x, y - 1, z)) hanging.push([x, y, z]);
let sum = 0, worst = 0;
for (const [x, z, , roof] of cells) {
  let top = 0;
  for (let y = 0; y < Y; y++) if (g.get(x, y, z)) top = y + 1;
  sum += top - roof; worst = Math.max(worst, Math.abs(top - roof));
}
const r = g.save(`${DIR}/DC53947.nbt`);
console.log({ ...r, hanging: hanging.length, meanTopMinusRoof: (sum / cells.length).toFixed(2), worstAbsTopMinusRoof: worst, lights: lights.length });
