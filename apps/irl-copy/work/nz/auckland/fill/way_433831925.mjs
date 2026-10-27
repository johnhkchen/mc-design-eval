import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Saint Paul's Apartments: a 1970s concrete-and-brick flats block, 15 storeys of 4 blocks on a two-storey brick podium.
// Lidar roof heights 59-60 across the footprint read as one flat top (60); the SW corner's 57-58 reads as a lower wing (58).
// Every exterior face is a solid shell with glass panes set into the wall line and an air gap behind; floors sit at each
// storey line across the whole footprint, so nothing floats. Recessed loggias on the long faces break the grid.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_433831925.cells.json", "utf8"));
const X = 13, Y = 73, Z = 24;
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_433831925.nbt";
const g = new Voxels([X, Y, Z]);

const PANE = "light_blue_stained_glass_pane";
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, top: roof >= 59 ? 60 : 58 });
const at = (x, z) => foot.get(`${x},${z}`);

// which exterior face a footprint cell sits on (null inside): N = z-1 missing, S = z+1, W = x-1, E = x+1
const faceOf = (x, z) => (!at(x, z - 1) ? "N" : !at(x, z + 1) ? "S" : !at(x - 1, z) ? "W" : !at(x + 1, z) ? "E" : null);
// a pane's connections run along its wall line
const paneState = (face) => (face === "N" || face === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

for (const [key, { ground, top }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const face = faceOf(x, z), ext = face !== null;
  const u = face === "N" || face === "S" ? x : z;                       // position along the face
  const corner = (!at(x, z - 1) || !at(x, z + 1)) && (!at(x - 1, z) || !at(x + 1, z));
  const pier = corner || u % 2 === 0;                                     // concrete fin every other bay: glass and concrete alternate
  for (let y = 0; y < top; y++) {
    const k = Math.floor(y / 4), r = y % 4;                               // storey k, row r within it
    let b = null, s;
    if (y < ground) b = "stone_bricks";                                   // foundation down to the lowest ground
    else if (!ext) {                                                      // interior: a slab per storey, air between
      if (y === top - 1) b = "smooth_stone";                              // roof deck
      else if (y === ground || r === 0) b = "light_gray_concrete";
    } else if (y === top - 1) b = "light_gray_concrete";                  // parapet coping
    else if (y < 8) {                                                     // brick podium, storeys 0-1
      if (y === ground) b = "stone_bricks";                               // base course
      else if (r === 0) b = "light_gray_concrete";
      else if (r === 3 || pier) b = "bricks";
      else { b = PANE; s = paneState(face); }
    } else {                                                              // pale concrete tower
      if (r === 0) b = "light_gray_concrete";                             // storey line
      else if (r === 3) b = "white_concrete";                             // spandrel
      else if (pier) b = "light_gray_concrete";
      else if (k % 2 === 1 && (face === "W" || face === "E") && u % 3 === 1) {
        // recessed loggia on a long face: open cell with a rail on the storey line
        if (r === 1) { b = "iron_bars"; s = paneState(face); }
      } else {
        b = PANE; s = paneState(face);
        // a warm lamp standing just inside some windows (the air gap behind the glass)
        if (r === 1 && (k * 3 + u) % 5 === 0) {
          const [dx, dz] = inward[face], ix = x + dx, iz = z + dz;
          if (at(ix, iz) && !faceOf(ix, iz)) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    }
    if (b) g.set(x, y, z, b, s);
  }
}

// entrance on the north face at x 6: iron doors, a flat canopy over, a lantern hung inside
const dr = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(6, 0, 0, "iron_door", dr("lower"));
g.set(6, 1, 0, "iron_door", dr("upper"));
for (let x = 5; x <= 7; x++) for (let z = 0; z <= 1; z++) g.set(x, 2, z, "light_gray_concrete");
g.set(6, 1, 1, "lantern", { hanging: "true", waterlogged: "false" });

// rooftop plant room on the flat top, x 4-8, z 9-14: walls, a window band, a roof, a lightning rod
for (let x = 4; x <= 8; x++) for (let z = 9; z <= 14; z++) {
  if (!at(x, z)) continue;
  const edge = x === 4 || x === 8 || z === 9 || z === 14;
  for (let y = 60; y <= 62; y++) {
    if (!edge) continue;
    const win = y === 61 && ((x === 4 || x === 8) ? z >= 11 && z <= 12 : x >= 5 && x <= 7);
    if (win) g.set(x, y, z, PANE, paneState(x === 4 || x === 8 ? "W" : "N"));
    else g.set(x, y, z, "white_concrete");
  }
  g.set(x, 63, z, "light_gray_concrete");
}
g.set(6, 64, 11, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const stats = g.save(out);
console.log(JSON.stringify({ file: out, cells: foot.size, ...stats }));
