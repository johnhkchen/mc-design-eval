// DC71882: 1501 12th St NW, a 1910s Beaux-Arts-era five-unit apartment block of red brick on a stone plinth,
// with a limestone string course per storey and a stone cornice. The street face (south, z 8) carries the entrance.
// Footprint cells come from DC71882.cells.json as [x, z, ground, roof]; the building walls are a one-block shell,
// the interior is air behind the glass with one floor slab per storey and a roof deck under the cornice.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC71882.cells.json`, "utf8"));

const W = 7, D = 9, H = 19;
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r });
const cellAt = (x, z) => fp.get(`${x},${z}`);

// Intent first, so glass panes can read their neighbours before they are written.
const want = new Map();
const put = (x, y, z, block, state) => want.set(`${x},${y},${z}`, { block, state });

// Shell classification: a cell with a missing footprint neighbour is exterior.
const DIRS = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  c.missing = DIRS.filter(([dx, dz]) => !cellAt(x + dx, z + dz)).map(([dx, dz, n]) => ({ dx, dz, n }));
  c.isExt = c.missing.length > 0;
  c.x = x; c.z = z;
}

// Door: the street face (south, z 8, the face the render calls the front), centre cell.
const DOOR = { x: 3, z: 8 };

for (const c of fp.values()) {
  const { x, z, g, r, isExt, missing } = c;
  // foundation below the lowest ground, plinth at the cell's own ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  put(x, g, z, "stone_bricks");
  const top = r - 1;           // cornice / roof-deck row
  const isCorner = missing.length >= 2;

  for (let y = g + 1; y < top; y++) {
    const rel = y - g;
    if (rel === 3) { put(x, y, z, "smooth_stone"); continue; }     // floor slab / string course
    if (!isExt) continue;                                            // interior air behind the glass
    const windowRow = rel === 1 || rel === 2 || rel === 4 || rel === 5;
    if (windowRow && !isCorner && (x + z) % 2 === 1) {
      if (x === DOOR.x && z === DOOR.z) {
        if (rel === 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        if (rel === 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false", });
        continue;
      }
      put(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      continue;
    }
    put(x, y, z, "bricks");
  }
  // the cornice (exterior) or roof deck (interior) closes each column
  put(x, top, z, "smooth_stone");
}

// Panes connect to whatever stands beside them in the wall plane.
for (const [key, v] of want) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const near = (dx, dz) => { const n = want.get(`${x + dx},${y},${z + dz}`); return n && n.block !== "air" ? "true" : "false"; };
  v.state = { north: near(0, -1), south: near(0, 1), east: near(1, 0), west: near(-1, 0), waterlogged: "false" };
}

// Warm light behind some ground and upper windows: glowstone in the interior cell straight in from the glass.
for (const c of fp.values()) {
  if (!c.isExt || c.missing.length !== 1) continue;
  const { x, z, g, r } = c;
  if ((x * 3 + z * 5) % 4 !== 1) continue;
  const m = c.missing[0];
  const inward = cellAt(x - m.dx, z - m.dz);
  if (!inward || inward.isExt) continue;
  if (g + 1 < r - 1) put(x - m.dx, g + 1, z - m.dz, "glowstone");
}

// Rooftop: a brick chimney on the north-west corner and an HVAC unit on the lower east wing.
put(1, 7, 0, "bricks"); put(1, 8, 0, "bricks");
put(6, 6, 6, "light_gray_concrete");

// Write the volume.
const g3 = new Voxels([W, H, D]);
for (const [key, v] of want) {
  const [x, y, z] = key.split(",").map(Number);
  g3.set(x, y, z, v.block, v.state);
}
const out = g3.save(`${DIR}/DC71882.nbt`);
console.log(`DC71882: ${out.blocks} blocks, ${out.palette} palette entries`);
