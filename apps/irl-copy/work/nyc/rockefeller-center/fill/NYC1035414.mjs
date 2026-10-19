// 11 East 47th Street (1930, commercial & office): a 6 x 26 loft block, seven storeys on a granite base.
// Brick piers, glass bays, limestone string courses and quoins, a black shopfront with a lobby door on the
// west face, a stepped low wing at the north end and a two-storey penthouse on the NE corner (lidar 22).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035414.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 6, Z = 26, H = 34;

// Smoothed roof map: the lidar wobbles 19..21 over the body, so it becomes one flat tier of 20; the north
// two rows are the empty forecourt (lidar 0); the north edge steps down into wings 16 (x1..4) and 10 (x5);
// the 22 cells at x4..5, z18..20 are the penthouse. The lidar's lone 0s inside the body are filled.
const R = Array.from({ length: X }, () => Array(Z).fill(0));
const lidar = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (z < 2) R[x][z] = 0;
  else if (z === 2) R[x][z] = x === 0 ? 20 : x === 5 ? 10 : 16;
  else if (x >= 4 && z >= 18 && z <= 20 && (lidar.get(`${x},${z}`) ?? 0) >= 21) R[x][z] = 22;
  else R[x][z] = 20;
}

// Outside the footprint, or a neighbour whose roof is at or below this height, counts as open air.
const at = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : R[x][z]);
const open = (x, z, y) => at(x, z) <= y;
const faces = (x, z, y) => ({ w: open(x - 1, z, y), e: open(x + 1, z, y), n: open(x, z - 1, y), s: open(x, z + 1, y) });

const PLINTH = "polished_granite", STONE = "stone", DECK = "smooth_stone", LIMESTONE = "calcite";
const BRICK = "bricks", SHOP = "polished_blackstone", GLASS = "glass_pane", GLOW = "glowstone";
const FLOORS = new Set([4, 7, 10, 13, 16, 19]);          // storey lines: slab inside, limestone band outside
const SHOP_ROWS = [1, 2, 3];                              // ground floor shopfront

const g = new Voxels([X, H, Z]);
const paneState = (f) => (f.w || f.e
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const isDoor = (x, z, y) => x === 0 && (z === 12 || z === 13) && y <= 2;

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const top = at(x, z);
  for (let y = 0; y < top; y++) {
    const f = faces(x, z, y);
    const ext = f.w || f.e || f.n || f.s;
    const corner = (f.w || f.e) && (f.n || f.s);
    // Along the face the cell is on: z for the long west/east walls, x for the short north/south ends.
    const along = f.w || f.e ? z : x;
    const pier = along % 3 === 2;

    if (y === 0) { g.set(x, y, z, PLINTH); continue; }
    if (y === top - 1) { g.set(x, y, z, ext ? LIMESTONE : DECK); continue; }           // cornice / roof deck
    if (FLOORS.has(y)) { g.set(x, y, z, ext ? LIMESTONE : STONE); continue; }          // string course / slab
    if (!ext) continue;                                                                  // interior air behind the glass

    if (SHOP_ROWS.includes(y)) {
      if (corner || pier) g.set(x, y, z, SHOP);
      else if (isDoor(x, z, y)) {
        const hinge = z === 12 ? "left" : "right";
        g.set(x, y, z, "iron_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge, open: "false", powered: "false" });
      } else if (y === 3 && (z === 12 || z === 13)) g.set(x, y, z, SHOP);              // lintel over the door
      else g.set(x, y, z, GLASS, paneState(f));
      continue;
    }
    // Upper storeys: window rows between the storey lines (and the penthouse).
    if (corner) g.set(x, y, z, LIMESTONE);
    else if (pier) g.set(x, y, z, BRICK);
    else g.set(x, y, z, GLASS, paneState(f));
  }
}

// Warm light: glowstone on the storey slab behind some west-wall glass, and lanterns under the lobby lintel.
for (const y of [5, 8, 11, 14, 17]) for (let z = 0; z < Z; z++) {
  if (z % 3 !== 1 || at(1, z) <= y || at(0, z) <= y) continue;
  if ((z * 5 + y) % 3 === 0) g.set(1, y, z, GLOW);
}
g.set(1, 3, 12, "lantern", { hanging: "true", waterlogged: "false" });
g.set(1, 3, 13, "lantern", { hanging: "true", waterlogged: "false" });

// Roof: a 2 x 2 plant box and a brick flue on the deck, with a limestone cap.
for (const [x, z] of [[1, 9], [2, 9], [1, 10], [2, 10]]) for (const y of [20, 21]) g.set(x, y, z, DECK);
for (let y = 20; y <= 22; y++) g.set(2, y, 16, BRICK);
g.set(2, 23, 16, LIMESTONE);

const out = `${DIR}/NYC1035414.nbt`;
const stats = g.save(out);
console.log(`wrote ${out}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
