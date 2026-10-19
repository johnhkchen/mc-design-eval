// DC71864: 101 G St SW, a 1960s Southwest urban-renewal residential slab with two elevator cores.
// Brick shell with a white concrete storey line every three blocks, a one-block air gap behind the glass,
// a solid concrete core, and a grade-level entrance on the east face. Roof heights from the lidar, smoothed
// into flat tiers: 12 for the slab, 13 for the two elevator cores, 14 for the mechanical bulkheads on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71864.cells.json", "utf8"));
const g = new Voxels([10, 26, 31]);

// Rectangles [x0, z0, x1, z1, roof]. Mechanical rooms first so they win over the cores they sit on.
const inRect = (x, z, [x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const MECH = [[3, 8, 6, 9, 14], [4, 21, 6, 23, 14]];
const CORE = [[2, 4, 7, 10, 13], [2, 20, 6, 25, 13]];
const roofAt = (x, z) => {
  const r = [...MECH, ...CORE].find((rc) => inRect(x, z, rc));
  return r ? r[4] : 12;
};
const isMech = (x, z) => MECH.some((rc) => inRect(x, z, rc));

const ring = (x, z) => (x === 0 || x === 9 || z === 0 || z === 30 ? "border" : x === 1 || x === 8 || z === 1 || z === 29 ? "gap" : "inner");
const inLobby = (x, z) => x === 8 && z >= 13 && z <= 16;
const cornerCell = (x, z) => (x === 0 || x === 9) && (z === 0 || z === 30);
const lit = (k) => k % 4 === 0;

const WALL = "bricks", BAND = "white_concrete", BASE = "stone_bricks", SLAB = "light_gray_concrete";
const GLASS = "light_blue_stained_glass", ROOF = "gravel";

// Parapet walls connect along the face they sit on.
const parapet = (x) => ({
  id: "stone_brick_wall",
  state: x === 0 || x === 9
    ? { north: "low", south: "low", east: "none", west: "none", up: "true", waterlogged: "false" }
    : { east: "low", west: "low", north: "none", south: "none", up: "true", waterlogged: "false" },
});

// The street-side shell: piers, glass with white mullions, storey bands, cornice, parapet, and the entrance on x=9.
function borderBlock(x, z, y) {
  if (y === 0) return { id: BASE };
  if (y === 1 || y === 4 || y === 7 || y === 10) return { id: BAND };
  if (y === 11) return parapet(x);
  if (x === 9 && z >= 13 && z <= 16) {
    if (z === 14 && y === 0) return { id: "dark_oak_door", state: { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (z === 14 && y === 1) return { id: "dark_oak_door", state: { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (y === 2) return { id: "dark_oak_slab", state: { type: "bottom", waterlogged: "false" } };
    if (y === 3) return { id: GLASS };
  }
  if (cornerCell(x, z)) return { id: WALL };
  const i = x === 0 || x === 9 ? z : x;   // along-face index
  if (i % 4 === 0) return { id: WALL };
  if (i % 4 === 2) return { id: BAND };   // white mullion
  return { id: GLASS };
}

const isGlassWindow = (x, z, y) => {
  if (ring(x, z) !== "border" || y === 0 || y === 1 || y === 4 || y === 7 || y === 10 || y === 11) return false;
  if (x === 9 && z >= 13 && z <= 16) return y === 3;
  if (cornerCell(x, z)) return false;
  const i = x === 0 || x === 9 ? z : x;
  return i % 4 === 1 || i % 4 === 3;
};

// The one-block air gap behind the glass, the floor slabs at the storey lines, and the roof deck.
function gapBlock(x, z, y) {
  if (inLobby(x, z) && y <= 3) return null;
  if (y === 2 || y === 3 || y === 5 || y === 6 || y === 8 || y === 9) return null;
  if (y === 10) return { id: ROOF };
  return { id: SLAB };
}

// A core or mechanical bulkhead wall: brick where it is exposed above its neighbours, concrete where it is not.
const topOf = (x, z) => (ring(x, z) === "border" ? 11 : roofAt(x, z) > 12 ? roofAt(x, z) - 1 : 10);
const exposed = (x, z, y) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return topOf(nx, nz) < y || !footprint.has(`${nx},${nz}`);
  });

const footprint = new Set(cells.map(([x, z]) => `${x},${z}`));
const groundOf = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));

for (const [x, z] of cells) {
  const gr = groundOf.get(`${x},${z}`);
  const kind = ring(x, z);
  const top = topOf(x, z);
  for (let y = 0; y <= top; y++) {
    if (y < gr) { g.set(x, y, z, BASE); continue; }   // foundation: fill up to the cell's own ground
    if (kind === "border") {
      const b = borderBlock(x, z, y);
      g.set(x, y, z, b.id, b.state);
      continue;
    }
    if (kind === "gap") {
      const b = gapBlock(x, z, y);
      if (b) g.set(x, y, z, b.id, b.state);
      continue;
    }
    // inner: solid core, roof deck at the top of a slab, bulkhead walls and caps above it
    if (roofAt(x, z) > 12 && y >= 11) {
      if (y === roofAt(x, z) - 1) g.set(x, y, z, isMech(x, z) ? "iron_bars" : "stone_bricks");
      else g.set(x, y, z, exposed(x, z, y) ? WALL : SLAB);
      continue;
    }
    g.set(x, y, z, y === top ? ROOF : SLAB);
  }
}

// Glowstone in the air gap behind a few lit windows.
for (const [x, z] of cells) {
  for (let y = 2; y <= 9; y++) {
    if (!isGlassWindow(x, z, y)) continue;
    const i = x === 0 || x === 9 ? z : x;
    if (!lit(i * 3 + y * 5 + x + z)) continue;
    const gx = x === 9 ? 8 : x === 0 ? 1 : x;
    const gz = z === 0 ? 1 : z === 30 ? 29 : z;
    if (inLobby(gx, gz)) continue;
    g.set(gx, y, gz, "glowstone");
  }
}

// Rooftop plant: two boxes with louvred caps on the roof deck.
for (const [x0, z0] of [[3, 15], [6, 26]]) {
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    g.set(x0 + dx, 11, z0 + dz, SLAB);
    g.set(x0 + dx, 12, z0 + dz, "iron_bars");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71864.nbt");
