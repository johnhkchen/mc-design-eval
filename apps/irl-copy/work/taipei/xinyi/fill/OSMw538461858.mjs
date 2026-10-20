import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538461858";
const W = 19, H = 23, D = 16;

// Record: no tags. Read as a 2-storey commercial block (about 11 blocks to roof),
// Xinyi-era low-rise: granite base, shopfront ground storey, tinted glazing
// between white concrete piers, quartz floor bands and a parapet, with a rooftop
// plant box and a red aviation lamp on a mast.

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const v = new Voxels([W, H, D]);

const cells = new Map();
for (const [x, z, g] of raw) cells.set(`${x},${z}`, Math.max(0, Math.round(g)));
const has = (x, z) => cells.has(`${x},${z}`);
const groundAt = (x, z) => cells.get(`${x},${z}`);

const isPerim = (x, z) =>
  has(x, z) && (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));
const nearEdge = (x, z) =>
  !isPerim(x, z) && (isPerim(x - 1, z) || isPerim(x + 1, z) || isPerim(x, z - 1) || isPerim(x, z + 1));

// Front = perimeter cells on the lowest-z (north) edge if any; door sits at the middle of them.
let front = raw.filter(([x, z]) => isPerim(x, z) && !has(x, z - 1)).map(([x, z]) => [x, z]);
if (front.length === 0) front = raw.filter(([x, z]) => isPerim(x, z)).map(([x, z]) => [x, z]);
front.sort((a, b) => a[0] - b[0]);
const [doorX, doorZ] = front.length ? front[Math.floor(front.length / 2)] : [-1, -1];

const GLASS = "light_blue_stained_glass_pane";
const FRAME = "white_concrete";
const BASE = "polished_granite";
const LINE = "quartz_block";
const PARAPET = "quartz_block";
const FLOOR = "smooth_stone";
const FOUNDATION = "stone";

const paneProps = (alongX) =>
  alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function facade(x, y, z, g) {
  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const corner = (missN || missS) && (missW || missE);
  const alongX = missN || missS;
  const idx = alongX ? x : z;
  const pillar = corner || idx % 3 === 0;
  const outDir = missN ? "north" : missS ? "south" : missW ? "west" : "east";
  const isDoor = x === doorX && z === doorZ;

  if (y === g) return v.set(x, y, z, BASE);
  if (y === 10) return v.set(x, y, z, PARAPET);

  if (y < 5) {
    if (y === 4) return v.set(x, y, z, "smooth_stone");
    if (isDoor && (y === g + 1 || y === g + 2) && y < 4) {
      return v.set(x, y, z, "dark_oak_door", {
        facing: outDir,
        half: y === g + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    }
    if (pillar) return v.set(x, y, z, "smooth_stone");
    return v.set(x, y, z, GLASS, paneProps(alongX));
  }
  if (y === 5) return v.set(x, y, z, LINE);
  if (y === 9) return v.set(x, y, z, FRAME);
  // storey 2 window band (6..8)
  if (pillar) return v.set(x, y, z, FRAME);
  return v.set(x, y, z, GLASS, paneProps(alongX));
}

for (const [x, z, gRaw] of raw) {
  const g = Math.max(0, Math.round(gRaw));
  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) v.set(x, y, z, FOUNDATION);

  const p = isPerim(x, z);
  for (let y = g; y <= 10; y++) {
    if (p) {
      facade(x, y, z, g);
    } else {
      if (y === g || y === 5 || y === 10) v.set(x, y, z, FLOOR);
      else if (y === 7 && nearEdge(x, z) && (x + 2 * z) % 5 === 0) v.set(x, y, z, "glowstone");
    }
  }
}

// Rooftop: plant boxes and a mast with a red aviation lamp at the interior cell nearest the centroid.
const interior = raw.filter(([x, z]) => !isPerim(x, z) && groundAt(x, z) <= 10);
if (interior.length) {
  const cx = raw.reduce((s, c) => s + c[0], 0) / raw.length;
  const cz = raw.reduce((s, c) => s + c[1], 0) / raw.length;
  let mast = interior[0];
  let best = Infinity;
  for (const c of interior) {
    const d = (c[0] - cx) ** 2 + (c[1] - cz) ** 2;
    if (d < best) { best = d; mast = c; }
  }
  const [mx, mz] = mast;
  for (let y = 11; y <= 14; y++) v.set(mx, y, mz, FRAME);
  v.set(mx, 15, mz, "redstone_lamp", { lit: "true" });

  for (const [x, z] of interior) {
    if (x === mx && z === mz) continue;
    if (x % 6 === 2 && z % 5 === 1) {
      v.set(x, 11, z, "light_gray_concrete");
      v.set(x, 12, z, "light_gray_concrete");
    }
  }
}

v.save(`${DIR}/${ID}.nbt`);
