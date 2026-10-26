import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC55345";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 35, D = 49;
const g = new Voxels([W, H, D]);

const byKey = new Map(cells.map(c => [`${c[0]},${c[1]}`, c]));
const has = (x, z) => byKey.has(`${x},${z}`);
const minZ = Math.min(...cells.map(c => c[1]));

function put(x, y, z, id, props) {
  if (x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D) g.set(x, y, z, id, props);
}

// Smooth the lidar roof heights over a 3x3 neighbourhood so tiers read as clean planes.
function smoothedRoof(x, z) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = byKey.get(`${x + dx},${z + dz}`);
    if (c) { sum += c[3]; n++; }
  }
  return sum / n;
}

for (const c of cells) {
  const [x, z] = c;
  const gr = Math.max(0, Math.round(c[2]));
  const rawTop = smoothedRoof(x, z);
  // Storey pitch of 2 blocks so every tier stands on the course below it.
  let top = gr + 2 * Math.round((rawTop - gr) / 2);
  top = Math.min(top, H - 6);
  if (top < gr + 4) top = gr + 4;

  const edge = !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
  const isFront = edge && z === minZ;
  const entrance = isFront && x >= 8 && x <= 15;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - gr;

    if (!edge) {
      // Interior: air gap with a floor slab per storey.
      if (rel % 2 === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Base course, entrance glazing with a quartz surround.
    if (rel <= 1) {
      if (entrance) {
        if (x === 8 || x === 15) put(x, y, z, "quartz_block");
        else put(x, y, z, "tinted_glass");
      } else {
        put(x, y, z, "smooth_stone");
      }
      continue;
    }

    // Entrance canopy course with a lantern under it.
    if (entrance && rel === 2) {
      put(x, y, z, "quartz_block");
      continue;
    }

    // Full-block parapet cap.
    if (y === top - 1) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    if (rel % 2 === 0) {
      // Spandrel band.
      put(x, y, z, "light_gray_concrete");
    } else {
      // Window band: concrete piers, tinted-glass panes, rare lit panes.
      if ((x + z) % 4 === 0) {
        put(x, y, z, "white_concrete");
      } else if ((x * 7 + z * 3 + rel) % 23 === 0) {
        put(x, y, z, "glowstone");
      } else {
        put(x, y, z, "gray_stained_glass_pane");
      }
    }
  }

  // Roof slab on interior cells; parapet already on edges.
  if (!edge) put(x, top - 1, z, "light_gray_concrete");

  // Roof plant, on the roof surface, kept clear of the parapet.
  if (!edge && x >= 9 && x <= 14 && z >= 12 && z <= 20 && top + 2 <= H) {
    put(x, top, z, "gray_concrete");
    put(x, top + 1, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
