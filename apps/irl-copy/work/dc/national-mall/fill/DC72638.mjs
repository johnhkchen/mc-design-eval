// DC72638: 11 Dupont Circle NW, a Commercial-Office-Large block of the 1900-1920 Washington type: a stone podium
// (3 storeys of 4 blocks, 12 high) with a 2-block penthouse core (14 high) set in from the podium's edge. Shell walls
// one cell thick with air behind the glass and a solid floor/roof slab per storey; the lidar roof is smoothed into the
// two tiers, the core eroded by one cell so it sets back from the podium.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const OUT = `${DIR}/DC72638.nbt`;
const cells = JSON.parse(readFileSync(`${DIR}/DC72638.cells.json`, "utf8"));

const W = 22, D = 24, H = 26;
const k = (x, z) => `${x},${z}`;
const roofAt = new Map(cells.map(([x, z, , r]) => [k(x, z), r]));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

const inF = (x, z) => roofAt.has(k(x, z));
// the core: lidar roof 14, with all four neighbours also 14, so its outer ring sits at the podium's 12
const inB = (x, z) => inF(x, z) && roofAt.get(k(x, z)) >= 14 && DIRS.every(([dx, dz]) => (roofAt.get(k(x + dx, z + dz)) ?? 0) >= 14);

// the faces of a cell that look out of its set (a stepped edge exposes one axis per cell; a corner exposes two)
const exposure = (inSet, x, z) => DIRS.filter(([dx, dz]) => !inSet(x + dx, z + dz));
const isCorner = (ex) => ex.some(([dx]) => dx) && ex.some(([, dz]) => dz);
// the along-wall coordinate: a face toward +-x runs along z, a face toward +-z runs along x
const bay = (ex, x, z) => (ex.some(([dx]) => dx) ? z : x);
const isWindowBay = (ex, x, z) => !isCorner(ex) && [1, 2].includes(((bay(ex, x, z) % 4) + 4) % 4);

// the entrance: the middle of the south-east frontage, on a single-face bay
const seFront = [];
for (const [key, r] of roofAt) {
  const [x, z] = key.split(",").map(Number);
  if (r >= 14) continue;
  const ex = exposure(inF, x, z);
  if (ex.length === 1 && ex[0][0] + ex[0][1] > 0 && isWindowBay(ex, x, z)) seFront.push({ x, z, n: ex[0] });
}
seFront.sort((a, b) => a.x - b.x || a.z - b.z);
const door = seFront[Math.floor(seFront.length / 2)];
const doorBay = bay([door.n], door.x, door.z);
const inDoorTrio = (x, z, ex) =>
  ex.length === 1 && ex[0].join() === door.n.join() && Math.abs(bay(ex, x, z) - doorBay) <= 1;

// roof plant: three 2x1 units on the podium roof, away from the edge and the core
const plantCells = [];
for (const [key, r] of roofAt) {
  const [x, z] = key.split(",").map(Number);
  if (r >= 14 || exposure(inF, x, z).length || inB(x, z)) continue;
  if (roofAt.has(k(x + 1, z)) && !exposure(inF, x + 1, z).length && !inB(x + 1, z)) plantCells.push([x, z]);
}
plantCells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const plantAt = new Set();
for (const f of [0.22, 0.5, 0.78]) {
  const [x, z] = plantCells[Math.floor(plantCells.length * f)];
  plantAt.add(k(x, z)); plantAt.add(k(x + 1, z));
}

const GLASS = "light_blue_stained_glass", SHOP = "glass", BAND = "polished_andesite", WALL = "calcite";
const PLINTH = "stone_bricks", PARAPET = "stone_bricks", FLOOR = "smooth_stone", LAMP = "glowstone";
const lit = (x, y, z) => (x * 5 + z * 3 + y * 7) % 11 === 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Tier A: the podium, 12 high, four storeys of bands at y = 0, 4, 8, 11 and window rows at 1-2, 5-6, 9-10 (3, 7 lintels)
for (const [key] of roofAt) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposure(inF, x, z);
  const perim = ex.length > 0;
  for (let y = 0; y < 12; y++) {
    if (!perim) {
      if (y % 4 === 0 || y === 11) put(x, y, z, FLOOR);
      continue;
    }
    if (y === 0 || y === 4 || y === 8 || y === 11) { put(x, y, z, y === 0 ? PLINTH : BAND); continue; }
    if (y % 4 === 3) { put(x, y, z, WALL); continue; }
    // y = 1, 2, 5, 6, 9, 10: the window rows of storey 0, 1, 2
    if (inDoorTrio(x, z, ex) && y < 3) {
      if (x === door.x && z === door.z) {
        const base = { facing: DIR_NAME[door.n.join()], hinge: "left", open: "false", powered: "false" };
        put(x, y, z, "dark_oak_door", { ...base, half: y === 1 ? "lower" : "upper" });
      } else put(x, y, z, WALL);
      continue;
    }
    if (isWindowBay(ex, x, z)) {
      put(x, y, z, lit(x, y, z) && y > 0 ? LAMP : y < 4 ? SHOP : GLASS);
    } else put(x, y, z, WALL);
  }
  // the door's head: a projecting lintel over the entrance trio (storey 0, y = 3 handled above as a wall course)
  if (inDoorTrio(x, z, ex)) put(x, 3, z, "stone_brick_slab", { type: "top" });
  // the parapet and the roof plant on the podium top
  if (perim) put(x, 12, z, PARAPET);
  else if (plantAt.has(k(x, z))) { put(x, 12, z, "iron_block"); put(x, 13, z, "iron_bars"); }
}

// Tier B: the penthouse core, two storeys high (12-13) on the podium's roof slab; its walls are the core's outer ring
for (const [key] of roofAt) {
  const [x, z] = key.split(",").map(Number);
  if (!inB(x, z)) continue;
  const ex = exposure(inB, x, z);
  if (ex.length === 0) {
    put(x, 12, z, FLOOR);
    put(x, 13, z, FLOOR);
    continue;
  }
  put(x, 12, z, isWindowBay(ex, x, z) ? (lit(x, 12, z) ? LAMP : GLASS) : WALL);
  put(x, 13, z, BAND);
}

const stats = g.save(OUT);
console.log(`door ${door.x},${door.z} facing ${DIR_NAME[door.n.join()]}; core ${[...roofAt].filter(([kk, r]) => r >= 14).length} cells`, stats);
