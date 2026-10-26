import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const raw = JSON.parse(readFileSync(`${DIR}/DC58941.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : raw.cells;

const W = 14, H = 20, D = 13;
const g = new Voxels([W, H, D]);

// ---- footprint lookup ----
const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map(c => [key(c[0], c[1]), c]));
const has = (x, z) => cellMap.has(key(x, z));
const perim = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));
const corner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// ---- per-cell massing from lidar roof, lightly flattened ----
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
function topOf(c) {
  const gr = Math.max(0, Math.round(c[2]));
  let r = Math.round(c[3]);
  if (Math.abs(r - median) <= 1) r = median;   // flatten lidar noise
  return Math.min(H - 4, Math.max(r, gr + 3));
}

// window bays on facade: piers at corners and even bays, glass on odd bays
function isWindow(x, z, y) {
  if (!perim(x, z) || corner(x, z)) return false;
  if (y % 3 === 0) return false;             // floor line
  const alongX = !has(x, z + 1) || !has(x, z - 1);
  const w = alongX ? x : z;
  return w % 2 === 1;
}

// ---- entrance on south (+z) street face, nearest the middle ----
let entrance = null;
for (const c of cells) {
  const [x, z] = c;
  if (!has(x, z + 1)) {
    if (!entrance || Math.abs(x - 7) < Math.abs(entrance[0] - 7)) entrance = [x, z];
  }
}

// ---- build ----
for (const c of cells) {
  const [x, z] = c;
  const gr = Math.max(0, Math.round(c[2]));
  const top = topOf(c);
  const isPer = perim(x, z);

  // foundation
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    if (isPer) {
      if (y === gr) {
        g.set(x, y, z, "polished_andesite");          // base course
      } else if (y % 3 === 0) {
        g.set(x, y, z, "light_gray_concrete");        // floor line / spandrel
      } else if (isWindow(x, z, y)) {
        g.set(x, y, z, "light_blue_stained_glass_pane");
      } else {
        g.set(x, y, z, "white_concrete");             // pier
      }
    } else {
      // interior: floor slab per storey, air between (no interiors)
      if (y % 3 === 0) {
        g.set(x, y, z, "smooth_stone");
      } else if (y % 3 === 1 && y >= gr + 1) {
        const nbs = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
        const behindWindow = nbs.some(([nx, nz]) => has(nx, nz) && isWindow(nx, nz, y));
        if (behindWindow && (x * 7 + z * 3 + y) % 7 === 0) {
          g.set(x, y, z, "glowstone");
        }
      }
    }
  }

  // roof cap and parapet
  g.set(x, top, z, "stone_bricks");
  if (isPer) {
    g.set(x, top + 1, z, "stone_brick_wall");
  }

  // roof plant box on interior cells
  if (!isPer && x >= 4 && x <= 7 && z >= 4 && z <= 6 && top + 2 < H) {
    g.set(x, top + 1, z, "light_gray_concrete");
    g.set(x, top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- entrance: doors, pilasters flanking, lintel ----
if (entrance) {
  const [ex, ez] = entrance;
  const c = cells.find(cc => cc[0] === ex && cc[1] === ez);
  const gr = Math.max(0, Math.round(c[2]));
  for (const px of [ex - 1, ex + 1]) {
    if (has(px, ez) && perim(px, ez)) {
      g.set(px, gr, ez, "polished_andesite");
      g.set(px, gr + 1, ez, "polished_andesite");
      g.set(px, gr + 2, ez, "polished_andesite");
    }
  }
  g.set(ex, gr, ez, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false"
  });
  g.set(ex, gr + 1, ez, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false"
  });
  g.set(ex, gr + 2, ez, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/DC58941.nbt`);
