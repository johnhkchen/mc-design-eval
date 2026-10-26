// 1633 Q St NW (Dupont Circle): a brick commercial block with a stone base, a stone shop fascia and string courses,
// a shopfront on the street (north) face, and a stepped massing in clean tiers: a low street wing, a four-storey body,
// and a 10-high tower at the centre with a penthouse. The lidar roof is median-smoothed over the footprint, then
// snapped to the tiers. Walls are built only where a face is open; interiors are air behind the glass with a floor slab
// per storey, and lamps sit in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const raw = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54788.cells.json", "utf8"));

// lidar roof -> clean tiers: median of the 3x3 footprint neighbourhood, then snap to 2 / 4 / 7 / 10 blocks
const RAW = new Map(raw.map(([x, z, ground, roof]) => [`${x},${z}`, roof]));
const tier = (r) => (r <= 2 ? 2 : r <= 5 ? 4 : r <= 8 ? 7 : 10);
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const cells = raw.map(([x, z, ground]) => {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (RAW.has(`${x + dx},${z + dz}`)) near.push(RAW.get(`${x + dx},${z + dz}`));
  return [x, z, ground, tier(median(near))];
});

const FOOT = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const roofAt = (x, z) => FOOT.get(`${x},${z}`)?.roof ?? -1;          // -1 outside the footprint
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
// the faces of cell (x, z) that are open at height y: the neighbour is outside the footprint or its roof is at or below y
const openFaces = (x, z, y) => DIRS.filter(([dx, dz]) => roofAt(x + dx, z + dz) <= y).map(([, , f]) => f);
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

const g = new Voxels([10, 22, 15]);
const DOOR = { x: 4, z: 0 };                                          // the street door, centred on the north face

// the wall row at height y on a street-facing or side face: stone only at the shop fascia (the rest is brick), glass in
// the window rows with brick piers every third block
const spandrel = (y) => (y === 2 ? "smooth_stone" : "bricks");

for (const [x, z, ground, roof] of cells) {
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");    // foundation under any slope
  for (let y = 0; y < roof; y++) {
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }         // base course
    if (y === roof - 1) { g.set(x, y, z, "smooth_stone"); continue; } // roof surface / cornice
    if (y % 2 === 0) {                                                 // storey line: slab inside, string course outside
      g.set(x, y, z, openFaces(x, z, y).length ? spandrel(y) : "smooth_stone");
      continue;
    }
    const faces = openFaces(x, z, y);
    if (!faces.length) continue;                                       // interior storey: air behind the glass
    if (faces.length >= 2) { g.set(x, y, z, "stone_bricks"); continue; } // quoin at a corner
    const face = faces[0];
    const along = face === "north" || face === "south" ? x : z;
    const pier = along % 3 === 0;
    g.set(x, y, z, pier ? "bricks" : "glass");
    if (!pier) {
      // a warm lamp in some windows: on the floor just inside the glass
      const [ix, iz] = inward[face];
      const lx = x + ix, lz = z + iz;
      const lit = (along + y) % 4;
      if (roofAt(lx, lz) > y && !openFaces(lx, lz, y).length) {
        if (lit === 1) g.set(lx, y, lz, "lantern", { hanging: "false", waterlogged: "false" });
        if (lit === 3) g.set(lx, y, lz, "glowstone");
      }
    }
  }
}

// street door: a dark oak door, lower and upper halves
g.set(DOOR.x, 1, DOOR.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR.x, 2, DOOR.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// parapet on the roof edges that drop away (the street wing, the body's edge, the tower's shoulders)
const parapetAt = (x, z) => roofAt(x, z) > 0 && openFaces(x, z, roofAt(x, z) - 1).length > 0;
for (const [x, z, , roof] of cells) {
  if (!parapetAt(x, z)) continue;
  const side = (dx, dz) => (parapetAt(x + dx, z + dz) ? "low" : "none");
  g.set(x, roof, z, "stone_brick_wall", {
    north: side(0, -1), south: side(0, 1), west: side(-1, 0), east: side(1, 0), up: "false", waterlogged: "false",
  });
}

// roof equipment: a small penthouse on the tower cell with no open face
g.set(4, 10, 5, "bricks");
g.set(4, 11, 5, "smooth_stone");

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54788.nbt");
console.log(out);
