// 1503 10th St NW: a red-brick Edwardian school (c.1912). Two-storey wing with a stone base and cornice, a taller
// corner tower on the west end, a three-bay-high east block, a low gym wing to the south, a rooftop plant box and
// a brick chimney. Built from the lidar roof tiers (median-smoothed), one solid shell per tier, with the storey air
// layers left open behind the glass and warm lights in some of the bays.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62578.nbt";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62578.cells.json", "utf8"));
const X = 42, Z = 28, Y = 18;

// --- footprint and roof tiers: 3x3 median of the lidar roof heights, then snapped to the four tiers
const roof = Array.from({ length: Z }, () => Array(X).fill(-1));
for (const [x, z, , r] of cells) roof[z][x] = r;
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && roof[z][x] >= 0;
const tierOf = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) v.push(roof[z + dz][x + dx]);
  v.sort((a, b) => a - b);
  let h = v[Math.floor(v.length / 2)];
  if (h >= 6) h = (x <= 2 && z >= 10 && z <= 13) ? 6 : 5;   // the lone 6s elsewhere are lidar noise on the wing
  else if (h >= 4) h = 3;                                    // the bumps on the east block are the same roof
  else if (h <= 2) h = 2;
  if (x > 31 && h === 5) h = 3;                              // the east edge reads as the east block
  return h;
};
const H = Array.from({ length: Z }, () => Array(X).fill(0));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (inFp(x, z)) H[z][x] = tierOf(x, z);

// the storey layers (air behind the glass) and the window rows for each tier
const airLayers = { 2: [], 3: [1], 5: [1, 3], 6: [1, 3] };
const windowRows = { 2: [0], 3: [1], 5: [1, 3], 6: [1, 3] };

// --- the blocks: a map from "x,y,z" to [block, state]
const blocks = new Map();
const put = (x, y, z, b, s) => blocks.set(`${x},${y},${z}`, [b, s]);
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z)) continue;
  const h = H[z][x];
  // a facade face: a neighbour outside the footprint or lower than this layer
  const nb = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];
  for (let y = 0; y < h; y++) {
    const exposed = nb.some(([a, b]) => !inFp(a, b) || H[b][a] <= y);
    const u = x + z;                                         // position along the wall: the one that changes
    if (exposed) {
      let b = "bricks";
      if (y === h - 1) b = "smooth_stone";                    // cornice / parapet
      else if (y === 0 && h >= 3) b = "stone_bricks";         // plinth
      else if (windowRows[h]?.includes(y)) {
        const k = u % 4;
        b = k === 0 ? "bricks" : k === 3 ? "stone_bricks" : "glass_pane";
      } else if (h >= 3 && (y === 2 || y === 4) && h >= 5) b = "stone_bricks";   // floor string courses
      put(x, y, z, b);
    } else if (y === h - 1) {
      put(x, y, z, "light_gray_concrete");                    // roof deck
    } else if (airLayers[h]?.includes(y)) {
      // storey air, left open
    } else {
      put(x, y, z, "smooth_stone");                           // floor slab
    }
  }
}

// --- entrance on the north face of the wing: double doors at x 14..15, lintel above on the storey-two row
for (const x of [14, 15]) {
  put(x, 1, 6, "oak_door", { facing: "south", half: "lower", hinge: x === 14 ? "left" : "right", open: "false", powered: "false" });
  put(x, 2, 6, "oak_door", { facing: "south", half: "upper", hinge: x === 14 ? "left" : "right", open: "false", powered: "false" });
}
for (let x = 13; x <= 16; x++) put(x, 3, 6, "smooth_stone");        // the canopy/hood over the doors
put(13, 1, 6, "stone_bricks"); put(16, 1, 6, "stone_bricks");        // door surround

// --- rooftop plant box on the wing and a brick chimney on the east block
for (let z = 8; z <= 11; z++) for (let x = 18; x <= 21; x++) put(x, 5, z, "white_concrete");
for (const y of [3, 4]) put(36, y, 3, "bricks");
put(36, 5, 3, "smooth_stone");

// --- warm lights in the storey air, behind some of the windows (the cell stands on its floor slab)
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z)) continue;
  const h = H[z][x];
  for (const y of airLayers[h] ?? []) {
    if (at(x, y, z)) continue;                                           // not air
    const behindWindow = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([a, b]) => at(a, y, b)?.[0] === "glass_pane");
    if (behindWindow && (x * 7 + z * 3 + y) % 5 === 0) put(x, y, z, (x + z) % 2 ? "glowstone" : "shroomlight");
  }
}

// --- glass panes connect to their neighbours (solid or glass) on the same layer
const connects = (x, y, z) => { const b = at(x, y, z); return !!b; };
for (const [k, [b, s]] of [...blocks]) {
  if (b !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  blocks.set(k, [b, {
    north: String(connects(x, y, z - 1)), south: String(connects(x, y, z + 1)),
    east: String(connects(x + 1, y, z)), west: String(connects(x - 1, y, z)), waterlogged: "false",
  }]);
}

// --- write the structure
const g = new Voxels([X, Y, Z]);
for (const [k, [b, s]] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b, s);
}
const r = g.save(OUT);
console.log(`wrote ${OUT}: ${r.blocks} blocks, ${r.palette} palette entries`);
