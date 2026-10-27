// Way 446478801: a two-and-a-half storey Edwardian brick commercial block with a cream-plaster pier grid and a
// stone base, shopfront ground floor, and a four-storey tower at the narrow south-west end (lidar roof 17).
// Massing: body top 11 everywhere (lidar 10-11 smoothed to one flat tier); setback at 13 (lidar 12-13); core at 17.
// A cell is wall where any face is exposed to air at that height; interior cells get floor slabs and air gaps.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_446478801.cells.json", "utf8"));   // [x, z, ground, roof]
const g = new Voxels([12, 30, 34]);

const roofAt = new Map(); for (const [x, z, , roof] of cells) roofAt.set(`${x},${z}`, roof);
const has = (x, z) => roofAt.has(`${x},${z}`);
// tiers: 11 body, 13 setback (lidar 12-13), 17 core (lidar 17)
const top = (x, z) => { const r = roofAt.get(`${x},${z}`); return r >= 17 ? 17 : r >= 12 ? 13 : 11; };
const solid = (x, z, y) => has(x, z) && y < top(x, z);
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !solid(x + dx, z + dz, y));

// the entrance: north face of the middle of the wide end
const DOOR = { x: 9, z: 0, facing: "north" };
const GLAZE = new Set([1, 2, 5, 6, 7, 12, 13, 14]);          // window bands
const BAND = { 0: "stone_bricks", 3: "bricks", 4: "stone_bricks", 8: "stone_bricks", 9: "bricks", 11: "stone_bricks", 15: "stone_bricks" };
const FLOORS = new Set([0, 4, 8]);                            // interior floor slabs

const PIER = "white_concrete", STONE = "stone_bricks", FLOOR = "smooth_stone";
const glassPane = (wallAlongX) => ({ north: wallAlongX ? "true" : "false", south: wallAlongX ? "true" : "false", east: wallAlongX ? "false" : "true", west: wallAlongX ? "false" : "true", waterlogged: "false" });
const door = (half) => ({ facing: DOOR.facing, half, hinge: "left", open: "false", powered: "false" });
const stairs = { facing: DOOR.facing, half: "bottom", shape: "straight", waterlogged: "false" };

for (const [x, z] of cells) {
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const ext = exposed(x, z, y);
    if (!ext.length) {                                        // interior: a floor slab per storey, the roof deck, air otherwise
      if (FLOORS.has(y) || y === t - 1) g.set(x, y, z, FLOOR);
      continue;
    }
    const [, dx, dz] = ext[0];
    const wallAlongX = dz !== 0;                              // exposed to the north/south: the wall runs along x
    const bay = wallAlongX ? x : z;
    if (y === t - 1) { g.set(x, y, z, STONE); continue; }     // cornice / parapet cap
    if (x === DOOR.x && z === DOOR.z) {
      if (y === 0) { g.set(x, y, z, "stone_brick_stairs", stairs); continue; }
      if (y === 1) { g.set(x, y, z, "oak_door", door("lower")); continue; }
      if (y === 2) { g.set(x, y, z, "oak_door", door("upper")); continue; }
    }
    if (GLAZE.has(y)) {
      if (bay % 3 === 0) g.set(x, y, z, PIER);
      else g.set(x, y, z, "glass_pane", glassPane(wallAlongX));
      continue;
    }
    g.set(x, y, z, BAND[y] ?? "bricks");
  }
}

// warm light behind some windows, in the air gap just inside the glass
for (const [x, z] of cells) {
  const ext = exposed(x, z, 6); if (!ext.length) continue;
  const [, dx, dz] = ext[0]; const bay = dz !== 0 ? x : z;
  if (bay % 6 !== 1) continue;
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && !exposed(ix, iz, 6).length) g.set(ix, 6, iz, "glowstone");
}
// a hanging lantern inside the entrance, under the first-floor slab
g.set(DOOR.x, 3, DOOR.z + 1, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant on the deck: a 2 x 2 iron box
for (const [x, z] of [[6, 10], [7, 10], [6, 11], [7, 11]]) g.set(x, 11, z, "iron_block");

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_446478801.nbt"));
