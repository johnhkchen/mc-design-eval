// NYC1034352: 78 West 47th Street, built 1920, mixed residential and commercial. A four-storey brick block over a
// granite shopfront, with limestone belt courses and a calcite cornice, on a stepped lot: the tall front mass, a
// setback wing at the street (south) end and a low one-storey strip at the rear. Flat tar roof, a small penthouse and a chimney.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${HERE}/NYC1034352.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 5, D = 19, H = 17;

const ground = new Map(), roof = new Map();
for (const [x, z, gr, r] of cells) { ground.set(`${x},${z}`, gr); roof.set(`${x},${z}`, r); }
const FP = (x, z) => roof.has(`${x},${z}`);

// Clean tiers from the lidar roof: 12 and up is the 14-block front mass; the two 10s at the south corner are the 9 wing.
const top = (x, z) => {
  if ((x === 3 || x === 4) && z === 16) return 9;
  const r = roof.get(`${x},${z}`);
  return r >= 12 ? 14 : r;
};
const solid = (x, y, z) => FP(x, z) && y < Math.max(top(x, z), ground.get(`${x},${z}`));
// The directions a block faces out of the massing: +x east, -x west, -z north (rear), +z south (47th Street front).
const DIRS = [[1, 0], [-1, 0], [0, -1], [0, 1]];
const outs = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

// Storeys: base 0, shopfront 1-2 with fascia 3, floors of two window rows between belt courses at 4, 7 and 10, cornice on top.
const BAND = new Set([3, 4, 7, 10]);
const WINDOW_ROWS = new Set([1, 2, 5, 6, 8, 9, 11, 12]);
const lit = (x, y, z) => (x + 2 * z + 3 * y) % 5 === 0;

const g = new Voxels([W, H, D]);
const carve = [];   // [x, y, z, warm]: the air pocket behind each window, a glowstone pocket for some

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const T = top(x, z);
  for (let y = 0; y < T; y++) {
    const out = outs(x, y, z);
    if (y === T - 1) { g.set(x, y, z, out.length ? "calcite" : "gray_concrete"); continue; }   // cornice, else tar roof
    if (!out.length) { g.set(x, y, z, "stone_bricks"); continue; }                              // core, behind the skin
    if (out.length > 1) { g.set(x, y, z, y <= 3 ? "polished_granite" : "bricks"); continue; }   // corners: piers
    const [dx, dz] = out[0];
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (BAND.has(y)) { g.set(x, y, z, "smooth_stone"); continue; }
    if (!WINDOW_ROWS.has(y)) { g.set(x, y, z, "bricks"); continue; }
    const south = dz === 1;
    if (south && x === 2 && y <= 2) {   // the street door, in a recessed bay
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      carve.push([x, y, z - 1, false]);
      continue;
    }
    if (dx === 0 && z % 3 === 0) { g.set(x, y, z, south && y <= 2 ? "polished_granite" : "bricks"); continue; }   // mullion
    g.set(x, y, z, "glass");
    const ix = x - dx, iz = z - dz;
    if (solid(ix, y, iz) && !outs(ix, y, iz).length) carve.push([ix, y, iz, lit(x, y, z)]);
  }
}
for (const [x, y, z, warm] of carve) g.set(x, y, z, warm ? "glowstone" : "air");

// Roof: a 3 x 3 penthouse on the front mass with a calcite cap and a warm room behind its glass; a brick chimney on the wing.
for (let y = 14; y <= 15; y++) for (let x = 1; x <= 3; x++) for (let z = 6; z <= 8; z++) g.set(x, y, z, "bricks");
for (let x = 1; x <= 3; x++) for (let z = 6; z <= 8; z++) g.set(x, 16, z, "calcite");
for (const y of [14, 15]) { g.set(2, y, 6, "glass"); g.set(2, y, 8, "glass"); g.set(2, y, 7, "glowstone"); }
g.set(2, 9, 17, "bricks"); g.set(2, 10, 17, "bricks"); g.set(2, 11, 17, "calcite");

console.log(g.save(`${HERE}/NYC1034352.nbt`));
