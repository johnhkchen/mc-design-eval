import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 18 Cranberry Street, Brooklyn Heights: an 1845 Greek Revival / early Italianate
// brownstone rowhouse, about four storeys, flat roof behind a cornice.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001620.cells.json", "utf8"));

const W = 10, H = 24, D = 6;
const g = new Voxels([W, H, D]);

const FACADE = "brown_terracotta";
const TRIM = "smooth_stone";
const CORNICE = "chiseled_stone_bricks";
const FOUNDATION = "stone_bricks";
const GLASS = "glass_pane";

const map = new Map();
const key = (x, z) => `${x},${z}`;
const grounds = [], roofs = [];
for (const c of cells) {
  const x = Math.round(c[0]), z = Math.round(c[1]);
  const ground = Math.round(c[2]), roof = Math.round(c[3]);
  map.set(key(x, z), { x, z, ground, roof });
  grounds.push(ground);
  roofs.push(roof);
}
const has = (x, z) => map.has(key(x, z));
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };

// Smooth lidar noise: one common storey base and one flat roof for the whole building.
const BASE = median(grounds);
const ROOF = Math.min(H - 1, median(roofs));

// Pass 1: foundation, walls, storey lines, cornice and roof cap
for (const { x, z, ground } of map.values()) {
  const front = !has(x, z - 1);   // street side (low z)
  const back = !has(x, z + 1);
  const left = !has(x - 1, z);
  const right = !has(x + 1, z);
  const boundary = front || back || left || right;
  const alongX = front || back;
  const alongZ = left || right;
  const corner = alongX && alongZ;

  // foundation fills from y0 up to this cell's own ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUNDATION);

  // storey floor slabs on the common base, every 3 blocks, for every cell
  for (let y = BASE; y < ROOF - 1; y += 3) {
    if (y >= ground) g.set(x, y, z, TRIM);
  }

  if (boundary) {
    for (let y = Math.max(ground, BASE); y < ROOF; y++) {
      const rel = (y - BASE) % 3;
      if (y === ROOF - 1) { g.set(x, y, z, TRIM); continue; }
      if (y === ROOF - 2) { g.set(x, y, z, CORNICE); continue; }
      if (rel === 0) { g.set(x, y, z, TRIM); continue; }
      const k = Math.floor((y - BASE) / 3);

      let windowed = false;
      if (!corner) {
        if (alongX) {
          windowed = (x % 3) !== 0;
          if (k === 0) windowed = windowed && x !== 5;
        } else if (alongZ) {
          windowed = z >= 1 && z <= 4;
        }
      }

      if (windowed) {
        g.set(x, y, z, GLASS);
        if (rel === 1 && alongX && !alongZ) {
          const inZ = front ? z + 1 : z - 1;
          if (((x * 7 + z * 3 + k * 5) % 4) === 0 && has(x, inZ)) g.set(x, y, inZ, "glowstone");
        } else if (rel === 1 && alongZ && !alongX) {
          const inX = left ? x + 1 : x - 1;
          if (((x * 7 + z * 3 + k * 5) % 4) === 0 && has(inX, z)) g.set(inX, y, z, "glowstone");
        }
      } else {
        g.set(x, y, z, FACADE);
      }
    }
  }

  // flat roof cap over every cell
  g.set(x, ROOF - 1, z, TRIM);
}

// Pass 2: entrance on the street facade, centred, with a stone surround and lantern
for (const { x, z, ground } of map.values()) {
  if (z === 0 && !has(x, z - 1)) {
    if (x === 3 || x === 5) {
      // pilaster-like door surround
      for (let y = BASE; y <= BASE + 2; y++) {
        if (y >= ground) g.set(x, y, z, CORNICE);
      }
    }
  }
}
for (const { x, z, ground } of map.values()) {
  if (z === 0 && x === 4 && !has(x, z - 1) && BASE >= ground) {
    g.set(x, BASE, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, BASE + 1, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, BASE + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001620.nbt");
