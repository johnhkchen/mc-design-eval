// Quay Buildings, Auckland waterfront: a 1920s-30s reinforced-concrete commercial block faced in red brick, with a
// polished-andesite base, cream quartz trims and a shopfront at street level. Lidar roofs (6-27 above y 0, flat ground)
// are quantized into four clean tiers: 3-storey wings/podium, 5-storey wing, 6-storey body, 7-storey setback core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1055210263.cells.json", "utf8"));
const g = new Voxels([32, 40, 36]);

const tier = (r) => (r <= 12 ? 12 : r <= 21 ? 20 : r <= 25.5 ? 24 : 28);   // storey tops, multiples of 4
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// lidar noise: each cell's roof is the mean over its footprint neighbourhood (3 x 3), then tiered, so the core is one mass
const RAW = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const H = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = RAW.get(`${x + dx},${z + dz}`); if (r !== undefined) { s += r; n++; }
  }
  H.set(`${x},${z}`, tier(s / n));
}
const hAt = (x, z) => H.get(`${x},${z}`) ?? -1;                         // -1 = off the footprint
// the faces of cell (x, z) at height y that are open to air: off-footprint, or the neighbour's roof is already below y
const outsAt = (x, z, y) => DIRS.filter(([dx, dz]) => hAt(x + dx, z + dz) <= y);

// the front (z = 35) entrance: the door sits in the middle pier of the shopfront, lantern under the lintel
const DOOR = { x: 21, z: 35 };

function paneState(xFace) {
  // a pane runs along the face: it joins its neighbours along that face, not across it
  return xFace
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
}

function wall(x, y, z, outs, h) {
  const xo = outs.some(([dx]) => dx !== 0), zo = outs.some(([, dz]) => dz !== 0);
  const k = y >> 2, r = y & 3;                              // storey index, row within the storey
  // a true corner (both neighbours off the footprint) gets a quoin; a diagonal run of steps reads as its x-faces
  const ox = (outs.find(([dx]) => dx) || [0])[0], oz = (outs.find(([, dz]) => dz) || [0, 0])[1];
  if (xo && zo && hAt(x + ox, z) < 0 && hAt(x, z + oz) < 0) return g.set(x, y, z, "quartz_block");
  const xFace = xo, along = xFace ? z : x;
  const pier = along % 3 === 0;                              // a pier every third cell; two bays of glass between
  if (r === 3) return g.set(x, y, z, "stone_bricks");        // lintel under the storey's glass
  if (k === 0) {                                             // shopfront: plate glass between polished piers
    if (pier) return g.set(x, y, z, "polished_andesite");
    return g.set(x, y, z, "glass");
  }
  if (pier) return g.set(x, y, z, "bricks");
  g.set(x, y, z, "glass_pane", paneState(xFace));
  // warm light behind some panes: one row of glowstone just inside, on a diagonal rhythm so it is not every window
  if (r === 1 && ((Math.floor(along / 3) + k) % 3 === 0)) {
    const xi = xFace ? x - ox : x, zi = xFace ? z : z - oz;
    if (hAt(xi, zi) > y && g.val(xi, y, zi) === 0) g.set(xi, y, zi, "glowstone");
  }
}

for (const [x, z, ground, roof] of cells) {
  const h = H.get(`${x},${z}`);
  for (let y = 0; y < h; y++) {
    const outs = outsAt(x, z, y);
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }      // foundation, if the ground were lower
    if (y === 0) { g.set(x, y, z, outs.length ? "polished_andesite" : "smooth_stone"); continue; }
    if (y % 4 === 0 && y <= h - 2) {                                    // a floor slab per storey, across the footprint
      g.set(x, y, z, outs.length ? "quartz_block" : "smooth_stone");     // exposed edge = cream string course
      continue;
    }
    if (y === h - 1 && outs.length === 0) { g.set(x, y, z, "stone_bricks"); continue; }   // roof deck
    if (outs.length) wall(x, y, z, outs, h);
    // else: an air gap between the floors
  }
}

// parapets on the outer edge, and roof plant on the interior of the body and core
for (const [x, z] of [...H.keys()].map((k) => k.split(",").map(Number))) {
  const h = hAt(x, z);
  const outer = DIRS.some(([dx, dz]) => hAt(x + dx, z + dz) < 0);
  if (outer) {
    g.set(x, h, z, "bricks");
    g.set(x, h + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }
  const interior = DIRS.every(([dx, dz]) => hAt(x + dx, z + dz) >= h);
  if (h >= 24 && interior && x % 5 === 2 && z % 5 === 2) g.set(x, h, z, "iron_block");   // roof plant, sparse
}

// the front entrance: two door halves, and a lantern hanging from the storey line above
g.set(DOOR.x, 1, DOOR.z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR.x, 2, DOOR.z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(DOOR.x, 3, DOOR.z, "lantern", { hanging: "true", waterlogged: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1055210263.nbt";
console.log(g.save(out));
