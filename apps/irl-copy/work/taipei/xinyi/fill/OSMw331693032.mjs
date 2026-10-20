import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 東棟: a two-storey Xinyi-era commercial block (c. 1980s-90s). Smooth quartz
// render, a polished andesite base, stone-brick plinth, shopfront glass at
// street level, blue-tinted upper windows, and a green-glazed tile cap in the
// Taiwanese manner. Roof parapet sits 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw331693032";
const W = 36, H = 23, D = 54;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => x + "," + z;
const ground = new Map();
let minG = Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity;
for (const [x, z, gy] of cells) {
  const G = Math.round(gy);
  ground.set(key(x, z), G);
  minG = Math.min(minG, G);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z);
}
const has = (x, z) => ground.has(key(x, z));

// Top course (last solid block index). Roof reads ~11 blocks above lowest ground.
const T = minG + 10;
const cx = Math.floor((minX + maxX) / 2);

// Exterior faces of a footprint cell: zn = front (low z), zp = back,
// xn = west, xp = east.
function perimFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("zn");
  if (!has(x, z + 1)) f.push("zp");
  if (!has(x - 1, z)) f.push("xn");
  if (!has(x + 1, z)) f.push("xp");
  return f;
}
const isPerim = (x, z) => perimFaces(x, z).length > 0;

const INWARD = { zn: [0, 1], zp: [0, -1], xn: [1, 0], xp: [-1, 0] };

function paneProps(alongZ) {
  // Pane connects along the wall it sits in.
  return alongZ
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

function doorProps(half, hinge, facing) {
  return { facing, half, hinge, open: "false", powered: "false" };
}

const g = new Voxels([W, H, D]);
const lights = [];

for (const [x, z, gy] of cells) {
  const G = ground.get(key(x, z));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  const faces = perimFaces(x, z);

  // Interior: floor slab at grade, storey slab, roof deck, plant boxes.
  if (faces.length === 0) {
    g.set(x, G, z, "light_gray_concrete");
    if (G + 5 < T) g.set(x, G + 5, z, "light_gray_concrete");
    g.set(x, T, z, "light_gray_concrete");
    if (x % 9 === 4 && z % 7 === 3 && T + 1 < H) {
      g.set(x, T + 1, z, "white_concrete");
    }
    continue;
  }

  // Perimeter wall.
  const corner = faces.length > 1;
  const f = faces[0];
  const alongZ = (f === "zn" || f === "zp");
  const along = alongZ ? x - minX : z - minZ;
  const pier = corner || along % 4 === 0;
  const entranceZone = f === "zn" && x >= cx - 2 && x <= cx + 3;
  const doorCell = f === "zn" && (x === cx || x === cx + 1);

  for (let y = G; y < T; y++) {
    const rel = y - G;
    let b = null, props = undefined;

    if (rel === 0) {
      b = "polished_andesite";
    } else if (rel <= 4) {
      // Ground storey: shopfronts and entrance.
      if (entranceZone) {
        if (rel === 4) {
          b = "green_terracotta";
        } else if (doorCell) {
          if (rel === 1) {
            b = "dark_oak_door";
            props = doorProps("lower", x === cx ? "left" : "right", "south");
          } else if (rel === 2) {
            b = "dark_oak_door";
            props = doorProps("upper", x === cx ? "left" : "right", "south");
          } else {
            b = "glass_pane";
            props = paneProps(true);
          }
        } else {
          b = "glass_pane";
          props = paneProps(alongZ);
        }
      } else if (rel === 4) {
        b = "smooth_quartz";
      } else if (pier) {
        b = "smooth_quartz";
      } else {
        b = "glass_pane";
        props = paneProps(alongZ);
      }
    } else if (rel === 5) {
      // Storey line.
      b = "light_gray_concrete";
    } else if (rel <= 8) {
      // Upper storey: blue-tinted windows between quartz mullions.
      if (pier) {
        b = "smooth_quartz";
      } else {
        b = "light_blue_stained_glass_pane";
        props = paneProps(alongZ);
      }
    } else {
      // Head course below the cap.
      b = "smooth_quartz";
    }

    if (b) g.set(x, y, z, b, props);
  }

  // Cap course on the parapet.
  g.set(x, T, z, "green_terracotta");

  // Warm lights set just inside the glass (placed last, see below).
  if (!corner && f && !entranceZone && !pier) {
    const [dx, dz] = INWARD[f];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !isPerim(ix, iz)) {
      if (along % 8 === 2) lights.push([ix, G + 7 < T ? G + 7 : null, iz]);
      else if (along % 12 === 6) lights.push([ix, G + 2, iz]);
    }
  }
}

// Entrance canopy: a projecting roof on two quartz posts, set in the footprint
// row just inside the front wall so it stands on the ground it covers.
const doorG = ground.get(key(cx, minZ));
const canopyZ = minZ + 1;
const canopyY = doorG + 4;
for (let x = cx - 3; x <= cx + 4; x++) {
  if (!has(x, canopyZ) || isPerim(x, canopyZ)) continue;
  g.set(x, canopyY, canopyZ, "green_terracotta");
  g.set(x, canopyY + 1, canopyZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const px of [cx - 3, cx + 4]) {
  if (!has(px, canopyZ) || isPerim(px, canopyZ)) continue;
  const pg = ground.get(key(px, canopyZ));
  for (let y = pg; y < canopyY; y++) g.set(px, y, canopyZ, "smooth_quartz");
}

// Lights last, so no interior pass overwrites them.
for (const [lx, ly, lz] of lights) {
  if (ly === null || ly === undefined) continue;
  g.set(lx, ly, lz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
