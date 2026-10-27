import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s reinforced-concrete office block on a shopfront ground floor: cream render walls, quartz piers, glass panes in
// quartz frames, stone storey lines and a plant room on the roof. The lidar roof (about 22 above the lowest ground) makes
// four storeys on the north-west mass, stepping down to three on the south-east and one at the edges.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430119.cells.json", "utf8"));

const g = new Voxels([32, 34, 24]);
const FP = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const at = (x, z) => FP.get(`${x},${z}`);
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };

// floor slabs: the plinth top, then each storey's floor, the last one being the roof slab
const SLAB = [3, 8, 12, 16, 20];
// storeys above the plinth, from the lidar roof, smoothed into four tiers
const tiers = (roof) => (roof <= 9 ? 1 : roof <= 14 ? 2 : roof <= 20 ? 3 : 4);
const tierAt = (x, z) => tiers(at(x, z).roof);

// faces a cell shows: outward (off the footprint) or down a step to a lower tier
const faces = (x, z) => {
  const k = tierAt(x, z);
  return Object.keys(DIRS).filter((d) => { const n = at(x + DIRS[d][0], z + DIRS[d][1]); return !n || tiers(n.roof) < k; });
};
const outward = (x, z, d) => !at(x + DIRS[d][0], z + DIRS[d][1]);
const pickFace = (x, z) => {
  const fs = faces(x, z);
  return fs.find((d) => outward(x, z, d)) ?? fs[0] ?? null;
};

// the entrance: the outward north face cell nearest x = 10
const northOuter = cells.filter(([x, z]) => outward(x, z, "n")).map(([x, z]) => [x, z]);
const door = northOuter.reduce((a, b) => (Math.abs(b[0] - 10) < Math.abs(a[0] - 10) ? b : a));

const paneFor = (d) => {
  const ew = d === "n" || d === "s";   // a pane on a north/south face joins east and west
  return { north: String(!ew), south: String(!ew), east: String(ew), west: String(ew), waterlogged: "false" };
};

const PIER = ["quartz_pillar", { axis: "y" }];

// the facade block at a wall cell's height y, on a cell of tier k
function facadeBlock(x, z, y, k, d) {
  const u = d === "n" || d === "s" ? x : z;   // position along the face
  const pier = u % 3 === 0;
  if (x === door[0] && z === door[1] && y <= 6) {
    if (y === 4) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (y === 5) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    return ["oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" }];
  }
  if (y === SLAB[k] + 1) return ["smooth_quartz"];   // a continuous parapet, standing on the roof slab
  let j = 0;
  while (j + 1 < k && SLAB[j + 1] < y) j++;   // the storey this row is in
  if (j === 0) {                              // shopfront: kickplate, glass, fascia
    if (pier) return PIER;
    if (y === 4) return ["polished_andesite"];
    if (y <= 6) return ["glass"];
    return ["dark_oak_planks"];
  }
  const rel = y - SLAB[j];                    // 1..3 above the storey's slab
  if (pier) return PIER;
  if (rel === 3) return ["smooth_quartz"];    // lintel
  return ["glass_pane", paneFor(d)];
}

const place = (x, y, z, [block, state]) => g.set(x, y, z, block, state);

for (const [x, z, , roof] of cells) {
  const k = tiers(roof);
  // foundation under every cell, then the floor slabs (the last is the roof)
  for (let y = 0; y < 3; y++) g.set(x, y, z, "stone_bricks");
  for (let i = 0; i <= k; i++) g.set(x, SLAB[i], z, "stone_bricks");

  const d = pickFace(x, z);
  if (!d) continue;                                              // interior: floor slabs only
  for (let y = 4; y <= SLAB[k] + 1; y++) {
    if (SLAB.slice(0, k + 1).includes(y)) continue;              // the storey slabs and the roof, already down
    place(x, y, z, facadeBlock(x, z, y, k, d));
  }

  // warm light behind some outward windows: on the interior floor, one cell in from the glass, per storey
  if (outward(x, z, d)) {
    const [dx, dz] = DIRS[d];
    const ix = x - dx, iz = z - dz;
    const u = d === "n" || d === "s" ? x : z;
    if (at(ix, iz) && !faces(ix, iz).length && u % 3 !== 0) {
      for (let s = 0; s < k; s++) if ((x * 7 + z * 13 + s * 5) % 5 === 0) g.set(ix, SLAB[s] + 1, iz, "glowstone");
    }
  }
}

// a plant room on the middle of the top tier: walls on the roof slab, a stone cap
let plant = 0;
for (let x = 13; x <= 17; x++) for (let z = 9; z <= 12; z++) {
  if (!at(x, z) || tierAt(x, z) !== 4 || faces(x, z).length) continue;
  const edge = x === 13 || x === 17 || z === 9 || z === 12;
  for (let y = 21; y <= 23; y++) g.set(x, y, z, edge ? "smooth_quartz" : "air");
  g.set(x, 24, z, "stone_bricks");
  plant++;
}
for (const [x, z] of [[13, 9], [17, 9], [13, 12], [17, 12]]) g.set(x, 21, z, "quartz_pillar", { axis: "y" });

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430119.nbt");
console.log(`way_154430119: ${cells.length} cells, plant room ${plant} cells, ${stats.blocks} blocks, palette ${stats.palette}`);
