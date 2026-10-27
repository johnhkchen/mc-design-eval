// Mt Eden-side commercial block, 1920s-30s: two storeys of brick over a stone base, a stone string course, a
// glazed shopfront on the downhill (+z) face, a stone parapet with a coping course, and a plant room on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_825070305.cells.json", "utf8"));
const g = new Voxels([16, 21, 12]);

const ROOF = 9;              // lidar roof height above y 0; the parapet's top face
const STRING = 4;            // first-floor slab / string course
const CAP = 8;               // roof deck and parapet course (top face at ROOF)
const key = (x, z) => `${x},${z}`;

const F = new Map();         // footprint cell -> ground
for (const [x, z, ground] of cells) F.set(key(x, z), ground);
const inF = (x, z) => F.has(key(x, z));
// outward normals of the faces this cell shares with the outside
const outward = (x, z) => [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]].filter(([dx, dz]) => !inF(x + dx, z + dz));
const isPerim = (x, z) => outward(x, z).length > 0;

const WALL = "bricks", PIER = "stone_bricks", BASE = "stone_bricks", SLAB = "smooth_stone", GLASS = "glass_pane";

for (const [x, z, ground] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);
  // ground-floor slab on the foundation, interior only (the walls carry the perimeter)
  if (!isPerim(x, z)) g.set(x, ground, z, SLAB);
  // first-floor and roof slabs span the whole footprint
  g.set(x, STRING, z, SLAB);
  g.set(x, CAP, z, isPerim(x, z) ? PIER : SLAB);
}

// shell: perimeter walls with window grids
const frontDoor = [13, 11];   // the lowest corner of the footprint, on the downhill (+z) face
const lights = new Set();
for (const [x, z, ground] of cells) {
  if (!isPerim(x, z)) continue;
  const out = outward(x, z);
  const corner = out.length > 1;
  const [dx, dz, face] = out[0] ?? [0, 0, "north"];
  const along = dz !== 0 ? x : z;            // position along the face
  const window = !corner && along % 3 !== 0;  // two panes, then a pier
  const paneState = dz !== 0 ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
                             : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  for (let y = ground; y < ROOF; y++) {
    if (y === ROOF - 1) { g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }   // coping on the parapet
    if (y === CAP) { g.set(x, y, z, PIER); continue; }
    if (y === STRING) { g.set(x, y, z, SLAB); continue; }
    if (y === 3 || y === 7) { g.set(x, y, z, WALL); continue; }           // storey lintels
    const storeyWindow = (y >= 1 && y <= 2) || (y === 5 || y === 6);
    if (!corner && window && storeyWindow && y > ground) {
      g.set(x, y, z, GLASS, paneState);
      if (y === 5 && (x + z) % 5 === 0) lights.add(key(x + dx * -1, z + dz * -1) + ":5");  // glowstone behind this pane
      continue;
    }
    if (y === ground) { g.set(x, y, z, BASE); continue; }
    g.set(x, y, z, corner ? PIER : WALL);                                  // brick infill and piers; stone quoins at the corners
  }
  // the shopfront door: lower and upper halves in the lowest cell of the front
  if (x === frontDoor[0] && z === frontDoor[1]) {
    g.set(x, ground, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, ground + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// glowstone behind selected upper-floor panes; a hanging lantern under the entrance slab
for (const k of lights) { const [xz, y] = k.split(":"); const [x, z] = xz.split(",").map(Number); if (!isPerim(x, z) && inF(x, z)) g.set(x, Number(y), z, "glowstone"); }
g.set(13, 3, 10, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant: a two-high box on the interior of the roof, standing on the deck
for (const [x, z] of [[6, 4], [7, 4], [6, 5], [7, 5], [8, 4], [8, 5]]) {
  if (!inF(x, z) || isPerim(x, z)) continue;
  g.set(x, ROOF, z, "light_gray_concrete");
  g.set(x, ROOF + 1, z, "light_gray_concrete");
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_825070305.nbt");
console.log(out);
