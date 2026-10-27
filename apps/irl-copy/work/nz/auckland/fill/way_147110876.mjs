// Shortland Street Carpark, Auckland (way 147110876): a 1970s reinforced-concrete multi-storey car park. Six decks on a
// stone plinth at the lowest ground, with 4-block storey lines (a slab, two open-deck bays, a spandrel). Lidar roofs are
// snapped to the storey grid: most of the footprint is the six-deck roof at y 24 (a 26 top), the lift and stair cores
// stand a deck higher (28, 32), and the lower NE wing and the low SW ramp step down. The street-side ground floor is a
// glazed shopfront with a door on the west face; the deck openings are iron-bar screens, the cores are glazed. Storey
// lines are global (multiples of 4) so every floor stands on the one below; the plinth runs up to the first storey line
// above each cell's ground so nothing hangs over a slope. Interiors are air with a floor slab per storey, lit by glowstone
// just behind some panes and lanterns on the roof deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110876.cells.json", "utf8"));
const W = 68, D = 59, H = 48;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// median of the 3x3 lidar roofs (noise out), then a storey line for each tier
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = (r) => (r >= 33 ? 32 : r >= 28 ? 28 : r >= 24 ? 24 : r >= 18 ? 20 : r >= 12 ? 16 : 8);
// the first storey line at or above a cell's ground: the plinth runs up to it
const plinthTop = (x, z) => 4 * Math.ceil(G[x][z] / 4);
const T = Array.from({ length: W }, () => Array(D).fill(0));    // roof slab y of each cell (a multiple of 4)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) T[x][z] = Math.max(tier(median(x, z)), plinthTop(x, z) + 4);

// faces of a cell exposed at height y: outside the footprint, or beside a neighbour whose roof is below y
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !inside(x + dx, z + dz) || T[x + dx][z + dz] < y);
const paneState = (dz) => (dz !== 0                                  // a face running along x: panes join east-west
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the entrance: the middle of the west edge's street-level run (the lowest ground)
const westStreet = [];
for (let z = 0; z < D; z++) if (inside(0, z) && G[0][z] <= 2) westStreet.push(z);
const doorZ = westStreet.length ? westStreet[westStreet.length >> 1] : -1;
const STREET = (x, z) => G[x][z] <= 4;                 // the low side: shopfronts on its ground storey

const v = new Voxels([W, H, D]);
const glowAt = [];                                     // lights just inside a glazed bay, placed after the shell
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const fb = plinthTop(x, z), t = T[x][z];
  // foundation and plinth: solid up to the first storey line
  // the plinth's exposed faces get the same piers as the decks above, so the base is not one dark mass
  for (let y = 0; y < fb; y++) {
    const ext = exposed(x, z, y);
    const along = ext.length ? (ext[0][1] !== 0 ? z : x) : 0;
    v.set(x, y, z, ext.length && along % 4 === 0 ? "polished_andesite" : "stone_bricks");
  }
  for (let y = fb; y < t; y++) {
    const ext = exposed(x, z, y), k = y % 4;
    if (k === 0) { v.set(x, y, z, ext.length ? "smooth_stone" : "light_gray_concrete"); continue; }   // storey line / floor slab
    if (!ext.length) continue;                         // interior air
    if (ext.length > 1) { v.set(x, y, z, "white_concrete"); continue; }   // corner column
    const [, dx2, dz2] = ext[0];
    const along = dz2 !== 0 ? x : z;                   // position along the face
    if (k === 3) { v.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel
    if (x === 0 && z === doorZ && (y === fb + 1 || y === fb + 2)) {     // the entrance door, lower and upper halves
      v.set(x, y, z, "iron_door", { facing: "east", half: y === fb + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (along % 4 === 0) { v.set(x, y, z, "white_concrete"); continue; }   // a pier every 4 blocks: the frame
    const glazed = t >= 28 || (STREET(x, z) && y < fb + 4);
    v.set(x, y, z, glazed ? "glass_pane" : "iron_bars", paneState(dz2));
    if (glazed && k === 1 && along % 3 === 1) {        // a warm light just behind the pane, on the floor slab
      const ix = x - dx2, iz = z - dz2;
      if (inside(ix, iz) && !exposed(ix, iz, y).length) glowAt.push([ix, y, iz]);
    }
  }
  // roof deck, with a coping on the rim (a rim is any edge where the cell stands above the ground or a lower roof)
  const rim = exposed(x, z, t).length > 0;
  v.set(x, t, z, rim ? "smooth_stone" : "light_gray_concrete");
  if (rim) v.set(x, t + 1, z, "smooth_stone");
}
for (const [x, y, z] of glowAt) if (!v.val(x, y, z)) v.set(x, y, z, "glowstone");
// lanterns on the open roof deck of the six-deck tier, on a 8-block grid
for (let x = 4; x < W; x += 8) for (let z = 4; z < D; z += 8) {
  if (!inside(x, z) || T[x][z] !== 24 || exposed(x, z, 24).length) continue;
  v.set(x, 25, z, "lantern", { hanging: "false", waterlogged: "false" });
}

console.log(v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110876.nbt"));
