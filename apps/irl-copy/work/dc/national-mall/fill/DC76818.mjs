// 124 Seaton Place NW: a Victorian-era (c. 1900-1910) red-brick rowhouse range, read as four party-wall units on the
// street (z = 6) front, a stone plinth and belt course, two storeys and a small attic storey under a stone cornice,
// with a lower rear ell to the east (lidar roof 6 against 7) and chimney stacks on the main roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76818.cells.json`, "utf8"));   // [x, z, ground, roof]

const BRICK = "bricks", TRIM = "smooth_stone", BASE = "stone_bricks", FLOOR = "oak_planks", ROOF = "deepslate_tiles";
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // pane runs along x
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane runs along z
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => at.has(`${x},${z}`);
const exposedFaces = (x, z) => [!has(x, z + 1), !has(x, z - 1), !has(x + 1, z), !has(x - 1, z)];  // +z, -z, +x, -x
const corner = (x, z) => exposedFaces(x, z).filter(Boolean).length >= 2;

// Massing: the street row and the main block rise to a stone cornice at y6; the lidar's 6 against 7 (the east rear ell,
// z 2..4) is a one-storey-lower wing with its cap at y5. The street row's 6 is a lidar edge, smoothed up to the main tier.
const topOf = (x, z) => (z === 6 || at.get(`${x},${z}`).roof >= 7 ? 6 : 5);

// Street front (z = 6): door columns 1, 4, 8, 11 (one per unit), piers at 3, 7, 10, glass at 2, 5, 6, 9, 12.
const DOORS = new Set([1, 4, 8, 11]);
const WINDOWS = new Set([2, 5, 6, 9, 12]);
// Other faces: a regular window on every third cell, off the corners.
const sideWindow = (x, z) => (x + z) % 3 === 1 && !corner(x, z);

const g = new Voxels([14, 19, 7]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Warm lights behind the glass and a shroomlight in the attic, on the interior floors.
const LIGHTS = [[5, 2, 5, "glowstone"], [9, 2, 5, "glowstone"], [12, 3, 5, "glowstone"], [6, 5, 5, "shroomlight"]];

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const top = topOf(x, z);
  const perimeter = exposedFaces(x, z).some(Boolean);
  const isCorner = z === 6 && (x === 0 || x === 13);   // quoins at the street corners only
  const front = z === 6 && exposedFaces(x, z)[0];

  // plinth: a solid course at y0 under every cell (ground-0 cells' base; ground-1 cells' foundation)
  put(x, 0, z, BASE);

  for (let y = 1; y <= top; y++) {
    if (!perimeter) {
      // interior: floor slabs at the storey lines, air between (no interiors), the roof closes the top
      if (y === top) put(x, y, z, ROOF);
      else if (y === 1 || y === 4) put(x, y, z, FLOOR);
      continue;
    }
    if (y === top) { put(x, y, z, TRIM); continue; }           // stone cornice / cap
    if (y === 1) { put(x, y, z, BASE); continue; }             // base course
    if (y === 4) { put(x, y, z, TRIM); continue; }             // belt course, the floor line behind it
    if (isCorner) { put(x, y, z, TRIM); continue; }            // quoins at the corners
    const attic = y === 5;                                    // attic storey, only on the main tier
    if (front) {
      const x0 = x;
      if (!attic && DOORS.has(x0) && y <= 3) { put(x, y, z, "dark_oak_door", { ...DOOR, half: y === 2 ? "lower" : "upper" }); continue; }
      if (attic && DOORS.has(x0)) { put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" }); continue; }
      if (WINDOWS.has(x0)) { put(x, y, z, "glass_pane", PANE_X); continue; }
      put(x, y, z, BRICK);
      continue;
    }
    if (sideWindow(x, z)) {
      const along = exposedFaces(x, z)[0] || exposedFaces(x, z)[1] ? PANE_X : PANE_Z;
      put(x, y, z, "glass_pane", along);
      continue;
    }
    put(x, y, z, BRICK);
  }
}

// Chimney stacks on the main roof (stand on the cover at y6), each capped with a stone slab.
for (const [x, z] of [[6, 3], [10, 5]]) {
  put(x, 7, z, BRICK); put(x, 8, z, BRICK); put(x, 9, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Roof equipment on the rear ell's cap (y5): a plant box.
put(12, 6, 3, "iron_block");

for (const [x, y, z, block] of LIGHTS) put(x, y, z, block);

g.save(`${DIR}/DC76818.nbt`);
console.log("cells", cells.length, "blocks", g.count());
