// 39 West 44th Street, N.Y. Yacht Club (1900), an NYC individual landmark: a Beaux-Arts commercial and office palazzo,
// the typical Midtown club-and-office building of its decade. Footprint 21 x 11 (x across the front, low z = north = the
// 44th Street frontage). Lidar roof is read as clean tiers, not followed cell by cell: a 13-block (about 4 storey) front
// range on the street, a 9-block lower wing toward the east, a 27-block band behind it and a 30-block (about 10 storey)
// rear mass that the lidar shows at the south and south-east. Base: a limestone (calcite) ground storey with a shopfront
// and a centred entrance under a dark awning. Upper storeys: red brick piers between paired windows, limestone string
// courses at every storey line, a limestone cornice and a brick parapet with a limestone cap. Glass panes sit on the
// outer skin with air behind them (a one-block gap) and a floor course solid in each storey, so there are no interiors.
// Some panes have glowstone behind them. The 30-block roof carries a glazed penthouse, the 27-block roof two units.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034221.cells.json`, "utf8"));
const X = 21, Z = 11, Y = 34;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
// The lidar reads 0 at (16, 8) inside the rear mass: a gap in the scan, so it is built like its neighbours.
const LIDAR_GAP = new Set(["16,8"]);
const built = (x, z) => inFoot(x, z) && (cell.get(`${x},${z}`).roof > 0 || LIDAR_GAP.has(`${x},${z}`));
const ground = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).ground : 0);

// Tier tops (block heights above y 0): the massing the lidar supports, with the steps made clean.
const tier = (x, z) => {
  if (z <= 2) {
    if (x <= 8) return 13;                 // front range on 44th Street
    if (x <= 14) return z === 0 ? 9 : 13;  // street wall steps back at its north edge
    return 9;                              // lower east wing, x 15..18
  }
  if (z <= 5) {
    if (x <= 14) return 27;                // band behind the front
    if (x === 15) return 13;
    return x <= 18 ? 11 : 10;              // east flank
  }
  if (x <= 15 || z >= 8 || (x >= 19 && z >= 7)) return 30;   // rear mass and its south-east tower
  return 11;                               // south-east shoulder, x 16..18 z 6..7 and x 19..20 z 6
};
const top = (x, z) => (built(x, z) ? tier(x, z) : 0);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// Which outward faces are exposed at height y: outside the footprint, unbuilt, or the neighbour's roof is at or below y.
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return top(x + dx, z + dz) <= y; });

const GLASS_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };  // pane on a face along x
const GLASS_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // pane on a face along z
const glassFor = (d) => (d === "N" || d === "S" ? GLASS_NS : GLASS_EW);
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
const columns = [...cell.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => built(x, z));
const windows = [];

// 1. The mass and its skin, column by column. Every column is solid from its foundation to its tier top, so nothing
// floats and every storey and setback stands on what is below.
for (const [x, z] of columns) {
  const H = tier(x, z), G = ground(x, z);
  for (let y = 0; y < H; y++) {
    if (y < G) { g.set(x, y, z, "stone_bricks"); continue; }                  // foundation under the slope
    const ex = exposed(x, z, y);
    if (y === H - 1) { g.set(x, y, z, ex.length ? "calcite" : "gray_concrete"); continue; }  // cap or roof covering
    if (!ex.length) { g.set(x, y, z, "bricks"); continue; }                   // solid core
    const d = ex[0];
    const pier = ((d === "N" || d === "S") ? x : z) % 3 === 0;                // brick piers every third cell
    if (ex.length >= 2) { g.set(x, y, z, "calcite"); continue; }              // quoins at the corners
    if (y === H - 4) { g.set(x, y, z, "calcite"); continue; }                 // cornice
    if (y > H - 4) { g.set(x, y, z, "bricks"); continue; }                    // parapet
    if (y < 5) {                                                              // ground storey: limestone base
      if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }
      if (y === 4 || pier) { g.set(x, y, z, "calcite"); continue; }
      g.set(x, y, z, "glass_pane", glassFor(d)); windows.push({ x, y, z, d }); continue;
    }
    const course = (y - 5) % 3 === 0;                                         // storey line
    if (course) { g.set(x, y, z, "calcite"); continue; }
    if (pier) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "glass_pane", glassFor(d)); windows.push({ x, y, z, d });
  }
}

// 2. Air behind the glass: the cell just inside each pane is open (a one-block gap), with glowstone behind some panes.
for (const { x, y, z, d } of windows) {
  const [dx, dz] = DIRS[d];
  const ix = x - dx, iz = z - dz;
  if (!built(ix, iz) || y < ground(ix, iz) || y >= tier(ix, iz) - 1) continue;
  if (lit(d === "N" || d === "S" ? x : z, y, "NSEW".indexOf(d))) g.set(ix, y, iz, "glowstone");
  else g.set(ix, y, iz, "air");
}

// 3. The entrance: a centred door at x 4 under a dark awning, with a glass transom and limestone jambs.
g.set(3, 1, 0, "calcite"); g.set(3, 2, 0, "calcite"); g.set(3, 3, 0, "calcite");
g.set(5, 1, 0, "calcite"); g.set(5, 2, 0, "calcite"); g.set(5, 3, 0, "calcite");
g.set(4, 1, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(4, 2, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(4, 3, 0, "glass_pane", GLASS_NS);
for (let x = 3; x <= 5; x++) g.set(x, 4, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });
g.set(4, 1, 1, "air"); g.set(4, 2, 1, "air");                                 // the vestibule behind the door

// 4. Roof of the rear mass: a glazed penthouse, 4 x 3, on a limestone floor, a ring of glass with air inside, a cap.
// Its floor sits on the 30-block roof at y 30; the cap closes it at y 32.
const PEN = { x0: 6, x1: 9, z0: 7, z1: 9 };
for (let x = PEN.x0; x <= PEN.x1; x++) for (let z = PEN.z0; z <= PEN.z1; z++) {
  g.set(x, 30, z, "calcite");
  g.set(x, 32, z, "calcite");
  const edge = x === PEN.x0 || x === PEN.x1 || z === PEN.z0 || z === PEN.z1;
  const corner = (x === PEN.x0 || x === PEN.x1) && (z === PEN.z0 || z === PEN.z1);
  if (!edge) { g.set(x, 31, z, "air"); continue; }
  if (corner) g.set(x, 31, z, "calcite");
  else g.set(x, 31, z, "glass_pane", z === PEN.z0 || z === PEN.z1 ? GLASS_NS : GLASS_EW);
}
g.set(7, 31, 8, "glowstone");

// 5. Roof equipment: two air-handling units on the 27-block roof, one on the front range, one on the east wing.
g.set(3, 27, 4, "iron_block"); g.set(4, 27, 4, "iron_block"); g.set(3, 28, 4, "iron_block");
g.set(7, 13, 1, "iron_block"); g.set(8, 13, 1, "iron_block");

g.save(`${DIR}/NYC1034221.nbt`);
console.log(`NYC1034221: ${g.count()} blocks, palette ${g.palette.length}, size ${g.size.join("x")}`);
