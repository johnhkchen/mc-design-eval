import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 13, H = 23, D = 22;
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${SRC}/OSMw1024337096.cells.json`, "utf8"));

// Footprint lookup: key "x,z" -> ground height (blocks above y0)
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));
const groundAt = (x, z) => G.get(key(x, z));

const maxG = Math.max(...cells.map((c) => c[2]));
// Roof sits about 11 blocks above the lowest ground; keep at least a 2-storey body above the highest ground.
const ROOF = Math.max(11, maxG + 11);

const isPerim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const g = new Voxels([W, H, D]);

// Pass 1: foundations, floor slabs, belt course, roof deck and parapet
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground floor slab on the ground
  g.set(x, gr, z, isPerim(x, z) ? "stone_bricks" : "smooth_stone");

  // Second floor slab (storey line) across the whole footprint
  const belt = gr + 5;
  if (belt < ROOF) {
    g.set(x, belt, z, isPerim(x, z) ? "white_concrete" : "smooth_stone");
  }

  // Roof deck
  g.set(x, ROOF, z, "smooth_stone");

  // Parapet and cornice on the perimeter
  if (isPerim(x, z)) {
    g.set(x, ROOF + 1, z, "white_concrete");
  }
}

// Pass 2: perimeter walls, window grids, pillars, entrance
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const corner = isCorner(x, z);
  const xEdge = !has(x, z - 1) || !has(x, z + 1); // wall runs along X
  const along = xEdge ? x : z;
  const pillar = corner || along % 3 === 0;
  const frontFace = z === 0 && has(x, 0);

  for (let y = gr + 1; y < ROOF; y++) {
    const rel = y - gr; // 1..(ROOF-gr-1)
    let id;

    if (rel === 4) {
      // Ground storey lintel
      id = "white_concrete";
    } else if (rel === 5) {
      // Belt course already placed in pass 1; keep it
      continue;
    } else if (rel <= 3) {
      // Ground storey shopfront: glass with white frames
      id = pillar ? "white_concrete" : "cyan_stained_glass_pane";
    } else if (rel === 10 || y === ROOF - 1) {
      // Top spandrel band under the parapet
      id = "white_concrete";
    } else {
      // Upper storeys: window grid with frames
      id = pillar ? "white_concrete" : "light_blue_stained_glass_pane";
    }

    g.set(x, y, z, id);
  }

  // Entrance on the street face (z = 0): a door at x = 6, glass beside it
  if (frontFace && x >= 4 && x <= 8) {
    if (x === 6) {
      g.set(x, gr + 1, z, "dark_oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 2, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
    } else if (x === 5 || x === 7) {
      g.set(x, gr + 1, z, "cyan_stained_glass_pane");
      g.set(x, gr + 2, z, "cyan_stained_glass_pane");
      g.set(x, gr + 3, z, "cyan_stained_glass_pane");
    }
    // Canopy band over the entrance, sitting on the wall at the lintel line
    if (x >= 4 && x <= 8) g.set(x, gr + 4, z, "light_gray_concrete");
  }
}

// Pass 3: warm lights behind glass in the air gap (interior cells only)
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  // Ground storey, next to the street-side glass
  if (z === 1 && (x === 3 || x === 9)) {
    g.set(x, gr + 2, z, "glowstone");
  }
  // Upper storey, a few lit rooms
  if (z === 2 && (x === 2 || x === 5 || x === 8 || x === 11)) {
    g.set(x, gr + 7, z, "shroomlight");
  }
}

// Pass 4: roof equipment (air-conditioning plant) on the roof deck
const acUnits = [
  [3, 14, 2, 2],
  [8, 6, 2, 2],
];
for (const [x0, z0, w, d] of acUnits) {
  for (let x = x0; x < x0 + w; x++) {
    for (let z = z0; z < z0 + d; z++) {
      if (has(x, z)) g.set(x, ROOF + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${SRC}/OSMw1024337096.nbt`);
