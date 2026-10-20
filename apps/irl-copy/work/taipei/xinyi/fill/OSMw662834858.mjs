import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw662834858";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 90, H = 47, D = 20;
const T = 35;                       // roof level above lowest ground (7 storeys x 5)

// Normalise grounds so the lowest ground under the footprint is y 0.
const minG = Math.min(...cells.map(c => c[2]));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr - minG);
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

const isShell = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
// front/back faces (long sides, along x) take priority at corners
const onZFace = (x, z) => !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inBounds(x, y, z)) return;
  if (y < gAt(x, z)) return;        // only above the cell's own ground
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Facade material for a shell cell at height y.
function facade(x, z, y, u, fz) {
  const rel = y % 5;
  const s = Math.floor(y / 5);
  if (rel === 0) return s === 0 ? "polished_andesite" : "quartz_block";   // spandrel / base course
  if (s === 0 && fz && z === 0 && x >= 42 && x <= 47) return "stone_bricks"; // entrance canopy row
  if (rel === 4) return "white_concrete";                                    // fascia / frame
  if (u % 5 === 0) return "white_concrete";                                  // piers as frames
  return "cyan_stained_glass";
}

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gr = gAt(x, z);
  const shell = isShell(x, z);
  const fz = onZFace(x, z);
  const u = fz ? x : z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < T; y++) {
    const rel = y % 5;
    const s = Math.floor(y / 5);
    if (shell) {
      g.set(x, y, z, facade(x, z, y, u, fz));
    } else {
      // Interior: floor slab at each storey line, otherwise air.
      if (rel === 0) g.set(x, y, z, "light_gray_concrete");
      // Warm glowstone just behind some window bays, at mid-window height.
      if (rel === 2) {
        if (z === 1 && has(x, 0) && x % 5 === 2 && s % 2 === 0) g.set(x, y, z, "glowstone");
        if (z === D - 2 && has(x, D - 1) && x % 5 === 2 && s % 2 === 1) g.set(x, y, z, "glowstone");
      }
    }
  }

  if (shell) {
    g.set(x, T, z, "quartz_block");          // cornice
    if (gr <= T + 1) g.set(x, T + 1, z, "white_concrete"); // parapet
  } else {
    g.set(x, T, z, "gray_concrete");         // roof deck
  }
}

// Entrance: glass doors on the front face, lanterns under the canopy.
put(45, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(45, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(44, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
put(46, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// Rooftop plant penthouse, sitting on the roof deck at T.
for (let x = 30; x <= 59; x++) {
  for (let z = 6; z <= 13; z++) {
    if (!has(x, z)) continue;
    const perim = x === 30 || x === 59 || z === 6 || z === 13;
    if (perim) {
      const u = (x === 30 || x === 59) ? z : x;
      g.set(x, T + 1, z, "white_concrete");
      for (const yy of [T + 2, T + 3]) {
        g.set(x, yy, z, u % 5 === 0 ? "white_concrete" : "cyan_stained_glass");
      }
    }
    g.set(x, T + 4, z, "light_gray_concrete"); // cap
  }
}

// Mast on the penthouse cap.
for (let y = T + 5; y <= T + 9; y++) {
  g.set(45, y, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
