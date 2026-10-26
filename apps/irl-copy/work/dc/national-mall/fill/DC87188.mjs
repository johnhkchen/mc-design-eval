import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87188.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87188.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 13, H = 31, D = 15;
const g = new Voxels([W, H, D]);

const WALL = "calcite";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const CORNICE = "chiseled_stone_bricks";
const GLASS = "light_blue_stained_glass_pane";

// Raw lidar per cell, then smooth the roof into one clean main level with a real setback where lidar says taller.
const raw = cells.map(([x, z, gr, rf]) => ({ x, z, G: Math.round(gr), T: Math.round(rf) - 1 }));
const sortedT = raw.map((c) => c.T).sort((a, b) => a - b);
const R0 = sortedT[Math.floor(sortedT.length / 2)];   // median main roof (surface y)

const cellMap = new Map();
for (const c of raw) {
  const T = c.T > R0 + 1 ? c.T : R0;                   // smooth noise; keep only real towers
  cellMap.set(c.x + "," + c.z, { G: c.G, T: Math.max(T, c.G + 1) });
}
const has = (x, z) => cellMap.has(x + "," + z);
const exN = (x, z) => !has(x, z - 1);
const exS = (x, z) => !has(x, z + 1);
const exW = (x, z) => !has(x - 1, z);
const exE = (x, z) => !has(x + 1, z);
const isEdge = (x, z) => exN(x, z) || exS(x, z) || exW(x, z) || exE(x, z);

const FLOORS = [5, 9, 13, 17];
const BANDS = [[0, 5], [5, 9], [9, 13], [13, 17]];

const glassZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glassX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Main massing, foundations, floors, facade articulation.
for (const [key, { G, T }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);
  const zFace = exN(x, z) || exS(x, z);
  const xFace = exW(x, z) || exE(x, z);
  const corner = zFace && xFace;

  for (let y = 0; y < G; y++) g.set(x, y, z, FOUND);

  if (edge) {
    for (let y = G; y < T; y++) g.set(x, y, z, WALL);
    g.set(x, G, z, BASE);                              // base course
  }

  for (const F of FLOORS) {
    if (F > G && F < T) g.set(x, F, z, FLOOR);
  }

  if (edge) {
    for (let i = 0; i < BANDS.length; i++) {
      const b = i === 0 ? G : BANDS[i][0];
      const t = BANDS[i][1];
      if (t <= G) continue;
      const line = b + 3;                              // transom / storey line
      if (line > G && line < T && line < t) g.set(x, line, z, BASE);
    }
  }

  // Roof slab, cornice on the edge, parapet cap.
  g.set(x, T, z, edge ? CORNICE : FLOOR);
  if (edge) g.set(x, T + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Window grids: alternating bays with piers, on non-corner facade cells.
  if (edge && !corner) {
    const alongOK = zFace
      ? (x % 2 === 1 && x > 0 && x < W - 1)
      : (z % 2 === 1 && z > 0 && z < D - 1);

    for (let i = 0; i < BANDS.length; i++) {
      const b = i === 0 ? G : BANDS[i][0];
      const t = BANDS[i][1];
      if (t <= G) continue;
      if (alongOK) {
        for (const y of [b + 1, b + 2]) {
          if (y <= G || y > t - 2 || y >= T) continue;
          g.set(x, y, z, GLASS, zFace ? glassZ : glassX);
        }
      }
      // Warm glow just inside a subset of windows (open interior cells only).
      const row = b + 1;
      if (alongOK && row > G && row <= t - 2 && row < T) {
        let ix = x, iz = z;
        if (exN(x, z)) iz = z + 1;
        else if (exS(x, z)) iz = z - 1;
        else if (exW(x, z)) ix = x + 1;
        else if (exE(x, z)) ix = x - 1;
        const useLight = zFace ? (x % 4 === 1) : (z % 4 === 1);
        if (useLight && has(ix, iz) && !isEdge(ix, iz)) g.set(ix, row, iz, "shroomlight");
      }
    }
  }
}

// Street entrance: centre bay of the north (z = 0) face. Stone surround, glazed sidelights, double door.
for (let x = 4; x <= 8; x++) {
  if (!has(x, 0)) continue;
  const { G, T } = cellMap.get(x + ",0");
  if (G + 4 >= T) continue;
  // Surround: solid stone frame over the opening.
  g.set(x, G + 4, 0, BASE);
  g.set(x, G + 3, 0, CORNICE);
  if (x === 4 || x === 8) {
    g.set(x, G + 1, 0, WALL);
    g.set(x, G + 2, 0, WALL);
  } else if (x === 5 || x === 7) {
    g.set(x, G + 1, 0, GLASS, glassZ);
    g.set(x, G + 2, 0, GLASS, glassZ);
  }
}
if (has(6, 0)) {
  const { G } = cellMap.get("6,0");
  g.set(6, G + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(6, G + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lanterns flanking the door on the surround.
  if (has(5, 0)) g.set(5, G + 2, 0, "lantern", { hanging: "false", waterlogged: "false" });
  if (has(7, 0)) g.set(7, G + 2, 0, "lantern", { hanging: "false", waterlogged: "false" });
}

// Rooftop penthouse on the main roof only (cells whose roof is the main level), resting on the slab below.
const P = R0 + 1;
for (let x = 3; x <= 9; x++) {
  for (let z = 4; z <= 10; z++) {
    if (!has(x, z)) continue;
    const { T } = cellMap.get(x + "," + z);
    if (T !== R0) continue;
    g.set(x, P, z, FLOOR);
    g.set(x, P + 3, z, FLOOR);
    const ring = x === 3 || x === 9 || z === 4 || z === 10;
    if (ring) {
      g.set(x, P + 1, z, WALL);
      g.set(x, P + 2, z, WALL);
    }
  }
}
// Warm light inside the penthouse ring, at its own height.
if (has(6, 7)) g.set(6, P + 2, 7, "shroomlight");

g.save(OUT);
