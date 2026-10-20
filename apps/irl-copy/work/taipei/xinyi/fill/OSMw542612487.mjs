import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 8 x 7, roof about 11 blocks above lowest ground.
// Read as a two-storey reinforced-concrete commercial block of the 1980s-90s
// Xinyi fabric: pale concrete frame, glass-and-quartz shopfront at street level,
// a glazed upper storey with spandrel bands, a flat roof with a parapet, a
// rooftop water tank and condenser units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612487";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 8, H = 23, D = 7;
const g = new Voxels([W, H, D]);

// Levels (absolute y, y 0 = lowest ground under the footprint)
const FLOOR2 = 5;   // first-floor slab / string course
const ROOF = 10;    // roof slab
const PARAPET = 11; // parapet course on the perimeter

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);
const groundOf = (x, z) => Math.max(0, Math.min(G.get(`${x},${z}`), 12));

const exposed = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isPerimeter = (x, z) => {
  const e = exposed(x, z);
  return e.N || e.S || e.W || e.E;
};

// Front (street-facing) door: the south-exposed cell nearest the middle of the front.
const southCells = cells
  .filter(([x, z]) => !has(x, z + 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = southCells.length ? southCells[Math.floor(southCells.length / 2)] : Math.floor(W / 2);
const doorZ = Math.max(...cells.map(([, z]) => z));

// Pick the facade face for a perimeter cell (priority S, N, E, W).
const faceOf = (x, z) => {
  const e = exposed(x, z);
  if (e.S) return "S";
  if (e.N) return "N";
  if (e.E) return "E";
  if (e.W) return "W";
  return null;
};
const faceU = (face, x, z) => (face === "N" || face === "S" ? x : z);
const inward = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

const GLASS = "light_blue_stained_glass";
const PIER = "smooth_quartz";
const WALL = "white_concrete";
const SPANDREL = "light_gray_concrete";
const BASE = "polished_andesite";
const FOUND = "stone";

const deferredLights = [];

// ---- Main shell ----
for (const [x0, z0] of cells) {
  const x = x0, z = z0;
  const gr = groundOf(x, z);
  const perim = isPerimeter(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Ground-level course (base course on perimeter, floor inside)
  g.set(x, gr, z, perim ? BASE : "smooth_stone");

  // First-floor slab and roof slab across the whole footprint
  if (gr < FLOOR2) g.set(x, FLOOR2, z, perim ? SPANDREL : "smooth_stone");
  g.set(x, ROOF, z, "smooth_stone");

  if (!perim) continue;

  // Parapet course
  g.set(x, PARAPET, z, WALL);

  const face = faceOf(x, z);

  // Walls from the ground course up to the roof slab
  for (let y = gr + 1; y <= ROOF - 1; y++) {
    if (y === FLOOR2) continue; // already set
    let id = WALL;
    if (y === 9) id = SPANDREL; // upper spandrel band under the cornice
    if (face && y <= 4 + (gr - 0) && y >= gr + 1 && y <= 4) {
      // ground storey: shopfront, door and lintel
      const u = faceU(face, x, z);
      if (face === "S" && Math.abs(u - doorX) <= 0 && y <= gr + 2) {
        // door handled below
        id = null;
      } else if (face === "S" && y === gr + 3 && Math.abs(u - doorX) <= 1) {
        id = PIER;
      } else if (y === gr + 4) {
        id = WALL;
      } else {
        id = u % 2 === 0 ? PIER : GLASS;
      }
    } else if (face && y >= 6 && y <= 8) {
      // upper storey: window grid with piers
      const u = faceU(face, x, z);
      id = u % 2 === 1 ? GLASS : PIER;
      if (id === GLASS && y === 7 && u % 4 === 1) {
        const [dx, dz] = inward[face];
        deferredLights.push([x + dx, 7, z + dz]);
      }
    }
    if (id) g.set(x, y, z, id);
  }

  // Lintel / canopy over the entrance on the south (street) face
  if (face === "S") {
    const u = faceU(face, x, z);
    if (Math.abs(u - doorX) <= 1) {
      g.set(x, gr + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Entrance door (two-high) on the south face
if (has(doorX, doorZ)) {
  const gr = groundOf(doorX, doorZ);
  g.set(doorX, gr + 1, doorZ, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, gr + 2, doorZ, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Warm light behind some upper windows (interior cells only)
for (const [lx, ly, lz] of deferredLights) {
  if (has(lx, lz) && !isPerimeter(lx, lz)) {
    g.set(lx, ly, lz, "shroomlight");
  }
}

// ---- Roof equipment ----
// Water tank: 2x2 drum on the roof, centre of the footprint
for (const [x, z] of [[2, 2], [3, 2], [2, 3], [3, 3]]) {
  if (!has(x, z)) continue;
  g.set(x, PARAPET, z, "light_gray_concrete");
  g.set(x, PARAPET + 1, z, "light_gray_concrete");
  g.set(x, PARAPET + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Condenser units along the roof, set back from the parapet
for (const [x, z] of [[5, 1], [1, 4]]) {
  if (!has(x, z) || isPerimeter(x, z)) continue;
  g.set(x, PARAPET, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
