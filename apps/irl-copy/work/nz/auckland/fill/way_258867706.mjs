import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1970s concrete-frame office block on a glazed shopfront base: 4 storeys on most of the footprint, 5 on the south-east
// wing, a 6-storey tower on the east side, white precast piers, light-grey storey lines, blue glass between, a
// recessed entrance on the north (z-min) face, a plant room on the tower roof and planted terraces on the low roofs.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_258867706.cells.json", "utf8"));
const W = 77, D = 60, H = 38;
const g = new Voxels([W, H, D]);

const FOOT = "stone_bricks", SLAB = "smooth_stone", ROOF = "gray_concrete", PIER = "white_concrete";
const SPAND = "light_gray_concrete", GLASS = "light_blue_stained_glass", LIT = "glowstone", BASE = "polished_andesite";
const CAP = "smooth_stone_slab";

// the footprint: key "x,z" -> lidar roof height (above y 0); ground is the cell's third number (0 or 1)
const roof = new Map();
for (const [x, z, , r] of cells) roof.set(`${x},${z}`, r);
const inF = (x, z) => roof.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// lidar noise smoothed: median roof height over the cells within 2 blocks
const smooth = new Map();
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number), vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inF(x + dx, z + dz)) vals.push(roof.get(`${x + dx},${z + dz}`));
  vals.sort((a, b) => a - b); smooth.set(k, vals[vals.length >> 1]);
}
// storeys per cell: a clean tier per band of smoothed roof height (4-block storeys, roof slab on the storey grid)
const storeys = new Map();
for (const [k, r] of smooth) storeys.set(k, r <= 21 ? 4 : r <= 23 ? 5 : 6);
const N = (x, z) => storeys.get(`${x},${z}`);
// a face is exterior at storey k when the neighbour has no storey k: outside the footprint or shorter
const exposed = (x, z, k) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || N(x + dx, z + dz) <= k);

// the entrance: the north (z-min) face, centred on where the ground-level face is
const northX = [];
for (const k of roof.keys()) { const [x, z] = k.split(",").map(Number); if (!inF(x, z - 1)) northX.push(x); }
const entranceX = northX.length ? northX[northX.length >> 1] : 38;
const entranceZ = Math.min(...[...roof.keys()].map((k) => k.split(",").map(Number)).filter(([x]) => x === entranceX).map(([, z]) => z));

// the tower's centre (the 6-storey cells) for its plant room
const tower = [...storeys].filter(([, n]) => n === 6).map(([k]) => k.split(",").map(Number));
const tcx = Math.round(tower.reduce((s, [x]) => s + x, 0) / tower.length), tcz = Math.round(tower.reduce((s, [, z]) => s + z, 0) / tower.length);

const doorLower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const doorUpper = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
const lanternHang = { hanging: "true", waterlogged: "false" };
const leaves = { persistent: "true", distance: "7", waterlogged: "false" };

for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number), n = N(x, z), T = 2 + 4 * n;

  // foundation: solid from y 0 to the ground under every cell (ground 0 or 1), so nothing floats on a slope
  for (let y = 0; y <= 1; y++) g.set(x, y, z, FOOT);

  // storeys: a floor slab at each storey line, walls in the three rows above it on the exposed faces
  for (let s = 0; s < n; s++) {
    const F = 2 + 4 * s;
    g.set(x, F, z, SLAB);
    const ex = exposed(x, z, s);
    if (!ex.length) {
      // interior: an air room with a column on the 8-block grid (the slab rests on it, not on air)
      if (x % 8 === 4 && z % 8 === 4) for (let y = F + 1; y <= F + 3; y++) g.set(x, y, z, PIER);
      continue;
    }
    // along the face: the bay index; corners take the z-facing bay
    const zFace = ex.some(([, dz]) => dz !== 0);
    const idx = zFace ? x : z;
    const pier = idx % 8 === 0 || (ex.length > 1 && (x === 0 || z === 0 || x === W - 1 || z === D - 1));
    const lit = s % 2 === 1 && idx % 8 === 4;
    const door = s === 0 && ex.some(([dx, dz]) => dz === -1) && x === entranceX && z === entranceZ;
    for (let y = F + 1; y <= F + 3; y++) {
      let b;
      if (y === F + 1) b = s === 0 ? BASE : SPAND;
      else b = lit ? LIT : GLASS;
      if (pier) b = PIER;
      if (s === 0 && y === F + 1 && !pier) b = BASE;
      if (door) {
        if (y === F + 1) { g.set(x, y, z, "dark_oak_door", doorLower); continue; }
        if (y === F + 2) { g.set(x, y, z, "dark_oak_door", doorUpper); continue; }
        b = PIER; // lintel over the door
      }
      g.set(x, y, z, b);
    }
    // a hanging lantern just inside the entrance, hung from the first floor slab
    if (door) g.set(x, F + 1, z + 1, "lantern", lanternHang);
  }

  // roof: the membrane at T; a parapet and cap on any edge that drops away (taller tiers keep their edge)
  g.set(x, T, z, ROOF);
  const edge = exposed(x, z, n);
  if (edge.length) { g.set(x, T + 1, z, PIER); g.set(x, T + 2, z, CAP, { type: "bottom", waterlogged: "false" }); }
  // planted terraces on the interior roofs of the low tiers
  else if (n === 4 && x % 6 === 0 && z % 6 === 0) g.set(x, T + 1, z, "oak_leaves", leaves);
}

// tower plant room: a 7 x 7 box of light-grey concrete on the tower roof, roof capped (only where the whole box is tower)
for (let x = tcx - 3; x <= tcx + 3; x++) for (let z = tcz - 3; z <= tcz + 3; z++) {
  if (!inF(x, z) || N(x, z) !== 6) continue;
  const T = 2 + 4 * 6, rim = x === tcx - 3 || x === tcx + 3 || z === tcz - 3 || z === tcz + 3;
  for (let y = T + 1; y <= T + 3; y++) if (rim || y === T + 3) g.set(x, y, z, SPAND);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_258867706.nbt";
const r = g.save(out);
console.log(JSON.stringify({ entranceX, entranceZ, tower: [tcx, tcz], towerCells: tower.length, ...r }));
