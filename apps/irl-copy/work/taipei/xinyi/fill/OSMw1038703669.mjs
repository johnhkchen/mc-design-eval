import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise commercial block, c. 1980s Xinyi-area style: beige quartz-tile walls,
// white concrete piers, red sign band over a glazed ground-floor shopfront,
// two storeys of ribbon windows with frames, cornice and parapet, flat roof with
// cooling units. Floors follow each cell's own ground, so the downhill side
// carries its extra storey on a foundation.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const CELLS = `${DIR}/OSMw1038703669.cells.json`;
const OUT = `${DIR}/OSMw1038703669.nbt`;

const W = 14, H = 23, D = 37;
const TOP = 11;      // parapet top sits 11 blocks above the cell's own ground
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const minG = Math.min(...cells.map(c => c[2]));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr - minG);
const has = (x, z) => G.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

for (const [x, z] of cells) {
  const gr = G.get(`${x},${z}`);
  const nN = has(x, z - 1), nS = has(x, z + 1), nW = has(x - 1, z), nE = has(x + 1, z);
  const ring = !(nN && nS && nW && nE);
  const exNS = !nN || !nS;     // wall runs along x
  const exEW = !nW || !nE;     // wall runs along z
  const corner = exNS && exEW;

  // Foundation below grade.
  for (let y = 0; y < gr; y++) S(x, y, z, "stone");

  // Ground-storey deck (base course on the ring).
  S(x, gr, z, ring ? "stone_bricks" : "smooth_stone");

  // Storey 1 (local 1..4) and storey 2 (local 6..9) on ring cells.
  if (ring) {
    const t = exNS ? x : z;
    const pier = corner || t % 3 === 0;

    // Ground storey: shopfront or pier.
    for (let l = 1; l <= 3; l++) {
      if (pier) S(x, gr + l, z, "white_concrete");
      else if (l === 1) S(x, gr + l, z, "smooth_stone");
      else S(x, gr + l, z, "glass");
    }
    S(x, gr + 4, z, pier ? "white_concrete" : "red_concrete"); // sign band / pier cap

    // Storey 2 windows: frame, glass, head.
    S(x, gr + 5, z, "smooth_stone");                            // floor band
    for (let l = 6; l <= 9; l++) {
      if (pier) S(x, gr + l, z, "quartz_block");
      else if (l === 6 || l === 9) S(x, gr + l, z, "light_gray_concrete");
      else S(x, gr + l, z, "glass_pane");
    }

    // Cornice and parapet.
    S(x, gr + 10, z, "smooth_stone");
    S(x, gr + 11, z, "smooth_quartz");

    // Warm light behind glass (interior cell just inside the ring).
    const dx = !nW ? 1 : !nE ? -1 : 0;
    const dz = !nN ? 1 : !nS ? -1 : 0;
    const ix = x + (exEW ? dx : 0), iz = z + (exNS ? dz : 0);
    if (!pier && has(ix, iz) && !(ix === x && iz === z)) {
      const interiorRing = !(has(ix, iz - 1) && has(ix, iz + 1) && has(ix - 1, iz) && has(ix + 1, iz));
      if (!interiorRing) {
        if (t % 6 === 1) S(ix, gr + 7, iz, "glowstone");
        if (t % 4 === 2) S(ix, gr + 2, iz, "glowstone");
      }
    }

    // Main entrance on the north (z-min) wall, centred.
    if (!nN && (x === 6 || x === 7)) {
      if (x === 6) {
        S(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        S(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        S(x, gr + 1, z, "glass");
        S(x, gr + 2, z, "glass");
      }
      S(x, gr + 3, z, "glass"); // transom
    }
  } else {
    // Interior: floor deck over storey 1 and roof deck.
    S(x, gr + 5, z, "smooth_stone");
    S(x, gr + 10, z, "gray_concrete");
    // Rooftop cooling units on a loose grid, sitting inside the parapet.
    if ((x * 7 + z * 3) % 11 === 0) S(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save(OUT);
