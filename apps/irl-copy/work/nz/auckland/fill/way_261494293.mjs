// A two-storey 1930s brick-and-plaster shop block on the Mt Eden Road fringe: a stone plinth, shopfront glazing on
// the ground floor, a plaster lintel course at the storey line, upper windows in brick bays, and a plaster parapet
// round a flat roof. The lidar's roof is level at 7 blocks over every cell, so the massing is one flat-topped block:
// the ground falls away under it (foundation fill) and the downhill side shows the full height.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494293.cells.json", "utf8"));

// storey lines on absolute y: ground floor below the lintel course at FLOOR, upper storey between FLOOR and the parapet
const FLOOR = 3;          // ground-floor ceiling / first-floor slab, plaster lintel band on the walls
const ROOF = 6;           // top block layer; the roof surface is at 7 (lidar)
const BRICK = "bricks", TRIM = "white_concrete", PLINTH = "stone_bricks", DECK = "smooth_stone", GLASS = "glass_pane";

const g = new Voxels([24, 19, 24]);
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { x, z, ground, roof });
const at = (x, z) => F.get(`${x},${z}`);

// outward faces of a footprint cell: the sides with no footprint cell beside them
const SIDES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPPOSITE = { north: "south", south: "north", west: "east", east: "west" };
const outward = (c) => Object.keys(SIDES).filter((n) => !at(c.x + SIDES[n][0], c.z + SIDES[n][1]));
// position along a face: x for north/south walls, z for east/west walls
const along = (c, side) => (side === "north" || side === "south" ? c.x : c.z);
// a pane connects along its own wall (to neighbours and to the plaster piers), not out of it
const paneState = (side) => {
  const alongX = side === "north" || side === "south";
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
};

// the entrance: a non-corner ring cell on the lower ground near the middle of the block (door is two cells tall)
const ring = [...F.values()].filter((c) => outward(c).length > 0);
const doorCands = ring.filter((c) => outward(c).length === 1 && c.ground <= 1);
doorCands.sort((a, b) => (Math.abs(a.x - 12) + Math.abs(a.z - 12)) - (Math.abs(b.x - 12) + Math.abs(b.z - 12)));
const door = doorCands[0];
const doorKey = door ? `${door.x},${door.z}` : null;

for (const c of F.values()) {
  const { x, z, ground } = c;
  // foundation: solid from the lowest ground up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, PLINTH);
  // floor slabs across the whole footprint at the storey line and under the roof; the rest is air (no interiors)
  g.set(x, FLOOR, z, DECK);
  g.set(x, ROOF, z, DECK);

  const sides = outward(c);
  if (!sides.length) continue;
  // the stepped edge of the footprint has cells with two open sides; each takes its first one, so the wall reads as a run
  const side = sides[0];
  const idx = along(c, side);
  for (let y = ground; y <= ROOF; y++) {
    if (y === ROOF || y === FLOOR) { g.set(x, y, z, TRIM); continue; }
    if (y < FLOOR) {
      // ground floor: plinth course, then shopfront glazing with plaster piers every fourth bay
      if (y === ground && ground <= 2) g.set(x, y, z, PLINTH);
      else if (idx % 4 === 0) g.set(x, y, z, TRIM);
      else g.set(x, y, z, GLASS, paneState(side));
      continue;
    }
    // upper storey: a window in two of every three cells, brick piers between
    if (idx % 3 === 0) g.set(x, y, z, BRICK);
    else g.set(x, y, z, GLASS, paneState(side));
  }
}

// warm light: a hanging lantern just inside every other upper window, and one behind some shopfront glass
for (const c of ring) {
  const sides = outward(c);
  if (sides.length !== 1) continue;
  const side = sides[0];
  const idx = along(c, side);
  const [dx, dz] = SIDES[OPPOSITE[side]];      // inward step from this wall
  const xi = c.x + dx, zi = c.z + dz;
  if (!at(xi, zi)) continue;
  if (idx % 3 !== 0 && idx % 6 === 1) g.set(xi, 5, zi, "lantern", { hanging: "true" });
  if (c.ground <= 1 && idx % 4 !== 0 && idx % 8 === 2) g.set(xi, 2, zi, "lantern", { hanging: "true" });
}

// the entrance door: two cells tall on the lower ground, with the transom above it
if (door) {
  const side = outward(door)[0];
  g.set(door.x, door.ground, door.z, "dark_oak_door", { facing: side, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, door.ground + 1, door.z, "dark_oak_door", { facing: side, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let y = door.ground + 2; y < FLOOR; y++) g.set(door.x, y, door.z, TRIM);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494293.nbt");
console.log("way_261494293", { cells: F.size, door: doorKey, blocks: g.count(), palette: g.palette.length });
