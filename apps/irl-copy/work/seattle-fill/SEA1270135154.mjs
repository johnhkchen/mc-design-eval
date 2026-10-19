// SEA1270135154 (Seattle Center, parcel SEA1985200550): a low glazed pavilion on an L-shaped footprint.
// Brief: continuous glass walls under a folded white roof with two skylight strips, white mullions every 3 blocks,
// a few solid white panels, a double entrance at the south-east corner, a stone plinth.
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

const ID = "SEA1270135154";
const MANIFEST = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json";
const LEFTOVERS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/leftovers.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/" + ID + ".nbt";

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const bld = manifest.buildings.find((b) => b.id === ID);
const left = JSON.parse(readFileSync(LEFTOVERS, "utf8")).find((b) => b.id === ID);
const [X0, Z0] = left.box;              // box is [x0, z0, x1, z1] = [240, 87, 259, 112]
const [W, D] = left.size;               // 20 x 26
const H = 14;                           // heightBlocks 8 + headroom for the folded roof

const fp = new Set(bld.footprint.map(([x, z]) => `${x - X0},${z - Z0}`));
const inFp = (x, z) => fp.has(`${x},${z}`);
const cells = [...fp].map((k) => k.split(",").map(Number));
if (cells.some(([x, z]) => x < 0 || x >= W || z < 0 || z >= D)) throw new Error("footprint outside box");

// exterior wall cells: a footprint cell with a 4-neighbour outside the footprint
const outsideN = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFp(x + dx, z + dz));
const isWall = (x, z) => inFp(x, z) && outsideN(x, z);
const isCorner = (x, z) => {
  const n = [inFp(x + 1, z), inFp(x - 1, z), inFp(x, z + 1), inFp(x, z - 1)].filter(Boolean).length;
  return isWall(x, z) && n <= 2 && !(inFp(x + 1, z) && inFp(x - 1, z)) && !(inFp(x, z + 1) && inFp(x, z - 1));
};

// the double entrance: two cells on the south face, near the south-east corner
const DOOR_Z = D - 1;
const DOOR_X = [W - 3, W - 2];          // x 17 and 18
const isDoor = (x, z) => z === DOOR_Z && DOOR_X.includes(x);

// a few solid white panels among the glazing
const isSolidPanel = (x, z) =>
  (x === 0 && (z === 21 || z === 22)) ||                       // west face of the lower wing
  (z === 18 && (x === 7 || x === 8)) ||                        // north face of the lower wing
  (x === W - 2 && (z === 3 || z === 4));                       // east face of the upper wing

// folded roof: two raised skylight ridges, each with white shoulders and a bevelled edge
// lower wing ridge runs east-west (x), upper wing ridge runs north-south (z)
const ridge = (x, z) => {
  const lower = z >= 18 && z <= D - 1;
  const upper = z <= 17 && x >= 11;
  if (lower) {
    const dx = Math.abs(x - 9.5);
    if (dx <= 0.5) return "glass";
    if (dx <= 1.5) return "white";
    if (dx <= 2.5) return "slab";
  }
  if (upper) {
    const dx = Math.abs(x - 14.5);
    if (dx <= 0.5) return "glass";
    if (dx <= 1.5) return "white";
    if (dx <= 2.5) return "slab";
  }
  return null;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => { if (inFp(x, z)) g.set(x, y, z, b, s); };

for (const [x, z] of cells) {
  const edge = isWall(x, z);
  // stone plinth: solid foundation y 0-1 under the whole footprint
  put(x, 0, z, "stone_bricks");
  put(x, 1, z, edge ? "polished_andesite" : "smooth_stone");

  if (edge) {
    // sill course, glazing band, eave fascia
    put(x, 2, z, "smooth_quartz");
    for (let y = 3; y <= 6; y++) {
      if (isSolidPanel(x, z)) put(x, y, z, "white_concrete");
      else if (isCorner(x, z) || (x + z) % 3 === 0) put(x, y, z, "white_concrete");   // mullion every 3 blocks
      else put(x, y, z, "glass");
    }
    put(x, 7, z, "smooth_quartz");
    // overhanging roof edge in quartz slab
    put(x, 8, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // interior cells: roof deck only
    put(x, 8, z, "white_concrete");
  }

  // raised folded roof bands and skylight strips
  const r = ridge(x, z);
  if (r === "glass") { put(x, 8, z, "white_concrete"); put(x, 9, z, "glass"); }
  else if (r === "white") put(x, 9, z, "white_concrete");
  else if (r === "slab") put(x, 9, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
}

// double entrance: iron doors (lower and upper halves) with a glass transom above
for (const x of DOOR_X) {
  const hinge = x === DOOR_X[0] ? "left" : "right";
  put(x, 1, DOOR_Z, "polished_andesite");
  g.set(x, 2, DOOR_Z, "iron_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 3, DOOR_Z, "iron_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
  for (let y = 4; y <= 6; y++) g.set(x, y, DOOR_Z, "glass");
  g.set(x, 7, DOOR_Z, "smooth_quartz");
}

g.save(OUT);
console.log(JSON.stringify({ id: ID, size: [W, H, D], blocks: g.count(), palette: g.palette.length, out: OUT }));
