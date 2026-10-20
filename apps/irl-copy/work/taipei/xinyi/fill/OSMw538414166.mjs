import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1970s-80s Taipei commercial block: two storeys over a stone plinth,
// cream concrete frame with red-tile fascia over a glazed shopfront, punched
// windows with spandrels, a quartz cornice and parapet, and roof plant.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414166.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414166.nbt";

const W = 24, H = 23, D = 16;
const TOP = 11;          // parapet top, matches lidar roof height
const STOREY_LINE = 5;   // ground floor / upper floor slab
const CORNICE = 10;      // roof slab and cornice course

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(Math.round(gr), TOP)));
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
}
const inFP = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

// Outward direction for edge cells (north/south faces take precedence at corners).
function outward(x, z) {
  if (!inFP(x, z - 1)) return { dx: 0, dz: -1 };
  if (!inFP(x, z + 1)) return { dx: 0, dz: 1 };
  if (!inFP(x + 1, z)) return { dx: 1, dz: 0 };
  if (!inFP(x - 1, z)) return { dx: -1, dz: 0 };
  return null;
}

const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };

function doorBlock(x, y, z, half) {
  g.set(x, y, z, "oak_door", {
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });
}

function edgeColumn(x, z, gr, d) {
  const ns = d.dz !== 0;
  const u = ns ? x : z;
  const umin = ns ? xmin : zmin;
  const umax = ns ? xmax : zmax;
  const rel = u - umin;
  const pier = rel % 3 === 0 || u === umax;
  const win = ns ? GLASS_NS : GLASS_EW;
  const doorHere = d.dz === 1 && z === zmax && u === xmin + 13 && gr + 2 <= 3;

  for (let y = gr; y <= TOP; y++) {
    if (y < STOREY_LINE) {
      // Ground floor: plinth, shopfront glazing, red fascia under the upper floor.
      if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }
      if (doorHere && (y === gr + 1 || y === gr + 2)) {
        doorBlock(x, y, z, y === gr + 1 ? "lower" : "upper");
        continue;
      }
      if (y === 4) { g.set(x, y, z, "red_terracotta"); continue; }
      if (pier) g.set(x, y, z, "light_gray_concrete");
      else g.set(x, y, z, "glass_pane", win);
    } else if (y < CORNICE) {
      // Upper floor: spandrels at the slab lines, punched windows between.
      if (y === 5 || y === 9) { g.set(x, y, z, "light_gray_concrete"); continue; }
      if (pier) { g.set(x, y, z, "white_concrete"); continue; }
      g.set(x, y, z, "glass_pane", win);
      // Warm light: glowstone on the inner side of every fourth window bay.
      if (y === 7 && rel % 6 === 4) {
        const ix = x - d.dx, iz = z - d.dz;
        if (inFP(ix, iz) && !outward(ix, iz) && gAt(ix, iz) <= 7) {
          g.set(ix, 7, iz, "glowstone");
        }
      }
    } else if (y === CORNICE) {
      g.set(x, y, z, "quartz_block");
    } else if (y === CORNICE + 1) {
      if (pier) g.set(x, y, z, "quartz_slab", SLAB_BOTTOM);
    }
  }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const d = outward(x, z);
  if (d) {
    edgeColumn(x, z, gr, d);
    continue;
  }

  // Interior: floor slab at the storey line, roof slab, and rooftop plant.
  if (gr <= STOREY_LINE) g.set(x, STOREY_LINE, z, "smooth_stone");
  if (gr <= CORNICE) {
    g.set(x, CORNICE, z, "light_gray_concrete");
    if (x % 8 === 4 && z % 6 === 3) g.set(x, CORNICE + 1, z, "iron_block");
  }
}

g.save(OUT);
