// DC77985: a 1910s Beaux-Arts office block on the Mall's edge. Calcite walls, a stone-brick plinth, a 12-block
// pavilion on the front over 10-block wings, and an 11-block bay on the front-east. Built as a shell: ring walls, floor
// slabs at y 1, 4, 7 and a roof deck per tier, air inside, with a few glowstone rooms behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77985.cells.json", "utf8"));
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inside = (x, z) => foot.has(`${x},${z}`);

// Roof tiers from the lidar, smoothed: the pavilion (x 2..7, z 0..3) reads 10-12 so it is one 12-block tier; the lidar's
// 11s on the front-east become an 11-block bay; the wings 10; the low south-east cell (roof 2) stays a 2-block lean-to.
function top(x, z) {
  if (x >= 2 && x <= 7 && z <= 3) return 12;
  if (z === 0 && x >= 8 && x <= 10) return 11;
  const { roof } = foot.get(`${x},${z}`);
  return roof <= 3 ? roof : 10;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the sides of cell (x, z) that face outside air at height y: off the footprint, or past a neighbour's roof
function exposedSides(x, z, y) {
  return Object.entries(DIRS).filter(([, [dx, dz]]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) <= y).map(([d]) => d);
}

// Floor slabs at storey lines (y 1 is the plinth and ground floor), and the lit rooms: a light sits in the air gap behind
// one window, on the floor slab.
const FLOORS = [1, 4, 7];
const LIT = new Set(["2,2,1", "10,5,1", "1,2,2", "10,5,4"]);
const B = new Map();                                  // "x,y,z" -> { block, state, axis }
const put = (x, y, z, block, state, axis) => B.set(`${x},${y},${z}`, { block, state, axis });

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const T = top(x, z), deck = T === 12 ? 10 : T - 1;  // the roof covering's own layer under the top
  for (let y = 0; y < T; y++) {
    const ex = exposedSides(x, z, y), out = ex.length > 0;
    const zFace = ex.includes("N") || ex.includes("S");
    if (y === 0 || (y === 1 && out)) put(x, y, z, "stone_bricks");                 // foundation, and the plinth course
    else if (FLOORS.includes(y) || y === deck) put(x, y, z, "smooth_stone");      // slabs and roof deck, solid
    else if (T === 12 && y === 11 && out) put(x, y, z, "stone_bricks");           // pavilion parapet
    else if (T === 11 && y === 9 && out) put(x, y, z, "smooth_stone");            // 11-bay cornice
    else if (out && (y === 2 || y === 3 || y === 5 || y === 6 || y === 8 || (y === 9 && T === 12))) {
      const u = zFace ? x : z;
      const door = (facing, hinge) => ({ facing, half: y === 2 ? "lower" : "upper", hinge, open: "false", powered: "false" });
      if (zFace && z === 0 && x >= 4 && x <= 7 && y <= 3) {                       // the portico: columns and doors
        if (x === 4 || x === 7) put(x, y, z, "quartz_pillar");
        else put(x, y, z, "dark_oak_door", door("south", x === 5 ? "left" : "right"));
      } else if (zFace && z === 6 && x === 7 && y <= 3) {                         // the rear service door on the bump
        put(x, y, z, "dark_oak_door", door("north", "left"));
      } else {
        const pier = zFace ? (u % 3 === 0 || u === 11) : (u % 3 === 0 || u === 6);
        if (pier) put(x, y, z, "calcite");
        else put(x, y, z, "glass_pane", null, zFace ? "z" : "x");
      }
    } else if (LIT.has(`${x},${y},${z}`)) put(x, y, z, "glowstone");
  }
}

// the canopy over the entrance, the roof's lightning rods on the parapet, and two units on the wing roof
for (let x = 4; x <= 7; x++) put(x, 4, 0, "stone_bricks");
put(2, 12, 0, "lightning_rod"); put(7, 12, 0, "lightning_rod");
put(9, 10, 4, "polished_andesite"); put(10, 10, 4, "polished_andesite");

// glass panes connect to the panes and piers beside them in their own wall plane
for (const [key, e] of B) {
  if (e.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const has = (dx, dz) => B.has(`${x + dx},${y},${z + dz}`);
  const conn = e.axis === "z"
    ? { east: has(1, 0), west: has(-1, 0), north: false, south: false }
    : { north: has(0, -1), south: has(0, 1), east: false, west: false };
  e.state = Object.fromEntries(Object.entries({ ...conn, waterlogged: false }).map(([k, v]) => [k, String(v)]));
}

const g = new Voxels([12, 24, 7]);
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77985.nbt";
console.log(g.save(out));
