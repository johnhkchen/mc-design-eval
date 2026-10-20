import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001489";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 27, D = 6;
const g = new Voxels([W, H, D]);

// Footprint lookup: ground and roof per cell
const map = new Map();
let G0 = Infinity;
for (const [x, z, gr, roof] of cells) {
  const ground = Math.max(0, Math.round(gr));
  G0 = Math.min(G0, ground);
  map.set(`${x},${z}`, { gr: ground, roof: Math.round(roof) });
}
if (!Number.isFinite(G0)) G0 = 0;

const has = (x, z) => map.has(`${x},${z}`);

// Brick walk-up, c. 1899: stone base, brick piers with stone window surrounds,
// one brownstone string course per storey, a bracketed cornice at the top.
// Every block sits on a block below it: no overhangs or floating parts.
for (const [key, info] of map) {
  const [x, z] = key.split(",").map(Number);
  const gr = info.gr;
  const R = Math.min(Math.max(info.roof, gr + 4), H - 3);

  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const onLong = z === 0 || z === D - 1;
  const onShort = !onLong && (x === 0 || x === W - 1);

  // Foundation under each cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Walls and floors up to the cornice course
  for (let y = gr; y <= R - 2; y++) {
    const rel = y - G0;
    const floorLine = rel % 3 === 0;

    if (floorLine) {
      g.set(x, y, z, perim ? "brown_terracotta" : "smooth_stone");
      continue;
    }
    if (!perim) continue; // interior stays air

    // Bay classification for the two window rows of each storey
    let kind = "pier";
    if (onLong) {
      if (x > 0 && x < W - 1) {
        const m = x % 3;
        if (m === 1) kind = "frame";
        else if (m === 2) kind = "glass";
      }
    } else if (onShort) {
      if (z === 1 || z === 4) kind = "frame";
      else if (z === 2 || z === 3) kind = "glass";
    }

    if (kind === "glass") {
      g.set(x, y, z, "glass_pane");
      // Warm light behind some windows, on the storey's lower row
      if (rel % 3 === 1 && (onLong ? x % 6 === 2 : z === 2)) {
        if (onLong) {
          const iz = z === 0 ? 1 : D - 2;
          if (has(x, iz)) g.set(x, y, iz, "glowstone");
        } else {
          const ix = x === 0 ? 1 : W - 2;
          if (has(ix, z)) g.set(ix, y, z, "glowstone");
        }
      }
    } else if (kind === "frame") {
      g.set(x, y, z, "stone_bricks");
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // Cornice: stone slab edge over the wall, roof deck inside
  if (perim) {
    g.set(x, R - 2, z, "brown_terracotta");
    g.set(x, R - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  } else {
    g.set(x, R - 1, z, "smooth_stone");
  }
}

// Front entrance on the z=0 facade with surround and transom
const doorX = 8;
if (has(doorX, 0)) {
  const gr = map.get(`${doorX},0`).gr;
  g.set(doorX - 1, gr, 0, "stone_bricks");
  g.set(doorX - 1, gr + 1, 0, "stone_bricks");
  g.set(doorX - 1, gr + 2, 0, "stone_bricks");
  g.set(doorX + 1, gr, 0, "bricks");
  g.set(doorX + 1, gr + 1, 0, "bricks");
  g.set(doorX + 1, gr + 2, 0, "bricks");
  g.set(doorX, gr, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, gr + 1, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, gr + 2, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  if (has(doorX, 1)) {
    g.set(doorX, gr + 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof bulkhead / stair house at the centre, if the roof is low enough
const bk = map.get(`9,3`);
if (bk) {
  const R = Math.min(Math.max(bk.roof, bk.gr + 4), H - 3);
  if (R <= 22) {
    for (let x = 7; x <= 10; x++) {
      for (let z = 2; z <= 3; z++) {
        if (!has(x, z)) continue;
        g.set(x, R - 1, z, "smooth_stone");
        for (let y = R; y <= R + 1; y++) g.set(x, y, z, "stone_bricks");
        g.set(x, R + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
