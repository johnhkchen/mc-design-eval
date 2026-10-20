import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Xinyi commercial block (1980s-90s mid-rise shophouse character):
// stone plinth, white tiled (terracotta) walls, quartz storey lines, grey concrete frames,
// glazed shopfront on the ground floor, punched window bays above, cornice and parapet.
// Roof about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833577";
const W = 19, H = 23, D = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...cells.map((c) => c[2]));

// cell key "x,z" -> ground relative to the lowest ground (y 0)
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, Math.round(gr - minG));

const has = (x, z) => cellMap.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Facade block for an exterior cell at storey-relative height rel (1..11).
function facadeBlock(rel, t, corner) {
  switch (rel) {
    case 1: return "stone_bricks";                 // base course / plinth
    case 2:
    case 3:                                        // ground-floor shopfront glazing
      return (corner || t % 3 === 0) ? "smooth_quartz" : "glass";
    case 4: return "smooth_quartz";                // shopfront lintel
    case 5: return "smooth_quartz";                // storey line
    case 6: return "gray_concrete";                // upper window sill frame
    case 7:
    case 8:                                        // upper-floor windows
      return (corner || t % 3 !== 1) ? "white_terracotta" : "glass";
    case 9: return "gray_concrete";                // window head frame
    case 10: return "smooth_quartz";               // cornice
    case 11: return "white_terracotta";            // parapet
    default: return "white_terracotta";
  }
}

// Entrance: find the southern-most exterior cells on the z max edge and take the middle one.
let maxZ = -Infinity;
for (const key of cellMap.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z + 1) && z > maxZ) maxZ = z;
}
const frontXs = [...cellMap.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => z === maxZ)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : null;

for (const [key, gr] of cellMap) {
  const [x, z] = key.split(",").map(Number);

  const N = !has(x, z - 1);
  const S = !has(x, z + 1);
  const Wf = !has(x - 1, z);
  const E = !has(x + 1, z);
  const ext = N || S || Wf || E;
  const corner = (N || S) && (Wf || E);
  const t = (N || S) ? x : z;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs per storey (ground-floor ceiling and roof), interior cells only;
  // exterior cells get the storey-line blocks from the facade.
  if (!ext) {
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
  }

  // Facade and storey lines on exterior cells, storey-relative rel 1..11.
  if (ext) {
    for (let rel = 1; rel <= 11; rel++) {
      put(x, gr + rel, z, facadeBlock(rel, t, corner));
    }
  }

  // Rooftop plant on interior roof cells, sitting on the roof slab.
  if (!ext && x % 5 === 2 && z % 5 === 2) {
    put(x, gr + 11, z, "iron_block");
  }

  // Warm lights behind glass: inward cell of single-face wall cells.
  if (ext && !corner) {
    let dx = 0, dz = 0;
    if (N) dz = 1;
    else if (S) dz = -1;
    else if (Wf) dx = 1;
    else if (E) dx = -1;
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz)) {
      const igr = cellMap.get(`${ix},${iz}`);
      if (t % 6 === 2) put(ix, igr + 2, iz, "glowstone");   // shopfront light
      if (t % 6 === 4) put(ix, igr + 7, iz, "shroomlight");  // upper-floor light
    }
  }
}

// Main entrance on the south (z max) face, middle bay.
if (doorX !== null) {
  const gr = cellMap.get(`${doorX},${maxZ}`);
  put(doorX, gr + 1, maxZ, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, gr + 2, maxZ, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, gr + 3, maxZ, "smooth_quartz"); // door head / transom
}

g.save(`${DIR}/${ID}.nbt`);
