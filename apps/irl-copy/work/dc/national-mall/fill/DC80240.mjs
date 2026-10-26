import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s stripped-classical office block of pale limestone, the Federal Triangle's idiom: three storeys on a
// polished-andesite base, a string course at each floor, glass in calcite piers, a pedimentless entrance bay on the
// north (z 0) street face, and a flat roof with a cornice. The lidar roof is level at 10 with a 4 x 3 block of 11s in
// the middle: read as a central attic pavilion one row higher, not as noise. Ground steps down to the south-east, so
// the ground floor takes the step (its base course starts one block lower there) and the upper storeys stay on the
// roof line.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC80240.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 19, D = 15, Y = 23;
const g = new Voxels([W, Y, D]);

const WALL = "calcite", BASE = "polished_andesite", CORNICE = "smooth_sandstone", DECK = "smooth_stone";
const FOUNDATION = "stone_bricks", DOOR = "dark_oak_door";

// footprint lookup: "x,z" -> { ground, roof }
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, roof });
const inside = (x, z) => cell.has(`${x},${z}`);

// which sides of a footprint cell face outside it: N is z - 1 (the street face at z 0), S is z + 1, W is x - 1, E is x + 1
const exposedSides = (x, z) => ({ N: !inside(x, z - 1), S: !inside(x, z + 1), W: !inside(x - 1, z), E: !inside(x + 1, z) });
const isWall = (x, z) => { const e = exposedSides(x, z); return e.N || e.S || e.W || e.E; };

// the central attic: the lidar's 11s are a 4 x 3 block (x 11..14, z 3..5); the rest of the roof is 10 (the noisy 11s elsewhere are smoothed)
const PAVILION = (x, z) => x >= 11 && x <= 14 && z >= 3 && z <= 5;
const topOf = (x, z) => (PAVILION(x, z) ? 10 : 9);   // the top block's y: a roof of R is capped at y R-1
const pavilionWall = (x, z) => !PAVILION(x + 1, z) || !PAVILION(x - 1, z) || !PAVILION(x, z + 1) || !PAVILION(x, z - 1);

// the glazing: panes run along the face they sit in (east-west on a N/S face, north-south on an E/W face)
const pane = (ns) => (ns ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });

// the entrance bay: a door on the street face's middle cell, pilasters either side, and the string course above as its lintel
const ENTRY = { x: 9, z: 0 };
const entrySurround = (x, z) => z === ENTRY.z && Math.abs(x - ENTRY.x) <= 1;

// the facade of one perimeter cell at height y, given its ground g0
function facade(x, z, y, g0) {
  const e = exposedSides(x, z);
  const ns = e.N || e.S, ew = e.W || e.E;
  if (y === g0) return { id: BASE };                       // base course at the ground
  if (y === 3 || y === 6) return { id: CORNICE };          // string courses at the floor lines
  if (y === topOf(x, z) && !PAVILION(x, z)) return { id: CORNICE }; // the cornice on the roof line
  if (entrySurround(x, z)) {
    if (x === ENTRY.x) {
      if (y === g0) return { id: DOOR, state: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
      if (y === g0 + 1) return { id: DOOR, state: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
    } else if (y <= g0 + 1) return { id: BASE };           // pilasters either side of the door
  }
  if (ns && ew) return { id: WALL };                       // a corner: solid stone
  const along = ns ? x : z;
  if (along % 3 === 0) return { id: WALL };                // pier between windows
  return { id: "glass_pane", state: pane(ns) };
}

// the ground: solid from y 0 up to each cell's ground, so nothing floats on the slope
for (const [x, z, ground] of cells) for (let y = 0; y < ground; y++) g.set(x, y, z, FOUNDATION);

const glassCells = [];
for (const [x, z, ground] of cells) {
  const top = topOf(x, z);
  const wall = isWall(x, z);
  for (let y = ground; y <= top; y++) {
    if (PAVILION(x, z) && y === 10) {                      // the attic row: a calcite ring round a stone deck
      g.set(x, y, z, pavilionWall(x, z) ? WALL : DECK);
      continue;
    }
    if (wall) {
      const f = facade(x, z, y, ground);
      if (f.id === "glass_pane") glassCells.push({ x, y, z, state: f.state });
      g.set(x, y, z, f.id, f.state);
    } else {
      // interior: a floor slab at each floor line and the roof deck; air between
      if (y === 3 || y === 6 || y === 9) g.set(x, y, z, DECK);
    }
  }
}

// warm light: some windows show a glowstone just inside the glass, in the air gap behind it
const LIT = (x, y, z) => (x * 2 + z + y) % 13 === 0 && y !== 2;
let lit = 0;
for (const { x, y, z, state } of glassCells) {
  if (y === 3 || y === 6 || y === 9 || !LIT(x, y, z)) continue;
  // the inward cell is opposite the exposed side: north/south panes face z, east/west panes face x
  const e = exposedSides(x, z);
  const ix = e.W ? x + 1 : e.E ? x - 1 : x;
  const iz = e.N ? z + 1 : e.S ? z - 1 : z;
  if (!inside(ix, iz) || isWall(ix, iz)) continue;
  g.set(ix, y, iz, "glowstone"); lit++;
}

// the entrance hall: a hanging lantern under the floor slab just inside the door
g.set(ENTRY.x, 2, ENTRY.z + 1, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant: a 2 x 2 stone-brick unit on the roof deck, well in from the cornice (interior cells, so nothing overhangs)
for (let x = 4; x <= 5; x++) for (let z = 4; z <= 5; z++) g.set(x, 10, z, FOUNDATION);

const res = g.save(`${DIR}/DC80240.nbt`);
console.log(JSON.stringify({ ...res, lit }));
