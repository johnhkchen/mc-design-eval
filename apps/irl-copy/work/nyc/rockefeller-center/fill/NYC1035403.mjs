// 390 Madison Avenue, 1953 commercial and office building: a mid-century office slab, about 27 storeys (roof 83 blocks
// at the tallest), on a three-storey granite base with a shopfront and an entrance on the low-z (north) frontage. The
// lidar roof is median-smoothed over a 5 x 5 window and quantised to clean flat tiers (30, 39, 45, 54, 66, 72, 81), so
// the massing reads as stepped setbacks: a tall central slab, lower wings on the north and west, and a roof gardens
// and plant rooms at the setbacks. Every column stands from y 0 (foundation) to its tier; nothing overhangs. Facades
// are storey-banded on one global grid (spandrel rows at y % 3 == 1, windows between): cream spandrels, light-blue
// glass panes with grey mullions one block out from a solid core, air behind the panes with a floor slab per storey
// (no interiors). Warm glowstone sits behind some panes, and hanging lanterns light the entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035403.cells.json`, "utf8"));
const X = 66, Z = 55, Y = 84;
const STOREY_PODIUM = 10;                                 // the granite base is y 0..9 (three storeys)

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidarAt = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : null);
const groundAt = (x, z) => cell.get(`${x},${z}`).ground;

// Median of the lidar over the footprint cells in a 5 x 5 window: lidar noise and stair-stepped facets go, the step
// between tiers stays. Quantised to the nearest flat tier; lidar 3 or less is open ground (plaza, sidewalk, court).
const TIERS = [30, 39, 45, 54, 66, 72, 81];
const medianAt = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const r = lidarAt(x + dx, z + dz); if (r !== null) v.push(r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (m) => (m <= 3 ? 0 : TIERS.reduce((best, t) => (Math.abs(t - m) < Math.abs(best - m) ? t : best)));
const topAt = (x, z) => (inFoot(x, z) ? tierOf(medianAt(x, z)) : 0);     // 0 = open or outside the footprint

// Outward faces: N = low z (the entrance frontage), S, W, E. [dx, dz] points out of the building.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const openAt = (x, y, z) => topAt(x, z) <= y;                           // outside, open ground, or below its roof
const exposedFaces = (x, y, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return openAt(x + dx, y, z + dz); });
const isExposed = (x, y, z) => exposedFaces(x, y, z).length > 0;
const innerNeighbourExposed = (x, y, z) =>
  [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => topAt(x + dx, z + dz) > y && isExposed(x + dx, y, z + dz));

// Materials: the tower is cream spandrels, light-blue glass and grey aluminium mullions; the base is polished granite.
const M = {
  base: "polished_granite", spandrel: "white_concrete", glass: "light_blue_stained_glass_pane", door: "light_blue_stained_glass",
  mullion: "gray_concrete", core: "light_gray_concrete", roof: "gray_concrete", parapet: "white_concrete",
  sidewalk: "smooth_stone", foundation: "stone_bricks", plant: "iron_block", plantTop: "smooth_quartz",
};
const PANE_ALONG_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // on a N or S face
const PANE_ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // on a W or E face
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 17 === 0;                  // sparse, deterministic warm panes

// The entrance: a two-storey glass door in the granite base on the north frontage, four blocks wide, under a granite
// fascia (the y 4 spandrel course) with hanging lanterns inside it.
const ENTRANCE_X = [38, 41];
const isEntrance = (x, y, z, face) => face === "N" && z === 0 && x >= ENTRANCE_X[0] && x <= ENTRANCE_X[1] && (y === 2 || y === 3);

const g = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const ground = groundAt(x, z), T = topAt(x, z);

  // 1. Foundation from y 0 up to the cell's ground, so nothing floats on a slope.
  for (let y = 0; y < ground; y++) g.set(x, y, z, M.foundation);
  if (!T) { g.set(x, ground, z, M.sidewalk); continue; }      // open ground: the paving the building stands in

  // 2. The building column: from its ground to its tier.
  for (let y = ground; y < T; y++) {
    const faces = exposedFaces(x, y, z);
    const exposed = faces.length > 0;
    const podium = y < STOREY_PODIUM;

    if (y === T - 1) {                                        // roof: parapet on the edge, roof covering inside
      g.set(x, y, z, exposed ? M.parapet : M.roof);
      continue;
    }
    const spandrelRow = y % 3 === 1 || y === 0 || y === 1;   // base course and the spandrel course of each storey
    const windowRow = !spandrelRow && y < T - 2;             // below the roof slab
    if (!exposed) {
      // Behind the facade: an air gap behind the window rows (with the odd warm pane), solid floor slabs and core.
      if (windowRow && innerNeighbourExposed(x, y, z)) {
        if (lit(x, y, z)) g.set(x, y, z, "glowstone");
        continue;
      }
      g.set(x, y, z, M.core);
      continue;
    }
    const face = faces[0];
    const along = face === "N" || face === "S" ? x : z;
    if (isEntrance(x, y, z, face)) { g.set(x, y, z, M.door); continue; }
    if (spandrelRow) {
      g.set(x, y, z, podium ? M.base : M.spandrel);
      continue;
    }
    if (along % 3 === 0) {                                     // mullion, every third column of the face
      g.set(x, y, z, podium ? M.base : M.mullion);
      continue;
    }
    g.set(x, y, z, M.glass, face === "N" || face === "S" ? PANE_ALONG_X : PANE_ALONG_Z);
  }

  // 3. Roof plant: two-block boxes on the top tiers, standing on the roof covering.
  if (T >= 66 && !isExposed(x, T - 1, z) && x % 9 === 4 && z % 9 === 4) {
    g.set(x, T, z, M.plant);
    g.set(x, T + 1, z, M.plantTop);
  }
}

// Lanterns hang under the entrance fascia, inside the open door bay.
for (const x of [ENTRANCE_X[0] + 1, ENTRANCE_X[1] - 1]) {
  g.set(x, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/NYC1035403.nbt`);
