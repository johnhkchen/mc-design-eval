// 33 West 47th Street, 1920 mixed residential and commercial building: a 7 x 26 block lot on a narrow Midtown frontage,
// its 47th Street front at low z (north). The lidar roof is read as clean storeys of 3 blocks: a two-storey commercial
// front with a shopfront and a recessed entrance under a granite hood, a three- and four-storey stepped middle along the
// east side, a five-storey spine on the west lot line the length of the lot (17 blocks), a five-storey south wing with
// two stair bulkheads, and the lidar's open ground left as paving. Red brick walls on a granite foundation and base
// course, limestone floor bands and a cornice, steel-sash windows as glass panes with air behind each and a floor slab
// per storey, a spruce water tank on the spine's roof. Warm glowstone sits behind some upper panes. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034478.cells.json`, "utf8"));
const X = 7, Y = 29, Z = 26;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Roof tiers (block heights above y 0, exclusive top), smoothed from the lidar: the spine on the west lot line is 17,
// the south wing and the mid-lot wings are 15 and 12, the stepped middle 9 and the front 7 (two storeys). Lidar of 1
// or less is no building: a yard. 0 = nothing built.
const tierAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  const { roof } = cell.get(`${x},${z}`);
  if (roof <= 1) return 0;
  if (x === 1 && z >= 1) return 17;
  if (roof >= 17) return 17;
  if (roof >= 14) return 15;
  if (roof >= 11) return 12;
  if (roof >= 8) return 9;
  return 7;
};

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // outward; N = the 47th Street front
const inside = (x, y, z) => tierAt(x, z) > y;                    // a built block here, at this height
// Open air at (x, y, z): off the lot, a yard, or above the roof here. A yard's paving at y 0 is solid, not open.
const open = (x, y, z) => !(y === 0 && inFoot(x, z)) && tierAt(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};

const g = new Voxels([X, Y, Z]);

// 1. Massing: granite foundation from y 0 up to each cell's ground, a brick core to the tier, gravel on the roof.
// Yards are paved at y 0 so the open ground reads as a court.
for (const [x, z] of cells) {
  const top = tierAt(x, z), { ground } = cell.get(`${x},${z}`);
  if (!top) { g.set(x, 0, z, "smooth_stone"); continue; }
  for (let y = 0; y < ground; y++) g.set(x, y, z, "polished_granite");
  for (let y = ground; y < top; y++) g.set(x, y, z, y === top - 1 ? "gravel" : "bricks");
}

// 2. Faces, on every block with open air beside it. Base course at y 0 (ground-0 cells), a limestone floor band at each
// storey line (y 3, 6, 9, 12, 15), a smooth-stone cornice on each tier's top course, windows in the bays between brick
// piers every third block. The ground floor is a shopfront (glass between granite piers) with a door at the front's
// centre. Behind each window a one-block air pocket sits between floor slabs; some upper pockets hold glowstone.
const lit = (x, y, z) => y >= 4 && y % 3 === 1 && (x * 5 + y * 7 + z * 3) % 11 === 0;
for (const [x, z] of cells) {
  const top = tierAt(x, z);
  if (!top) continue;
  const { ground } = cell.get(`${x},${z}`);
  for (let y = ground; y < top; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;               // position along the face
    const ix = x - dx, iz = z - dz;           // one block in, behind the face
    const shopRow = y < 3;                    // the ground floor
    if (y === top - 1) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y % 3 === 0) {                         // storey line: a floor slab through the face and its pocket
      g.set(x, y, z, "smooth_stone");
      if (inside(ix, y, iz)) g.set(ix, y, iz, "smooth_stone");
      continue;
    }
    if (shopRow && x === 3 && z === 0 && d === "N") {   // the entrance
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      if (inside(ix, y, iz)) g.set(ix, y, iz, "air");
      continue;
    }
    if (u % 3 === 0) {                         // a brick pier, granite at the shopfront
      if (shopRow) g.set(x, y, z, "polished_granite");
      continue;
    }
    if (shopRow) g.set(x, y, z, "glass");
    else g.set(x, y, z, "glass_pane", d === "N" || d === "S"
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    if (inside(ix, y, iz)) g.set(ix, y, iz, lit(x, y, z) ? "glowstone" : "air");
  }
}

// The granite hood over the entrance, on the floor band above the door.
for (const x of [2, 3, 4]) g.set(x, 3, 0, "polished_granite");

// Roof equipment: a spruce water tank on the spine's roof, capped with a slab.
for (const z of [17, 18]) for (let y = 17; y < 20; y++) g.set(1, y, z, "spruce_planks");
for (const z of [17, 18]) g.set(1, 20, z, "spruce_slab", { type: "top", waterlogged: "false" });

const stats = g.save(`${DIR}/NYC1034478.nbt`);
console.log(`NYC1034478: ${stats.blocks} blocks, ${stats.palette} palette entries`);
