import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Residential stone house, c.1880, Mont-Saint-Michel. Granite walls with
// stone-brick bands and lintels, slate roof, brick chimney, timber door.
// Lidar roof gives the massing. Roof and storey lines are smoothed across the
// footprint so the building reads as one house; each cell keeps its own
// foundation to its ground.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${SRC}/FR301499669.cells.json`, "utf8"));

const W = 18, H = 26, D = 29;
const g3 = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const N4 = [
  [0, -1, "north"],
  [0, 1, "south"],
  [1, 0, "east"],
  [-1, 0, "west"],
];
const opp = { north: "south", south: "north", east: "west", west: "east" };

// ---- 1. Normalise cells ----
const cellMap = new Map();
for (const [x, z, g0, r0] of cells) {
  cellMap.set(key(x, z), { x, z, g: Math.round(g0), Rraw: Math.round(r0), out: [], d: 0 });
}
const allR = [...cellMap.values()].map((c) => c.Rraw).sort((a, b) => a - b);
const Rmed = allR[Math.floor(allR.length / 2)];
for (const c of cellMap.values()) {
  // clamp roof into one tier band around the median: flat, coherent roof
  let R = Math.min(Math.max(c.Rraw, Rmed - 3), Rmed + 2);
  R = Math.max(R, c.g + 8);
  R = Math.min(R, H - 5);
  c.R = R;
}

// ---- 2. Distance from outside (edge cells = 1) ----
const queue = [];
for (const c of cellMap.values()) {
  c.out = N4.filter(([dx, dz]) => !cellMap.has(key(c.x + dx, c.z + dz))).map(([, , n]) => n);
  if (c.out.length) {
    c.d = 1;
    queue.push(c);
  }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of N4) {
    const n = cellMap.get(key(c.x + dx, c.z + dz));
    if (n && !n.d) {
      n.d = c.d + 1;
      queue.push(n);
    }
  }
}

// ---- 3. Storeys on one common wall line for the whole house ----
// Wall top target: median roof minus a 3-block roof allowance.
const WtTarget = Rmed - 3;
for (const c of cellMap.values()) {
  const S = Math.max(2, Math.floor((WtTarget - c.g) / 4));
  c.S = S;
  c.wallTop = c.g + 4 * S;
  c.cap = c.R - c.wallTop;
  if (c.cap < 3) {
    // keep a roof of at least 3 blocks: drop one storey
    c.S = Math.max(1, c.S - 1);
    c.wallTop = c.g + 4 * c.S;
    c.cap = c.R - c.wallTop;
  }
  c.roofTop = c.wallTop + Math.min(c.d, c.cap);
}

// ---- 4. Door: street-facing (south) perimeter cell nearest the middle ----
let doorCell = null;
{
  const cs = [...cellMap.values()].filter((c) => c.d === 1 && c.out.length === 1);
  const minX = Math.min(...cs.map((c) => c.x));
  const maxX = Math.max(...cs.map((c) => c.x));
  const mid = (minX + maxX) / 2;
  const pick = (face) => {
    const list = cs.filter((c) => c.out[0] === face);
    if (!list.length) return null;
    return list.reduce((a, b) => (Math.abs(b.x - mid) < Math.abs(a.x - mid) ? b : a));
  };
  doorCell = pick("south") || pick("north") || pick("east") || pick("west");
}

const glowList = [];
let chimneyCell = null;

// ---- 5. Foundations, floors, walls, windows ----
for (const c of cellMap.values()) {
  const { x, z, g, d, S, wallTop } = c;
  const isPer = d === 1;

  for (let y = 0; y < g; y++) g3.set(x, y, z, "granite");

  for (let s = 0; s < S; s++) g3.set(x, g + 4 * s, z, "stone_bricks");
  g3.set(x, wallTop, z, "stone_bricks"); // cornice / ceiling

  if (isPer) {
    for (let y = g + 1; y < wallTop; y++) {
      const rel = (y - g) % 4;
      if (rel === 0) continue;
      if (rel === 3) {
        g3.set(x, y, z, "stone_bricks");
        continue;
      }
      const face = c.out.length === 1 ? c.out[0] : null;
      if (face) {
        const t = face === "north" || face === "south" ? x : z;
        const isDoor = doorCell && doorCell.x === x && doorCell.z === z && y <= g + 2;
        if (!isDoor && t % 3 === 1) {
          const axisNS = face === "north" || face === "south";
          g3.set(x, y, z, "glass_pane", {
            north: "false",
            south: "false",
            east: axisNS ? "true" : "false",
            west: axisNS ? "true" : "false",
            waterlogged: "false",
          });
          if (rel === 2 && (x * 7 + z * 13 + g * 3 + y) % 4 === 0) {
            const [dx, dz] = N4.find(([, , n]) => n === face).slice(0, 2);
            glowList.push([x - dx, g + 4 * Math.floor((y - g) / 4) + 2, z - dz]);
          }
          continue;
        }
      }
      g3.set(x, y, z, "granite");
    }
  }

  if (!chimneyCell || d > chimneyCell.d || (d === chimneyCell.d && x % 2 === 0)) {
    chimneyCell = c;
  }
}

// ---- 6. Warm lights behind glass ----
for (const [x, y, z] of glowList) {
  const c = cellMap.get(key(x, z));
  if (c && c.d >= 2 && y < c.wallTop) g3.set(x, y, z, "glowstone");
}

// ---- 7. Door with lantern and stone surround ----
if (doorCell) {
  const c = doorCell;
  const facing = opp[c.out[0]];
  g3.set(c.x, c.g + 1, c.z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g3.set(c.x, c.g + 2, c.z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g3.set(c.x, c.g + 3, c.z, "stone_bricks");
  // lantern on the ground floor beside the door, inside the footprint
  const lx = c.x + 1 < W ? c.x + 1 : c.x - 1;
  const lc = cellMap.get(key(lx, c.z));
  if (lc && lc.d >= 2) g3.set(lx, c.g + 1, c.z, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- 8. Roof: deepslate tiles with slate stairs on the slope ----
for (const c of cellMap.values()) {
  const { x, z, wallTop, roofTop, d, cap } = c;
  for (let y = wallTop + 1; y < roofTop; y++) g3.set(x, y, z, "deepslate_tiles");

  if (d < cap) {
    let best = null;
    let bestVal = Infinity;
    for (const [dx, dz, name] of N4) {
      const n = cellMap.get(key(x + dx, z + dz));
      const v = n ? n.d : 0;
      if (v < bestVal) {
        bestVal = v;
        best = name;
      }
    }
    g3.set(x, roofTop, z, "deepslate_tile_stairs", {
      facing: opp[best],
      half: "bottom",
      shape: "straight",
      waterlogged: "false",
    });
  } else {
    g3.set(x, roofTop, z, "deepslate_tiles");
  }
}

// ---- 9. Chimney on the ridge ----
if (chimneyCell) {
  const { x, z, roofTop } = chimneyCell;
  for (let y = roofTop + 1; y <= roofTop + 3 && y < H; y++) g3.set(x, y, z, "bricks");
  if (roofTop + 4 < H) g3.set(x, roofTop + 4, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g3.save(`${SRC}/FR301499669.nbt`);
