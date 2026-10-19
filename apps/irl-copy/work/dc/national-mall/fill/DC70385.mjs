// 500 D St SW (Commercial-Office-Large): a 1970s precast-and-tinted-glass office bar on the D Street side of the Mall.
// The lidar's low roofs (1-3 blocks above y 0) are a four-storey flat bar at y 8 (2 blocks a storey, about 4.8 m each); the
// 12-13 lidar strip along the D Street (south) edge, x 16..25, is a frontage whose middle pavilion (x 18..23) rises to 13 and whose ends step down to 10; the lower
// wing on the north-east (roof <= 3) stops at y 4. Every column is solid from y 0 to its ground (foundation), and every
// tier stands on the solid row below it. Interiors are air: a slab per storey, an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC70385.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const info = new Map(cells.map(([x, z, g, roof]) => [key(x, z), { g, roof }]));
const inFoot = (x, z) => info.has(key(x, z));
const G = (x, z) => info.get(key(x, z)).g;

const frontage = (x, z) => z === 21 && x >= 16 && x <= 25;
const wing = (x, z) => x >= 19 && z <= 9 && info.get(key(x, z)).roof <= 3;
// The frontage pavilion (x 18..23) rises to 13; its ends step down to 10 (a setback in the strip).
const T = (x, z) => (frontage(x, z) ? (x >= 18 && x <= 23 ? 13 : 10) : wing(x, z) ? 4 : 8);   // top (exclusive) of each column
const topAt = (x, z) => (inFoot(x, z) ? T(x, z) : 0);              // outside the footprint: nothing above y 0

const FACES = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 }, { name: "west", dx: -1, dz: 0 },
];
// A face at height y is outside when the neighbouring column does not reach that height.
const outFaces = (x, z, y) => FACES.filter((f) => topAt(x + f.dx, z + f.dz) <= y);

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);
const windows = [];

// Entrance: a dark oak door in the D Street face of the bar, mid-frontage-side at x 13, with a canopy over the glass.
const DOOR = [13, 21];
const [doorX, doorZ] = DOOR;
const doorG = G(doorX, doorZ);

// 1. Shell, column by column.
for (const [x, z, g] of cells) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }                  // foundation under the ground
    const faces = outFaces(x, z, y);
    if (y === t - 1) {                                                      // roof: parapet on the edge, roof inside
      put(x, y, z, faces.length ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (!faces.length) {                                                    // interior: a floor slab per storey
      if (y === g || y % 2 === 0) put(x, y, z, "white_concrete");
      continue;
    }
    if (y === g) put(x, y, z, "polished_granite");                          // base course
    else if (y === t - 2) put(x, y, z, "chiseled_stone_bricks");            // cornice course
    else if (y === g + 1) {                                                 // shopfront glass, dark frames
      const along = faces[0].dz !== 0 ? x : z;
      if (faces.length > 1 || along % 3 === 0) put(x, y, z, "black_concrete");
      else { put(x, y, z, "light_blue_stained_glass_pane"); windows.push([x, y, z, faces[0]]); }
    }
    else if (y % 2 === 0) put(x, y, z, "white_concrete");                   // spandrel / storey line
    else {                                                                  // upper window rows
      const along = faces[0].dz !== 0 ? x : z;
      if (faces.length > 1 || along % 3 === 0) put(x, y, z, "light_gray_concrete");   // corner and mullion
      else { put(x, y, z, "light_blue_stained_glass_pane"); windows.push([x, y, z, faces[0]]); }
    }
  }
}

// 2. Door and canopy: lower and upper halves in the shell over the ground floor, a stone canopy over three cells.
put(doorX, doorG, doorZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorX, doorG + 1, doorZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const ox of [-1, 0, 1]) put(doorX + ox, doorG + 2, doorZ, "polished_andesite");

// 3. Roof plant on the four-storey bar: iron units, kept off the parapet, one lantern on some.
for (const [x, z] of cells) {
  if (T(x, z) !== 8 || frontage(x, z)) continue;
  const rim = FACES.some((f) => topAt(x + f.dx, z + f.dz) < 8);
  if (rim) continue;
  if (x % 5 === 2 && z % 6 === 3) {
    put(x, 8, z, "iron_block");
    if (z % 12 === 3) put(x, 9, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 4. Warm light: a glowstone just behind some glass, in the air gap, on the floor slab below.
for (const [x, y, z, f] of windows) {
  const ix = x - f.dx, iz = z - f.dz;
  if (!inFoot(ix, iz) || y <= G(ix, iz) || y >= T(ix, iz) || at(ix, y, iz)) continue;
  if (!at(ix, y - 1, iz)) continue;
  if ((x + z + y) % 11 === 0) put(ix, y, iz, "glowstone");
}

// 5. Glass pane connections: a pane joins the neighbour in each direction that is a solid block or pane (not a door).
const joins = (x, y, z) => { const b = at(x, y, z)?.block; return !!b && !b.includes("door") && b !== "lantern"; };
for (const [key2, p] of plan) {
  if (p.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key2.split(",").map(Number);
  p.state = Object.fromEntries([
    ...FACES.map((f) => [f.name, String(joins(x + f.dx, y, z + f.dz))]),
    ["waterlogged", "false"],
  ]);
}

// Write the structure.
const v = new Voxels([28, 25, 22]);
for (const [key2, p] of plan) {
  const [x, y, z] = key2.split(",").map(Number);
  v.set(x, y, z, p.block, p.state);
}
const out = v.save(`${DIR}/DC70385.nbt`);
console.log(`DC70385.nbt: ${out.blocks} blocks, ${out.palette} palette entries, ${windows.length} window cells, door at x${doorX} z${doorZ}`);
