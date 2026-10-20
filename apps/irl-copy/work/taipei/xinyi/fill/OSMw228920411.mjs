import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw228920411";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 31;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  if (gr > maxG) maxG = gr;
}
const has = (x, z) => ground.has(key(x, z));

// Roof: about 11 blocks above the lowest ground, kept above the highest cell.
const ROOF = Math.max(11, maxG + 9);

const OFF = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const ORDER = ["north", "south", "east", "west"];

const missing = (x, z) => ORDER.filter((d) => !has(x + OFF[d][0], z + OFF[d][1]));
const isEdge = (x, z) => missing(x, z).length > 0;
const facingOf = (x, z) => missing(x, z)[0];

// Entrance: on the north-facing street wall, nearest to the centre line x = 11.
let door = null;
for (const [x, z] of cells) {
  if (!missing(x, z).includes("north")) continue;
  const score = Math.abs(x - 11) * 1000 + z;
  if (!door || score < door.score) door = { x, z, score };
}

const PANE = (facing) =>
  facing === "north" || facing === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, ground slab, storey slab and roof deck on every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");
  if (gr + 5 < ROOF - 1) g.set(x, gr + 5, z, "smooth_stone");
  g.set(x, ROOF - 1, z, "gray_concrete");
}

// Pass 2: walls on edge cells, stacked from each cell's own ground up to the roof.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const f = facingOf(x, z);
  const idx = f === "north" || f === "south" ? x : z;
  const T = ROOF - gr;
  if (T <= 0) continue;
  const isDoor = door && door.x === x && door.z === z;

  for (let b = 0; b < T; b++) {
    const y = gr + b;
    let blk = "white_concrete";
    let props;

    if (b === 0) {
      blk = "polished_andesite";
    } else if (b <= 3) {
      // Ground-floor shopfront: glass with white concrete mullions.
      if (idx % 3 === 0) blk = "white_concrete";
      else { blk = "glass_pane"; props = PANE(f); }
    } else if (b === 4) {
      blk = "light_gray_concrete";
    } else if (b === 5) {
      blk = "smooth_stone";
    } else if (b <= 8) {
      if (b === 6) blk = "light_gray_concrete";
      else if (idx % 3 === 0) blk = "white_concrete";
      else { blk = "glass_pane"; props = PANE(f); }
    } else {
      blk = "light_gray_concrete";
    }

    if (b === T - 1) { blk = "stone_bricks"; props = undefined; } // parapet cap

    if (isDoor && (b === 1 || b === 2)) {
      g.set(x, y, z, "oak_door", {
        facing: f,
        half: b === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (props) g.set(x, y, z, blk, props);
    else g.set(x, y, z, blk);
  }

  // Warm light behind some windows, inside the air gap.
  const [dx, dz] = OFF[OPP[f]];
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && !isEdge(ix, iz)) {
    for (const b of [2, 7]) {
      if (b < T - 1 && idx % 2 === 0 && ((idx + b) % 4 === 0 || b === 2)) {
        if (!(isDoor && b === 2)) g.set(ix, gr + b, iz, "glowstone");
      }
    }
  }
}

// Pass 3: rooftop plant on interior cells.
const interior = cells.filter(([x, z]) => !isEdge(x, z));
for (const [x, z] of interior) {
  if (x % 7 === 3 && z % 9 === 4) {
    g.set(x, ROOF, z, "smooth_stone");
    if (ROOF + 1 < H) g.set(x, ROOF + 1, z, "iron_block");
  }
}

// Boiler flue: brick stack near the rear (north-east) of the roof.
let flue = null;
for (const [x, z] of interior) {
  const score = Math.abs(x - 17) + Math.abs(z - 22);
  if (!flue || score < flue.score) flue = { x, z, score };
}
if (flue) {
  for (let y = ROOF; y <= Math.min(ROOF + 5, H - 1); y++) {
    g.set(flue.x, y, flue.z, "bricks");
  }
  if (ROOF + 6 < H) g.set(flue.x, ROOF + 6, flue.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
