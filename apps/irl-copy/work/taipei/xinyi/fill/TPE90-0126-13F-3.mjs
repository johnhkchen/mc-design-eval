import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE90-0126-13F-3";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 44, H = 76, D = 35;
const ROOF = 64;
const g = new Voxels([W, H, D]);

const minG = Math.min(...cells.map((c) => c[2]));
const inSet = new Set(cells.map(([x, z]) => x + "," + z));
const isIn = (x, z) => inSet.has(x + "," + z);

const lit = (i, s, face, x, z) => s >= 1 && ((i * 31 + s * 17 + face * 7 + x * 3 + z * 5) % 9 === 0);

// Classify perimeter cells once so the entrance can be placed on a real south-facing wall
const isCorner = (x, z) => ((!isIn(x - 1, z) || !isIn(x + 1, z)) && (!isIn(x, z - 1) || !isIn(x, z + 1)));
const southXs = cells
  .filter(([x, z]) => !isIn(x, z + 1) && !isCorner(x, z))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entranceX = southXs.length
  ? southXs[Math.floor(southXs.length / 2)]
  : Math.round(W / 2);
const canopyXs = new Set(southXs.filter((x) => Math.abs(x - entranceX) <= 2));

for (const [x, z, gr] of cells) {
  const gy = gr - minG;

  // Foundation
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone");

  const topH = ROOF - gy;
  if (topH <= 0) continue;

  const missN = !isIn(x, z - 1);
  const missS = !isIn(x, z + 1);
  const missW = !isIn(x - 1, z);
  const missE = !isIn(x + 1, z);
  const perim = missN || missS || missW || missE;

  if (!perim) {
    g.set(x, gy, z, "polished_andesite");
    for (let h = 5; h < topH; h += 5) g.set(x, gy + h, z, "light_gray_concrete");
    g.set(x, ROOF - 1, z, "light_gray_concrete");
    continue;
  }

  let face, i;
  if (missN) { face = 0; i = x; }
  else if (missS) { face = 2; i = x; }
  else if (missW) { face = 3; i = z; }
  else { face = 1; i = z; }
  const corner = (missW || missE) && (missN || missS);
  const isEntrance = face === 2 && !corner && x === entranceX;
  const isCanopy = face === 2 && !corner && canopyXs.has(x);

  for (let h = 0; h < topH; h++) {
    const y = gy + h;
    const s = Math.floor(h / 5);
    const r = h % 5;

    // Roof edge
    if (h === topH - 1) { g.set(x, y, z, "smooth_stone"); continue; }
    if (h === topH - 2) { g.set(x, y, z, "white_concrete"); continue; }
    if (h === topH - 3) { g.set(x, y, z, "smooth_stone"); continue; }

    // Entrance door, two blocks tall, on the south wall
    if (isEntrance && h < 2) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "south",
        half: h === 0 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Canopy: a projecting-looking band of stone slab over the entrance, with a lintel above the door
    if (isCanopy && h === 3) {
      g.set(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (isEntrance && h === 2) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (corner) {
      g.set(x, y, z, h === 0 ? "polished_granite" : "quartz_block");
      continue;
    }

    if (h === 0) { g.set(x, y, z, "polished_granite"); continue; }

    if (r === 0) {
      g.set(x, y, z, h < 15 ? "smooth_stone" : "white_concrete");
      continue;
    }

    if (i % 3 === 0) {
      g.set(x, y, z, "light_gray_concrete");
    } else if (lit(i, s, face, x, z) && r === 2) {
      g.set(x, y, z, "glowstone");
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }
}

// Mechanical penthouse on the roof slab
const PH = { x0: 10, x1: 33, z0: 10, z1: 24 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!isIn(x, z)) continue;
    const ring = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let y = ROOF; y <= ROOF + 2; y++) {
      if (ring) {
        const isGlassRow = y === ROOF + 1 && !((x === PH.x0 || x === PH.x1) && (z === PH.z0 || z === PH.z1));
        const midX = (x - PH.x0) % 4 === 0;
        g.set(x, y, z, isGlassRow && !midX ? "light_blue_stained_glass" : "light_gray_concrete");
      }
    }
    g.set(x, ROOF + 3, z, "smooth_stone");
  }
}

// Antenna mast on the penthouse, centred on the tower
const mastX = Math.round((PH.x0 + PH.x1) / 2);
const mastZ = Math.round((PH.z0 + PH.z1) / 2);
if (isIn(mastX, mastZ)) {
  for (let y = ROOF + 4; y <= ROOF + 9; y++) {
    g.set(mastX, y, mastZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
