import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Taipei shophouse-style block, c. 1980s-90s: a two-storey tiled
// concrete commercial building with a stone base, a shopfront at street level,
// a white-framed window grid above, a cornice and parapet, and rooftop units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865185";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const exp = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const ring = exp.length > 0;

  // Interior cells: floor and ceiling slabs only, air between (no interiors).
  if (!ring) {
    put(x, gr, z, "light_gray_concrete");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    if ((x + z) % 9 === 4) put(x, gr + 11, z, "gray_concrete"); // roof plant
    continue;
  }

  const corner = exp.some(d => d[0] !== 0) && exp.some(d => d[1] !== 0);
  // Facade: street face is the -z side; otherwise first exposed side.
  const facade = exp.find(d => d[0] === 0 && d[1] === -1) || exp[0];
  const [fdx, fdz] = facade;
  const street = fdz === -1;
  const u = fdz !== 0 ? x : z;            // position along the facade
  const L = fdz !== 0 ? W : D;            // facade length
  const inX = x - fdx, inZ = z - fdz;     // interior cell behind this wall
  const inside = has(inX, inZ) && !exp.length ? true : has(inX, inZ);
  const glowBehind = (y, id = "glowstone") => {
    if (!inside) return;
    const onRing = DIRS.some(([dx, dz]) => !has(inX + dx, inZ + dz));
    if (!onRing) put(inX, y, inZ, id);
  };

  // Base course.
  put(x, gr, z, "polished_andesite");

  if (corner) {
    // Corner piers run the full height.
    for (let k = 1; k <= 11; k++) put(x, gr + k, z, "white_concrete");
  } else if (street) {
    // Ground storey: shopfront with a central entrance.
    const isDoor = u === 4;
    const isPier = u % 3 === 0 || u === 0 || u === L - 1;
    for (let k = 1; k <= 3; k++) {
      if (isDoor) {
        if (k === 1) {
          put(x, gr + k, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (k === 2) {
          put(x, gr + k, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else {
          put(x, gr + k, z, "white_concrete");
        }
      } else if (isPier) {
        put(x, gr + k, z, "white_concrete");
      } else {
        put(x, gr + k, z, "glass");
      }
    }
    put(x, gr + 4, z, "smooth_quartz");
    if (!isDoor && !isPier && u % 6 === 1) glowBehind(gr + 2);
    if (isDoor) {
      // Lantern hangs from the storey slab inside the entrance.
      if (inside) put(inX, gr + 4, inZ, "lantern", { hanging: "true", waterlogged: "false" });
    }
  } else {
    // Other faces: sill, window band, lintel.
    const isPier = u % 3 === 0 || u === 0 || u === L - 1;
    put(x, gr + 1, z, "white_concrete");
    for (let k = 2; k <= 3; k++) put(x, gr + k, z, isPier ? "white_concrete" : "glass");
    put(x, gr + 4, z, "smooth_quartz");
    if (!isPier && u % 6 === 2) glowBehind(gr + 2);
  }

  // Storey line between floors.
  put(x, gr + 5, z, "white_concrete");

  // Upper storey: windows in a grid with frames.
  const isPier2 = u % 3 === 0 || u === 0 || u === L - 1;
  put(x, gr + 6, z, "white_concrete");
  put(x, gr + 9, z, "white_concrete");
  for (let k = 7; k <= 8; k++) put(x, gr + k, z, isPier2 ? "white_concrete" : "glass");
  if (!isPier2 && u % 6 === 2) glowBehind(gr + 7, "shroomlight");

  // Cornice, parapet.
  put(x, gr + 10, z, "white_concrete");
  put(x, gr + 11, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
