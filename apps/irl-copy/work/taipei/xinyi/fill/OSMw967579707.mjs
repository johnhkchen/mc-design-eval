import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Taipei shophouse-style block, c. 1970s-80s: two storeys on a stone base,
// cream tiled facade with pale piers, light blue glass bands, cornice and parapet,
// flat light-grey roof with rooftop water tanks and a plant room.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw967579707";
const W = 32, H = 23, D = 18;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of raw) ground.set(`${x},${z}`, gy);

const inside = (x, z) => ground.has(`${x},${z}`);
const B = Math.min(...ground.values());          // lowest ground: y 0 reference
const TOP = B + 10;                              // parapet course, roof height 11
const DOOR_X = Math.floor(W / 2);                // entrance on the south (z max) face

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const exposed = (x, z) => DIRS.filter((d) => !inside(x + d.dx, z + d.dz));
const isEdge = (x, z) => exposed(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS = "light_blue_stained_glass";
const PIER = "smooth_quartz";
const SILL = "quartz_block";
const BAND = "smooth_stone";
const BASE = "stone_bricks";
const ROOF = "light_gray_concrete";
const WARM = "glowstone";

for (const [x, z, gy] of raw) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone");

  // Floor slab (storey line) and roof deck on every footprint cell.
  put(x, B + 5, z, BAND);
  put(x, B + 9, z, ROOF);

  const ex = exposed(x, z);
  if (ex.length === 0) {
    // Interior cell: air gap between floors, roof equipment on the deck.
    const tanks = [[5, 5], [6, 5], [5, 6], [6, 6], [24, 11], [25, 11], [24, 12], [25, 12]];
    if (tanks.some(([tx, tz]) => tx === x && tz === z)) put(x, B + 10, z, "iron_block");
    if (x >= 19 && x <= 21 && z >= 5 && z <= 7) put(x, B + 10, z, ROOF);
    continue;
  }

  // Primary exposed face decides the along-wall index.
  const face = ex.find((f) => f.name === "north" || f.name === "south") ?? ex[0];
  const u = face.name === "north" || face.name === "south" ? x : z;
  const onSouthFront = ex.some((f) => f.name === "south");
  const isDoorCell = onSouthFront && x === DOOR_X && z === D - 1;
  const pier = u % 3 === 0;

  for (let y = gy; y <= TOP; y++) {
    if (y === B) {
      put(x, y, z, BASE);
    } else if (y >= B + 1 && y <= B + 3) {
      if (isDoorCell) {
        if (y === B + 1) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (y === B + 2) put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, BAND);
      } else {
        put(x, y, z, pier ? PIER : GLASS);
      }
    } else if (y === B + 4) {
      put(x, y, z, isDoorCell ? "stone_brick_slab" : BASE, isDoorCell ? { type: "bottom", waterlogged: "false" } : undefined);
    } else if (y === B + 5) {
      put(x, y, z, BAND);
    } else if (y === B + 6) {
      put(x, y, z, pier ? PIER : SILL);
    } else if (y === B + 7 || y === B + 8) {
      put(x, y, z, pier ? PIER : GLASS);
    } else if (y === B + 9) {
      put(x, y, z, BAND);
    } else if (y === B + 10) {
      put(x, y, z, BAND);
    }
  }

  // Warm lights behind some windows (in the air gap just inside the glass).
  const inX = x - face.dx, inZ = z - face.dz;
  const innerOpen = inside(inX, inZ) && !isEdge(inX, inZ);
  if (innerOpen && !pier && !isDoorCell) {
    if (u % 6 === 1) put(inX, B + 2, inZ, WARM);
    if (u % 6 === 4) put(inX, B + 7, inZ, WARM);
  }
}

g.save(`${DIR}/${ID}.nbt`);
