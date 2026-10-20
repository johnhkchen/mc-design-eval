import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, footprint 6 x 8, roof about 11 blocks above the lowest ground (lidar).
// Reading: a two-storey low-rise commercial block of the 1960s-80s Taipei type, with a
// stone-brick plinth, white concrete piers and pale tiled bands, a shopfront at street level
// (north face), punched windows above, a plain parapet, and a couple of rooftop AC plant boxes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1454365473";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 23, D = 8;
const g = new Voxels([W, H, D]);

const ROOF = 11;      // roof surface, blocks above lowest ground
const FLOOR2 = 5;     // second-storey floor line (ground storey is 5 blocks)

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(key(x, z), gy);
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// exposed sides: n = -z (street side), s = +z, w = -x, e = +x
const side = (x, z) => ({
  n: !has(x, z - 1), s: !has(x, z + 1),
  w: !has(x - 1, z), e: !has(x + 1, z),
});
const isExt = (x, z) => { const s = side(x, z); return s.n || s.s || s.w || s.e; };

const uOf = (x, z, face) => (face === "n" || face === "s") ? x - minX : z - minZ;
const uMax = face => (face === "n" || face === "s") ? maxX - minX : maxZ - minZ;
const isBay = (u, um) => u > 0 && u < um && u % 2 === 1;

const GLASS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };

// Door: front (north) face, bay nearest the middle, only where the ground storey can hold it.
let doorKey = null;
{
  const um = uMax("n");
  let best = Infinity;
  for (const [x, z, gy] of cells) {
    if (!side(x, z).n || gy > 1) continue;
    const u = uOf(x, z, "n");
    if (!isBay(u, um)) continue;
    const d = Math.abs(u - um / 2);
    if (d < best) { best = d; doorKey = key(x, z); }
  }
}

// Wall spec for an exterior cell at height y.
function wallSpec(y, gd, bay, pier) {
  if (y === gd) return ["stone_bricks"];                       // plinth course
  if (y < 4) return bay && !pier ? ["glass_pane", GLASS] : ["white_concrete"];
  if (y === 4) return ["smooth_stone"];                        // ground storey lintel
  if (y === FLOOR2) return ["smooth_stone"];                   // storey line
  if (y <= 8) return bay && !pier ? ["glass_pane", GLASS] : ["white_concrete"];
  if (y === 9) return ["smooth_stone"];                        // upper lintel band
  return ["white_concrete"];                                   // top course under roof
}

for (const [x, z, gd] of cells) {
  const s = side(x, z);
  const faces = ["n", "s", "w", "e"].filter(f => s[f]);
  const roofY = Math.max(ROOF, gd);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gd; y++) put(x, y, z, "stone_bricks");

  if (faces.length === 0) {
    // Interior cell: floor slabs only, air above (no interiors).
    put(x, gd, z, "smooth_stone");
    if (gd < FLOOR2) put(x, FLOOR2, z, "smooth_stone");
    put(x, roofY, z, "smooth_stone");
    continue;
  }

  const pier = faces.length > 1;           // corner cell: full-height pier
  const face = faces[0];
  const bay = !pier && isBay(uOf(x, z, face), uMax(face));
  const isDoor = key(x, z) === doorKey;

  for (let y = gd; y < roofY; y++) {
    if (isDoor && (y === gd + 1 || y === gd + 2)) {
      const half = y === gd + 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
    } else if (isDoor && y === gd + 3 && y < 4) {
      put(x, y, z, "glass_pane", GLASS);  // transom over the door
    } else {
      const [id, props] = wallSpec(y, gd, bay, pier);
      put(x, y, z, id, props);
    }
  }

  // Warm light: glowstone on the upper floor just inside some lit bays.
  if (!pier && bay && !isDoor && (x + z) % 2 === 0 && gd <= 5) {
    const inward = { n: [x, z + 1], s: [x, z - 1], w: [x + 1, z], e: [x - 1, z] }[face];
    const [ix, iz] = inward;
    if (has(ix, iz) && !isExt(ix, iz)) put(ix, 6, iz, "glowstone");
  }

  // Roof slab and plain parapet on the exterior ring.
  put(x, roofY, z, "smooth_stone");
  put(x, roofY + 1, z, "stone_brick_slab", SLAB_BOTTOM);
}

// Rooftop AC plant on two interior cells.
for (const [x, z] of [[minX + 1, minZ + 1], [maxX - 1, maxZ - 1]]) {
  if (!has(x, z) || isExt(x, z)) continue;
  const roofY = Math.max(ROOF, gnd(x, z));
  put(x, roofY + 1, z, "stone_bricks");
  put(x, roofY + 2, z, "stone_brick_slab", SLAB_BOTTOM);
}

g.save(`${DIR}/${ID}.nbt`);
