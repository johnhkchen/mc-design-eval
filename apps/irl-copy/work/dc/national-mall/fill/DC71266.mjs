// DC71266: 1500 9th St NW, a brick church (Religious) on a 9 x 4 footprint, lidar roof 6 blocks with one 7-block tower.
// Front = z 0 (the 9th Street face). Storeys: plinth y0, storey 1 y1-2, string course y3, storey 2 y4, cornice y5.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71266.cells.json", "utf8"));
const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);

// Lidar: the roof is 6 across the body; the 7s on x5-6 z0-2 are the one tower (kept). The 7s at the back-left are noise, smoothed to 6.
const isTower = (x, z) => x >= 5 && x <= 6 && z <= 2;

// Exterior faces: the side(s) of a cell with no footprint neighbour
const missing = (x, z) => [!inFp(x, z - 1) && "n", !inFp(x, z + 1) && "s", !inFp(x - 1, z) && "w", !inFp(x + 1, z) && "e"].filter(Boolean);
const isExterior = (x, z) => missing(x, z).length > 0;
const isCorner = (x, z) => missing(x, z).length >= 2;

// Openings. Lower = storey 1 (y1-2) glazing, upper = storey 2 (y4) glazing
const LOWER = new Set(["2,0", "7,0", "8,1", "2,3", "5,3", "1,1"]);
const UPPER = new Set(["2,0", "7,0", "6,0", "8,1", "2,3", "5,3", "1,1"]);
const DOOR = "4,0";
const GLOW = [[2, 1, 1], [7, 1, 1], [7, 4, 1]];

const g = new Voxels([9, 19, 4]);

// Glass pane: connected along its wall (front/back walls run along x, side walls along z)
const pane = (face) => (face === "n" || face === "s")
  ? { east: "true", north: "false", south: "false", west: "true", waterlogged: "false" }
  : { east: "false", north: "true", south: "true", west: "false", waterlogged: "false" };
const stair = (facing, half) => ({ facing, half, shape: "straight", waterlogged: "false" });

// Plinth and interior floors/ceilings: every footprint cell stands on the plinth
for (const [x, z] of cells) {
  g.set(x, 0, z, "stone_bricks");
  if (!isExterior(x, z)) {
    g.set(x, 3, z, "smooth_stone");        // storey line floor, carried by the walls
  }
  // stone cornice ring; the slate roof over the interior (the top surface of the body)
  g.set(x, 5, z, isExterior(x, z) ? "stone_bricks" : "deepslate_tiles");
  if (isTower(x, z)) { g.set(x, 6, z, "stone_bricks"); }
}

// Solid stone tower above the body roof (the tower's interior is filled too, so it reads as a mass, not a chimney)
for (const [x, z] of cells) {
  if (isTower(x, z)) { g.set(x, 5, z, "stone_bricks"); g.set(x, 6, z, "stone_bricks"); }
}

// Exterior walls: storeys 1 and 2, the string course and the cornice
for (const [x, z] of cells) {
  if (!isExterior(x, z)) continue;
  const key = `${x},${z}`, face = missing(x, z)[0];
  const top = isTower(x, z) ? 6 : 4;
  for (let y = 1; y <= top; y++) {
    if (y === 3 || y >= 5) { g.set(x, y, z, "stone_bricks"); continue; }
    if (isCorner(x, z)) { if (y <= 4) g.set(x, y, z, "stone_bricks"); continue; }
    if (key === DOOR && (y === 1 || y === 2)) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (key === DOOR && y === 4) { g.set(x, y, z, "chiseled_stone_bricks"); continue; }
    if (key === DOOR && y > 4) continue;
    if ((y === 1 || y === 2) && LOWER.has(key)) { g.set(x, y, z, "glass_pane", pane(face)); continue; }
    if (y === 4 && UPPER.has(key)) { g.set(x, y, z, "glass_pane", pane(face)); continue; }
    g.set(x, y, z, "bricks");
  }
}

// Door canopy: stone voussoirs over the entrance
g.set(3, 4, 0, "stone_brick_stairs", stair("north", "bottom"));
g.set(5, 4, 0, "stone_brick_stairs", stair("north", "bottom"));

// Warm light behind the glass
for (const [x, y, z] of GLOW) g.set(x, y, z, "glowstone");

// Tower top: a lantern on the cap as a beacon
g.set(5, 7, 1, "lantern", { hanging: "false", waterlogged: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71266.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
