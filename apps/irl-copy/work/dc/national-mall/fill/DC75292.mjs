import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1111 Pennsylvania Ave NW, Commercial-Office-Large: a 1960s-70s stone-faced office block, six storeys on a stone plinth
// with a taller core and a plant penthouse. The lidar roof record (17 wings, 20 body, 22 core) is read as three flat tiers.
// Storeys are 3-block modules: a sandstone string course, then two rows of glass between calcite piers. The ground floor
// is a storefront with a recessed entrance on the west face. Solid walls run from the plinth to each tier's roof; floor
// slabs span the air gap between them and are carried by the walls and the core.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75292.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 28, D = 29, Y = 26;
const g = new Voxels([W, Y, D]);

// roof record -> tier top (blocks above y 0): the 17-18 band is the wing, 19-20 the body, 21-22 the core
const tierOf = (roof) => (roof <= 18 ? 17 : roof <= 20 ? 20 : 22);
const T = Array.from({ length: W }, () => Array(D).fill(-1));
const ground = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, gr, roof] of cells) { T[x][z] = tierOf(roof); ground[x][z] = gr; }

// the storey lines (floor slabs and string courses); row 0 is the ground floor's slab
const SLAB = new Set([0, 4, 7, 10, 13, 16, 19]);

const inFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && T[x][z] >= 0;
const solid = (x, y, z) => (y < 0 ? true : inFoot(x, z) && y < T[x][z]);
// a block is shell when a face of it is open to the air or the ground outside the building
const faces = (x, y, z) => ({
  W: !solid(x - 1, y, z), E: !solid(x + 1, y, z), N: !solid(x, y, z - 1), S: !solid(x, y, z + 1), U: !solid(x, y + 1, z),
});
// the outside of the footprint, for the perimeter (parapets and cornices)
const onEdge = (x, z) => !inFoot(x - 1, z) || !inFoot(x + 1, z) || !inFoot(x, z - 1) || !inFoot(x, z + 1);

// the penthouse: the core's plant room, set in from its edges; the wing boxes sit on the 17 roof
const core = [];
for (const [x, z] of cells) if (T[x][z] === 22 && !onEdge(x, z)) core.push([x, z]);
const penthouse = new Set(core.filter(([x, z]) => x >= 11 && x <= 16 && z >= 6 && z <= 9).map((c) => c.join(",")));
const lanterns = [[11, 6], [16, 9]].filter(([x, z]) => penthouse.has(`${x},${z}`));
const wingBoxes = [[3, 21], [4, 21], [3, 22], [4, 22], [22, 25], [23, 25], [22, 26], [23, 26]];

// the west-face entrance: a three-cell recess at z 10..12 with a door on its back wall at z 11
const ENTRY = { x: 0, z0: 10, z1: 12 };
const entryAt = (x, y, z) => x >= 0 && x <= 1 && z >= ENTRY.z0 && z <= ENTRY.z1 && y >= 1 && y <= 2;

// a facade cell: a plinth, a sandstone band on each string course, calcite piers, glass between
function facadeBlock(x, y, z, f) {
  if (y === 0) return { id: "stone_bricks" };
  if (SLAB.has(y) || y === 3) return { id: "smooth_sandstone" };
  const lateral = [f.W || f.E, f.N || f.S].filter(Boolean).length;
  const alongZ = f.W || f.E; // a west or east face runs along z
  const i = alongZ ? z : x;
  if (lateral === 2 || i % 3 === 0) return { id: "calcite" };
  const pane = alongZ ? { north: "true", south: "true", east: "false", west: "false" } : { east: "true", west: "true", north: "false", south: "false" };
  return { id: "light_blue_stained_glass_pane", state: pane, glow: (x + 2 * y + 3 * z) % 7 === 0 };
}

const put = (x, y, z, id, state) => g.set(x, y, z, id, state);
const glows = [];

