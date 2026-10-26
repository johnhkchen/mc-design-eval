// 1333 New Hampshire Ave NW (Commercial-Office-Large), a 1960s-70s Modernist office block in pale stone and glass.
// Plinth + shopfront ground storey, a 2-block storey rhythm of spandrel and glass band, a 17-high wing
// and a 20-high core tower set back from the wing's edge, cornice courses, a lintelled entrance, and an
// air gap behind every glass band so lanterns read as lit offices from the street.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65325.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65325.nbt";

const key = (x, z) => `${x},${z}`;
const foot = new Map();                                   // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) foot.set(key(x, z), { ground, roof });
const has = (x, z) => foot.has(key(x, z));

// Lidar roof snapped to two clean tiers: 17-18 = wing, 19-20 = core.
const tierTop = new Map();
for (const [k, c] of foot) tierTop.set(k, c.roof >= 19 ? 20 : 17);

// Tower = core cells whose four neighbours are also core (one-cell inset from the wing), so the setback is clean.
const isTower = (x, z) => has(x, z) && tierTop.get(key(x, z)) === 20 &&
  [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => tierTop.get(key(x + dx, z + dz)) === 20);
const topOf = (x, z) => (isTower(x, z) ? 20 : has(x, z) ? 17 : 0);

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a wall at height y: the cell's side faces outdoors, or its neighbour stands no higher than y
const exposed = (x, z, y) => NB.filter(([dx, dz]) => !has(x + dx, z + dz) || topOf(x + dx, z + dz) <= y);
const isWall = (x, z, y) => exposed(x, z, y).length > 0;

// Front = the south face (z+1 outdoors); the entrance takes the two cells nearest the middle of that face.
const cx = 14;
const southFace = cells.filter(([x, z]) => !has(x, z + 1) && x >= 6 && x <= 22).sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
const doorCells = new Set(southFace.slice(0, 2).map(([x, z]) => key(x, z)));

const g = new Voxels([29, 32, 24]);
const FLOORS = new Set([1, 4, 6, 8, 10, 12, 14, 16, 17]);     // slabs; the air sits between each floor and its glass band

const wallBlock = (x, z, y, top) => {
  if (y === top - 1) return "quartz_block";                  // cornice course on every wall
  if (y === 1) return "stone_bricks";                        // plinth / base course
  if (y === 3) return "smooth_stone";                        // shopfront header
  if (y === 2) return (x + z) % 3 === 0 ? "stone_bricks" : "light_blue_stained_glass";  // shopfront glass
  if (top === 20 && y === 17) return "light_gray_concrete";  // tower spandrel above the wing
  if (top === 20 && y === 18) return (x + z) % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";
  if (y % 2 === 0) return "light_gray_concrete";             // spandrel: slab edge
  return (x + z) % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";  // window band with mullion
};

for (const [k, c] of foot) {
  const [x, z] = k.split(",").map(Number);
  const top = topOf(x, z);
  g.set(x, 0, z, "stone_bricks");                            // foundation from y 0 to the ground
  for (let y = 1; y < top; y++) {
    const wall = isWall(x, z, y);
    if (!wall) {
      if (y === top - 1 || FLOORS.has(y)) g.set(x, y, z, "smooth_stone");   // floor slab / roof deck
      continue;
    }
    if (y <= 3 && doorCells.has(k) && (y === 2 || y === 3)) {
      g.set(x, y, z, "oak_door", { facing: "south", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === 4 && doorCells.has(k)) { g.set(x, y, z, "smooth_stone"); continue; }   // lintel over the entrance
    g.set(x, y, z, wallBlock(x, z, y, top));
  }
}

// Roof plant on the tower: a 5 x 3 plant room with a louvred top, standing on the tower's roof deck.
for (let x = 12; x <= 16; x++) for (let z = 9; z <= 11; z++) {
  if (!isTower(x, z)) continue;
  g.set(x, 20, z, "light_gray_concrete");
  g.set(x, 21, z, x % 2 === 0 ? "iron_bars" : "smooth_stone");
}

// Warm offices: lanterns in the air gap behind a few glass bands, on the floor slab below.
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  const top = topOf(x, z);
  for (const y of [5, 9, 13]) {
    if (y >= top - 1 || !isWall(x, z, y)) continue;
    if (((x * 5 + z * 7 + y) % 9) !== 0) continue;
    const out = exposed(x, z, y)[0];
    if (!out) continue;
    const ix = x - out[0], iz = z - out[1];
    if (!has(ix, iz) || isWall(ix, iz, y) || topOf(ix, iz) <= y) continue;
    g.set(ix, y, iz, "lantern", { hanging: "false" });
  }
}

const stats = g.save(OUT);
console.log(JSON.stringify({ file: OUT, ...stats, doorCells: [...doorCells] }));
