import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1700 New York Ave NW: 1980s-style speculative office block, 4-5 storeys.
// Light precast concrete with a polished granite base, ribbon glazing between
// white concrete mullions, a granite-framed double-door entrance on the street
// face (z = 0), a flat roof with a parapet and a centred mechanical penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 24, H = 27, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/DC53976.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { gr, rf });
const has = (x, z) => map.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Flat tiers: one roof level for the whole block (median of lidar roofs),
// storey lines shared by every cell so they align across the slope.
const y0 = Math.min(...cells.map((c) => c[2]));
const roofSorted = cells.map((c) => c[3]).sort((a, b) => a - b);
const med = roofSorted[Math.floor(roofSorted.length / 2)];

const levels = [];
for (let L = y0 + 4; L < H; L += 3) levels.push(L); // ground storey 4 tall, then 3-block floors

const paneFront = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneSide = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Mullion rule per face: front/back faces (z = 0 / z = D-1) are spaced along x,
// end faces (x = 0 / x = W-1) are spaced along z. Interior notches use both.
const isPier = (x, z) => {
  const onFrontBack = z === 0 || z === D - 1;
  const onEnds = x === 0 || x === W - 1;
  if (onFrontBack && onEnds) return true;
  if (onFrontBack) return x % 3 === 0;
  if (onEnds) return z % 3 === 0;
  return x % 3 === 0 || z % 3 === 0;
};

// Pass 1: foundations, floors, walls, roof and parapet, per footprint cell.
for (const [x, z, gy] of cells) {
  const T = Math.min(H - 4, Math.max(med, gy + 6));
  const edge = isEdge(x, z);

  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    put(x, gy, z, "light_gray_concrete");
    for (const L of levels) if (L > gy && L < T - 1) put(x, L, z, "light_gray_concrete");
  } else {
    const pier = isPier(x, z);
    const frontBack = z === 0 || z === D - 1;
    const paneProps = frontBack ? paneFront : paneSide;

    for (let y = gy; y < T; y++) {
      let b;
      if (y === gy) {
        b = "polished_granite";
      } else if (y === T - 1) {
        b = "light_gray_concrete";
      } else if (y >= y0 + 4) {
        if (pier) b = "white_concrete";
        else b = (y - y0 - 4) % 3 === 0 ? "light_gray_concrete" : "glass_pane";
      } else {
        if (pier) b = "polished_granite";
        else b = y >= y0 + 3 ? "light_gray_concrete" : "glass_pane";
      }
      if (b === "glass_pane") put(x, y, z, b, paneProps);
      else put(x, y, z, b);
    }

    // Parapet cap on the edge.
    put(x, T + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  put(x, T, z, "smooth_stone");

  // Centred mechanical penthouse, set back from the edges.
  if (!edge && x >= 5 && x <= 8 && z >= 5 && z <= 9) {
    put(x, T + 1, z, "light_gray_concrete");
    put(x, T + 2, z, "light_gray_concrete");
    put(x, T + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Warm lights behind the front glazing in some interior bays.
  if (z === 1 && has(x, 1) && !isEdge(x, 1) && x % 6 === 2) {
    for (const L of levels) {
      if (L > gy && L + 2 < T - 1) put(x, L + 1, 1, "shroomlight");
    }
  }
}

// Pass 2: entrance on the street face (z = 0). Granite surround in the
// ground-floor opening, double doors in the centre bays, a lantern on each side.
for (const [x, z, gy] of cells) {
  if (z !== 0) continue;
  // Granite surround around the doors (columns x = 9 and x = 12), lintel row at gy+3.
  if (x === 9 || x === 12) {
    put(x, gy + 1, z, "polished_granite");
    put(x, gy + 2, z, "polished_granite");
  }
  if (x === 10) {
    put(x, gy + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  if (x === 11) {
    put(x, gy + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
    put(x, gy + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
  }
  if (x >= 9 && x <= 12) {
    put(x, gy + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}
// Lanterns on the granite piers flanking the doors, one block in front of the
// piers at the inside face so they read as the entrance lights.
for (const [x, z, gy] of cells) {
  if (z === 1 && (x === 9 || x === 12) && has(x, 1)) {
    put(x, gy + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC53976.nbt`);
