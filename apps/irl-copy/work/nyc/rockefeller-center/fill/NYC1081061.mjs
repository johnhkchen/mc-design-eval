// NYC1081061: 59 West 44 Street, NYC individual landmark, Commercial & Office, 1902. Read as a Beaux-Arts commercial
// block: red brick on a granite plinth, cream stone for quoins, string courses, lintels and cornices, a two-storey
// shopfront wing on the 44th Street face (z 0), a four-storey body, and a five-storey tower stepping up on the east
// edge and the south-east corner (lidar roof 14-15). Storeys are 3 blocks; windows are glass panes one block back
// from the face (an air gap), some with a glowstone behind; every roof ends in a cornice and a stone slab parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1081061.cells.json`, "utf8"));   // [x, z, ground, roof] per cell
const W = 6, D = 10;

const BRICK = "bricks", TRIM = "smooth_sandstone", BASE = "polished_granite", GLASS = "glass_pane";
const ROOF = "stone_bricks", CAP = "stone_brick_slab", AIR = "air", LIGHT = "glowstone";

// The lidar roof (layers above y 0) smoothed into three tiers: 6 layers (two storeys), 12 (four), 15 (five).
const tier = (r) => (r === 0 ? 0 : r <= 8 ? 6 : r <= 13 ? 12 : 15);
const TOP = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, tier(r)]));
const top = (x, z) => TOP.get(`${x},${z}`) ?? 0;
const solid = (x, y, z) => y >= 0 && y < top(x, z);
const exposed = (x, y, z) => [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dx, dz]) => !solid(x + dx, y, z + dz));
// Position along a face (0..L-1): x for a z-face, z for an x-face.
const along = (x, z, [, dz]) => (dz ? x : z);
const faceLen = ([, dz]) => (dz ? W : D);

const g = new Voxels([W, 27, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const R = top(x, z);
  for (let y = 0; y < R; y++) g.set(x, y, z, BRICK);
}

const paneState = (f) => (f[1] ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const recess = (x, y, z, f, block) => { const [ix, iz] = [x - f[0], z - f[1]]; if (solid(ix, y, iz)) g.set(ix, y, iz, block); };

let win = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const R = top(x, z);
  for (let y = 0; y < R; y++) {
    const faces = exposed(x, y, z);
    if (!faces.length) { if (y === R - 1) g.set(x, y, z, ROOF); continue; }   // roof covering on an interior top
    const s = Math.floor(y / 3), lj = y % 3;
    const quoin = faces.find((f) => along(x, z, f) === 0 || along(x, z, f) === faceLen(f) - 1);
    const f = quoin ?? faces.find((ff) => ff[1] === -1 && z === 0) ?? faces[0];   // street face wins
    const a = along(x, z, f);
    const street = f[1] === -1 && z === 0 && s === 0;

    if (y === R - 1) { g.set(x, y, z, TRIM); continue; }              // cornice on every roof's top layer
    if (quoin) { g.set(x, y, z, lj === 0 && s === 0 ? BASE : TRIM); continue; }   // quoined corners
    if (lj === 0) {                                                   // base course, then a string course per storey
      if (s === 0 && y === 0) g.set(x, y, z, BASE);
      else if (street && a >= 1 && a <= 3 && s === 1) g.set(x, y, z, "smooth_sandstone_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });   // canopy over the entrance
      else g.set(x, y, z, s === 0 ? BASE : TRIM);
      continue;
    }
    if (street) {                                                     // 44th Street shopfront
      if (a === 2) {                                                  // entrance: dark oak door, two blocks high
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: lj === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        recess(x, y, z, f, AIR);
      } else if (a % 2 === 1 && lj === 1) {                           // shop glass, lit from inside
        g.set(x, y, z, GLASS, paneState(f)); recess(x, y, z, f, LIGHT);
      } else if (a % 2 === 1) g.set(x, y, z, TRIM);                    // fascia over the shop glass
      else g.set(x, y, z, BASE);                                      // granite pier
      continue;
    }
    if (a % 2 === 1) {                                                // window bay: glass one block back, an air gap
      g.set(x, y, z, GLASS, paneState(f));
      recess(x, y, z, f, win++ % 3 === 1 && lj === 1 ? LIGHT : AIR);  // warm light behind every third window
      continue;
    }
    g.set(x, y, z, BRICK);                                            // brick pier between bays
  }
}

// Parapet: a stone slab on the edge of every roof, standing on the cornice.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const R = top(x, z);
  if (!R) continue;
  if (exposed(x, R - 1, z).length) g.set(x, R, z, CAP, { type: "bottom", waterlogged: "false" });
}

// Roof plant: a 2 x 2 mechanical housing on the four-storey roof, standing on the roof covering.
for (const [x, z] of [[1, 5], [2, 5], [1, 6], [2, 6]]) {
  g.set(x, 12, z, "smooth_stone");
  g.set(x, 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// The open light court in the south-west notch: a granite paving at grade.
g.set(1, 0, 9, BASE);

const { blocks, palette } = g.save(`${DIR}/NYC1081061.nbt`);
console.log(`NYC1081061.nbt: ${blocks} blocks, ${palette} palette entries`);
