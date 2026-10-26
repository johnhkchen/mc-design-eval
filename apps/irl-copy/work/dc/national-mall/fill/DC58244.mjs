// 1305 10th St NW: a three-storey brick walk-up on a stone plinth, with a stone parapet and a dark flat roof.
// The lidar roof is 7 blocks above the lowest ground, so the storeys are 2 blocks each (window row over a stone band)
// on a base course, under a parapet that is the roof's top layer. Walls are a 1-block shell; the rooms are air behind
// the glass, with an oak floor slab under each storey line and a deck over the top one. The street front is the long
// west face (x = 0): the entrance sits there at z = 11, where the ground is at the lowest level.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC58244.nbt";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC58244.cells.json", "utf8"));

const BRICK = "bricks", STONE = "stone_bricks", FLOOR = "oak_planks", DECK = "deepslate_tiles";
const LANTERN = "lantern", PANE = "glass_pane", DOOR = "dark_oak_door";
const [X, Y, Z] = [7, 19, 17];
const g = new Voxels([X, Y, Z]);

// footprint: "x,z" -> { ground, roof }
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof });
const inFp = (x, z) => fp.has(`${x},${z}`);

// exterior faces of each footprint cell: the sides whose neighbour is outside the footprint
const DIRS = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
const facesOf = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inFp(x + dx, z + dz)).map(([n]) => n);

// the entrance: west face, z = 11 (ground 0, the lowest street level)
const DOOR_Z = 11, DOOR_FACE = "west";

// along-wall coordinate for bays: z on the east/west faces, x on the north/south faces
const along = (face, x, z) => (face === "west" || face === "east" ? z : x);

for (const [key, { ground, roof }] of fp) {
  const [x, z] = key.split(",").map(Number);
  const top = roof - 1;                       // highest layer of the building
  const faces = facesOf(x, z);
  const shell = faces.length > 0;
  const quoin = faces.length >= 2;            // a corner of the envelope
  // foundation: solid from y 0 up to the ground under this cell (y 0 is the base course on the plinth)
  for (let y = 0; y < ground; y++) g.set(x, y, z, STONE);

  for (let y = Math.max(ground, 0); y <= top; y++) {
    if (y === 0) { g.set(x, y, z, STONE); continue; }              // base course, the whole footprint
    if (y === top) {                                                // parapet ring; the roof deck inside it
      g.set(x, y, z, shell ? STONE : DECK); continue;
    }
    if (!shell) {                                                   // interior: floor slab per storey, air between
      if (y % 2 === 0) g.set(x, y, z, FLOOR);
      continue;
    }
    if (y % 2 === 0) { g.set(x, y, z, BRICK); continue; }           // storey band: brick between the window rows
    // window row (odd y): quoins, piers, and glass bays on each exposed face
    if (quoin) { g.set(x, y, z, STONE); continue; }
    const face = faces[0], t = along(face, x, z);
    if (face === DOOR_FACE && x === 0 && (z === DOOR_Z - 1 || z === DOOR_Z + 1)) { g.set(x, y, z, STONE); continue; }
    if (face === DOOR_FACE && x === 0 && z === DOOR_Z) {            // doorway, and a stone lintel above it
      if (y === 1) g.set(x, y, z, DOOR, { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, STONE);
      continue;
    }
    if (t % 3 === 0) g.set(x, y, z, BRICK);                         // pier
    else g.set(x, y, z, PANE);                                      // glass bay
  }
}

// the doorway's upper half is the band row above it (y 2), one block of the same door
{
  const [x, z] = [0, DOOR_Z];
  if (fp.has(`${x},${z}`)) g.set(x, 2, z, DOOR, { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// warm light: a lantern two blocks in from some front windows, so the glass keeps an air gap behind it
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (x !== 0 || z % 6 !== 2 || z === DOOR_Z) continue;
  for (const y of [1, 3, 5]) {
    const hang = y !== 1;
    if (inFp(2, z) && g.get(2, y, z) === null) g.set(2, y, z, LANTERN, { hanging: String(hang), waterlogged: "false" });
  }
}

// panes connect to the solid neighbours and to other panes, as they do in the world
const solid = (x, y, z) => { const b = g.get(x, y, z); return !!b && (b.block === "minecraft:" + PANE || b.block === "minecraft:" + BRICK || b.block === "minecraft:" + STONE); };
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (const y of [1, 3, 5]) {
    const b = g.get(x, y, z);
    if (!b || b.block !== "minecraft:" + PANE) continue;
    const st = {};
    st.north = String(solid(x, y, z - 1));
    st.south = String(solid(x, y, z + 1));
    st.east = String(solid(x + 1, y, z));
    st.west = String(solid(x - 1, y, z));
    st.waterlogged = "false";
    g.set(x, y, z, PANE, st);
  }
}

const summary = g.save(OUT);
console.log(JSON.stringify(summary));
