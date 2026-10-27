// Way 269467359: a brick shop-top block, two storeys with a three- and four-storey setback core, the 15 x 16 footprint.
// Read as a 1920s-30s commercial block in Mt Eden / Eden Terrace: red brick walls on a stone plinth, cream quartz
// string courses and cornice, shopfronts on the ground floor, a dark-oak entrance, a flat roof with a coping.
// The lidar roof heights become three flat tiers (8, 12, 16 blocks: 2, 3 and 4 storeys of 4 blocks), so every
// tier stands on the one below it. Walls are one block thick with an air gap behind the glass; floor slabs per storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467359.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..14, z 0..15

const W = 15, D = 16, H = 28;
// flat roof tiers (blocks above y 0): 8, 12 and 16, i.e. 2, 3 and 4 storeys. The lidar's raw heights are noisy, so a
// cell is 16 only if it is in the tall core (a lidar 14-15 with a tall neighbour; a lone spike drops), 12 if the lidar
// says 9-12 or it rings the core as a podium step, and 8 elsewhere.
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const roofAt = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const nb4 = (x, z) => DIRS.map(([, dx, dz]) => `${x + dx},${z + dz}`);
const tallCore = new Set([...roofAt].filter(([k, r]) => r >= 13 && nb4(...k.split(",").map(Number)).some((n) => (roofAt.get(n) ?? 0) >= 13)).map(([k]) => k));
const tierOf = (k) => (tallCore.has(k) ? 16 : (roofAt.get(k) >= 9 || nb4(...k.split(",").map(Number)).some((n) => tallCore.has(n))) ? 12 : 8);
const fp = new Map();
for (const [x, z, ground] of cells) fp.set(`${x},${z}`, { g: ground, T: tierOf(`${x},${z}`) });
const at = (x, z) => fp.get(`${x},${z}`);
// the faces of cell (x, z) that show to the outside at height y: off the footprint, or above a lower neighbour's roof
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => { const n = at(x + dx, z + dz); return !n || y >= n.T; }).map(([d]) => d);

// facade rhythm: piers every 3 cells along each wall, glass bays between; the entrance is on the south face
const DOOR = [10, 15];
const isPier = (face, x, z) => ((face === "N" || face === "S") ? x : z) % 3 === 0;
const paneState = (face) => (face === "N" || face === "S"
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" });
const LIT = (x, y, z) => y >= 4 && y % 4 === 1 && (x + 2 * z) % 5 === 0;   // a few upper windows lit behind the glass

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < c.g; y++) put(x, y, z, "stone_bricks");
  // interior floor slab on each storey, and the roof surface on top
  put(x, c.g, z, "smooth_stone");
  for (let y = 4; y < c.T; y += 4) if (y >= c.g) put(x, y, z, "smooth_stone");
  put(x, c.T, z, "smooth_stone");
}

for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const T = c.T;
  // walls: one block thick, from the ground to the roof
  for (let y = c.g; y < T; y++) {
    const faces = exposed(x, z, y);
    if (!faces.length) continue;
    if (y === 0 && c.g === 0) { put(x, y, z, "stone_bricks"); continue; }      // plinth course at the bottom
    if (y === T - 1) { put(x, y, z, "smooth_quartz"); continue; }                 // cornice
    if (faces.length >= 2) { put(x, y, z, "bricks"); continue; }                  // brick quoins at the corners
    const face = faces[0];
    const win = !isPier(face, x, z);
    if (y < 4) {                                                             // ground floor: shopfront glass
      put(x, y, z, win ? "glass_pane" : "bricks", win ? paneState(face) : undefined);
    } else if (y % 4 === 0) {                                                // string course
      put(x, y, z, "smooth_quartz");
    } else if (y % 4 === 3) {                                                // window head / pier
      put(x, y, z, win ? "smooth_quartz" : "bricks");
    } else {                                                                 // window glass / pier
      if (win && LIT(x, y, z)) put(x, y, z, "glowstone");
      else put(x, y, z, win ? "glass_pane" : "bricks", win ? paneState(face) : undefined);
    }
  }
  // coping on the outside edge of the roof
  if (exposed(x, z, T).length) put(x, T + 1, z, "smooth_quartz");
}

// the entrance: dark oak door on the south face, a quartz transom and a hanging lantern above
const [dx, dz] = DOOR;
put(dx, 0, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx, 1, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(dx, 2, dz, "smooth_quartz");
put(dx, 3, dz, "lantern", { hanging: "true" });

// roof plant on the four-storey core: a brick chimney and a lightning rod
put(8, 17, 2, "bricks"); put(8, 18, 2, "bricks");
put(7, 17, 2, "lightning_rod", { facing: "up", powered: "false" });

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467359.nbt");
console.log(JSON.stringify(res));
