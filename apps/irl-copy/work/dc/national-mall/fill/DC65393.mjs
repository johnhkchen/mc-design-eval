// 1630 R St NW: a 1920s-style red-brick apartment block with a limestone-trimmed cornice, four storeys over a shopfront
// -ish ground floor, a penthouse core and rooftop plant. Footprint 21 x 11, lidar roof 10-11 blocks above y 0.
// Front = the z=0 face (main entrance at x 9-10). Storeys are 2 blocks (~5 m at 0.42 blocks/m), so the 10-block roof reads as 4 storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65393.cells.json", "utf8"));

const g = new Voxels([21, 23, 11]);
const cell = new Map(cells.map(([x, z, gr, r]) => [`${x},${z}`, { gr, r }]));
const inFp = (x, z) => cell.has(`${x},${z}`);
const NEIGH = [[0, -1], [0, 1], [-1, 0], [1, 0]];          // front, back, west, east (front = z 0)
const edge = (x, z) => NEIGH.some(([dx, dz]) => !inFp(x + dx, z + dz));
const faceOf = (x, z) => { for (const [dx, dz] of NEIGH) if (!inFp(x + dx, z + dz)) return { dx, dz, i: dz ? x : z }; return null; };

const FLOORS = new Set([3, 5, 7, 9]);                         // floor slabs, and the roof deck at 9
const isEntrance = (x, z, y) => z === 0 && (y === 1 || y === 2) && x >= 8 && x <= 11;
const DOOR = (x, y) => ({ facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 9 ? "left" : "right", open: "false", powered: "false" });
const lights = new Set();

for (const [x, z, gr, r] of cells) {
  const e = edge(x, z), face = e ? faceOf(x, z) : null;
  for (let y = 0; y < r; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }          // foundation under a raised cell
    if (!e) {                                                           // interior: floor slabs only, air gap between
      if (y === gr || FLOORS.has(y)) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }         // base course
    if (isEntrance(x, z, y)) {
      if (x === 8 || x === 11) g.set(x, y, z, "smooth_sandstone");
      else g.set(x, y, z, "dark_oak_door", DOOR(x, y));
      continue;
    }
    const i = face.i;
    if (y > 9) { g.set(x, y, z, "bricks"); continue; }                  // penthouse core (lidar 11)
    if (y <= 2) {                                                       // shopfront / lobby
      g.set(x, y, z, i % 3 === 0 ? "stone_bricks" : "glass");
      if (y === 1 && i % 3 === 2) lights.add(`${x - face.dx},${z - face.dz}`);   // warm lobby light behind the glass
      continue;
    }
    if (FLOORS.has(y)) { g.set(x, y, z, "smooth_sandstone"); continue; }   // spandrels, cornice at 9
    g.set(x, y, z, i % 3 === 0 ? "bricks" : "glass_pane");              // upper window bays, brick piers
  }
}

// glowstone on the lobby floor behind the shopfront glass: only where the cell inside is interior
for (const k of lights) {
  const [x, z] = k.split(",").map(Number);
  if (inFp(x, z) && !edge(x, z)) g.set(x, 1, z, "glowstone");
}
// entrance lanterns inside the lobby, rooftop plant on the lower roof
g.set(9, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
g.set(10, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
for (const [x, z] of [[2, 2], [3, 2], [16, 2], [17, 2]]) g.set(x, 10, z, "iron_block");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65393.nbt";
console.log(g.save(out));
