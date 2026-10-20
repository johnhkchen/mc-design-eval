import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-style office/shop block, c. 1980s: white concrete frame with
// light-grey piers, tinted glazing in bands, granite base, smooth-stone floor
// lines, parapet and a central plant penthouse. Two storeys of 5 blocks, roof at y 11.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459505.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459505.nbt";
const W = 20, H = 23, D = 25;
const ROOF = 11;

const DIRS = [
  { name: "n", dx: 0, dz: -1 },
  { name: "s", dx: 0, dz: 1 },
  { name: "w", dx: -1, dz: 0 },
  { name: "e", dx: 1, dz: 0 },
];

// ---- footprint ----
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const G = new Map();
for (const [x, z, gy] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(gy))));
}
const has = (x, z) => G.has(`${x},${z}`);
const exposed = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isPerim = (x, z) => exposed(x, z).length > 0;
const entries = [...G.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});

// ---- front (entrance) face: prefer south, then north, east, west ----
let front = null;
for (const nm of ["s", "n", "e", "w"]) {
  if (entries.some((c) => { const e = exposed(c.x, c.z); return e.length === 1 && e[0].name === nm; })) {
    front = nm;
    break;
  }
}
const frontDir = DIRS.find((d) => d.name === front);
const alongOf = (x, z, d) => (d.dz !== 0 ? x : z);
let mid = -999;
if (frontDir) {
  const fc = entries.filter((c) => { const e = exposed(c.x, c.z); return e.length === 1 && e[0].name === front; });
  if (fc.length) {
    const vals = fc.map((c) => alongOf(c.x, c.z, frontDir));
    mid = Math.floor((Math.min(...vals) + Math.max(...vals)) / 2);
  }
}

// ---- materials ----
const FOUND = "stone_bricks";
const BASE = "polished_granite";
const WALL = "white_concrete";
const PIER = "light_gray_concrete";
const GLASS = "gray_stained_glass";
const LINE = "smooth_stone";
const ROOFM = "gray_concrete";

// ---- facade rule for a perimeter cell at height y ----
function facade(c, y, ex) {
  const { x, z, gr } = c;
  if (y === gr) return BASE;
  const corner = ex.length > 1;
  const d = ex[0];
  const along = alongOf(x, z, d);
  const pier = corner || along % 3 === 0;

  // entrance bay on the front face, three cells wide
  if (!corner && frontDir && d.name === front && Math.abs(along - mid) <= 1) {
    if (y === gr + 3) return LINE; // canopy / lintel
    if (y > gr && y <= gr + 2) {
      if (along === mid && y === gr + 2) {
        vox.set(x, y, z, "lantern", { hanging: "true" });
      }
      return null; // doorway opening
    }
  }

  if (y === 5 || y === 10) return LINE;          // floor lines
  if (y === ROOF) return pier ? PIER : WALL;      // parapet
  if (y < 5) {                                    // storey 1: shopfront band
    if (pier) return PIER;
    if (y === 4) return WALL;                     // spandrel
    return y <= Math.min(gr + 3, 3) ? GLASS : WALL;
  }
  // storey 2
  if (pier) return PIER;
  if (y === 9) return WALL;                       // spandrel
  return GLASS;
}

// ---- build ----
const vox = new Voxels([W, H, D]);

for (const c of entries) {
  const { x, z, gr } = c;
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) vox.set(x, y, z, FOUND);

  const ex = exposed(x, z);
  if (ex.length > 0) {
    for (let y = gr; y <= ROOF; y++) {
      const b = facade(c, y, ex);
      if (b) vox.set(x, y, z, b);
    }
  } else {
    // interior: floor slabs and roof deck, no interior fit-out
    if (gr <= 5) vox.set(x, 5, z, LINE);
    vox.set(x, 10, z, LINE);
    vox.set(x, ROOF, z, ROOFM);
    if (gr > 0) vox.set(x, gr, z, LINE);

    // warm lights behind windows (interior cells next to the facade)
    const nearPerim = DIRS.some((d) => isPerim(x + d.dx, z + d.dz) && has(x + d.dx, z + d.dz));
    if (nearPerim) {
      if (gr < 7 && (x * 5 + z * 3) % 4 === 0) vox.set(x, 7, z, "shroomlight");
      if (gr + 2 <= 3 && (x + z * 2) % 5 === 0) vox.set(x, gr + 2, z, "glowstone");
    }
  }
}

// ---- roof plant penthouse on the interior of the roof ----
for (let x = 6; x <= 13; x++) {
  for (let z = 8; z <= 16; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    const border = x === 6 || x === 13 || z === 8 || z === 16;
    if (border) {
      vox.set(x, 12, z, PIER);
      vox.set(x, 13, z, (x + z) % 2 === 0 ? GLASS : WALL);
    }
    vox.set(x, 14, z, ROOFM);
  }
}
if (has(10, 12) && !isPerim(10, 12)) vox.set(10, 15, 12, "lightning_rod");

// rooftop condenser units
for (const [x, z] of [[3, 4], [16, 20]]) {
  if (has(x, z) && !isPerim(x, z)) vox.set(x, 12, z, "iron_block");
}

vox.save(OUT);
