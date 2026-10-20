import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001606";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 12, H = 24, D = 5;
const vox = new Voxels([W, H, D]);

const clampI = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Footprint lookup: ground per cell, lidar roof per cell
const info = new Map();
for (const [x, z, gr, rf] of cells) {
  info.set(`${x},${z}`, { g: Math.max(0, Math.round(gr)), r: Math.round(rf) });
}
const has = (x, z) => info.has(`${x},${z}`);

// One smoothed roof tier for the whole building (lidar noise removed),
// rounded to whole 2-block storeys above y 0
const roofs = [...info.values()].map((c) => c.r).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const ROOF_Y = clampI(2 * Math.round(medianRoof / 2), 4, H - 4);

const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};
const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

function faces(x, z) {
  return {
    north: !has(x, z - 1), // street side (z = 0)
    south: !has(x, z + 1),
    west: !has(x - 1, z),
    east: !has(x + 1, z),
  };
}

// Corners and every third bay are piers
const isPierAlong = (a, len) => a === 0 || a === len - 1 || a % 3 === 0;

for (const [key, c] of info) {
  const [x, z] = key.split(",").map(Number);
  const G = clampI(c.g, 0, ROOF_Y - 2);   // this cell's ground (foundation top)
  const R = ROOF_Y;                       // shared roof tier, stands on every column

  const f = faces(x, z);
  const perim = f.north || f.south || f.west || f.east;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) set(x, y, z, "stone");

  // Walls, floors and windows, storey by storey from ground to roof
  for (let y = G; y < R; y++) {
    const rel = y - G;
    const k = Math.floor(rel / 2);   // storey index on this cell
    const w = rel % 2;               // 0 = storey line / spandrel, 1 = window row

    if (!perim) {
      if (w === 0 && k >= 1) set(x, y, z, "smooth_stone"); // floor slab per storey
      continue;
    }

    let along, len;
    if (f.north || f.south) { along = x; len = W; }
    else { along = z; len = D; }
    const pier = isPierAlong(along, len);

    // Ground-floor storefront on the street face, with entrance
    if (f.north && y === G) {
      if (pier) set(x, y, z, "stone_bricks");
      else if (x === 5) set(x, y, z, "dark_oak_door", doorProps("lower"));
      else set(x, y, z, "glass");
      continue;
    }
    if (f.north && y === G + 1) {
      if (x === 5) set(x, y, z, "dark_oak_door", doorProps("upper"));
      else set(x, y, z, pier ? "stone_bricks" : "dark_oak_planks");
      continue;
    }

    if (y === G) { set(x, y, z, "stone_bricks"); continue; } // base course

    if (w === 0) { // storey string course
      set(x, y, z, k >= 1 ? "smooth_stone" : "bricks");
      continue;
    }

    // Window row: glass in bays, stone piers between
    if (pier) {
      set(x, y, z, "stone_bricks");
    } else {
      set(x, y, z, "glass");
      // warm light in the air gap just inside some windows
      if ((along + k + (f.north || f.south ? z : x)) % 3 === 0) {
        const ix = f.north || f.south ? x : f.west ? x + 1 : x - 1;
        const iz = f.north ? z + 1 : f.south ? z - 1 : z;
        const lamp = (along + k) % 2 === 0 ? "glowstone" : "shroomlight";
        set(ix, y, iz, lamp);
      }
    }
  }

  // Cornice, parapet and roof on every cell
  if (perim) {
    set(x, R, z, "stone_bricks");
    set(x, R + 1, z, "bricks"); // parapet
  } else {
    set(x, R, z, "smooth_stone");
  }

  // Stone lintel over the entrance
  if (f.north && x >= 4 && x <= 6) set(x, G + 2, z, "stone_bricks");
}

// Roof plant: one penthouse block on the shared roof tier, on the back side
for (const [px, pz] of [[8, 2], [9, 2]]) {
  if (!has(px, pz)) continue;
  set(px, ROOF_Y + 1, pz, "stone_bricks");
  set(px, ROOF_Y + 2, pz, "stone_bricks");
  set(px, ROOF_Y + 3, pz, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

vox.save(`${DIR}/${ID}.nbt`);
