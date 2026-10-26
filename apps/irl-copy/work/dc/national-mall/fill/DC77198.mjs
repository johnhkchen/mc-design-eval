// 443 New York Ave NW: a 1960s brick apartment block with an elevator, a stone plinth, calcite cornice and
// string courses, a corner tower stepping down to two wings, and a hollow shell (air behind the glass).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77198.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77198.nbt";

const BRICK = "bricks", PLINTH = "stone_bricks", TRIM = "calcite", DECK = "smooth_stone", GLASS = "glass_pane";
const CAP = { block: "smooth_stone_slab", state: { type: "bottom", waterlogged: "false" } };
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([4, 18, 12]);
const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const edgeX = (x) => x === 0 || x === 3, edgeZ = (z) => z === 0 || z === 11;
const perimeter = (x, z) => edgeX(x) || edgeZ(z);

// the facade of a perimeter cell at height y, from its roof height r
function facade(x, z, y, r) {
  if (y === 0) return PLINTH;
  if (edgeX(x) && edgeZ(z)) return TRIM;                      // quoins at the corners
  if (r >= 4 && y === 3) return TRIM;                          // cornice (low roofs) / string course (tower)
  if (r === 6 && y === 5) return BRICK;                        // tower top course under the cap
  if (z === 0 && (x === 1 || x === 2) && y <= 2) {             // entrance: door at x1, lobby glass at x2
    if (x === 1) return "door";
    return GLASS;
  }
  const windowHere = edgeZ(z) ? (x === 1 || x === 2) : z % 2 === 1;   // windows on the ends, odd bays on the long sides
  return windowHere ? GLASS : BRICK;
}

for (const [x, z, ground, roof] of cells) {
  const r = roof, per = perimeter(x, z);
  for (let y = 0; y <= r; y++) {
    if (y < ground) { g.set(x, y, z, PLINTH); continue; }        // foundation under the ground
    if (y === r) { if (per) g.set(x, y, z, CAP.block, CAP.state); continue; }   // parapet cap on the outer ring
    if (!per) {
      if (y === 0) g.set(x, y, z, PLINTH);
      else if (y === r - 1) g.set(x, y, z, DECK);               // roof deck over the hollow interior
      continue;                                                 // interior: air behind the glass
    }
    const f = facade(x, z, y, r);
    if (f === "door") { if (y <= 2) g.set(x, y, z, "dark_oak_door", DOOR(y === 1 ? "lower" : "upper")); continue; }
    g.set(x, y, z, f);
  }
}

// warm light (shroomlight) behind some windows (in the air gap, one or two cells in), and a mechanical penthouse on the wing roof
for (const [x, y, z] of [[2, 1, 3], [1, 1, 5], [2, 2, 3], [2, 1, 9]]) g.set(x, y, z, "shroomlight");
for (const [x, z] of [[1, 2], [2, 2], [1, 3], [2, 3]]) g.set(x, 4, z, PLINTH);

// glass panes connect to whatever is beside them (panes, piers, quoins, the door), so the bays read as framed glass
const solid = (x, y, z) => { const b = g.get(x, y, z); return b && b.block !== "minecraft:air"; };
const D = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (let y = 0; y < 18; y++) for (let z = 0; z < 12; z++) for (let x = 0; x < 4; x++) {
  const b = g.get(x, y, z); if (!b || b.block !== "minecraft:glass_pane") continue;
  const st = Object.fromEntries(Object.entries(D).map(([k, [dx, dz]]) => [k, solid(x + dx, y, z + dz) ? "true" : "false"]));
  g.set(x, y, z, GLASS, st);
}

const res = g.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, ${res.palette} palette entries`);
