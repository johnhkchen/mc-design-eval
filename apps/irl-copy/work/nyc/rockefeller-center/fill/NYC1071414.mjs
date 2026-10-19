// 1166 Avenue of the Americas, 1975 commercial and office tower: one flat-topped slab of 158 blocks (about 176 m) on a
// 49 x 49 footprint. The lidar reads 157-159 over the whole plate, so the massing is one tier at 158; the cells it reads
// low (0-9 and 45-46 on the north edge, 114 in the middle) are lidar dropouts and build to the same slab. Ground is 0 or
// 1, so the ground storey sits on a stone foundation under the higher cells, and it is the shopfront: a granite plinth,
// glass to y 4, a granite lintel. Office storeys are 3 blocks from y 5 (51 of them to y 157): a spandrel course (the floor
// line) and two rows of tinted glass, with light-grey mullions every 3 blocks and a full-height light column at each
// corner. The avenue runs along z, so the avenue facade is the west face (x 0): the lobby sits there, a double door
// (iron, hinged at z 22 and 23) under a granite lintel with a hanging lantern, the glass transom above it.
// A cornice course at y 157 and a one-block parapet at y 158 close the ring. Roof: a membrane at y 157, a plant room over
// the centre (x 18-30, z 18-28, to y 161, louvred), and two cooling blocks. The office glass is one block out from a
// solid core, with air behind it (no interiors) and a floor slab per storey; a few panes have a glowstone in that air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1071414.cells.json`, "utf8"));
const X = 49, Y = 171, Z = 49;

const TOP = 158;        // the slab's height above y 0 (the parapet block is its top, at y 158)
const ROOF = TOP - 1;   // the roof membrane and the cornice course
const SHOP = 5;         // the ground storey runs from each cell's ground up to y 4; office storeys start at y 5

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFoot = (x, z) => ground.has(`${x},${z}`);
const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // N = low z (uptown)
const facesOf = (x, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return !inFoot(x + dx, z + dz); });
const bay = (x, z, f) => (f === "W" || f === "E" ? z : x);       // the index along a face: z on the avenue faces, x on the others
const lit = (i, y, f) => (i * 5 + y * 7 + f.charCodeAt(0) * 3) % 11 === 0;   // sparse, deterministic warm panes

const DOOR = { facing: "west", open: "false", powered: "false" };

const interior = (y, g0) => (y > ROOF ? null : y < g0 ? { b: "stone_bricks" } : y === ROOF ? { b: "gray_concrete" } : { b: "light_gray_concrete" });

// The outer skin of a footprint cell at height y: {b, s, glass} or null (interior). glass = a pane, with air behind it.
function skin(x, z, y, F, g0) {
  if (x === 0 && F.includes("W") && y >= 1 && y <= 3 && z >= 21 && z <= 24) {          // the lobby entrance
    if (z === 22 || z === 23) {
      if (y === 3) return { b: "gray_stained_glass" };                                  // transom
      return { b: "iron_door", s: { ...DOOR, half: y === 1 ? "lower" : "upper", hinge: z === 22 ? "left" : "right" } };
    }
    return { b: "light_gray_concrete" };                                                // door frame
  }
  if (!F.length) return null;
  if (y === TOP) return { b: "light_gray_concrete" };                                  // parapet
  if (y < g0) return { b: "stone_bricks" };                                            // foundation under a raised cell
  if (y === ROOF) return { b: "light_gray_concrete" };                                 // cornice
  if (y === g0 || y === SHOP - 1) return { b: "polished_granite" };                    // plinth and shop lintel
  if (F.length > 1 || bay(x, z, F[0]) % 3 === 0) return { b: "light_gray_concrete" };  // mullion, or a corner column
  if (y < SHOP) return { b: "gray_stained_glass", glass: true };                       // shopfront
  if ((y - SHOP) % 3 === 0) return { b: "gray_concrete" };                             // spandrel: the floor line
  return { b: "gray_stained_glass", glass: true };                                     // office pane
}

const g = new Voxels([X, Y, Z]);
const behind = new Map();   // "x,y,z" of an inner cell behind a pane -> "air" or "glowstone"
for (const [x, z] of cellList) {
  const F = facesOf(x, z), g0 = ground.get(`${x},${z}`);
  for (let y = 0; y <= TOP; y++) {
    const s = skin(x, z, y, F, g0) ?? interior(y, g0);
    if (!s) continue;
    g.set(x, y, z, s.b, s.s);
    if (!s.glass) continue;
    const row = y < SHOP ? -1 : (y - SHOP) % 3;
    const warm = (y < SHOP ? y === g0 + 1 : row === 1) && F.some((f) => lit(bay(x, z, f), y, f));
    for (const f of F) {
      const [dx, dz] = DIRS[f], ix = x - dx, iz = z - dz;
      if (inFoot(ix, iz) && !facesOf(ix, iz).length) behind.set(`${ix},${y},${iz}`, warm ? "glowstone" : "air");
    }
  }
}
for (const [k, b] of behind) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, b); }

// The lobby: air behind the entrance, a granite canopy over it, a lantern hung from the canopy.
for (let x = 1; x <= 2; x++) for (let z = 21; z <= 24; z++) for (let y = 1; y <= 3; y++) g.set(x, y, z, "air");
for (let x = 1; x <= 2; x++) for (let z = 20; z <= 25; z++) g.set(x, SHOP - 1, z, "polished_granite");
g.set(1, 3, 22, "lantern", { hanging: "true", waterlogged: "false" });

// The roof: a plant room over the centre, louvred at y 159, capped at 161; two cooling blocks on the membrane.
for (let x = 18; x <= 30; x++) for (let z = 18; z <= 28; z++) {
  if (!inFoot(x, z)) continue;
  const edge = x === 18 || x === 30 || z === 18 || z === 28;
  g.set(x, TOP, z, "light_gray_concrete");
  g.set(x, TOP + 1, z, edge ? "gray_concrete" : "light_gray_concrete");
  g.set(x, TOP + 2, z, "light_gray_concrete");
  g.set(x, TOP + 3, z, "smooth_stone");
}
for (let x = 36; x <= 38; x++) for (let z = 34; z <= 36; z++) for (let y = TOP; y <= TOP + 1; y++) g.set(x, y, z, "smooth_stone");

// Check: nothing hangs (a block with air under it must have a block beside it on its own level, i.e. a course held by a wall).
let floating = 0;
for (let y = 1; y <= TOP + 3; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!g.get(x, y, z) || g.get(x, y, z).block === "minecraft:lantern" || g.get(x, y, z).block === "minecraft:iron_door") continue;
  // a course over air is held by its neighbours: only a block with nothing beside it on its level hangs
  if (!g.get(x, y - 1, z) && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz))) floating++;
}
console.log(`footprint ${cellList.length} cells, roof ${TOP}, floating blocks ${floating}`);
console.log(g.save(`${DIR}/NYC1071414.nbt`));
