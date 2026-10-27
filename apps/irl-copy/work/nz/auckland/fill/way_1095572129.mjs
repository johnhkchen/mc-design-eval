// Mt Eden-side interwar brick shopfront: one storey on a stone-faced plinth, a stone cornice and a brick parapet,
// shop glass and a timber door on the east (street) face, steel-sash windows on the sides, a skylit flat roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
// [x, z, ground, roof] per footprint cell; x 0..7, z 0..8; roof = lidar height above y 0
const cells = JSON.parse(readFileSync(`${DIR}/way_1095572129.cells.json`, "utf8"));
const FP = new Map(cells.map(([x, z, gr, roof]) => [`${x},${z}`, { gr, roof }]));
const inFp = (x, z) => FP.has(`${x},${z}`);
// the faces a cell can have to the outside: [name, dx, dz, facing]
const FACES = [["E", 1, 0, "east"], ["W", -1, 0, "west"], ["S", 0, 1, "south"], ["N", 0, -1, "north"]];
const exposed = (x, z) => FACES.filter(([, dx, dz]) => !inFp(x + dx, z + dz));

// the plan first (cell -> [block, state]), so glass panes can see their neighbours before anything is written
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, [block, state]);
const isPerimeter = (x, z) => exposed(x, z).length > 0;

// interior skylight: the four centre-most interior roof cells (set below once the perimeter is known)
const SKYLIGHT = new Set(["3,4", "4,4", "3,5", "4,5"]);
const lanternCells = [];
const lampCells = [];

for (const [x, z, gr, roof] of cells) {
  const top = roof - 1;                                   // the parapet / roof course of this cell
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");     // foundation under the ground line
  put(x, gr, z, "polished_andesite");                      // floor slab
  const out = exposed(x, z);

  if (!out.length) {                                       // interior: a roof membrane, air between
    if (!SKYLIGHT.has(`${x},${z}`)) put(x, top, z, "gray_concrete");
    else put(x, top, z, "glass");
    if ((x + z) % 3 === 0 && !SKYLIGHT.has(`${x},${z}`)) lanternCells.push([x, top - 1, z]);
    continue;
  }

  const front = out.some(([n]) => n === "E");              // the east face is the street front
  const along = out[0][1] !== 0 ? z : x;                   // E/W faces run along z, N/S faces along x
  for (let y = gr + 1; y <= top; y++) {
    if (y === top) { put(x, y, z, "bricks"); continue; }                  // parapet
    if (y === top - 1) { put(x, y, z, "smooth_stone"); continue; }       // cornice course
    if (front) {
      if (y === 3) { put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }   // fascia / canopy band
      if (z === 3) {                                                    // timber door, centred
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "east", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      put(x, y, z, "glass");                                            // shop glass
      continue;
    }
    if (y === 1) { put(x, y, z, "bricks"); continue; }                  // plinth course of brick
    if (along % 2 === 1) { put(x, y, z, "glass_pane"); continue; }      // steel-sash window bay
    put(x, y, z, "bricks");
  }

  // a lamp in some side windows: the interior cell behind the pane, two blocks up
  if (!front && along % 4 === 1) {
    const [, dx, dz] = out[0];
    const ix = x - dx, iz = z - dz;
    if (inFp(ix, iz) && !isPerimeter(ix, iz)) lampCells.push([ix, 2, iz]);
  }
}

for (const [x, y, z] of lanternCells) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
for (const [x, y, z] of lampCells) put(x, y, z, "glowstone");

// glass panes connect to the walls and panes beside them on the same course (never into the air or a lamp)
const PANE_NEIGHBOUR = new Set(["bricks", "smooth_stone", "glass_pane", "stone_bricks"]);
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
for (const [key, [block]] of plan) {
  if (block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const state = { waterlogged: "false" };
  for (const [name, dx, dz] of DIRS) {
    const n = plan.get(`${x + dx},${y},${z + dz}`);
    state[name] = n && PANE_NEIGHBOUR.has(n[0]) ? "true" : "false";
  }
  plan.set(key, [block, state]);
}

const g = new Voxels([8, 19, 9]);
for (const [key, [block, state]] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
g.save(`${DIR}/way_1095572129.nbt`);
