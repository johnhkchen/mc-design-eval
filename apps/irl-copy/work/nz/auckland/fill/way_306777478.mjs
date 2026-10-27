// way 306777478: a four-storey 1960s-70s reinforced-concrete block (white concrete panels, light-grey bands, tinted glazing),
// stepped down on its east edge to a three-storey wing, with a shopfront ground floor and a plant room on the roof.
// Solid from y 0 up to each cell's top, so every block stands on the block below it; the glazing sits in the outer skin.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_306777478.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_306777478.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const [W, H, D] = [32, 30, 67];
const g = new Voxels([W, H, D]);

// footprint: "x,z" -> { ground, top }. The lidar roof (16-17 over most of the plan, 14-15 on the east edge) is quantised into
// two flat tiers: the main block tops out at 17 (four storeys + coping), the east wing at 14 (three storeys + coping).
const plan = new Map();
for (const [x, z, ground, roof] of cells) plan.set(`${x},${z}`, { ground, top: roof >= 16 ? 17 : 14 });
const cellAt = (x, z) => plan.get(`${x},${z}`);
const solid = (x, y, z) => { const c = cellAt(x, z); return !!c && y >= 0 && y < c.top; };

// the faces of a block that look onto air: outside the footprint, or above the neighbour's top
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
function exposed(x, y, z) {
  return Object.keys(DIRS).filter((f) => !solid(x + DIRS[f][0], y, z + DIRS[f][1]));
}

// the storey rhythm: band (floor line) at 4, 8, 12; glazing in the two rows above each band; spandrel at the top of each storey
// (rows 0 base, 1-2 ground-floor glazing, 3 fascia). Coping on the top row of exposed blocks, roof membrane on the rest.
const WALL = "white_concrete", BAND = "light_gray_concrete", GLASS = "light_blue_stained_glass";

// the entrance: the west-facing ground-level cell nearest the middle of the west face, on the lowest ground
const westGround = cells.filter(([x, z, gr]) => gr <= 1 && !solid(x - 1, gr, z)).map(([x, z, gr]) => ({ x, z, gr }));
const midZ = westGround.reduce((s, c) => s + c.z, 0) / Math.max(1, westGround.length);
const door = westGround.sort((a, b) => Math.abs(a.z - midZ) - Math.abs(b.z - midZ))[0];

const footprint = [...plan.keys()].map((k) => k.split(",").map(Number));
for (const [x, z] of footprint) {
  const c = cellAt(x, z);
  for (let y = 0; y < c.top; y++) {
    const faces = exposed(x, y, z);
    let block = WALL;
    if (y < c.ground) block = "stone_bricks";                                  // foundation below grade
    else if (!faces.length) block = y === c.top - 1 ? "gray_concrete" : WALL;   // core, and the roof membrane
    else if (y === c.top - 1) block = "smooth_stone";                          // coping
    else if (y === c.ground) block = "polished_andesite";                      // base course
    else if (y % 4 === 0 || y % 4 === 3) block = BAND;                         // floor lines and spandrels
    else {                                                                     // glazing rows: bays of 3 glass, 1 pier
      const along = faces.includes("W") || faces.includes("E") ? z : x;
      const pier = along % 4 === 0;
      block = pier ? WALL : GLASS;
      if (!pier && y >= 5 && (x * 7 + y * 3 + z * 5) % 17 === 0) block = "glowstone";  // a few lit rooms
    }
    if (door && x === door.x && z === door.z && faces.includes("W")) {
      if (y === door.gr) g.set(x, y, z, "iron_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === door.gr + 1) g.set(x, y, z, "iron_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === door.gr + 2) g.set(x, y, z, "smooth_stone");              // lintel over the door
      else g.set(x, y, z, block);
      continue;
    }
    g.set(x, y, z, block);
  }
}

// roof plant room: a box well inside the main block, standing on the roof membrane
const mainCells = [...plan.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => cellAt(x, z).top === 17);
const inset = (x, z) => [-4, -3, -2, -1, 0, 1, 2, 3, 4].every((d) => [[d, 0], [0, d]].every(([a, b]) => cellAt(x + a, z + b)?.top === 17));
const plantCells = mainCells.filter(([x, z]) => inset(x, z) && x >= 14 && x <= 19 && z >= 27 && z <= 34);
for (const [x, z] of plantCells) {
  for (let y = 17; y <= 19; y++) g.set(x, y, z, y === 19 ? "smooth_stone" : BAND);
  if (x === 16 || x === 17) g.set(x, 18, z, "iron_bars");                       // louvred plant screens on the two middle columns
}

g.save(OUT);
console.log(`way_306777478: ${plan.size} footprint cells, door at x${door.x} z${door.z}, ${plantCells.length} plant cells`);
