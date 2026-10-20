import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 11, H = 23, D = 17;
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541374051.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541374051.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and ground per cell (lowest ground is y 0; roof ~11 above it).
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(x + "," + z, Math.max(0, Math.min(9, Math.round(gr))));
}
const inF = (x, z) => G.has(x + "," + z);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade grammar (era: late-20th-century Taipei commercial block, white tile and glass):
// y 0..3 shopfront storey, y 4 lintel band, y 5 floor line, y 6..8 window storey,
// y 9 sill band, y 10 cornice/roof deck. Penthouse plant room to y 12.
const MID_ROOF_Y = 10;

for (const [key, g0] of G) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");
  // Ground slab for this cell.
  put(x, g0, z, "smooth_stone");

  const nW = !inF(x - 1, z), nE = !inF(x + 1, z);
  const nN = !inF(x, z - 1), nS = !inF(x, z + 1);
  const shell = nW || nE || nN || nS;

  // Roof deck across the whole footprint.
  put(x, MID_ROOF_Y, z, shell ? "smooth_quartz" : "light_gray_concrete");

  // Interior floor slab at the second storey line.
  if (5 > g0) put(x, 5, z, "smooth_stone");

  if (!shell) continue;

  // Choose the outward face: x-faces first (corners read as x-faces), then z-faces.
  let face, dx = 0, dz = 0, L, along;
  if (nW || nE) {
    face = "x"; dx = nW ? -1 : 1; L = D; along = z;
  } else {
    face = "z"; dz = nN ? -1 : 1; L = W; along = x;
  }
  const ix = face === "x" ? -dx : 0;
  const iz = face === "z" ? -dz : 0;
  const mid = Math.floor(L / 2);
  const isFront = face === "z" && dz === 1;
  const isDoorBay = isFront && Math.abs(along - mid) <= 1 && along === mid;
  const mullion = along === 0 || along === L - 1 || along % 3 === 0;

  const paneProps = face === "x"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

  const inside = inF(x + ix, z + iz);
  const ix2 = x + ix, iz2 = z + iz;

  for (let y = g0 + 1; y <= 9; y++) {
    if (y <= 3) {
      // Shopfront storey.
      if (isDoorBay) {
        if (y === g0 + 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (y === g0 + 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "light_gray_concrete");
      } else if (mullion) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass");
      }
    } else if (y === 4) {
      // Lintel band; dark canopy slab over the entrance bay.
      if (isDoorBay) put(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
      else put(x, y, z, "light_gray_concrete");
    } else if (y === 5) {
      put(x, y, z, "smooth_stone");
    } else if (y >= 6 && y <= 8) {
      // Window storey: panes in frames of white concrete mullions.
      if (mullion) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
    } else if (y === 9) {
      put(x, y, z, "light_gray_concrete");
    }
  }

  // Cornice on the shell top.
  put(x, MID_ROOF_Y, z, "smooth_quartz");

  // Warm light behind some glazed bays (interior air gap cell).
  if (inside && !mullion && !isDoorBay) {
    if (along % 6 === 2) put(ix2, 2, iz2, "glowstone");
    if (along % 6 === 4) put(ix2, 7, iz2, "shroomlight");
  }
}

// Rooftop plant room on the central footprint cells.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
for (let x = cx - 1; x <= cx + 1; x++) {
  for (let z = cz - 2; z <= cz; z++) {
    if (!inF(x, z)) continue;
    const edge = x === cx - 1 || x === cx + 1 || z === cz - 2 || z === cz;
    for (let y = 11; y <= 12; y++) {
      put(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
    }
    put(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
