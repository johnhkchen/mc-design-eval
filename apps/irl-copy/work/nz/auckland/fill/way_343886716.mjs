import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A two-storey interwar brick commercial block (Mt Eden / Eden Terrace main-road type, c.1910-1935):
// red brick walls on a stone plinth, shopfronts with pilasters on the ground storey, a cream string course,
// two storeys of paired window bays, a moulded cornice and a brick parapet over a flat roof. Lidar roof 10 is the
// roof deck (top at y 10), parapet to 11. Lower single-storey wing where lidar roof is under 8.
//
// Levels (absolute): fascia/ground-storey top 4, floor slab 5, upper windows 6-7, head 8, cornice 9, parapet 10.
// Columns: foundation stone below each cell's ground; ring (exposed) cells carry the facade; interior cells are air
// with one floor slab at 5 and a roof deck at 9, so there is an air gap behind every window and no interiors.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_343886716.cells.json", "utf8"));

const WALL = "bricks", PIER = "smooth_quartz", FOUND = "stone_bricks", SLAB = "smooth_stone", GLASS = "glass_pane";
const FLOOR = 5, FASCIA = 4, HEAD = 8, CORNICE = 9, PARAPET = 10, WING_TOP = 5;
const OUT = { N: [0, -1, "north"], S: [0, 1, "south"], W: [-1, 0, "west"], E: [1, 0, "east"] };

const key = (x, z) => x + "," + z;
const fp = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => fp.has(key(x, z));

// Exposed faces of a footprint cell: the sides with no neighbour in the footprint.
const exposed = (x, z) => Object.keys(OUT).filter(d => !inside(x + OUT[d][0], z + OUT[d][1]));

// Front door: the south face, the bay nearest the middle of the frontage, on ground low enough for a two-high door.
const doorCell = cells
  .filter(([x, z, g]) => g <= 2 && exposed(x, z).includes("S") && !(exposed(x, z).includes("E") || exposed(x, z).includes("W")))
  .sort((a, b) => Math.abs(a[0] - 16) - Math.abs(b[0] - 16))[0];
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

const g = new Voxels([33, 23, 28]);

// Connect a pane to the wall it sits in: panes span the wall's run (east-west on N/S faces, north-south on E/W).
const pane = (face) => ({ north: face === "E" || face === "W" ? "true" : "false", south: face === "E" || face === "W" ? "true" : "false",
  east: face === "N" || face === "S" ? "true" : "false", west: face === "N" || face === "S" ? "true" : "false", waterlogged: "false" });

// Which face a ring cell is dressed on, and its position along that face (for bays and piers).
function facade(x, z, ex) {
  const ns = ex.includes("N") ? "N" : ex.includes("S") ? "S" : null;
  const we = ex.includes("W") ? "W" : ex.includes("E") ? "E" : null;
  const corner = !!(ns && we);
  const face = ns ?? we;
  const along = ns ? x : z;
  return { face, along, corner };
}

// Ground storey, from the cell's ground up to the fascia: shopfront glass between quartz pilasters every 4 bays,
// door bay with a two-high door under the glass.
function groundBlock(y, { face, along, corner }) {
  if (corner || along % 4 === 0) return [PIER];
  return [GLASS, pane(face)];
}

// Upper storey (main building only): two-bay windows of glass between two-bay brick piers, so the red brick reads as
// the wall and the glass as punched openings rather than a glass ribbon.
function upperBlock(y, { face, along, corner }) {
  if (corner) return [PIER];
  if (along % 4 === 0 || along % 4 === 3) return [WALL];
  return [GLASS, pane(face)];
}

for (const [x, z, gr, r] of cells) {
  // Plinth from y 0 up to the cell's own ground: nothing floats on the slope.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const ex = exposed(x, z);
  const wing = r < 8; // lidar roof under 8: a one-storey wing

  if (ex.length === 0) {
    // Interior: air storeys, a floor slab at FLOOR and a roof deck at the top of the building.
    g.set(x, FLOOR, z, SLAB);
    if (!wing) {
      g.set(x, CORNICE, z, SLAB);
      // Plant box on the roof, in the middle of the deck.
      if (x >= 12 && x <= 17 && z >= 9 && z <= 13) g.set(x, PARAPET, z, FOUND);
    }
    continue;
  }

  const f = facade(x, z, ex);
  const isDoor = key(x, z) === doorKey;
  // Front door on the south face, ground at most 2 so both halves fit under the fascia.

  // Ground storey: from the cell's ground to the fascia at FASCIA.
  for (let y = gr; y < FASCIA; y++) {
    const [blk, st] = groundBlock(y - gr, f);
    g.set(x, y, z, blk, st);
  }
  // Door bay: a two-high door on the cell's ground, under the glass.
  if (isDoor) {
    g.set(x, gr, z, "dark_oak_door", { facing: OUT[f.face][2], half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: OUT[f.face][2], half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  g.set(x, FASCIA, z, PIER); // fascia / lintel course

  if (wing) {
    g.set(x, WING_TOP, z, PIER); // lower wing: cornice course on the flat roof
    continue;
  }

  g.set(x, FLOOR, z, PIER);     // cream string course at the floor line
  for (let y = FLOOR + 1; y < HEAD; y++) {
    const [blk, st] = upperBlock(y, f);
    g.set(x, y, z, blk, st);
  }
  g.set(x, HEAD, z, PIER);      // window heads
  g.set(x, CORNICE, z, PIER);   // moulded cornice
  g.set(x, PARAPET, z, WALL);   // brick parapet to y 11

  // Warm light in some upper windows: a lantern standing on the floor slab one cell inside the glass.
  if (f.face && !f.corner && f.along % 8 === 1 && !isDoor) {
    const [dx, dz] = OUT[f.face];
    const ix = x - dx, iz = z - dz;
    if (inside(ix, iz) && exposed(ix, iz).length === 0) g.set(ix, 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_343886716.nbt");
console.log(info);
