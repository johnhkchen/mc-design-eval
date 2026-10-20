import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414353";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: cell key -> ground height
const gr = new Map();
for (const [x, z, h] of cells) gr.set(`${x},${z}`, h);
const has = (x, z) => gr.has(`${x},${z}`);
const groundOf = (x, z) => gr.get(`${x},${z}`);

// Record: ~11 blocks from lowest ground to roof. Two storeys of 5 blocks, plus a 1-block parapet.
const G0 = Math.min(...cells.map((c) => c[2]));   // lowest ground
const FL1 = G0 + 5;                                // second floor line
const TOP = G0 + 10;                               // roof deck (top solid layer)
const PAR = TOP + 1;                               // parapet ring

// Materials: mid-1990s Taipei commercial block - cream tile walls, pale quartz piers,
// smooth stone bands, dark-stone plinth, clear glazing.
const M = {
  found: "stone_bricks",
  base: "polished_andesite",
  wall: "quartz_block",
  pier: "quartz_pillar",
  band: "smooth_stone",
  parapet: "white_concrete",
  glass: "glass",
  equip: "light_gray_concrete",
  lamp: "glowstone",
};

// Write only inside the grid and never below the cell's own ground (no floating, no buried air).
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (y < groundOf(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const dirs = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

const isPerimeter = (x, z) => dirs.some((d) => !has(x + d.dx, z + d.dz));

// 1. Foundation, plinth, walls, floor slabs, roof deck, parapet.
for (const [x, z, ground] of cells) {
  // Foundation fill from y=0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, M.found);

  const perim = isPerimeter(x, z);
  if (!perim) {
    // Interior: air gap, with floor slabs and roof deck only.
    for (const y of [G0, FL1, TOP]) put(x, y, z, M.band);
    continue;
  }

  // Perimeter column from ground to roof deck.
  for (let y = ground; y <= TOP; y++) {
    let id = M.wall;
    if (y === TOP || y === FL1 || y === G0) id = M.band;
    put(x, y, z, id);
  }
  // Plinth course at ground.
  put(x, ground, z, M.base);
  // Parapet.
  put(x, PAR, z, M.parapet);
}

// 2. Window grids, shopfront, storey bands, piers.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isPerimeter(x, z)) continue;

  const facade = dirs.find((d) => !has(x + d.dx, z + d.dz));
  const t = facade.dx !== 0 ? z : x; // coordinate along the facade
  const pier = t % 3 === 0;

  for (let s = 0; s < 2; s++) {
    const fy = G0 + 5 * s;
    if (s === 0) {
      // Shopfront: tall glazing between piers, band above.
      for (let y = fy + 1; y <= fy + 3; y++) put(x, y, z, pier ? M.pier : M.glass);
      put(x, fy + 4, z, M.band);
    } else {
      // Upper storey: sill, glazing, lintel band.
      put(x, fy + 1, z, M.band);
      for (let y = fy + 2; y <= fy + 3; y++) put(x, y, z, pier ? M.pier : M.glass);
      put(x, fy + 4, z, M.band);
      if (pier) {
        put(x, fy + 1, z, M.pier);
        put(x, fy + 4, z, M.pier);
      }
    }

    // Warm light behind some glazing: glowstone one cell in, inside the air gap.
    if (!pier && (t + s) % 4 === 1) {
      const ix = x - facade.dx, iz = z - facade.dz;
      if (has(ix, iz) && !isPerimeter(ix, iz)) {
        put(ix, fy + 2, iz, M.lamp);
      }
    }
  }
}

// 3. Entrance on the north (street) face, centred on that facade.
const northFace = cells
  .filter(([x, z]) => isPerimeter(x, z) && !has(x, z - 1))
  .sort((a, b) => a[0] - b[0]);
if (northFace.length) {
  const [dx, dz, dg] = northFace[Math.floor(northFace.length / 2)];
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(dx, dg, dz, "oak_door", doorProps("lower"));
  put(dx, dg + 1, dz, "oak_door", doorProps("upper"));
  put(dx, dg + 2, dz, "glass"); // transom above the door
}

// 4. Roof equipment: AC plant boxes on the roof deck, some with lanterns.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (isPerimeter(x, z)) continue;
  if (x % 6 === 3 && z % 5 === 2) {
    put(x, TOP + 1, z, M.equip);
    if (x % 12 === 3 && z % 10 === 2) {
      put(x, TOP + 2, z, "lantern", { hanging: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
