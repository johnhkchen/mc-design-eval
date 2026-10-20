import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Decided here: a 1990s-era four-storey commercial slab
// (about 21 blocks to the parapet, ~15 m), white and grey tiled concrete
// with ribbon glazing, blue-green tinted glass, a granite base course,
// shopfront glazing at ground level and a central rooftop plant room.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109964";
const W = 24, H = 33, D = 183;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = cells.map(([x, z, gr]) => ({ x, z, gr: Math.max(0, Math.round(gr)) }));

const key = (x, z) => `${x},${z}`;
const groundMap = new Map(list.map((c) => [key(c.x, c.z), c.gr]));
const has = (x, z) => groundMap.has(key(x, z));

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const PANE_LONG = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_END = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pass 1: foundations, floors, facades, roof deck
for (const { x, z, gr } of list) {
  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mx = mW || mE, mz = mN || mS;
  const kind = mx && mz ? "corner" : mx ? "lx" : mz ? "lz" : "int";

  const RD = Math.max(20, gr + 1); // roof deck level (top surface ~21 blocks)

  if (kind === "int") {
    // interior: ground slab, storey floor slabs, roof deck
    const floors = new Set([gr, 5, 10, 15].filter((l) => l >= gr));
    for (const l of floors) put(x, l, z, "light_gray_concrete");
    put(x, RD, z, "gray_concrete");
    continue;
  }

  // facade / corner cell
  const idx = kind === "lx" ? z : x;
  const entrance =
    (kind === "lz" && (x === 11 || x === 12)) ||
    (kind === "lx" && (z === 90 || z === 91));
  const facing =
    kind === "lx" ? (mW ? "west" : "east") : kind === "lz" ? (mN ? "north" : "south") : "north";

  for (let y = gr; y < RD; y++) {
    if (y === gr) {
      put(x, y, z, "polished_granite"); // base course
      continue;
    }
    if (entrance && (y === gr + 1 || y === gr + 2) && kind !== "corner") {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y % 5 === 0) {
      put(x, y, z, "light_gray_concrete"); // storey spandrel
      continue;
    }
    if (y % 5 === 4) {
      put(x, y, z, "white_concrete"); // storey cornice band
      continue;
    }
    // window rows (y % 5 in 1..3)
    if (kind === "corner" || idx % 4 === 0) {
      put(x, y, z, "white_concrete"); // pier
      continue;
    }
    if (y < 5) {
      // ground-floor shopfront glazing
      put(x, y, z, "light_blue_stained_glass");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", kind === "lx" ? PANE_LONG : PANE_END);
    }
  }

  // parapet and coping
  put(x, RD, z, "white_concrete");
  put(x, RD + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: warm lights behind some windows (interior air cells)
for (const { x, z, gr } of list) {
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mx = mW || mE, mz = mN || mS;
  if (mx && mz) continue;
  if (!mx && !mz) continue;

  const idx = mx ? z : x;
  if (idx % 4 === 0) continue;

  const ix = mx ? (mW ? x + 1 : x - 1) : x;
  const iz = mz ? (mN ? z + 1 : z - 1) : z;
  if (!has(ix, iz)) continue;

  for (let k = 0; k < 4; k++) {
    const y = 5 * k + 2;
    if (y <= gr) continue;
    if ((idx + k) % 4 !== 0) continue;
    put(ix, y, iz, "glowstone");
  }
}

// Pass 3: central rooftop plant room (interior of roof, ring walls, slab top)
for (let x = 7; x <= 16; x++) {
  for (let z = 70; z <= 110; z++) {
    if (!has(x, z)) continue;
    const ring = x === 7 || x === 16 || z === 70 || z === 110;
    for (let y = 21; y <= 23; y++) {
      if (ring) put(x, y, z, "light_gray_concrete");
    }
    put(x, 24, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
