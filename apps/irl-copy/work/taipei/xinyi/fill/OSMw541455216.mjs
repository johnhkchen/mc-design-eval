import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455216";
const W = 19, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Palette: a two-storey mid-century Taipei commercial block.
// Cream tile and white concrete piers, red-tile storey line, cyan-tinted glass,
// stone-brick plinth, light-grey concrete roof with a parapet cap.
const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const PIER = "white_concrete";
const TILE = "white_terracotta";
const STRIPE = "red_terracotta";
const CORNICE = "smooth_quartz";
const CAP = "smooth_quartz";
const SILL = "smooth_quartz";
const GLASS = "cyan_stained_glass_pane";
const FLOOR = "light_gray_concrete";
const ROOF_EQ = "gray_concrete";

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(key(x, z), gr);
}
const has = (x, z) => G.has(key(x, z));
const clampGround = (v) => Math.min(Math.max(Math.round(v), 0), 10); // roof top stays below H
const groundOf = (x, z) => clampGround(G.get(key(x, z)));

const DIRS = {
  N: [0, -1, "north"],
  S: [0, 1, "south"],
  W: [-1, 0, "west"],
  E: [1, 0, "east"],
};

// Exposure per footprint cell
const exposure = (x, z) => {
  const out = [];
  for (const k of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[k];
    if (!has(x + dx, z + dz)) out.push(k);
  }
  return out;
};

// Pick the entrance: the centre-most north-facing (non-corner) exposed cell
const northCells = [];
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposure(x, z);
  if (ex.includes("N") && !(ex.includes("E") || ex.includes("W"))) northCells.push([x, z]);
}
let doorX = -1, doorZ = -1, doorFace = "N";
if (northCells.length) {
  const meanX = northCells.reduce((s, c) => s + c[0], 0) / northCells.length;
  northCells.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
  [doorX, doorZ] = northCells[0];
} else {
  // Fall back to any single-face exposed cell
  for (const k of G.keys()) {
    const [x, z] = k.split(",").map(Number);
    const ex = exposure(x, z);
    if (ex.length === 1) { doorX = x; doorZ = z; doorFace = ex[0]; break; }
  }
}

const paneProps = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Build every footprint cell
for (const [key0, gr0] of G) {
  const [x, z] = key0.split(",").map(Number);
  const gr = groundOf(x, z);
  const ex = exposure(x, z);
  const perimeter = ex.length > 0;
  const corner = ex.includes("N" ) !== ex.includes("S") ? false : false; // placeholder, replaced below
  const ns = ex.includes("N") || ex.includes("S");
  const ew = ex.includes("E") || ex.includes("W");
  const isCorner = ns && ew;

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Ground-floor deck / plinth
  g.set(x, gr, z, perimeter ? BASE : FLOOR);

  if (!perimeter) {
    // Interior: floor slabs per storey, air between, roof slab on top
    g.set(x, gr + 5, z, FLOOR);
    g.set(x, gr + 10, z, FLOOR);
    // Rooftop plant room in the middle of the roof
    if (x >= 7 && x <= 11 && z >= 5 && z <= 7) {
      g.set(x, gr + 11, z, ROOF_EQ);
      g.set(x, gr + 12, z, ROOF_EQ);
    }
    continue;
  }

  if (isCorner) {
    // Corner piers run the full height
    for (let y = gr + 1; y <= gr + 10; y++) g.set(x, y, z, PIER);
    g.set(x, gr + 11, z, CAP);
    g.set(x, gr + 5, z, STRIPE);
    g.set(x, gr + 10, z, CORNICE);
    continue;
  }

  // Facade cell on one exposed face
  const face = ns ? (ex.includes("N") ? "N" : "S") : (ex.includes("W") ? "W" : "E");
  const t = ns ? x : z;
  const isDoor = x === doorX && z === doorZ;
  const win = !isDoor && t % 3 !== 0;
  const props = paneProps(face);

  // Storey line, cornice and parapet
  g.set(x, gr + 5, z, STRIPE);
  g.set(x, gr + 10, z, CORNICE);
  g.set(x, gr + 11, z, CAP);

  // Storey 1 (ground, commercial)
  if (isDoor) {
    g.set(x, gr + 1, z, "iron_door", {
      facing: DIRS[doorFace][2], half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, "iron_door", {
      facing: DIRS[doorFace][2], half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    g.set(x, gr + 4, z, TILE);
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) {
      g.set(x, y, z, win ? GLASS : PIER, win ? props : undefined);
    }
    g.set(x, gr + 4, z, win ? TILE : PIER);
  }

  // Storey 2 (offices / residential)
  if (win) {
    g.set(x, gr + 6, z, SILL);
    g.set(x, gr + 7, z, GLASS, props);
    g.set(x, gr + 8, z, GLASS, props);
    g.set(x, gr + 9, z, TILE);
  } else {
    for (let y = gr + 6; y <= gr + 9; y++) g.set(x, y, z, PIER);
  }

  // Warm light behind some windows, in the interior cell just inside the glass
  if (win) {
    const dir = DIRS[face];
    const ix = x - dir[0], iz = z - dir[1];
    if (has(ix, iz) && exposure(ix, iz).length === 0 && groundOf(ix, iz) === gr) {
      if (t % 6 === 1) g.set(ix, gr + 2, iz, "glowstone");
      if (t % 6 === 4) g.set(ix, gr + 7, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
