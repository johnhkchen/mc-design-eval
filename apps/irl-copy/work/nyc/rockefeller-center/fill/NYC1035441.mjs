// 280 Park Avenue, the Bankers Trust Building: a 1962 commercial and office tower. The lidar reads a 111-block slab
// (about 123 m) across the middle of the 24 x 47 footprint (z 13..35), 56-block wings north (z 0..10) and south
// (z 36..46) with a 60-block shoulder at the south wing's west end, and a 117-block mechanical penthouse on the slab.
// Clean tiers, not lidar cells: the north wing and the south wing are flat, the two long faces step back at 96 in the
// upper tower, the 2-block court at z 11-12 stays open ground, and the lidar's holes in the north wing are filled.
// The notch in the west face at z 24-25 is the entrance: a lobby recess, a granite plinth, an iron door, a canopy and a
// hanging lantern. Shell: a granite plinth at the ground, a light-grey spandrel at the foot of every storey (3 blocks),
// quartz piers every third column, and glass panes in the bays between with a block of air behind them. Each storey has
// a floor slab (no interiors), the roof is gravel behind a quartz cap and a light-grey parapet. Warm glowstone sits
// behind some panes on the lower row of a storey. The 1962 curtain wall is grey-blue glass in light stone, so the tower
// reads as a flat, pale, mid-century slab with a bright crown.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035441.cells.json`, "utf8"));
const X = 24, Y = 123, Z = 47;

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFoot = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// Roof tier (block height above y 0) per footprint cell. 0 = open ground.
const topAt = (x, z) => {
  if (z <= 10) return 56;                                       // north wing, 18 storeys
  if (z === 11 || z === 12) return 0;                           // open court between the wing and the tower
  if (z >= 36) return x >= 4 && x <= 15 && z <= 38 ? 60 : 56;   // south wing, with a 60-block shoulder
  if (z === 35) return x <= 3 ? 56 : 111;                       // link to the wing, then the slab's south edge
  if (x >= 6 && x <= 17 && z >= 16 && z <= 31) return 117;      // mechanical penthouse
  if ((x === 0 || x === 23) && z >= 14 && z <= 33) return 96;   // upper-tower setback on the two long faces
  return 111;                                                   // the slab
};

// The entrance: a recess in the west face, open from the plaza up to the lintel at y 3.
const entrance = (x, y, z) => x === 0 && (z === 24 || z === 25) && y >= 1 && y < 3;
// Air for face purposes: outside the footprint, above a tier, or the recess. Plaza paving counts as air above y 0 only
// through the tier rule, so the plinth still shows where the building meets the court.
const openAt = (x, y, z) => !inFoot(x, z) || entrance(x, y, z) || y >= topAt(x, z);
const built = (x, y, z) => inFoot(x, z) && y >= groundAt(x, z) && y < topAt(x, z) && !entrance(x, y, z);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const facesOf = (x, y, z) => DIRS.filter(([dx, dz]) => openAt(x + dx, y, z + dz));

// Glass and iron bars connect along the face they sit in (the pane is a wall running along z on the W/E faces).
const along = ([dx]) => (dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 4 === 0;   // deterministic warm windows, about one lower pane in four

const g = new Voxels([X, Y, Z]);
const lamps = [];

// 1. Foundation, plaza paving, floor slabs, the roof deck, and the shell of every tier.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gr = groundAt(x, z), top = topAt(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (top === 0) { g.set(x, gr, z, "smooth_stone"); continue; }                 // the court's paving
  for (let y = gr; y < top; y++) {
    if (entrance(x, y, z)) continue;
    const faces = facesOf(x, y, z);
    if (y === top - 1) { g.set(x, y, z, faces.length ? "smooth_quartz" : "gravel"); continue; }   // cap or roof deck
    if (!faces.length) { if (y % 3 === 0 || y === gr) g.set(x, y, z, "light_gray_concrete"); continue; }  // slab
    if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }                // plinth
    if (top === 117) {                                                           // louvred penthouse
      if (faces.length > 1) { g.set(x, y, z, "smooth_quartz"); continue; }
      const u = faces[0][0] !== 0 ? z : x;
      g.set(x, y, z, u % 2 === 0 ? "iron_bars" : "light_gray_concrete", along(faces[0]));
      continue;
    }
    if (faces.length > 1) { g.set(x, y, z, "smooth_quartz"); continue; }         // corner pier
    if (y % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }         // storey spandrel
    const face = faces[0], u = face[0] !== 0 ? z : x;
    if (u % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }                // pier
    g.set(x, y, z, "gray_stained_glass_pane", along(face));
    if (y % 3 === 1 && lit(u, y, face[0] !== 0 ? 1 : 2)) lamps.push([x - face[0], y, z - face[1]]);
  }
  // A light-grey parapet on the edge of every roof but the penthouse.
  if (top !== 117 && facesOf(x, top - 1, z).length) g.set(x, top, z, "light_gray_concrete");
}

// 2. Warm light behind some panes, on the interior cell that sits on a floor slab.
for (const [x, y, z] of lamps) g.set(x, y, z, "glowstone");

// 3. The entrance: a canopy over the recess, a hanging lantern, an iron door in the lobby wall, and glass beside it.
for (const z of [24, 25]) g.set(0, 3, z, "smooth_quartz");
g.set(0, 2, 25, "lantern", { hanging: "true", waterlogged: "false" });
const door = { facing: "west", hinge: "left", open: "false", powered: "false" };
g.set(1, 1, 24, "iron_door", { ...door, half: "lower" });
g.set(1, 2, 24, "iron_door", { ...door, half: "upper" });

// 4. Rooftop: a small mast on the penthouse.
for (let y = 117; y <= 119; y++) g.set(11, y, 23, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const out = `${DIR}/NYC1035441.nbt`;
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
