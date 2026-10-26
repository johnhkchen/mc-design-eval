// DC66908: 1114 6th St NW, a religious building read from the lidar record as a basilica-plan church.
// Ground is flat (every cell at y 0). Storeys are 3 blocks (about 7 m, a church's double-height bays). The record's
// roof heights settle into three tiers: the west end and the north wing at 3 (one storey, narthex and vestry), the
// aisles and body at 5, and the nave band (z 4-5) at 6 (the raised central nave). Brick walls on a stone base, stone
// quoins and coping, a smooth-stone belt at the first floor line, glass panes in brick bays, a stone-framed door in the
// south front, glowstone behind some windows, and a stone cross on the nave ridge.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66908.cells.json", "utf8"));
const X = 15, Y = 18, Z = 8;
const FLOOR = 3;                        // the first floor line (belt and upper floor)
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => foot.has(`${x},${z}`);
const ground = (x, z) => foot.get(`${x},${z}`).ground;

// Tops in blocks from the lidar tiers (see header).
const topOf = (x, z) => (x === 0 || z <= 1) ? 3 : (z === 4 || z === 5) ? 6 : 5;

// Outward faces a cell shows to the street or sky.
const exposed = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inF(x + dx, z + dz)).map(([d]) => d);

// The room air: a cell at height y is inside only where it is not the cap or a floor, and every side neighbour is on the
// footprint and stands above y, so no air opens onto the void beside a lower tier.
const isAir = (x, y, z) => {
  if (!inF(x, z) || y < 1 || y > topOf(x, z) - 2 || y === FLOOR) return false;
  return Object.values(DIRS).every(([dx, dz]) => inF(x + dx, z + dz) && y < topOf(x + dx, z + dz));
};

// Window rows per tier: one row for the 3-block wing, two for the body, and the nave's upper row above the floor line.
const windowRows = (T) => (T === 3 ? [1] : T === 5 ? [1, 2] : [1, 2, 4]);

const g = new Voxels([X, Y, Z]);
const BRICK = "bricks", STONE = "stone_bricks", BELT = "smooth_stone", ROOF = "deepslate_tiles";
const PANE_NS = { north: "false", south: "false", east: "false", west: "false" };
const pane = (face) => {
  const wallX = face === "N" || face === "S";     // a pane in a wall running east-west joins its neighbours east and west
  return { ...PANE_NS, ...(wallX ? { east: "true", west: "true" } : { north: "true", south: "true" }), waterlogged: "false" };
};

for (const [x, z, gr] of cells) {
  const T = topOf(x, z);
  const ex = exposed(x, z);
  const corner = ex.length >= 2;
  for (let y = 0; y < T; y++) {
    if (y < gr) { g.set(x, y, z, STONE); continue; }    // foundation under any sloping ground
    if (isAir(x, y, z)) continue;                          // room air, left out of the file
    if (ex.length === 0) {                                 // an inner wall or floor
      g.set(x, y, z, y === T - 1 ? ROOF : y === 0 ? STONE : BRICK);
      continue;
    }
    if (y === 0 || y === T - 1) { g.set(x, y, z, STONE); continue; }   // base course and coping
    if (y === FLOOR && T >= 5) { g.set(x, y, z, BELT); continue; }      // storey line
    if (corner) { g.set(x, y, z, STONE); continue; }                    // quoins
    const face = ex[0];
    const along = face === "N" || face === "S" ? x : z;
    const [dx, dz] = DIRS[face];
    const inward = [x - dx, y, z - dz];
    // the south front door: a stone-framed, two-high dark oak door at the middle bay
    if (face === "S" && x === 7) {
      if (y === 0) { g.set(x, 0, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === 1) { g.set(x, 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      g.set(x, y, z, STONE); continue;                                  // lintel over the door
    }
    if (face === "S" && (x === 6 || x === 8) && y <= 2) { g.set(x, y, z, STONE); continue; }  // door surround
    const gableBay = face === "E" && (z === 4 || z === 5);             // the nave's east gable window
    const bay = along % 2 === 1 || gableBay;
    const row = windowRows(T).includes(y);
    if (bay && row && isAir(...inward)) {
      g.set(x, y, z, "glass_pane", pane(face));
      // warm light behind some panes, in the room air
      if (y === 1 && (along % 6 === 3 || (gableBay && z === 4))) g.set(...inward, "glowstone");
      continue;
    }
    g.set(x, y, z, BRICK);
  }
}

// The nave's ridge cross, on the cap at x 7, z 4 (the nave band's middle bay).
for (let y = 6; y <= 9; y++) g.set(7, y, 4, STONE);
g.set(6, 8, 4, STONE); g.set(8, 8, 4, STONE);

// The room behind the east gable's glass: a shroomlight in the nave.
g.set(13, 2, 4, "shroomlight");

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66908.nbt");
console.log(JSON.stringify(out));
