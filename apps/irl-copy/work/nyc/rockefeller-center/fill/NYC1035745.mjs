// 536 Madison Avenue, 1930: a six-storey brick mixed-use block with cream stone belts, quoins and a cornice,
// shopfronts on the Madison (x = 0) and cross-street (z) faces, upper residential windows in pairs with a stone mullion.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035745.cells.json`, "utf8"));   // [x, z, ground, roof]

const inFoot = new Set(cells.map(([x, z]) => `${x},${z}`));
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const R = roofs[Math.floor(roofs.length / 2)];         // lidar median, 18: one flat roof tier (lidar noise 17-19 smoothed away)
const g = new Voxels([15, R + 4, 7]);                  // 18 blocks of building, parapet, penthouse and chimney

const BASE = "polished_granite", STONE = "smooth_quartz", BRICK = "bricks", SHOP_PIER = "polished_blackstone";
const FLOOR = "stone_bricks", DECK = "stone";
const BELTS = [3, 6, 9, 12, 15];                       // storey lines, cream
const W = new Set([1, 2, 4, 6, 8, 10, 12, 13]);        // window columns on the long (z) faces; 0,3,5,7,9,11,14 are stone or brick piers
const WZ = new Set([1, 2, 4, 5]);                      // window rows on the short (x) faces

// Foundation: fill each footprint cell from y 0 up to its ground (all zero here, so no-op, kept for slopes).
for (const [x, z, ground] of cells) for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);

for (let z = 0; z < 7; z++) for (let x = 0; x < 15; x++) {
  if (!inFoot.has(`${x},${z}`)) continue;
  const ring = x === 0 || x === 14 || z === 0 || z === 6;
  const corner = (x === 0 || x === 14) && (z === 0 || z === 6);
  const zFace = z === 0 || z === 6, xFace = x === 0 || x === 14;

  if (!ring) {
    for (const y of [0, ...BELTS]) g.set(x, y, z, FLOOR);   // interior floor slabs, air between
    g.set(x, R - 1, z, DECK);                              // roof deck
    continue;
  }

  // Base course, storey belts, cornice and coping run the whole perimeter.
  g.set(x, 0, z, BASE);
  for (const y of [...BELTS, R - 1]) g.set(x, y, z, STONE);
  g.set(x, R, z, STONE);

  for (let y = 1; y < R - 1; y++) {
    if (BELTS.includes(y)) continue;                      // storey lines were laid above
    const s = Math.floor(y / 3), ground = s === 0;
    if (corner) { g.set(x, y, z, STONE); continue; }

    const window = zFace ? W.has(x) : WZ.has(z);
    if (window) {
      if (ground && x === 0) g.set(x, y, z, "glass");                     // Madison shopfront
      else if (ground && zFace) g.set(x, y, z, "glass");                  // cross-street shopfront
      else g.set(x, y, z, "glass_pane", zFace
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
      continue;
    }
    if (zFace) {
      if (x === 5 || x === 9) g.set(x, y, z, STONE);                      // stone mullions
      else g.set(x, y, z, ground ? SHOP_PIER : BRICK);
      continue;
    }
    // Short faces: entrance on Madison (x = 0), service door on the rear (x = 14), both at z = 3.
    if (z === 3 && ground) {
      const facing = x === 0 ? "west" : "east";
      const half = y === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    g.set(x, y, z, BRICK);
  }
}

// Warm lamps standing inside some windows (air gap behind the glass, on each storey floor).
for (let s = 1; s <= 5; s++) {
  for (const x of W) {
    if ((x + s) % 4 === 0) g.set(x, 3 * s + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
    if ((x + s) % 4 === 2) g.set(x, 3 * s + 1, 5, "lantern", { hanging: "false", waterlogged: "false" });
  }
}
for (const [x, z] of [[1, 1], [12, 1], [1, 5], [12, 5], [6, 1]]) g.set(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" });

// Roof: a penthouse box and a flue, both standing on the deck.
for (let z = 2; z <= 4; z++) for (let x = 9; x <= 11; x++) { g.set(x, R, z, BRICK); g.set(x, R + 1, z, STONE); }
for (let y = R; y <= R + 2; y++) g.set(2, y, 2, BRICK);
g.set(2, R + 3, 2, STONE);

g.save(`${dir}/NYC1035745.nbt`);
console.log(`built NYC1035745.nbt: ${g.count()} blocks, ${g.palette.length - 1} block states, roof at y=${R}`);
