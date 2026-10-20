import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001545";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const cm = new Map();
let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity, base = Infinity;
const roofs = [];
for (const [x, z, gr, roof] of cells) {
  const gg = Math.round(gr);
  const rr = Math.round(roof);
  cm.set(`${x},${z}`, { g: gg, r: rr });
  roofs.push(rr);
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
  base = Math.min(base, gg);
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const inF = (x, z) => cm.has(`${x},${z}`);
const isPerim = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

// One flat roof tier for the whole house: median of lidar roof heights, kept
// to a sensible storey count above the lowest ground (about 11 blocks).
roofs.sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const ROOF = clamp(medianRoof, base + 9, base + 12, 21);

// Trim: lighter brownstone tone so it reads against the brick.
const TRIM = "smooth_sandstone";
const TRIM2 = "chiseled_sandstone";

for (const [key, { g: g0 }] of cm) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);
  const R = ROOF;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  const front = z === zmin;
  const back = z === zmax;
  const left = x === xmin;
  const right = x === xmax;
  const onFront = front || back;

  for (let y = g0; y < R; y++) {
    // Roof cap / cornice
    if (y === R - 1) {
      g.set(x, y, z, perim ? TRIM : "smooth_stone");
      continue;
    }

    const h = y - base;
    const hm = h % 3;
    const k = Math.floor(h / 3);

    if (!perim) {
      if (y === g0) g.set(x, y, z, "smooth_stone");
      else if (hm === 0) g.set(x, y, z, "oak_planks");
      continue;
    }

    let block = "bricks";
    let state;
    if (hm === 0) block = TRIM;                       // string courses

    const faceU = onFront ? x : z;
    const cols = onFront ? [1, 4] : [2, 6];
    const isLong = onFront || left || right;

    // Entrance: door on the street facade, centred, with a stone surround
    if (front && x === 2 && k === 0 && y <= g0 + 1) {
      block = "oak_door";
      state = {
        facing: "north",
        half: y === g0 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    } else if (front && k === 0 && y === g0 + 2 && x >= 1 && x <= 3) {
      block = TRIM2;                                  // door hood across the bay
    } else if (front && k === 0 && (x === 1 || x === 3) && y <= g0 + 1) {
      block = TRIM2;                                  // door jambs
    } else if (
      isLong && (hm === 1 || hm === 2) && y <= R - 3 && cols.includes(faceU) &&
      !(x === xmin && z === zmin) && !(x === xmax && z === zmin)
    ) {
      block = "glass_pane";
      state = onFront
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

      // Warm light behind some street-front panes
      if (front && hm === 1 && (k === 0 || k === 2) && (faceU === 1 || faceU === 4)) {
        const zi = zmin + 1;
        const ig = cm.get(`${x},${zi}`);
        if (ig && y >= ig.g) g.set(x, y, zi, "glowstone");
      }
    }

    g.set(x, y, z, block, state);
  }
}

// Single brick chimney on the flat roof
const chimneyCands = [[3, zmax - 1], [2, zmax - 1], [3, zmin + 1], [2, zmin + 1]];
for (const [cx, cz] of chimneyCands) {
  if (inF(cx, cz) && !isPerim(cx, cz)) {
    if (ROOF + 1 <= 22) {
      g.set(cx, ROOF, cz, "bricks");
      g.set(cx, ROOF + 1, cz, TRIM2);
    }
    break;
  }
}

g.save(`${DIR}/${ID}.nbt`);
