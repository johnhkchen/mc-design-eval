import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 11 x 23 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, early-1990s Taipei commercial block: a stone base,
// a shopfront ground storey with a red fascia over a central entrance, an
// upper storey of white tile bays with quartz heads, a cornice parapet, and
// a stair/lift housing with AC plant on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618825";
const W = 11, H = 23, D = 23;
const ROOF = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(gr, ROOF - 2)));
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const missingFaces = (x, z) => {
  const out = [];
  if (!inFp(x, z - 1)) out.push("N");
  if (!inFp(x, z + 1)) out.push("S");
  if (!inFp(x - 1, z)) out.push("W");
  if (!inFp(x + 1, z)) out.push("E");
  return out;
};
const isExterior = (x, z) => inFp(x, z) && missingFaces(x, z).length > 0;
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Shell, storeys, facades
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const missing = missingFaces(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (missing.length === 0) {
    // Interior cell: floor slabs per storey, roof slab, air elsewhere.
    g.set(x, gr, z, "smooth_stone");
    if (gr < 5) g.set(x, 5, z, "smooth_stone");
    g.set(x, ROOF, z, "gray_concrete");
    continue;
  }

  const face = missing[0];
  const i = face === "N" || face === "S" ? x : z;

  // Exterior wall column from ground to frieze.
  for (let y = gr; y <= 10; y++) {
    let b;
    if (y === gr) b = "polished_andesite";                       // base course
    else if (y <= 4) b = i % 3 === 0 ? "white_concrete" : "light_blue_stained_glass"; // shopfront
    else if (y === 5) b = "smooth_stone";                        // storey line
    else if (y <= 8) b = i % 2 === 1 ? "glass_pane" : "white_concrete"; // upper bays
    else if (y === 9) b = "quartz_block";                        // window heads
    else b = "white_concrete";                                   // frieze
    g.set(x, y, z, b);
  }

  // Interior floor slabs (behind the wall, per storey)
  if (gr < 5) g.set(x, 5, z, "smooth_stone");

  // Parapet / cornice at roof level
  g.set(x, ROOF, z, "smooth_stone");

  // Warm light behind some upper windows
  if (i % 4 === 3) {
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (isExterior(ix, iz) === false && inFp(ix, iz)) g.set(ix, 7, iz, "glowstone");
  }

  // Red fascia over the shopfront on the street face
  if (face === "N" && i >= 3 && i <= 7 && gr < 4) {
    g.set(x, 4, z, "red_concrete");
  }

  // Central entrance on the street face
  if (face === "N" && i === 5 && gr + 2 <= 4) {
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Roof: stair and lift housing, supported on the roof slab
for (let x = 3; x <= 7; x++) {
  for (let z = 8; z <= 14; z++) {
    if (!inFp(x, z)) continue;
    const ring = x === 3 || x === 7 || z === 8 || z === 14;
    if (ring) for (let y = ROOF + 1; y <= ROOF + 3; y++) g.set(x, y, z, "white_concrete");
    g.set(x, ROOF + 4, z, "smooth_stone");
  }
}

// AC plant on the roof, a small block of iron units
for (let x = 1; x <= 2; x++) {
  for (let z = 3; z <= 5; z++) {
    if (inFp(x, z)) g.set(x, ROOF + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
