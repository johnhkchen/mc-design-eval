import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi commercial block, c. 1990s: a two-storey podium-scale office/retail block
// with a cream-tile facade, glass shopfronts on the ground storey, blue-tinted
// upper windows, a cornice and crenellated parapet, and rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw371297765";
const W = 80, H = 23, D = 149;
const ROOF_TOP = 11;      // parapet top, about 11 blocks above lowest ground
const STOREY_LINE = 5;    // storey band between floors one and two
const CORNICE = 10;       // roof level / cornice course

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const key = (x, z) => `${x},${z}`;

const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), clamp(Math.round(gr), 0, H - 1));
}
const has = (x, z) => ground.has(key(x, z));
const cellList = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});

const DX = { N: 0, S: 0, W: -1, E: 1 };
const DZ = { N: -1, S: 1, W: 0, E: 0 };
const sidesOf = (x, z) => ["N", "S", "W", "E"].filter((s) => !has(x + DX[s], z + DZ[s]));
const isEdge = (x, z) => sidesOf(x, z).length > 0;

// Main entrance: median facade position on each outward side, three bays wide.
const sideAlong = { N: [], S: [], W: [], E: [] };
for (const { x, z } of cellList) {
  for (const s of sidesOf(x, z)) sideAlong[s].push(s === "N" || s === "S" ? x : z);
}
const entrMid = {};
for (const s of ["N", "S", "W", "E"]) {
  const arr = sideAlong[s].sort((a, b) => a - b);
  entrMid[s] = arr.length ? arr[Math.floor(arr.length / 2)] : null;
}

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundation, facade and interior floors/roof per footprint cell.
for (const { x, z, gr } of cellList) {
  // Solid fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const sides = sidesOf(x, z);

  if (sides.length) {
    // Facade cell: pick the first outward side.
    const s = sides[0];
    const along = s === "N" || s === "S" ? x : z;
    const p = ((along % 4) + 4) % 4;
    const bay = p === 1 || p === 2;
    const pane = s === "N" || s === "S" ? paneNS : paneEW;
    const mid = entrMid[s];
    const isEntrWidth = mid !== null && Math.abs(along - mid) <= 1;
    const isEntrMid = mid === along;
    const inX = x - DX[s];
    const inZ = z - DZ[s];
    const inside = has(inX, inZ) && !isEdge(inX, inZ);

    for (let y = gr; y <= ROOF_TOP && y < H; y++) {
      let id = null;
      let props;

      if (y === gr) {
        id = "polished_granite";                        // base course
      } else if (y === STOREY_LINE || y === CORNICE) {
        id = "smooth_quartz";                           // storey line / cornice
      } else if (y === ROOF_TOP) {
        if (along % 2 === 0) id = "white_concrete";     // parapet merlons
      } else if (y < STOREY_LINE) {
        // Ground storey: shopfront with a three-bay entrance portal.
        if (isEntrWidth && y <= gr + 2) {
          if (isEntrMid) {
            id = "glass";                               // glazed entrance door
          } else {
            id = "polished_granite";                    // portal jamb
          }
        } else if (isEntrWidth && y === gr + 3) {
          id = "polished_granite";                      // portal lintel
        } else if (bay) {
          if (y <= gr + 2) {
            id = "glass";                               // shop display glass
          } else {
            id = "light_blue_stained_glass_pane";
            props = pane;
          }
        } else {
          id = "white_concrete";                        // pier
        }
      } else {
        // Upper storey: window grid.
        if (bay) {
          id = "light_blue_stained_glass_pane";
          props = pane;
        } else {
          id = "white_concrete";
        }
      }

      if (id) g.set(x, y, z, id, props);
    }

    // Projecting piers: step the pier one cell inward for facade relief.
    if (inside && !bay && !isEntrWidth) {
      for (let y = gr + 1; y <= 9 && y < H; y++) {
        if (y === STOREY_LINE) continue;
        g.set(inX, y, inZ, "white_concrete");
      }
    }

    // Warm light behind some upper and shop windows (air gap kept inside).
    if (inside && bay && !isEntrWidth) {
      for (let y = gr + 1; y <= 9 && y < H; y++) {
        if (y === STOREY_LINE) continue;
        if ((x * 31 + z * 17 + y * 7) % 11 === 0) {
          g.set(inX, y, inZ, "glowstone");
        }
      }
    }
  } else {
    // Interior cell: floor slab at ground, storey slab and roof deck. No interior.
    g.set(x, gr, z, "smooth_stone");
    if (gr < STOREY_LINE) g.set(x, STOREY_LINE, z, "smooth_stone");
    if (gr <= CORNICE) g.set(x, CORNICE, z, "light_gray_concrete");
  }
}

// 2. Rooftop plant: mechanical boxes and a glazed pavilion.
const pavIn = (x, z) => x >= 34 && x <= 44 && z >= 60 && z <= 80;

for (const { x, z, gr } of cellList) {
  if (gr > CORNICE) continue;
  if (isEdge(x, z)) continue;

  if (pavIn(x, z)) {
    // Pavilion: floor, glazed ring, columns at corners, roof slab, warm light.
    g.set(x, 11, z, "smooth_stone");
    g.set(x, 15, z, "smooth_quartz");
    const onRingX = x === 34 || x === 44;
    const onRingZ = z === 60 || z === 80;
    if (onRingX || onRingZ) {
      const corner = onRingX && onRingZ;
      for (let y = 12; y <= 14; y++) {
        if (corner) {
          g.set(x, y, z, "white_concrete");
        } else if (onRingZ) {
          g.set(x, y, z, "light_blue_stained_glass_pane", paneEW);
        } else {
          g.set(x, y, z, "light_blue_stained_glass_pane", paneNS);
        }
      }
    } else if (x === 39 && z === 70) {
      g.set(x, 12, z, "glowstone");
    }
    continue;
  }

  // Mechanical units on a loose grid across the roof.
  if (x >= 18 && x <= 58 && z >= 30 && z <= 118 && (x - 18) % 14 < 9 && (z - 30) % 22 < 12) {
    g.set(x, 11, z, "light_gray_concrete");
    g.set(x, 12, z, "light_gray_concrete");
    g.set(x, 13, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
