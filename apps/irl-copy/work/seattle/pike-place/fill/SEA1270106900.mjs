// SHOWBOX BUILDING (1916, 1412 1st Ave, Retail Store). A 1910s Seattle commercial block: red brick walls on a stone
// foundation, a shopfront on the street (south) front and the west end, three storeys above it. Stone belt courses at
// y 5 and 10, stone sills and lintels round each window bay, brick piers between bays, a stone cornice at y 14 and a
// brick parapet with a stone coping. The roof deck sits at y 14 (the lidar height above the lowest ground); each cell's
// foundation is filled up to its ground, so the lower (west) cells show one more wall course than the raised east ones.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${DIR}/SEA1270106900.cells.json`, "utf8"));
const W = 32, H = 26, D = 8;
const ROOF = 14, PARAPET = 15, COPING = 16;
const BELTS = [5, 10];
const DOOR_X = 15;                                             // the street door, in the south front

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inside = (x, z) => ground.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));
const perimeter = (x, z) => exposed(x, z).length > 0;
const corner = (x, z) => exposed(x, z).length > 1;
const faceOf = (x, z) => ["S", "W", "N", "E"].find((d) => exposed(x, z).includes(d));

// One perimeter block: the facade for its height. Corners are stone quoins; bays are piers of brick every 4 cells
// with a sill, panes and a lintel between them; the ground storey is a shopfront on the south and west fronts.
function facade({ x, z, gr, y, face, u }) {
  const shop = face === "S" || face === "W";
  if (y === COPING) return ["stone_brick_slab", { type: "bottom" }];
  if (y === PARAPET) return corner(x, z) ? ["stone_bricks"] : ["bricks"];
  if (y === ROOF) return ["stone_bricks"];                                  // cornice
  if (corner(x, z)) return y % 2 ? ["bricks"] : ["stone_bricks"];           // quoins, alternating courses
  if (BELTS.includes(y)) return ["stone_bricks"];
  const pier = u % 4 === 0;
  if (y < BELTS[0]) {                                                       // ground storey
    const door = shop && face === "S" && Math.abs(x - DOOR_X) <= 1 && (y === gr + 1 || y === gr + 2);
    if (door) {                                                             // the street door, with glass either side
      if (x !== DOOR_X) return ["glass"];
      return ["dark_oak_door", { facing: "south", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    }
    if (y === gr + 1) return shop ? ["polished_andesite"] : ["stone_bricks"];   // bulkhead / base course
    if (y === 4) return shop ? ["dark_oak_planks"] : ["stone_brick_slab", { type: "bottom" }];   // facia / lintel
    if (shop) return pier ? ["dark_oak_log", { axis: "y" }] : ["glass"];
    return pier ? ["bricks"] : ["glass_pane"];
  }
  if (y === 6 || y === 11) return pier ? ["bricks"] : ["stone_brick_slab", { type: "bottom" }];   // sills
  if (y === 9) return pier ? ["bricks"] : ["stone_brick_slab", { type: "top" }];                  // lintel
  return pier ? ["bricks"] : ["glass_pane"];                                                      // panes, y 7-8 and 12-13
}

const g = new Voxels([W, H, D]);

// Foundation, then a floor slab per storey (ground, 5, 10) across the whole footprint, and the roof deck.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (const y of [gr, ...BELTS]) g.set(x, y, z, "smooth_stone");
  g.set(x, ROOF, z, "smooth_stone");
}

// Facade: every perimeter cell from just above its ground up to the coping.
for (const [x, z, gr] of cells) {
  if (!perimeter(x, z)) continue;
  const face = faceOf(x, z), u = face === "S" || face === "N" ? x : z;
  for (let y = gr + 1; y <= COPING; y++) {
    const [b, s] = facade({ x, z, gr, y, face, u });
    g.set(x, y, z, b, s);
  }
}

// Warm light in the air cell just inside some bays (the interior is empty but for these and the floors).
for (const [x, z] of cells) {
  if (!perimeter(x, z) || corner(x, z)) continue;
  const face = faceOf(x, z), u = face === "S" || face === "N" ? x : z;
  if (u % 4 === 0 || (face === "S" && Math.abs(x - DOOR_X) <= 1)) continue;
  const [dx, dz] = DIRS[face], ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || perimeter(ix, iz)) continue;
  if (face === "S" || face === "W") { if (u % 8 === 2) g.set(ix, 3, iz, "glowstone"); }
  else {
    if (u % 8 === 6) g.set(ix, 7, iz, "shroomlight");
    if (u % 8 === 2) g.set(ix, 11, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof equipment: a brick stair-house on the interior roof with a door to the south, and a pair of copper units.
for (let y = PARAPET; y <= 16; y++) for (let x = 12; x <= 14; x++) for (const z of [5, 6]) g.set(x, y, z, "bricks");
for (let x = 12; x <= 14; x++) for (const z of [5, 6]) g.set(x, 17, z, "stone_brick_slab", { type: "bottom" });
for (const y of [PARAPET, 16]) g.set(13, y, 6, "dark_oak_door", { facing: "south", half: y === PARAPET ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
for (const [x, z] of [[9, 3], [10, 3], [9, 4], [10, 4]]) g.set(x, PARAPET, z, "oxidized_copper");

// Panes join neighbouring panes and solid blocks, as they do in game (lights do not count).
const LIGHT = /(lantern|glowstone|shroomlight)$/;
for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (g.get(x, y, z)?.block !== "minecraft:glass_pane") continue;
  const state = {};
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = g.get(x + dx, y, z + dz);
    state[{ N: "north", S: "south", E: "east", W: "west" }[d]] = n && !LIGHT.test(n.block) ? "true" : "false";
  }
  g.set(x, y, z, "glass_pane", { ...state, waterlogged: "false" });
}

const out = `${DIR}/SEA1270106900.nbt`;
console.log(g.save(out));
