import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408104";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 21;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const pane = (axis) =>
  axis === "x"
    ? { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" }
    : { north: "true", east: "false", south: "true", west: "false", waterlogged: "false" };

// Entrance: the street-side (lowest z) footprint cell nearest the middle of the frontage.
let frontZ = Infinity;
for (const [, z] of cells) frontZ = Math.min(frontZ, z);
const frontXs = cells.filter(([, z]) => z === frontZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const edge = missN || missS || missW || missE;

  if (!edge) {
    // Interior: air gap, floor slabs per storey, roof deck, rooftop plant.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    if (x >= 4 && x <= 7 && z >= 4 && z <= 7) {
      put(x, gr + 11, z, "smooth_stone");
      put(x, gr + 12, z, "stone_bricks");
    }
    // Warm lanterns standing on the floors, visible through the windows.
    if (x === 2 && z % 5 === 2) {
      put(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
      put(x, gr + 6, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
    continue;
  }

  // Facade orientation: which way the wall faces, and the running axis.
  let run, t, face;
  const corner = (missN || missS) && (missW || missE);
  if (missN) { face = "north"; run = "x"; t = x; }
  else if (missS) { face = "south"; run = "x"; t = x; }
  else if (missW) { face = "west"; run = "z"; t = z; }
  else { face = "east"; run = "z"; t = z; }

  const pier = corner || t % 3 === 0;
  const isDoor = face === "north" && z === frontZ && x === doorX;
  const frame = pier ? "light_gray_concrete" : "white_concrete";

  // Base course.
  put(x, gr, z, "polished_andesite");

  // Storey 1: shopfront glazing with lintel.
  if (isDoor) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "gray_concrete");
    put(x, gr + 4, z, "gray_concrete");
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (pier) put(x, y, z, frame);
      else put(x, y, z, "glass_pane", pane(run));
    }
    put(x, gr + 4, z, pier ? frame : "gray_concrete");
  }

  // Storey line between floors.
  put(x, gr + 5, z, "gray_concrete");

  // Storey 2: upper window band in tinted glass with a sill.
  put(x, gr + 6, z, pier ? frame : "gray_concrete");
  for (let y = gr + 7; y <= gr + 9; y++) {
    if (pier) put(x, y, z, frame);
    else put(x, y, z, "light_blue_stained_glass_pane", pane(run));
  }

  // Cornice and parapet with stone cap.
  put(x, gr + 10, z, "gray_concrete");
  put(x, gr + 11, z, "white_concrete");
  put(x, gr + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Warm lights behind a few upper windows on the rear facade.
  if (!pier && face === "south" && x % 6 === 1) {
    put(x, gr + 8, z, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
