import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3395526.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3395526.nbt";

const W = 10, H = 15, D = 3;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint record: ground (foundation top) and roof (lidar height above y0).
const rec = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  const ground = Math.max(0, Math.round(gr));
  // Roof follows lidar, at least 3 blocks above ground for a windowed band,
  // a lintel/cornice and an air gap behind the glass.
  const top = Math.min(12, Math.max(Math.round(rf), ground + 3));
  rec.set(`${x},${z}`, { ground, top });
}

const has = (x, z) => rec.has(`${x},${z}`);
const xs = [...rec.keys()].map((k) => +k.split(",")[0]);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const doorA = minX + Math.floor(W / 2) - 1;
const doorB = minX + Math.floor(W / 2);

const BRICK = "bricks";
const BASE = "stone_bricks";
const TRIM = "polished_andesite";
const CORNICE = "smooth_stone";
const GLASS = "glass";
const FLOOR = "smooth_stone";
const DECK = "light_gray_concrete";

for (const [key, { ground: gr, top: t }] of rec) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, BASE);

  const exp = {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
  const perim = exp.N || exp.S || exp.W || exp.E;
  const longFace = exp.N || exp.S;

  if (!perim) {
    // Interior: air gap, ground floor slab, roof deck.
    set(x, gr, z, FLOOR);
    set(x, t - 1, z, DECK);
    // Rooftop plant: an iron housing with a grille on top.
    if (x === minX + 2 && z === 1) {
      set(x, t, z, "iron_block");
      set(x, t + 1, z, "iron_bars");
    }
    continue;
  }

  // Perimeter walls: solid from ground to top-1.
  for (let y = gr; y <= t - 1; y++) set(x, y, z, BRICK);

  // Base course and cornice band.
  set(x, gr, z, BASE);
  set(x, t - 1, z, CORNICE);

  // Parapet cap.
  set(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  const isCorner = (exp.W && exp.N) || (exp.E && exp.N) || (exp.W && exp.S) || (exp.E && exp.S);

  if (longFace) {
    const xi = x - minX;
    const isDoor = x === doorA || x === doorB;

    if (isCorner) {
      // Limestone quoins at the corners, full height.
      for (let y = gr; y <= t - 1; y++) set(x, y, z, TRIM);
    }

    if (isDoor) {
      // Roll-up service door: solid dark panel in the lower two rows, stone lintel above.
      set(x, gr, z, "dark_oak_planks");
      set(x, gr + 1, z, "dark_oak_planks");
      if (gr + 2 < t - 1) set(x, gr + 2, z, TRIM);
    } else if (!isCorner && xi % 3 !== 0) {
      // Window: glass in a limestone sill and lintel.
      set(x, gr + 1, z, GLASS);
      const inner = rec.get(`${x},1`);
      if (inner && xi % 6 === 1 && gr + 1 < inner.top - 1) {
        set(x, gr + 1, 1, "shroomlight");
      }
    } else if (!isCorner) {
      // Brick pier.
      set(x, gr + 1, z, BRICK);
    }

    // Lintel / belt course between window row and cornice.
    if (!isDoor && gr + 2 < t - 1 && !isCorner) set(x, gr + 2, z, TRIM);
  } else {
    // End walls: a window at the centre of the short face.
    if (z === 1 && t - 1 > gr + 1) set(x, gr + 1, z, GLASS);
  }

  // Lightning rod on the north-east corner of the parapet.
  if (exp.N && exp.E) {
    set(x, t + 1, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(OUT);
