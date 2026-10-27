// Thomas Building Extension (Auckland CBD fringe, Mt Eden side): a 1930s reinforced-concrete commercial block,
// cream render on piers and string courses, a stone base and a shopfront ground floor, five storeys of strip windows
// under a stone cornice, and a sixth storey over the lidar's 24-block core. Massing is read from the lidar roof record:
// the body is flattened to roof 21, the core (raw roof >= 24) to roof 24, and every column is solid from its ground up.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_918249410.cells.json", "utf8"));

const key = (x, z) => x + "," + z;
const FP = new Map();
for (const [x, z, ground, raw] of cells) FP.set(key(x, z), { g: ground, core: raw >= 24 });
const inFP = (x, z) => FP.has(key(x, z));
const at = (x, z) => FP.get(key(x, z));
const ROOF_BODY = 21, ROOF_CORE = 24, CORE_FROM_Y = 20;
const roofOf = (c) => (c.core ? ROOF_CORE : ROOF_BODY);
const FLOORS = [4, 8, 12, 16, 20];               // absolute storey lines; the ground floor is the cell's own ground
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// outward faces of a footprint cell at height y: the open air beside it, or (for the tower) the body roof beside it above y 20
const facesAt = (x, z, y) => {
  const c = at(x, z), out = [];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inFP(nx, nz)) out.push([dx, dz, "edge"]);
    else if (c.core && !at(nx, nz).core && y >= CORE_FROM_Y) out.push([dx, dz, "tower"]);
  }
  return out;
};

const g = new Voxels([54, 38, 52]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < 38) g.set(x, y, z, block, state); };

// The shopfront band, the upper storeys, and the roof cap of one shell cell.
function facade(x, z, y, faces, c) {
  const corner = faces.length > 1;
  const along = faces[0][0] !== 0 ? z : x;           // a wall running along z is bayed by z, one running along x by x
  const pier = corner || along % 3 === 0;
  if (y === c.g) return "polished_andesite";          // plinth course
  if (y < 4) return pier ? "stone_bricks" : "glass_pane";
  const off = y % 4;
  if (off === 0) return "white_concrete";             // string course
  if (off === 3) return "light_gray_concrete";        // spandrel
  return pier ? "white_concrete" : "glass_pane";
}

const doorCells = [];
for (const [k, c] of FP) {
  const [x, z] = k.split(",").map(Number);
  const roof = roofOf(c);
  const edge = facesAt(x, z, c.g).filter((f) => f[2] === "edge");
  // foundation: solid from y 0 up to the ground under this cell
  for (let y = 0; y < c.g; y++) put(x, y, z, "stone_bricks");
  for (let y = c.g; y < roof; y++) {
    const faces = facesAt(x, z, y);
    if (y === roof - 1) { put(x, y, z, faces.length ? "smooth_stone" : "stone"); continue; }   // roof cap / cornice
    if (faces.length) {
      // only the true edge gets the window grid; the tower's faces above the body are dressed the same way
      put(x, y, z, facade(x, z, y, faces, { g: c.g }));
      continue;
    }
    if (y === c.g || FLOORS.includes(y)) put(x, y, z, "polished_andesite");   // interior floor slab, air above it
  }
  if (edge.length) put(x, roof, z, "stone_bricks");         // parapet on the roof's true edge
  if (edge.length && edge.some((f) => f[1] === -1)) doorCells.push({ x, z, g: c.g, faces: edge });
}

// Warm light behind some window bays: a block on the first row of the storey, on the floor slab, inside the air gap.
for (const [k, c] of FP) {
  const [x, z] = k.split(",").map(Number);
  const roof = roofOf(c);
  for (let y = c.g + 1; y < roof - 1; y++) {
    const faces = facesAt(x, z, y);
    if (faces.length !== 1) continue;
    const [dx, dz] = faces[0];
    const fi = facade(x, z, y, faces, { g: c.g });
    if (fi !== "glass_pane") continue;
    if (!(y % 4 === 1 || y === c.g + 1)) continue;
    if ((x * 7 + z * 3 + y) % 5 !== 0) continue;
    const ix = x - dx, iz = z - dz;
    if (!inFP(ix, iz) || facesAt(ix, iz, y).length) continue;
    put(ix, y, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
  }
}

// Entrance: the north-facing edge cell nearest the middle of the front, dark oak door, a stone lintel over it
const xs = cells.map((c) => c[0]).sort((a, b) => a - b), midX = xs[Math.floor(xs.length / 2)];
const north = doorCells.filter((d) => d.faces.some((f) => f[1] === -1));
north.sort((a, b) => Math.abs(a.x - midX) - Math.abs(b.x - midX));
const E = north[0];
if (E) {
  const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(E.x, E.g, E.z, "dark_oak_door", doorState("lower"));
  put(E.x, E.g + 1, E.z, "dark_oak_door", doorState("upper"));
  for (const dx of [-1, 0, 1]) {
    const x = E.x + dx;
    if (inFP(x, E.z) && facesAt(x, E.z, E.g + 2).some((f) => f[1] === -1)) put(x, E.g + 2, E.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Roof plant: a 3x3, 2-high box on each roof, centred on the roof cells nearest the middle of the footprint
function plantBox(roof) {
  const cand = [];
  for (const [k, c] of FP) {
    if (roofOf(c) !== roof) continue;
    const [x, z] = k.split(",").map(Number);
    let ok = true;
    for (let i = -2; i <= 2 && ok; i++) for (let j = -2; j <= 2 && ok; j++) if (!inFP(x + i, z + j) || roofOf(at(x + i, z + j)) !== roof) ok = false;
    if (ok) cand.push([x, z]);
  }
  cand.sort((a, b) => Math.hypot(a[0] - 27, a[1] - 26) - Math.hypot(b[0] - 27, b[1] - 26));
  if (!cand.length) return;
  const [bx, bz] = cand[0];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let y = roof; y < roof + 2; y++) put(bx + i, y, bz + j, "light_gray_concrete");
}
plantBox(ROOF_BODY);
plantBox(ROOF_CORE);

// Glass panes connect to their in-plane neighbours (other panes or solid blocks), as the vanilla pane states do
const SOLID = (b) => b && b !== "air";
const OPEN = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const panes = [];
g.forEachCell((i) => {
  const x = i % 54, y = Math.floor(i / 54) % 38, z = Math.floor(i / (54 * 38));
  if (g.get(x, y, z)?.block === "minecraft:glass_pane") panes.push([x, y, z]);
});
for (const [x, y, z] of panes) {
  const st = {};
  for (const [name, [dx, dz]] of Object.entries(OPEN)) {
    const n = g.get(x + dx, y, z + dz);
    st[name] = SOLID(n?.block) && n.block !== "minecraft:air" ? "true" : "false";
  }
  g.set(x, y, z, "glass_pane", { ...st, waterlogged: "false" });
}

const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_918249410.nbt");
console.log("wrote way_918249410.nbt", r, "footprint", cells.length, "cells, entrance", E ? [E.x, E.z] : null);
