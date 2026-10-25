import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499737.cells.json`, "utf8"));

const W = 11, H = 29, D = 13;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const cmap = new Map();
for (const [x, z, gc, r] of cells) cmap.set(key(x, z), { gc: Math.round(gc), r: Math.round(r) });
const has = (x, z) => cmap.has(key(x, z));
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Single massing height: median lidar roof value, eaves kept above the tallest ground
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const R = roofs[Math.floor(roofs.length / 2)];
const gmax = Math.max(...cells.map(c => Math.round(c[2])));
const eave = Math.max(R - 5, gmax + 4);
const ridge = eave + 5;

const STONE = "stone_bricks";
const TRIM = "polished_andesite";
const QUOIN = "chiseled_stone_bricks";
const FOUND = "granite";
const ROOF = "deepslate_tile_stairs";
const RIDGE = "deepslate_tiles";

// Pass 1: foundations, walls, ceiling, roof body and roof surface
for (const [x, z, gcRaw] of cells) {
  const gc = Math.round(gcRaw);

  for (let y = 0; y <= gc; y++) put(x, y, z, FOUND);

  if (eave - 1 > gc) put(x, eave - 1, z, STONE);

  if (perim(x, z) && eave - 2 > gc) {
    const cornerX = x === 0 || x === W - 1;
    const cornerZ = z === 0 || z === D - 1;
    const isCorner = cornerX && cornerZ;
    for (let y = gc + 1; y <= eave - 2; y++) {
      put(x, y, z, isCorner ? QUOIN : STONE);
    }
    put(x, gc + 1, z, TRIM);
    if (isCorner) put(x, gc + 1, z, QUOIN);
  }

  // Roof profile: gable ridge runs north-south along z
  const k = Math.min(x, W - 1 - x);
  for (let y = eave; y < eave + k; y++) put(x, y, z, STONE);
  if (k === 5) {
    put(x, ridge, z, RIDGE);
  } else {
    const facing = x < 5 ? "east" : "west";
    put(x, eave + k, z, ROOF, {
      facing, half: "bottom", shape: "straight", waterlogged: "false",
    });
  }
}

// Interior floor slab at the nave level (one storey, so one floor)
const floorY = Math.max(...cells.map(c => Math.round(c[2]))) + 1;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!perim(x, z) && floorY < eave - 1) put(x, floorY, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

const pane = (x, y, z, ns) => {
  put(x, y, z, "glass_pane", ns
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
};

// Pass 2: side walls (x=0 and x=10): pilasters at z=4 and z=8, windows at z=2, 6, 10
for (const [x, z, gcRaw] of cells) {
  const gc = Math.round(gcRaw);
  if (!(x === 0 || x === W - 1)) continue;
  if (z < 2 || z > D - 3) continue;

  if (z === 4 || z === 8) {
    // Pilaster: full-height chiseled course, with a base plinth
    for (let y = gc + 1; y <= eave - 2; y++) put(x, y, z, QUOIN);
    continue;
  }
  if (z % 2 !== 0 || gc + 3 > eave - 4) continue;

  put(x, gc + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  for (let y = gc + 3; y <= eave - 4; y++) pane(x, y, z, true);
  put(x, eave - 3, z, "stone_bricks");

  // Warm light behind the glass on every window
  const ix = x === 0 ? 1 : W - 2;
  if (has(ix, z)) put(ix, gc + 4, z, "glowstone");
}

// Pass 3: gable ends. Front (z=0) has the portal and rose window, back (z=12) a rose window
const roseY = eave - 3;
for (const x of [4, 5, 6]) {
  if (has(x, 0)) pane(x, roseY, 0, false);
  if (has(x, D - 1)) pane(x, roseY, D - 1, false);
}
// Rose window tracery centre
if (has(5, 0)) put(5, roseY, 0, "glowstone");
if (has(5, D - 1)) put(5, roseY, D - 1, "glowstone");

const frontCell = cells.find(c => c[0] === 5 && c[1] === 0);
if (frontCell) {
  const gc = Math.round(frontCell[2]);
  // Portal jambs with lit shroomlights either side
  put(4, gc + 1, 0, STONE);
  put(6, gc + 1, 0, STONE);
  put(4, gc + 2, 0, "shroomlight");
  put(6, gc + 2, 0, "shroomlight");
  // Double-height oak door in the centre
  put(5, gc + 1, 0, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(5, gc + 2, 0, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Stepped hood over the door
  for (const x of [4, 5, 6]) {
    put(x, gc + 3, 0, "stone_brick_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });
  }
  put(4, gc + 4, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  put(6, gc + 4, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 4: lantern-capped bell tower on the ridge, centred on (5,6)
const TX0 = 4, TX1 = 6, TZ0 = 5, TZ1 = 7;
for (let x = TX0; x <= TX1; x++) {
  for (let z = TZ0; z <= TZ1; z++) {
    for (let y = eave; y <= 22; y++) put(x, y, z, STONE);
  }
}
// Belfry openings on the east and west faces, with lit louvres
for (let y = 19; y <= 21; y++) {
  put(TX0, y, 6, "air");
  put(TX1, y, 6, "air");
}
put(TX0, 20, 6, "glowstone");
put(TX1, 20, 6, "glowstone");
// Cap and spire
for (let x = TX0; x <= TX1; x++) for (let z = TZ0; z <= TZ1; z++) put(x, 23, z, RIDGE);
for (let y = 24; y <= 26; y++) {
  put(5, y, 6, "stone_brick_wall", { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" });
}
put(5, 27, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/FR301499737.nbt`);
