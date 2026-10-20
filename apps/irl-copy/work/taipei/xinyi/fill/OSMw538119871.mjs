import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 6 x 19 footprint, roof about 11 blocks above lowest ground.
// Reading: a two-storey, mid-century (1960s-70s) Taipei shophouse-style block.
// Ground floor is a shopfront with a recessed entrance on the street (north) face.
// Upper floor is white glazed-tile wall with a window grid. Flat roof, stone
// parapet, small rooftop water tank and an AC unit.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119871";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 23, D = 19;
const ROOF = 11;          // roof slab layer, 11 above lowest ground
const PARA_TOP = ROOF + 2; // parapet occupies 12..13
const FLOOR2 = 6;          // second-floor slab layer
const CORNICE_1 = 5;       // storey line above shopfront band
const CORNICE_2 = 10;      // storey line under roof

const key = (x, z) => `${x},${z}`;
const base = Math.min(...cells.map(c => c[2]));
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr - base);
const has = (x, z) => G.has(key(x, z));

const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
};
// along-face index used for pier/window rhythm
const along = (f, x, z) => (f === "n" || f === "s") ? x : z;

const g = new Voxels([W, H, D]);

for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const fs = faces(x, z);
  const edge = fs.length > 0;
  const f = fs.includes("n") ? "n" : fs[0];

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor base course and storey walls.
  for (let y = gr + 1; y <= ROOF - 1; y++) {
    if (!edge) continue; // interior: air gap, floor slabs handled below

    const a = along(f, x, z);

    // Entrance on the street (north) face: double door, recessed at x = 2.
    if (f === "n" && a === 2 && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    let blk = "white_terracotta";
    if (y === gr + 1) {
      blk = "stone_bricks"; // base course
    } else if (y === CORNICE_1 || y === CORNICE_2 || y === FLOOR2) {
      blk = "smooth_quartz"; // storey lines
    } else {
      const band1 = y >= gr + 2 && y <= 4;
      const band2 = y >= 7 && y <= 9;
      if (band1 || band2) {
        const pier = a % 3 === 0;
        if (f === "n" && band1) {
          // shopfront: full glass with piers
          blk = pier ? "smooth_quartz" : "glass_pane";
        } else {
          blk = pier ? "white_terracotta" : "glass_pane";
        }
      }
    }
    g.set(x, y, z, blk);
  }

  // Roof slab over whole footprint (floor/roof structure, interior included).
  g.set(x, ROOF, z, "smooth_quartz");

  // Parapet on the edge only.
  if (edge) {
    for (let y = ROOF + 1; y <= PARA_TOP; y++) {
      g.set(x, y, z, "stone_brick_wall");
    }
  }

  // Second-floor slab across interior cells (air gap above ground floor).
  if (!edge && FLOOR2 > gr) g.set(x, FLOOR2, z, "smooth_quartz");
}

// Warm lights: glowstone just inside some ground-floor windows.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const fs = faces(x, z);
  if (fs.length === 0) continue;
  const f = fs.includes("n") ? "n" : fs[0];
  const a = along(f, x, z);
  if (a % 6 !== 1 || gr + 2 > 3) continue;
  const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] }[f];
  const ix = x + inward[0], iz = z + inward[1];
  if (has(ix, iz) && faces(ix, iz).length === 0) {
    g.set(ix, 3, iz, "glowstone");
  }
}

// Rooftop equipment: water tank (2 x 2, two high) and an AC unit.
const roofPut = (x, y, z, blk) => { if (has(x, z)) g.set(x, y, z, blk); };
for (const [x, z] of [[1, 14], [2, 14], [1, 15], [2, 15]]) {
  roofPut(x, ROOF + 1, z, "white_concrete");
  roofPut(x, ROOF + 2, z, "white_concrete");
}
roofPut(4, ROOF + 1, 16, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
