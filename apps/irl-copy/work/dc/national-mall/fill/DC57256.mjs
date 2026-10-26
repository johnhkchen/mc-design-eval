// DC57256: Store-Misc, 1611 Connecticut Ave NW. A 1920s-era brick commercial block: a 4-block shopfront wing along the
// street (N and E faces, glass shopfront and a corner entrance under a dark canopy) stepping up into a stone-string-course
// brick mass of two tiers (8, then a 9-high core with a penthouse). Every column stands on the ground floor slab, every
// storey on the slab below it; walls are one cell thick with glass in pairs, an air gap behind, and some warm lamps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57256.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57256.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]
const key = (x, z) => `${x},${z}`;
const lidar = new Map(), ground = new Map();
for (const [x, z, g0, roof] of cells) { lidar.set(key(x, z), roof); ground.set(key(x, z), g0); }
const inF = (x, z) => lidar.has(key(x, z));

// Smooth the lidar roof into three clean tiers: the 3x3 mean over footprint cells picks the tier, so per-cell noise
// (a 7 among 8s, a 9 among 8s) does not step the massing. 9 = core, 8 = mid mass, 4 = one-storey shopfront wing.
const tier = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (inF(x + dx, z + dz)) { sum += lidar.get(key(x + dx, z + dz)); n++; }
  }
  const m = sum / n;
  tier.set(key(x, z), m >= 8 ? 9 : m >= 5.5 ? 8 : 4);
}
const H = (x, z) => tier.get(key(x, z));

// Exterior faces at height y: a side is exposed where the neighbour is off the footprint or is lower than y.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, y, z) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d], nx = x + dx, nz = z + dz;
  return !inF(nx, nz) || H(nx, nz) <= y;
});

const g = new Voxels([17, 21, 10]);
const panes = new Set();      // glass panes in the walls, by "x,y,z", for their connection states
const window = [];            // wall cells that may take a lamp behind them
const DOOR_X = 11;            // entrance on the street (N) face of the shopfront wing

// Pass 1: the massing, cell by cell, bottom to top.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const h = H(x, z), gr = ground.get(key(x, z));
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");                    // foundation, if the ground rises
  for (let y = gr; y < h; y++) {
    const faces = exposed(x, y, z);
    if (faces.length === 0) {                                                       // interior: floor slabs and roof only
      if (y === 0 || y === h - 1) g.set(x, y, z, y === 0 ? "stone_bricks" : "smooth_stone");
      else if (y % 3 === 0) g.set(x, y, z, "smooth_stone");                         // storey floors
      continue;
    }
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                      // base course
    if (y === h - 1) {                                                              // cornice / parapet cap
      g.set(x, y, z, "smooth_stone");
      if (h === 4 && z === 0 && Math.abs(x - DOOR_X) <= 1) g.set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" }); // canopy over the door
      continue;
    }
    const zFace = faces.some((f) => f === "N" || f === "S");
    const along = zFace ? x : z;                                                    // bay rhythm runs along the facade
    const street = h === 4 && (y === 1 || y === 2) && (faces.includes("N") || faces.includes("E"));
    if (street) {                                                                   // commercial shopfront
      if (faces.includes("N") && x === DOOR_X) {
        g.set(x, y, z, "oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (along % 4 === 0) {
        g.set(x, y, z, "stone_bricks");
      } else {
        g.set(x, y, z, "glass_pane"); panes.add(key(x, y, z)); window.push([x, y, z, faces]);
      }
      continue;
    }
    if (y % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }                  // storey string course
    if (along % 3 !== 0) { g.set(x, y, z, "glass_pane"); panes.add(key(x, y, z)); window.push([x, y, z, faces]); }
    else g.set(x, y, z, "bricks");                                                  // piers
  }
}

// Pass 2: pane connections (which neighbours in the same wall are glass), and warm lamps in the air gap behind some panes.
const PANE_SIDES = (x, y, z, faces) => {
  const zFace = faces.includes("N") || faces.includes("S");
  const has = (dx, dz) => panes.has(key(x + dx, y, z + dz)) ? "true" : "false";
  return zFace
    ? { north: "false", south: "false", east: has(1, 0), west: has(-1, 0) }
    : { north: has(0, -1), south: has(0, 1), east: "false", west: "false" };
};
for (const [x, y, z, faces] of window) {
  g.set(x, y, z, "glass_pane", PANE_SIDES(x, y, z, faces));
  const f = faces.find((d) => d === "N" || d === "S" || d === "W" || d === "E") ?? faces[0];
  const [dx, dz] = DIRS[f], ix = x - dx, iz = z - dz;                               // the cell just inside this pane
  if (!inF(ix, iz) || H(ix, iz) <= y || exposed(ix, y, iz).length > 0) continue;
  if ((x * 31 + y * 17 + z * 7) % 11 === 0) g.set(ix, y, iz, "glowstone");      // a few warm windows, not a row of them
}

// Roof equipment: a penthouse on the four core cells at the centre, stacked straight onto the core's roof.
for (const [x, z] of [[5, 5], [6, 5], [5, 6], [6, 6]]) {
  const h = H(x, z);
  if (h !== 9) continue;
  g.set(x, h, z, "stone_bricks");
  g.set(x, h + 1, z, (x + z) % 2 ? "glass_pane" : "bricks", (x + z) % 2 ? { north: "false", south: "false", east: "false", west: "false" } : undefined);
  g.set(x, h + 2, z, "smooth_stone");
}

const stats = g.save(OUT);
console.log("DC57256 saved", OUT, stats);
