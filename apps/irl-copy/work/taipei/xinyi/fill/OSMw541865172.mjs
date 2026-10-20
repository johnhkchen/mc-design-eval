import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise (2-storey + parapet) commercial block, Xinyi district: cream/white
// concrete frame with glazed bays, polished-stone base course, dark shopfront
// sign band, flat roof with parapet and rooftop plant. Shown on a sloping lot:
// each column is filled from y0 up to its own ground, and the roof is held at
// a common level so the downhill side carries extra storeys.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865172";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 25;
const g = new Voxels([W, H, D]);

const ROOF = 11;          // roof surface height above lowest ground (lidar)
const STOREY = 5;         // blocks per storey

const key = (x, z) => `${x},${z}`;
const occupied = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => occupied.has(key(x, z));

// Front = the z-minimum edge; door sits at the middle of that row.
const minZ = Math.min(...cells.map((c) => c[1]));
const frontXs = cells.filter((c) => c[1] === minZ).map((c) => c[0]);
const midX = (Math.min(...frontXs) + Math.max(...frontXs)) / 2;
const doorX = frontXs.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), frontXs[0]);

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(H - 8, Math.round(gr0)));
  // Roof surface: common level, but never less than 6 blocks above this column's ground.
  const T = Math.min(H - 2, Math.max(ROOF, gr + 6));

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wf = !has(x - 1, z), E = !has(x + 1, z);
  const ext = N || S || Wf || E;
  // Position along the facade decides pier/glass rhythm.
  const h = (N || S) ? x : z;

  // Storeys: floor lines at each storey base, glazing in the middle band.
  for (let y = gr; y <= T - 2; y++) {
    const ly = y - gr;
    const k = Math.floor(ly / STOREY);
    const r = ly % STOREY;

    if (!ext) {
      // Interior: floor slabs only, open air behind the glass.
      if (r === 0) g.set(x, y, z, "smooth_stone");
      // Warm light behind selected front-row windows.
      else if (r === 2 && z === minZ + 1 && x % 3 === 1) g.set(x, y, z, "glowstone");
      continue;
    }

    // Front door (ground storey, z-min face, centre bay).
    if (k === 0 && N && x === doorX && (r === 1 || r === 2)) {
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (r === 0) {
      g.set(x, y, z, k === 0 ? "polished_andesite" : "white_concrete");
    } else if (r === 4) {
      g.set(x, y, z, "white_concrete");
    } else {
      // r = 1..3 : glazed band
      if (h % 3 === 0) g.set(x, y, z, "white_concrete");           // piers / mullions
      else if (k === 0 && r === 3) g.set(x, y, z, "dark_oak_planks"); // shopfront sign band
      else g.set(x, y, z, "glass_pane");
    }
  }

  // Roof slab over every column.
  g.set(x, T - 1, z, ext ? "light_gray_concrete" : "smooth_stone");

  // Parapet on the perimeter.
  if (ext) g.set(x, T, z, "smooth_quartz");

  // Rooftop plant on a few interior cells.
  if (!ext && x % 5 === 2 && z % 6 === 3 && T + 1 < H) {
    g.set(x, T, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
