// Way 912170826: a two-storey brick commercial block with a shopfront, a stone string course and a parapet, the
// Edwardian shop-and-flat type that lines the old streets of the Auckland CBD and Karangahape Road. Lidar gives a
// flat roof at 10 blocks on every cell, so the tiers are fixed to that: base 0, shopfront 0-3, storey line 4,
// upper storey 5-7 (windows between calcite sill and lintel), roof deck 8, parapet 8-10.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170826.cells.json", "utf8"));
if (!cells.every(([, , g, r]) => g === 0 && r === 10)) throw new Error("tiers are built for ground 0, roof 10");

const H = 10;
const key = (x, z) => `${x},${z}`;
const fp = new Set(cells.map(([x, z]) => key(x, z)));
const inFp = (x, z) => fp.has(key(x, z));
// a cell is on the wall when one of its four sides is open to the outside
const faces = (x, z) => ({ N: !inFp(x, z - 1), S: !inFp(x, z + 1), W: !inFp(x - 1, z), E: !inFp(x + 1, z) });
const perim = (x, z) => { const f = faces(x, z); return f.N || f.S || f.W || f.E; };
const corner = (f) => (f.N || f.S) && (f.W || f.E);
// what stands in a cell at height y, for the glass-pane connections: walls and the floor slabs
const solid = (x, y, z) => inFp(x, z) && (perim(x, z) || y === 0 || y === 4 || y === H - 2);

// the entrance: the north face on the street side, middle of the frontage
const DOOR = [5, 1];

const g = new Voxels([7, 23, 8]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

function pane(x, y, z, f) {
  const alongX = f.N || f.S;
  const [a, b] = alongX ? [[x - 1, z], [x + 1, z]] : [[x, z - 1], [x, z + 1]];
  const link = (c) => (c && solid(c[0], y, c[1]) ? "true" : "false");
  const s = alongX
    ? { north: "false", south: "false", east: link(b), west: link(a) }
    : { north: link(a), south: link(b), east: "false", west: "false" };
  return { ...s, waterlogged: "false" };
}

// the wall face of a cell: its window rhythm runs along the frontage (x on north/south faces, z on east/west)
const coordOf = (f, x, z) => (f.N || f.S ? x : z);

// 1. floors and roof deck, then the walls on the outer cells
for (const [x, z] of cells) {
  put(x, 0, z, "stone_bricks");
  if (!perim(x, z)) {
    put(x, 4, z, "oak_planks");
    put(x, H - 2, z, "smooth_stone");
  }
}

for (const [x, z] of cells) {
  if (!perim(x, z)) continue;
  const f = faces(x, z);
  const q = corner(f);
  const c = coordOf(f, x, z);
  const isDoor = x === DOOR[0] && z === DOOR[1];

  // shopfront: stone piers at the corners, glass with dark oak mullions, the door, and a timber fascia at 3
  for (const y of [1, 2]) {
    if (q) put(x, y, z, "stone_bricks");
    else if (isDoor) put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else if (c % 2 === 0) put(x, y, z, "glass_pane", pane(x, y, z, f));
    else put(x, y, z, "dark_oak_planks");
  }
  put(x, 3, z, q ? "stone_bricks" : isDoor ? "calcite" : "dark_oak_planks");
  // storey line
  put(x, 4, z, "calcite");
  // upper storey: 2-high windows between sill and lintel, brick piers between and at the corners
  for (const y of [5, 6]) {
    if (!q && c % 2 === 0) put(x, y, z, "glass_pane", pane(x, y, z, f));
    else put(x, y, z, "bricks");
  }
  put(x, 7, z, "calcite");
  // parapet with a cornice cap
  put(x, H - 2, z, "bricks");
  put(x, H - 1, z, "bricks");
  put(x, H, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// 2. warm light in some windows: a lantern on the floor of the room behind the glass (the inner cell)
const innerOf = (x, z, f) => {
  if (f.N) return [x, z + 1];
  if (f.S) return [x, z - 1];
  if (f.W) return [x + 1, z];
  return [x - 1, z];
};
const isInterior = (x, z) => inFp(x, z) && !perim(x, z);
for (const [x, z] of cells) {
  if (!perim(x, z)) continue;
  const f = faces(x, z);
  const c = coordOf(f, x, z);
  // a window cell (not a corner pier, not the door), and only some of them lit
  if (corner(f) || c % 2 !== 0 || (x === DOOR[0] && z === DOOR[1]) || (x + z) % 3 !== 0) continue;
  const [ix, iz] = innerOf(x, z, f);
  if (!isInterior(ix, iz)) continue;
  put(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  put(ix, 5, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// 3. roof plant room on the deck: a 2x2 block of interior cells, up to the parapet top
let plant = null;
for (const [x, z] of cells) {
  if ([[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => isInterior(a, b))) { plant = [x, z]; break; }
}
if (plant) {
  const [px, pz] = plant;
  for (const [a, b] of [[px, pz], [px + 1, pz], [px, pz + 1], [px + 1, pz + 1]]) {
    put(a, H - 1, b, "stone_bricks");
    put(a, H, b, "stone_bricks");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170826.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
