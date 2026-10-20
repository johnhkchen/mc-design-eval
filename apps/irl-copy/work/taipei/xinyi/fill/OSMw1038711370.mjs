import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey commercial block (c. 1980s Taipei shophouse-style): stone plinth,
// shopfront with a central entrance, upper storey of tinted-glass bays between
// white concrete piers, stone cornice, white parapet and a small roof plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711370";
const W = 13, H = 23, D = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of cells) ground.set(`${c[0]},${c[1]}`, c[2]);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const OPP = { n: "s", s: "n", w: "e", e: "w" };
const FACING = { n: "north", s: "south", w: "west", e: "east" };

const exterior = (x, z) =>
  Object.keys(DIRS).filter((k) => !has(x + DIRS[k][0], z + DIRS[k][1]));
const isCorner = (f) =>
  (f.includes("n") || f.includes("s")) && (f.includes("w") || f.includes("e"));
const along = (k, x, z) => (k === "n" || k === "s" ? x - minX : z - minZ);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance: the non-corner exterior face with the most cells; door at its middle.
const perim = cells.filter(([x, z]) => exterior(x, z).length > 0);
const nonCorner = perim.filter(([x, z]) => !isCorner(exterior(x, z)));
const faceCount = { n: 0, s: 0, w: 0, e: 0 };
for (const [x, z] of nonCorner) for (const k of exterior(x, z)) faceCount[k]++;
let entryFace = "s";
for (const k of ["n", "s", "w", "e"]) if (faceCount[k] > faceCount[entryFace]) entryFace = k;
const entryCands = nonCorner
  .filter(([x, z]) => exterior(x, z).includes(entryFace))
  .sort((a, b) => along(entryFace, a[0], a[1]) - along(entryFace, b[0], b[1]));
const entry = entryCands.length
  ? entryCands[Math.floor(entryCands.length / 2)]
  : null;
const entryKey = entry ? `${entry[0]},${entry[1]}` : null;

for (const [x, z, gr] of cells) {
  const f = exterior(x, z);
  const per = f.length > 0;

  // Foundation and floor/base course
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, per ? "polished_andesite" : "smooth_stone");

  // Floor slab at second storey (spandrel band on the facade)
  put(x, gr + 5, z, per ? "light_gray_concrete" : "smooth_stone");
  // Roof deck / cornice line
  put(x, gr + 10, z, per ? "stone_bricks" : "smooth_stone");

  if (!per) {
    // Roof plant box on the central interior cells
    if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 4) {
      put(x, gr + 11, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = isCorner(f);
  const k = corner ? null : f[0];
  const a = corner ? 0 : along(k, x, z);
  const pier = corner || a % 3 === 0;
  const isEntry = entryKey === `${x},${z}` && k === entryFace;

  // Ground storey: shopfront glass, white piers, stone fascia
  for (let dy = 1; dy <= 3; dy++) {
    const y = gr + dy;
    if (isEntry && dy <= 2) {
      const props = {
        facing: FACING[OPP[k]],
        half: dy === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
      put(x, y, z, "dark_oak_door", props);
    } else if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }
  put(x, gr + 4, z, "stone_bricks");

  // Upper storey: tinted-glass bays between white piers, framed by lintel/sill bands
  if (pier) {
    for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "white_concrete");
  } else {
    put(x, gr + 6, z, "light_gray_concrete");
    put(x, gr + 7, z, "light_blue_stained_glass");
    put(x, gr + 8, z, "light_blue_stained_glass");
    put(x, gr + 9, z, "light_gray_concrete");

    // Warm light behind some upper windows (on the interior floor slab)
    if (!corner && Math.floor(a / 3) % 2 === 0 && a % 3 === 1) {
      const ix = x - DIRS[k][0], iz = z - DIRS[k][1];
      if (has(ix, iz) && exterior(ix, iz).length === 0) {
        put(ix, gAt(ix, iz) + 6, iz, "glowstone");
      }
    }
  }

  // Cornice and parapet
  put(x, gr + 10, z, "stone_bricks");
  put(x, gr + 11, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
