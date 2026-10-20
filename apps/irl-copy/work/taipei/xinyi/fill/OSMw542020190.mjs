import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise commercial block, c. 1980s Taipei: two storeys over a plain
// podium, white tiled walls, shopfront glazing at street level, punched
// windows above, a quartz storey band and cornice, flat roof with parapet
// and a rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020190";
const W = 11, D = 17, H = 23;

const ROOF = 10;   // roof deck layer (about 11 blocks above lowest ground)
const BAND = 5;    // storey line between the two floors

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const groundOf = new Map();
for (const [x, z, gy] of cells) groundOf.set(`${x},${z}`, gy);
const inside = (x, z) => groundOf.has(`${x},${z}`);
const ground = (x, z) => groundOf.get(`${x},${z}`);
const exterior = (x, z) =>
  !inside(x, z - 1) || !inside(x, z + 1) || !inside(x - 1, z) || !inside(x + 1, z);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade material for an exterior wall cell at height y.
function facade(x, y, z, gr) {
  if (y === gr) return "polished_granite";          // base course
  if (y === BAND) return "smooth_quartz";           // storey line
  const bay = (x + z) % 2 === 0;                    // window bays alternate
  if (y < BAND) {
    if (bay && y >= gr + 1 && y <= BAND - 2) return "light_blue_stained_glass";
    return "white_concrete";
  }
  if (bay && y >= BAND + 1 && y <= ROOF - 2) return "light_blue_stained_glass";
  return "white_concrete";
}

// Entrance: middle exterior cell along the southern (max z) edge.
const southEdge = cells
  .filter(([x, z]) => z === Math.max(...cells.map(c => c[1])) && exterior(x, z))
  .sort((a, b) => a[0] - b[0]);
const entrance = southEdge.length ? southEdge[Math.floor(southEdge.length / 2)] : null;

// Rooftop tank: a 2x2 patch of interior roof cells.
let tank = null;
for (const [x, z, gr] of cells) {
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (quad.every(([qx, qz]) => inside(qx, qz) && !exterior(qx, qz) && ground(qx, qz) <= ROOF)) {
    tank = quad;
    break;
  }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ext = exterior(x, z);
  const top = Math.max(ROOF, gr);

  for (let y = gr; y <= top; y++) {
    if (y === top) {
      put(x, y, z, ext ? "smooth_quartz" : "gray_concrete"); // cornice / roof deck
      continue;
    }
    if (y === gr) {
      put(x, y, z, ext ? "polished_granite" : "smooth_stone"); // base / ground floor slab
      continue;
    }
    if (ext) {
      put(x, y, z, facade(x, y, z, gr));
    } else if (y === BAND && BAND > gr) {
      put(x, y, z, "smooth_stone"); // upper floor slab; interior air elsewhere
    }
  }

  // Parapet ring on the roof edge.
  if (ext && top === ROOF) put(x, ROOF + 1, z, "smooth_quartz");

  // Warm light: lanterns on the ground floor, glowstone on the upper floor.
  if (!ext) {
    if (((x * 7 + z * 3) % 5 === 0) && gr < BAND - 1) put(x, gr + 1, z, "lantern");
    if (((x * 3 + z * 5) % 7 === 0) && gr < BAND) put(x, BAND + 1, z, "glowstone");
  }
}

// Entrance door, double-height, facing outward to the south.
if (entrance) {
  const [x, z, gr] = entrance;
  if (gr + 2 < BAND) {
    put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "white_concrete"); // lintel over the door
  }
}

// Rooftop water tank on the 2x2 patch.
if (tank) {
  for (const [x, z] of tank) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "white_concrete");
    put(x, ROOF + 3, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
