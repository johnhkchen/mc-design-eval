import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1619 Massachusetts Ave NW: an educational building of the 1910s-20s, Georgian Revival / Beaux-Arts school in red
// brick on a stone base, with cream limestone (calcite) string courses, quoins, a cornice and parapet. A four-storey
// core (lidar 14) steps down to three-storey wings (12, 11) and a one-storey glazed annex (2), with a cupola and roof
// plant on the core. The lidar's noisy roof heights are smoothed into tiers before anything is built.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70337.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70337.nbt";

const TIER = { 10: 11, 13: 14 };    // lidar noise: a 10 is the 11 tier, a 13 is the 14 tier
const F = new Map();
for (const [x, z, ground, roof] of JSON.parse(readFileSync(CELLS, "utf8"))) F.set(`${x},${z}`, { ground, roof: TIER[roof] ?? roof });
const at = (x, z) => F.get(`${x},${z}`);
const DIRS = [{ dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: 1, dz: 0 }, { dx: -1, dz: 0 }];   // N S E W
// the faces of a cell's column at height y that look onto air: off the footprint, or above a lower neighbour's roof
const exposed = (x, y, z) => DIRS.filter(({ dx, dz }) => { const n = at(x + dx, z + dz); return !n || y >= n.roof; });
const solidAt = (x, y, z) => { const n = at(x, z); return !!n && y < n.roof; };
const onNS = (faces) => faces[0].dz !== 0;     // a N or S face runs along x, an E or W face along z
const bay = (u) => u % 3 === 1;                // one pane in three along a facade, brick piers between

// the facade material of an exposed column cell at height y: plinth, storey lines, cornice and parapet, quoins
function facadeBlock(x, y, z, roof, faces) {
  if (y === roof - 1) return roof === 2 && bay(onNS(faces) ? x : z) ? ["glass_pane"] : roof === 2 ? ["bricks"]
    : ["stone_brick_slab", { type: "top", waterlogged: "false" }];
  if (y === roof - 2 || (y < roof - 2 && (y === 3 || y === 6 || y === 9))) return ["calcite"];   // cornice, string courses
  const b = bay(onNS(faces) ? x : z);
  if (faces.length >= 2) return b ? ["bricks"] : ["calcite"];                                        // quoins on the piers only: the lidar's jagged corners would otherwise turn whole walls to stone
  return b ? ["glass_pane"] : ["bricks"];                                                            // window or pier
}

const g = new Voxels([14, 26, 16]);
const panes = [];
for (const [k, { ground, roof }] of F) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < roof; y++) {
    if (y === 0 || y < ground) { g.set(x, y, z, "stone_bricks"); continue; }          // plinth and foundation
    const faces = exposed(x, y, z);
    if (!faces.length) { g.set(x, y, z, y === roof - 1 ? "smooth_stone" : "bricks"); continue; }
    // the main entrance: a double dark oak door on the north face, under the string course
    if (z === 0 && (x === 5 || x === 6) && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 5 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    const [block, state] = facadeBlock(x, y, z, roof, faces);
    if (block === "glass_pane") {
      // panes connect along the facade to solid neighbours only
      const side = onNS(faces) ? ["east", "west"] : ["north", "south"];
      const [a, b] = onNS(faces) ? [[x + 1, z], [x - 1, z]] : [[x, z + 1], [x, z - 1]];
      const st = { north: "false", south: "false", east: "false", west: "false" };
      st[side[0]] = solidAt(a[0], y, a[1]) ? "true" : "false";
      st[side[1]] = solidAt(b[0], y, b[1]) ? "true" : "false";
      g.set(x, y, z, "glass_pane", st);
      panes.push({ x, y, z, faces, lit: (x * 7 + z * 5 + y * 3) % 4 === 0 });
    } else g.set(x, y, z, block, state);
  }
}

// each window has a one-block air gap behind the glass (glowstone in some, for the dusk glow) and is bounded by the
// floor slabs above and below; only cells that are not facade are opened, so no hole runs through a thin wall
for (const { x, y, z, faces, lit } of panes) {
  const xi = x - faces[0].dx, zi = z - faces[0].dz;
  if (at(xi, zi) && y < at(xi, zi).roof && !exposed(xi, y, zi).length) g.set(xi, y, zi, lit ? "glowstone" : "air");
}

// the entrance's vestibule is open behind the doors where it is not facade
for (const x of [5, 6]) for (const y of [1, 2]) if (!exposed(x, y, 1).length) g.set(x, y, 1, "air");

// a cupola on the core: a 3x3 glazed drum, a lantern hung under a stone cap, a lightning rod
for (let x = 4; x <= 6; x++) for (let z = 5; z <= 7; z++) for (let y = 14; y <= 16; y++) {
  const corner = x !== 5 && z !== 6;
  if (corner) g.set(x, y, z, "calcite");
  else if (x === 5 && z === 6) { if (y === 16) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); }
  else g.set(x, y, z, "glass_pane", x === 5 ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" });
}
for (let x = 4; x <= 6; x++) for (let z = 5; z <= 7; z++) g.set(x, 17, z, "stone_bricks");
g.set(5, 18, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// roof plant on the wings: units standing on the roof surface, on cells with no facade under them
for (const [x, y, z] of [[8, 12, 4], [9, 12, 4], [9, 11, 9]]) g.set(x, y, z, "light_gray_concrete");

const { blocks, palette } = g.save(OUT);
console.log(`saved ${OUT}: ${blocks} blocks, palette ${palette}`);
