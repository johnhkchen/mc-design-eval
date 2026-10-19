// 16 East 46 Street (NYC1088581): a 2008 Midtown office block, 7 x 24 blocks. The lidar roof per cell is snapped to whole
// 3-block storeys and smoothed into flat tiers: a stepped northern base rising to a 24-storey tower, a 22-storey setback
// to the south, a one-storey rear wing. The west face is the long street face with a recessed lobby. Glass with white
// spandrels and mullions, a granite base, a cornice and parapet at every tier edge, a mechanical penthouse on the tower.
// Hollow inside: a floor slab per storey, air behind the glass, a few lit rooms behind the panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 7, D = 24, SIZE_Y = 85;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1088581.cells.json`, "utf8"));

const snap3 = (v) => Math.round(v / 3) * 3;
// Roof height (blocks above y 0) per footprint cell; 0 = open court, not built. Lidar spikes are overridden per row.
function tier(x, z, roof) {
  if (roof <= 0) return 0;
  if (z === 0) return x === 6 ? 24 : 27;
  if (z === 1) return x === 0 ? 27 : x === 1 ? 33 : x === 6 ? 24 : 42;
  if (z === 2) return x === 0 ? 27 : x === 6 ? 24 : 45;
  if (z === 3) return x === 0 ? 30 : x === 6 ? 42 : 54;
  if (z === 4) return x === 0 ? 39 : x === 1 ? 54 : x === 6 ? 48 : 63;
  if (z === 5) return x === 0 ? 45 : x === 1 ? 54 : x === 6 ? 48 : 63;
  if (z === 6) return 63;
  if (z === 16) return 72;
  if (z >= 17 && z <= 20) return 66;
  if (z === 21) return x === 0 ? 27 : x === 1 ? 3 : 63;
  if (z >= 22) return x === 0 ? 27 : 3;
  return snap3(roof);
}

const H = Array.from({ length: W }, () => new Array(D).fill(0));
for (const [x, z, , roof] of cells) H[x][z] = tier(x, z, roof);

const top = (x, z) => (x >= 0 && x < W && z >= 0 && z < D ? H[x][z] : 0);
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
// Horizontal faces at height y that touch air: the building's exterior at that level.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) <= y);

const blocks = new Map();                                    // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => blocks.has(`${x},${y},${z}`);

const BASE = "polished_andesite", SPANDREL = "white_concrete", CORNICE = "light_gray_concrete", ROOF = "smooth_stone";
const PANE = "light_blue_stained_glass_pane", SHOP = "glass_pane", AWNING = "black_concrete", GLOW = "glowstone";
const DOOR = { facing: "west", hinge: "left", open: "false", powered: "false" };

// Shell: each built cell is a column from y 0 to its roof. Exterior faces are the ones touching air; the rest is floor
// slab per storey and air above it.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const h = H[x][z];
  for (let y = 0; y < h; y++) {
    const ex = exposed(x, z, y);
    // Lobby recess on the west face: a door between granite jambs, under the spandrel that becomes the canopy.
    if (x === 0 && z >= 10 && z <= 12 && y >= 1 && y <= 2) {
      if (z === 11) put(x, y, z, "iron_door", { ...DOOR, half: y === 1 ? "lower" : "upper" });
      else put(x, y, z, BASE);
      continue;
    }
    if (y === h - 1) { put(x, y, z, ex.length ? CORNICE : ROOF); continue; }      // roof surface / cornice
    if (!ex.length) { if (y % 3 === 0) put(x, y, z, SPANDREL); continue; }        // floor slab, air behind the glass
    if (y === 0) { put(x, y, z, BASE); continue; }                                 // granite base course
    if (x === 0 && y === 3 && z >= 9 && z <= 13) { put(x, y, z, AWNING); continue; }
    if (y % 3 === 0) { put(x, y, z, SPANDREL); continue; }                       // storey line
    if (ex.length > 1) { put(x, y, z, SPANDREL); continue; }                     // corner pier
    const [dx] = ex[0];
    const along = dx !== 0 ? z : x;                                              // position along the face
    if (along % 3 === 0) { put(x, y, z, SPANDREL); continue; }                  // mullion
    put(x, y, z, y < 3 ? SHOP : PANE);
  }
}

// Parapet on the edge of every tier that stands above a lower neighbour or the ground.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const h = H[x][z];
  if (h && DIRS.some(([dx, dz]) => top(x + dx, z + dz) < h)) put(x, h, z, SPANDREL);
}

// Mechanical penthouse on the tower roof: a solid box with a stone top.
for (let x = 2; x <= 4; x++) for (let z = 10; z <= 13; z++) for (let y = 72; y <= 74; y++) {
  if (y === 74) put(x, y, z, "stone_bricks");
  else if (x === 2 || x === 4 || z === 10 || z === 13) put(x, y, z, CORNICE);
}

// Panes connect along their face and to neighbouring mullions, so the grid reads as frames, not posts.
for (const [key, v] of [...blocks]) {
  if (v.block !== PANE && v.block !== SHOP) continue;
  const [x, y, z] = key.split(",").map(Number);
  const [dx] = exposed(x, z, y)[0];
  const s = dx !== 0
    ? { north: has(x, y, z - 1), south: has(x, y, z + 1), east: false, west: false }
    : { east: has(x + 1, y, z), west: has(x - 1, y, z), north: false, south: false };
  v.state = Object.fromEntries([...Object.entries(s).map(([k, b]) => [k, String(b)]), ["waterlogged", "false"]]);
}

// Warm light: a lantern in the lobby, and glowstone in some rooms directly behind the panes.
put(1, 1, 11, "lantern", { hanging: "false", waterlogged: "false" });
for (const [key, v] of [...blocks]) {
  if (v.block !== PANE && v.block !== SHOP) continue;
  const [x, y, z] = key.split(",").map(Number);
  const [dx, dz] = exposed(x, z, y)[0];
  const ix = x - dx, iz = z - dz;
  if (y % 3 === 0 || top(ix, iz) <= y || exposed(ix, iz, y).length || has(ix, y, iz)) continue;
  if ((x * 7 + y * 5 + z * 3) % 11 === 0) put(ix, y, iz, GLOW);
}

const g = new Voxels([W, SIZE_Y, D]);
for (const [key, { block, state }] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const { blocks: n, palette } = g.save(`${DIR}/NYC1088581.nbt`);
console.log(`NYC1088581.nbt: ${n} blocks, palette ${palette}, tower roof ${Math.max(...H.flat())} blocks`);
