// A 1960s-70s reinforced-concrete office block on a stone plinth, the kind that fills the Newton and CBD edges:
// white concrete, light-grey fins and floor bands, blue-tinted glazing, a dark base course, three setback tiers
// (lidar roofs 22 / 25 / 31 / 34 blocks), a coping cornice, rooftop plant and a glazed entrance on the west face.
// Floor lines sit at y = 2 + 4k so every storey is 4 blocks; each footprint cell rises from its own ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293127420.cells.json`, "utf8"));   // [x, z, ground, roof] per cell

const X = 20, Y = 47, Z = 14;
const g = new Voxels([X, Y, Z]);

// lidar roof heights -> three clean tiers (smoothing the noise: 21..22 is one wing, 23..28 one step, 29..32 the body, 33+ the crown)
const tierOf = (r) => (r <= 22 ? 22 : r <= 28 ? 25 : r <= 32 ? 31 : 34);
const col = new Map();   // "x,z" -> { ground, top }
for (const [x, z, ground, roof] of cells) col.set(`${x},${z}`, { ground, top: tierOf(roof) });
const at = (x, z) => col.get(`${x},${z}`);

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
// a face is exposed where the neighbour is outside the footprint or stands lower than this storey
const exposedDirs = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const nb = at(x + DIRS[d][0], z + DIRS[d][1]);
  return !nb || y >= nb.top;
});
// fins: every third cell along a face, and every corner
const isPier = (x, z, d, faces) => faces.length >= 2 || ((d === "n" || d === "s" ? x : z) % 3 === 0);

// the floor lines are 2, 6, 10 ... ; k is a row's place in its storey (0 = floor band, 3 = spandrel)
const kOf = (y) => (y - 2) % 4;
const lit = (x, y, z) => (x * 7 + y * 5 + z * 3) % 9 === 0 || (y < 6 && (x + z) % 2 === 0 && (x * 3 + z) % 4 !== 0);
const shroomlit = (x, y, z) => (x * 11 + y * 13 + z * 7) % 23 === 0;

const cell = new Map();   // "x,y,z" -> [block, state?] (the facade cells, the entrance and the rooftop plant)
const put = (x, y, z, block, state) => cell.set(`${x},${y},${z}`, [block, state]);

for (const [x, z, ground, roofRaw] of cells) {
  const top = tierOf(roofRaw);
  for (let y = 0; y < top; y++) {
    if (y < ground) { put(x, y, z, "stone_bricks"); continue; }   // foundation: solid from y 0 up to the cell's ground
    const faces = exposedDirs(x, z, y);
    if (y === top - 1) {                                             // the roof: coping on the edge, deck inside
      put(x, y, z, faces.length ? "light_gray_concrete" : "stone");
      continue;
    }
    if (!faces.length) {                                             // interior: only the floor slabs, the rest is air
      if (y >= 2 && kOf(y) === 0) put(x, y, z, "white_concrete");
      continue;
    }
    if (y < 2) { put(x, y, z, "stone_bricks"); continue; }          // base course
    const k = kOf(y);
    if (k === 0) { put(x, y, z, "light_gray_concrete"); continue; }  // floor band
    if (k === 3) { put(x, y, z, "white_concrete"); continue; }       // spandrel
    if (isPier(x, z, faces[0], faces)) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass");                        // glazing in a fin-to-fin bay
  }
}

// warm rooms: a light set in the air gap behind a pane (one inward cell, never into the thin parts)
for (const [x, z, ground, roofRaw] of cells) {
  const top = tierOf(roofRaw);
  for (let y = 2; y < top - 1; y++) {
    const k = kOf(y);
    if (k !== 1 && k !== 2) continue;
    const faces = exposedDirs(x, z, y);
    if (faces.length !== 1) continue;
    const [dx, dz] = DIRS[faces[0]];
    const ix = x - dx, iz = z - dz;
    const inner = at(ix, iz);
    if (!inner || inner.top <= y || exposedDirs(ix, iz, y).length) continue;
    if (!cell.get(`${x},${y},${z}`)?.[0].includes("glass")) continue;
    if (shroomlit(x, y, z)) put(ix, y, iz, "shroomlight");
    else if (lit(x, y, z)) put(ix, y, iz, "glowstone");
  }
}

// west entrance on the ground cell (1, 6): a glazed door under the floor band, lanterns hung either side
put(1, 0, 6, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
put(1, 1, 6, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
put(1, 1, 5, "lantern", { hanging: "true" });
put(1, 1, 7, "lantern", { hanging: "true" });

// rooftop plant on the crown: air-handling boxes standing on the deck
for (const [x, z] of [[14, 6], [16, 6], [14, 9], [16, 9]]) put(x, 34, z, "iron_block");

for (const [key, [block, state]] of cell) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}

const saved = g.save(`${DIR}/way_293127420.nbt`);
console.log(`way_293127420: ${saved.blocks} blocks, ${saved.palette} palette entries`);
