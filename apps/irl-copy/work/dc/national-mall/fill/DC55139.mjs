// DC55139: 50 F St NW, a 1920s-30s Classical Revival office block. Pale stone walls on a granite plinth, banded storeys,
// dark office glass with a glass ground-floor shopfront, stepping from an 18-block wing up to a 20-block tower with a
// mechanical penthouse, a 16-block east wing and a 3-block roof terrace over the lower courtyard. Lidar roof heights are
// quantised to four clean tiers (3, 16, 18, 20). Columns run from their ground up to their roof, so no tier floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55139.cells.json`, "utf8"));   // [x, z, ground, roof]

const tierOf = (r) => (r <= 3 ? 3 : r >= 19 ? 20 : r >= 18 ? 18 : 16);
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, R: tierOf(r) });
const at = (x, z) => foot.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const outsideFaces = (x, z) => DIRS.filter(([dx, dz]) => !at(x + dx, z + dz)).length;
// Shell: a face to the street, or to a lower tier. Everything else is hollow behind the glass, with floor slabs.
const isShell = (x, z) => DIRS.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.R < at(x, z).R; });
const FLOORS = [1, 4, 7, 10, 13, 16];          // storey lines: 3-block storeys above the shopfront band

const G = new Voxels([16, 32, 26]);
const put = (x, y, z, b, s) => G.set(x, y, z, b, s);
const cellsList = [...foot.keys()].map((k) => k.split(",").map(Number));

// Interior cell one step in from a shell cell: where a light behind the glass sits.
const inward = (x, z) => DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) => at(nx, nz) && !isShell(nx, nz));

for (const [x, z] of cellsList) {
  const { g: ground, R } = at(x, z);
  const shell = isShell(x, z);
  const pier = outsideFaces(x, z) >= 2 || (x + z) % 3 === 0;   // quoins at corners, piers every third bay
  for (let y = 0; y < R; y++) {
    if (y < ground) { put(x, y, z, "polished_granite"); continue; }                  // foundation under the ground line
    if (y === R - 1) {                                                              // roof cap; parapet on shell, terrace deck on the 3 tier
      put(x, y, z, shell ? "smooth_quartz" : R === 3 ? ((x + z) % 2 ? "moss_block" : "smooth_stone") : "gray_concrete");
      continue;
    }
    if (!shell) {                                                                   // hollow: floor slab per storey and at the ground line
      if (FLOORS.includes(y) || y === ground) put(x, y, z, "smooth_stone");
      continue;
    }
    let b;                                                                          // facade, bottom to top
    if (y <= 1) b = "polished_granite";                                             // plinth
    else if (y <= 3) b = pier ? "calcite" : "glass";                                // shopfront: clear glass, pier between
    else if (FLOORS.includes(y)) b = "smooth_quartz";                               // storey band
    else if (pier) b = "calcite";
    else b = "gray_stained_glass";                                                  // office glazing
    // office glass sits one block back in the hollow: a reveal between the bands and piers; lit ones get a glowstone behind
    const i = b === "gray_stained_glass" ? inward(x, z) : null;
    if (i && y >= at(...i).g && y < at(...i).R - 1) {
      put(x, y, z, "air");
      put(i[0], y, i[1], "gray_stained_glass");
      const i2 = [2 * i[0] - x, 2 * i[1] - z];
      if (at(...i2) && !isShell(...i2) && (x * 7 + z * 5 + y * 3) % 11 === 0 && y < at(...i2).R - 1) put(i2[0], y, i2[1], "glowstone");
      continue;
    }
    put(x, y, z, b);
    // shroomlight behind a few shop windows

    if (b === "glass" && y === 2 && (x * 3 + z) % 7 === 0) {
      const i = inward(x, z); if (i) put(i[0], y, i[1], "shroomlight");
    }
  }
}

// Entrance on the west face at z 6: a stair up from the street, a dark oak door, a canopy and two lanterns under it.
const [ex, ez] = [0, 6];
put(ex, 1, ez, "stone_brick_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
const doorState = { facing: "west", hinge: "left", open: "false", powered: "false" };
put(ex, 2, ez, "dark_oak_door", { ...doorState, half: "lower" });
put(ex, 3, ez, "dark_oak_door", { ...doorState, half: "upper" });
for (let z = 5; z <= 7; z++) put(ex, 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
for (const z of [5, 7]) put(ex, 3, z, "lantern", { hanging: "true", waterlogged: "false" });

// Mechanical penthouse on the 20-block tower: a stone box with glazed middles, capped at 22.
for (let x = 7; x <= 10; x++) for (let z = 13; z <= 16; z++) {
  for (const y of [20, 21]) {
    const edgeX = x === 7 || x === 10, edgeZ = z === 13 || z === 16;
    const glazed = (edgeX && !edgeZ && (z === 14 || z === 15)) || (edgeZ && !edgeX && (x === 8 || x === 9));
    put(x, y, z, edgeX || edgeZ ? (glazed ? "gray_stained_glass" : "stone_bricks") : "air");
  }
  put(x, 22, z, "stone_bricks");
}

// Roof terrace over the low courtyard wing: lanterns on the deck.
for (const [x, z] of [[13, 16], [14, 22]]) put(x, 3, z, "lantern", { hanging: "false", waterlogged: "false" });

const out = `${DIR}/DC55139.nbt`;
const info = G.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries`);
