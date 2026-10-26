import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 22, H = 34, D = 23;

const cells = JSON.parse(readFileSync(`${DIR}/DC86579.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { g: gr, r: rf });
const inside = (x, z) => map.has(key(x, z));

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const faces = (x, z) => {
  const out = [];
  for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    if (!inside(x + dx, z + dz)) out.push([dx, dz]);
  }
  return out;
};

// inset: Chebyshev distance from the nearest outside cell, minus one
const outside = [];
for (let x = -1; x <= W; x++) for (let z = -1; z <= D; z++) if (!inside(x, z)) outside.push([x, z]);
const inset = (x, z) => {
  let best = 99;
  for (const [ox, oz] of outside) best = Math.min(best, Math.max(Math.abs(x - ox), Math.abs(z - oz)) - 1);
  return best;
};

// Smoothed massing: average the lidar roof over each cell's 3x3 footprint
// neighbourhood, then snap to 2-block storey tiers so the skyline reads as clean setbacks.
const smoothTier = new Map();
for (const [x, z, , rf] of cells) {
  let sum = 0, cnt = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = map.get(key(x + dx, z + dz));
    if (c) { sum += c.r; cnt++; }
  }
  smoothTier.set(key(x, z), 2 * Math.round((sum / cnt) / 2));
}
const tierOf = (x, z) => smoothTier.get(key(x, z));
const maxTier = Math.max(...cells.map(([x, z]) => tierOf(x, z)));

const paneProps = (face) =>
  face[0] !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: three-bay recess on the min-z street face, centred on the footprint
const zmin = Math.min(...cells.map((c) => c[1]));
const frontXs = cells.filter((c) => c[1] === zmin).map((c) => c[0]).sort((a, b) => a - b);
const exX = frontXs[Math.floor(frontXs.length / 2)];
const isEntryBay = (x, z) => z === zmin && Math.abs(x - exX) <= 1;

for (const [x, z, gr] of cells) {
  const gy = gr;
  const tier = tierOf(x, z);
  const n = Math.max(2, Math.floor((tier - gy) / 2));
  const top = gy + 2 * n; // exclusive; roof cap sits at top-1

  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const ex = faces(x, z);
  const perim = ex.length > 0;
  const corner = ex.length >= 2;
  const face = ex[0];
  const pos = face ? (face[0] !== 0 ? z : x) : 0;

  for (let k = 0; k < n; k++) {
    const sy = gy + 2 * k;
    const wy = sy + 1;

    // floor / spandrel course
    if (perim) {
      put(x, sy, z, k === 0 ? "polished_granite" : "light_gray_concrete");
    } else {
      put(x, sy, z, "white_concrete");
    }

    if (wy === top - 1) continue; // roof cap written below

    if (perim) {
      const pier = corner || pos % 3 === 0;
      if (pier) {
        put(x, wy, z, k === 0 ? "polished_granite" : "white_concrete");
      } else if (k === 0) {
        // shopfront glass on the ground floor
        put(x, wy, z, "light_blue_stained_glass_pane", paneProps(face));
      } else {
        put(x, wy, z, "light_blue_stained_glass_pane", paneProps(face));
      }
    } else {
      // air gap behind glass; sparse warm glowstone accents
      if (k > 0 && k % 2 === 1 && (x * 3 + z * 5 + k) % 23 === 0) put(x, wy, z, "glowstone");
    }
  }

  // roof cap (structure)
  put(x, top - 1, z, "smooth_stone");

  // cornice on the perimeter
  if (perim) put(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // mechanical penthouse on the tallest tier, set in from the edge
  if (!perim && tier === maxTier && inset(x, z) >= 4 && top + 2 < H) {
    const edge = inset(x, z) === 4;
    if (edge) put(x, top, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    else put(x, top, z, "light_gray_concrete");
    put(x, top + 1, z, "stone_bricks");
  }
}

// Entrance bay: recessed lobby, door centred, polished granite lintel
for (const [x, z, gr] of cells) {
  if (!isEntryBay(x, z)) continue;
  const gy = gr;
  put(x, gy, z, "polished_granite");
  put(x, gy + 2, z, "polished_granite"); // lintel course over the bay
  if (x === exX) {
    g.set(x, gy + 1, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gy + 2, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    put(x, gy + 1, z, "light_blue_stained_glass_pane", paneProps([0, -1]));
  }
}

g.save(`${DIR}/DC86579.nbt`);
