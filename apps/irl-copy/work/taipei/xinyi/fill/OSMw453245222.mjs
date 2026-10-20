import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245222";
const W = 39, H = 90, D = 32;
const ROOF = 78;          // roof record: about 78 blocks above lowest ground
const TOP = ROOF - 1;     // highest solid block y = 77
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => ground.has(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => NB.some(([dx, dz]) => !has(x + dx, z + dz));
const isInner = (x, z) => !isEdge(x, z) && NB.some(([dx, dz]) => isEdge(x + dx, z + dz));

const g = new Voxels([W, H, D]);

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Entrance: edge cell on the minimum-z side, x nearest the middle of the footprint.
let entrance = null;
{
  let minZ = Infinity;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (isEdge(x, z)) minZ = Math.min(minZ, z);
  }
  let best = Infinity;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (z === minZ && isEdge(x, z)) {
      const d = Math.abs(x - W / 2);
      if (d < best) { best = d; entrance = { x, z, gr: ground.get(k) }; }
    }
  }
}

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const shell = isEdge(x, z);
  const inner = isInner(x, z);
  const F0 = gr + 4; // first floor slab, above base course and shopfront band

  for (let y = 0; y <= TOP; y++) {
    if (y < gr) { g.set(x, y, z, "stone"); continue; }

    if (y === gr) { g.set(x, y, z, shell ? "polished_andesite" : "stone_bricks"); continue; }

    if (y <= gr + 3) {
      // Ground-floor commercial shopfront band
      if (shell) {
        if ((x + z) % 3 === 0) g.set(x, y, z, "dark_oak_planks");
        else g.set(x, y, z, "glass");
      } else {
        g.set(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    if (y === TOP) {
      // Cornice / roof edge
      if (shell) g.set(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
      else g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Upper storeys: slab at rel 0, window band rel 1..3, spandrel rel 4
    const rel = (y - F0) % STOREY;
    const storey = Math.floor((y - F0) / STOREY);

    if (rel === 0) {
      g.set(x, y, z, shell ? "smooth_quartz" : "light_gray_concrete");
    } else if (rel === 4) {
      g.set(x, y, z, shell ? "smooth_quartz" : "light_gray_concrete");
    } else {
      // rel 1..3
      if (shell) {
        if ((x + z) % 3 === 0) {
          g.set(x, y, z, "smooth_quartz");
        } else {
          g.set(x, y, z, "light_blue_stained_glass_pane", PANE);
        }
      } else if (inner) {
        // air gap behind the glass; some rooms carry a warm light
        if (rel === 2 && ((x * 7 + z * 13 + storey * 3) % 5 === 0)) {
          g.set(x, y, z, "glowstone");
        }
      } else {
        g.set(x, y, z, "light_gray_concrete");
      }
    }
  }
}

// Rooftop plant: small enclosed boxes on the core
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (isEdge(x, z) || isInner(x, z)) continue;
  if (x % 9 >= 3 && x % 9 <= 5 && z % 9 >= 3 && z % 9 <= 5) {
    g.set(x, ROOF, z, "gray_concrete");
    g.set(x, ROOF + 1, z, "gray_concrete");
  }
}

// Entrance: double door on the street-facing edge, lantern above
if (entrance) {
  const { x, z, gr } = entrance;
  g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
