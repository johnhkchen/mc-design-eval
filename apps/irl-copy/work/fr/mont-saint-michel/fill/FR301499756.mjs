import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499756";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 54, H = 43, D = 42;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const key = (x, z) => x + "," + z;
const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["east", 1, 0],
  ["west", -1, 0],
];

// ---- cell map ----
const map = new Map();
for (const [x, z, gr, r] of cells) map.set(key(x, z), { x, z, g: gr, r });

const base = Math.min(...[...map.values()].map((c) => c.g));

// Wide smoothing (radius 3 mean of lidar roofs), then snap to storey multiples
// above the base so every tier stands on a floor line.
for (const c of map.values()) {
  let sum = 0, n = 0;
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    const o = map.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.r; n++; }
  }
  const mean = sum / n;
  const k = Math.round((mean - base) / 5);
  c.R = base + Math.min(7, Math.max(2, k)) * 5;
  c.R = Math.max(c.R, c.g + 10);
}

const f1 = base + 5; // first upper floor line

// Exposed faces: outside the footprint, or a neighbour at least one storey lower
const exposures = (c) => DIRS.filter(([n, dx, dz]) => {
  const o = map.get(key(c.x + dx, c.z + dz));
  return !o || o.R <= c.R - 5;
});

// ---- entrance: centre of the southern front at street level ----
const southFront = [...map.values()]
  .filter((c) => exposures(c).some(([n]) => n === "south"))
  .sort((a, b) => a.x - b.x);
const streetFront = southFront.filter((c) => c.g <= base + 1);
const doorPool = streetFront.length ? streetFront : southFront;
const doorCell = doorPool.length ? doorPool[Math.floor(doorPool.length / 2)] : null;

const paneProps = (zAxis) => zAxis
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- build ----
for (const c of map.values()) {
  const { x, z, g: gr, R } = c;

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "granite");

  const E = exposures(c);

  if (E.length === 0) {
    // interior: floor, storey slabs, ceiling, roof cap; air between
    put(x, gr, z, "stone_bricks");
    for (let y = gr + 1; y < R; y++) {
      if (y >= f1 && (y - base) % 5 === 0) put(x, y, z, "stone_bricks");
    }
    put(x, R - 1, z, "stone_bricks");
    put(x, R, z, "deepslate_tiles");
    // roof equipment: a few brick chimneys
    if (x % 13 === 6 && z % 11 === 5 && R + 3 < H) {
      put(x, R + 1, z, "bricks");
      put(x, R + 2, z, "bricks");
    }
    continue;
  }

  // exposed shell: one block thick, articulated facade
  const zAxis = E.some(([n]) => n === "north" || n === "south");
  const idx = zAxis ? x : z;
  const isDoor = doorCell && c === doorCell;

  for (let y = gr; y < R; y++) {
    let b = "smooth_stone", p;

    if (isDoor && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoor && y === gr + 3) {
      put(x, y, z, "dark_oak_planks");
      continue;
    }

    if (y === gr) {
      b = "polished_andesite";
    } else if (y < f1) {
      // ground-floor shopfront
      if (y === f1 - 1) b = "red_terracotta";
      else if (idx % 4 === 0) b = "stone_bricks";
      else { b = "glass_pane"; p = paneProps(zAxis); }
    } else {
      const rel = (y - base) % 5;
      const window = idx % 3 === 1;
      if (rel === 0) b = "chiseled_stone_bricks";
      else if (!window) b = "stone_bricks";
      else if (rel === 1 || rel === 4) b = "dark_oak_planks";
      else {
        // rel 2 and 3: glass, with occasional warm glowstone behind
        const warm = (x * 31 + z * 17 + Math.floor(y / 5) * 7) % 7 === 0;
        if (warm) b = "glowstone";
        else { b = "glass_pane"; p = paneProps(zAxis); }
      }
    }
    put(x, y, z, b, p);
  }

  // roof: eave stairs on exposed edges, slate elsewhere
  if (E.length) {
    const [dir] = E[0];
    put(x, R, z, "deepslate_tile_stairs", { facing: dir, half: "bottom", shape: "straight", waterlogged: "false" });
  } else {
    put(x, R, z, "deepslate_tiles");
  }
}

g.save(`${DIR}/${ID}.nbt`);
