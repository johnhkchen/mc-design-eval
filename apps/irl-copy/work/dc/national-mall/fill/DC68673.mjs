// DC68673: 1300 10th St NW, a religious building (Gothic Revival, red brick on a stone plinth, limestone trim,
// a copper-capped belfry at the SE corner). A hollow 1-cell shell: glass in the walls with air behind, floor slabs
// per storey, a roof cap on every column, and warm glowstone behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68673.cells.json", "utf8"));
const key = (x, z) => `${x},${z}`;
const lidar = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const has = (x, z) => lidar.has(key(x, z));
const isInterior = (x, z) => has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);

// Roof tiers: a 3x3 majority over the lidar heights irons out the noise (ties keep the lidar value); the SE corner
// is the belfry tower, which the lidar puts at 9-10, so it is set to 10 as one flat tier.
const roofOf = (x, z) => {
  if (x >= 8 && z >= 11) return 10;
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = lidar.get(key(x + dx, z + dz)); if (c) votes.set(c.r, (votes.get(c.r) ?? 0) + 1);
  }
  let best = lidar.get(key(x, z)).r, n = votes.get(best);
  for (const [r, k] of votes) if (k > n) { best = r; n = k; }
  return best;
};

const T = {
  plinth: "stone_bricks", floor: "stone_bricks", brick: "bricks", trim: "calcite",
  roof: "deepslate_tiles", copper: "oxidized_cut_copper", bars: "iron_bars", glass: "glass_pane", glow: "glowstone",
};
const runPane = (zFace) => (zFace
  ? { north: "false", east: "true", south: "false", west: "true" }     // wall runs along x
  : { north: "true", east: "false", south: "true", west: "false" });   // wall runs along z
const floorsOf = (top) => new Set([top - 2, ...[3, 5, 7].filter((y) => y <= top - 2)]);

const g = new Voxels([11, 22, 14]);
const glowAt = [];

for (const [k, { g: ground }] of cells.map(([x, z, gg]) => [key(x, z), { g: gg }])) {
  const [x, z] = k.split(",").map(Number);
  const top = roofOf(x, z);
  const cornice = top === 10 ? T.copper : T.trim;

  if (isInterior(x, z)) {
    // hollow: solid floor at the bottom, floor slabs per storey, air, and the roof cap on top
    const floors = floorsOf(top);
    for (let y = 0; y < top; y++) {
      if (y === 0 || y === top - 1) g.set(x, y, z, y === 0 ? T.floor : (top === 10 ? T.copper : T.roof));
      else if (floors.has(y)) g.set(x, y, z, T.floor);
    }
    continue;
  }

  // shell: the footprint's outer ring. The wall runs along x on the north/south faces, along z on the east/west
  const zFace = !has(x, z + 1) || !has(x, z - 1);
  const bay = (zFace ? x : z) % 3 !== 0;               // piers every third cell, windows between
  for (let y = 0; y < top; y++) {
    let b, s;
    if (y === top - 1) b = cornice;                          // cornice / copper cap
    else if (y === 0 && ground === 1) b = T.plinth;          // the stone plinth on the foundation
    else if (y === 3 || (top >= 9 && y === 7)) b = T.trim;   // string courses at the storey lines
    else if (top === 10 && y === 8) { if (bay) { b = T.bars; s = runPane(zFace); } else b = T.trim; }   // louvred belfry
    else if (bay) { b = T.glass; s = runPane(zFace); }
    else b = T.brick;
    g.set(x, y, z, b, s);
  }
  if (bay && (zFace ? x : z) % 6 === 2 && top >= 4) {
    // warm glowstone in the air behind a window, on the ground-storey line
    const dx = zFace ? 0 : (has(x + 1, z) ? 1 : -1), dz = zFace ? (has(x, z + 1) ? 1 : -1) : 0;
    if (isInterior(x + dx, z + dz)) glowAt.push([x + dx, 1, z + dz]);
  }
}

// The entrance on the north face: a pair of doors in a calcite surround with a lintel over (the storey string)
const door = (x, half, hinge) => g.set(x, half === "lower" ? 1 : 2, 0, "dark_oak_door",
  { facing: "south", half, hinge, open: "false", powered: "false" });
for (const x of [4, 5]) {
  door(x, "lower", x === 4 ? "left" : "right");
  door(x, "upper", x === 4 ? "left" : "right");
}
for (const y of [1, 2]) { g.set(3, y, 0, T.trim); g.set(6, y, 0, T.trim); }

for (const [x, y, z] of glowAt) g.set(x, y, z, T.glow);

// A flue on the nave roof, with a lightning rod on top (roof equipment)
for (const [x, z] of [[5, 2], [4, 2], [6, 2], [5, 3]]) {
  if (!has(x, z) || !isInterior(x, z) || roofOf(x, z) !== 6) continue;
  g.set(x, 6, z, T.brick); g.set(x, 7, z, T.brick); g.set(x, 8, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  break;
}
// The belfry's lightning rod
g.set(8, 10, 11, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68673.nbt");
console.log(`DC68673: ${blocks} blocks, ${palette} palette entries`);