// the ground: solid from y 0 up to each cell's ground (all zero on this lot), so nothing floats on the slope
for (const [x, z, gr] of cells) for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFoot(x, z)) continue;
  const top = T[x][z];

  // above the tier: parapets on the perimeter, the core's plant room, and the wing's roof boxes
  for (let y = top; y < Y; y++) {
    if (y === top && onEdge(x, z)) { put(x, y, z, "smooth_sandstone"); continue; }
    if (penthouse.has(`${x},${z}`) && (y === 22 || y === 23)) { put(x, y, z, "light_gray_concrete"); continue; }
    if (penthouse.has(`${x},${z}`) && y === 24 && lanterns.some(([lx, lz]) => lx === x && lz === z)) { put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" }); continue; }
    if (top === 17 && y === 17 && wingBoxes.some(([bx, bz]) => bx === x && bz === z)) put(x, y, z, "light_gray_concrete");
  }

  for (let y = 0; y < top; y++) {
    // the entrance recess and its door, on the west face
    if (x <= 1 && entryAt(x, y, z)) {
      if (x === 1 && z === 11) put(x, y, z, "dark_oak_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (x === 1) put(x, y, z, "calcite");
      continue; // the recess itself stays open
    }

    const f = faces(x, y, z);
    const shell = f.W || f.E || f.N || f.S || f.U;
    if (!shell) { if (SLAB.has(y)) put(x, y, z, "smooth_stone"); continue; } // interior: a floor slab per storey, air between

    if (f.U) { // the top of a tier: a cornice on the perimeter, a roof deck inside
      put(x, y, z, onEdge(x, z) ? "smooth_sandstone" : "stone");
      continue;
    }
    const b = facadeBlock(x, y, z, f);
    put(x, y, z, b.id, b.state);
    // warm glass: glowstone just inside the pane, in the air gap
    if (b.glow) {
      const ix = f.W ? x + 1 : f.E ? x - 1 : x, iz = f.N ? z + 1 : f.S ? z - 1 : z;
      if (solid(ix, y, iz) && !g.get(ix, y, iz)) glows.push([ix, y, iz]);
    }
  }
}
// the entrance door is in the recess's back wall; the lit windows stay lit only where the air is open
for (const [x, y, z] of glows) if (!g.get(x, y, z)) put(x, y, z, "glowstone");

// checks: every block has a solid face neighbour, every shell block above ground stands on a solid one,
// and the top follows the roof record
const count = (pred) => { let n = 0; for (let y = 0; y < Y; y++) for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (pred(x, y, z)) n++; return n; };
const has = (x, y, z) => !!g.get(x, y, z);
const isolated = count((x, y, z) => has(x, y, z) && y > 0 && !has(x - 1, y, z) && !has(x + 1, y, z) && !has(x, y, z - 1) && !has(x, y, z + 1) && !has(x, y - 1, z) && !has(x, y + 1, z));
// a perimeter block with air straight below it: a cantilever, not a wall standing on the course below
const overhang = count((x, y, z) => has(x, y, z) && y > 0 && !has(x, y - 1, z) && !SLAB.has(y) && (!inFoot(x - 1, z) || !inFoot(x + 1, z) || !inFoot(x, z - 1) || !inFoot(x, z + 1)));
if (overhang) for (let y = 1; y < Y; y++) for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (has(x, y, z) && !has(x, y - 1, z) && !SLAB.has(y) && (!inFoot(x - 1, z) || !inFoot(x + 1, z) || !inFoot(x, z - 1) || !inFoot(x, z + 1))) console.log("overhang at", x, y, z);
let sum = 0, worst = 0;
for (const [x, z, , roof] of cells) {
  let top = 0;
  for (let y = 0; y < Y; y++) if (has(x, y, z) && !(penthouse.has(`${x},${z}`) && y >= 22)) top = y + 1;
  sum += top - tierOf(roof); worst = Math.max(worst, Math.abs(top - tierOf(roof)));
}
const r = g.save(`${DIR}/DC75292.nbt`);
console.log({ ...r, isolated, overhangingEdges: overhang, meanTopMinusTier: (sum / cells.length).toFixed(2), worstTopMinusTier: worst, glows: glows.length, penthouse: penthouse.size });
