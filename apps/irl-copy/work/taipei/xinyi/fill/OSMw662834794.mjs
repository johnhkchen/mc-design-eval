import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building record: no name, 18 x 21 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey Taipei street-front commercial block of the 1980s-90s:
// tiled white facade, pale concrete piers and storey bands, aluminium-framed glass,
// a granite plinth, a shopfront on the ground floor and a parapet with rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw662834794";
const W = 18, H = 23, D = 21;
const ROOF = 11;     // parapet top sits at y = 11
const DECK = 10;     // roof deck / second-floor ceiling
const BAND = 5;      // first-floor ceiling / storey line

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// [dx, dz, facing, axis-along-face]
const DIRS = [
  [0, -1, "north", "x"],
  [0, 1, "south", "x"],
  [-1, 0, "west", "z"],
  [1, 0, "east", "z"],
];

const isInterior = (x, z) => DIRS.every(([dx, dz]) => has(x + dx, z + dz));

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Floor slabs (first-floor ceiling and roof deck) across the whole footprint.
for (const [x, z, gr] of cells) {
  if (BAND > gr) put(x, BAND, z, "light_gray_concrete");
  if (DECK > gr) put(x, DECK, z, "light_gray_concrete");
}

// Glass zones: shopfront on the ground floor, two-light windows upstairs.
const glassAt = (y, gr) =>
  (y >= gr + 2 && y <= gr + 3 && y < BAND) || (y >= 7 && y <= 8);

// 3. Street walls, piers, bands, plinth and windows.
const shroomCandidates = [];
for (const [x, z, gr] of cells) {
  const out = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (out.length === 0) continue;               // interior cell
  const corner = out.length > 1;
  const [dx, dz, , axis] = out[0];
  const u = axis === "x" ? x : z;
  const pier = corner || u % 3 === 0;

  for (let y = gr + 1; y <= DECK; y++) {
    let b = "white_concrete";
    let p;
    if (y === BAND || y === DECK) b = "light_gray_concrete";
    else if (y === gr + 1) b = "polished_granite";          // base course / plinth
    else if (pier) b = "light_gray_concrete";               // pale pier
    else if (glassAt(y, gr)) {
      b = "glass_pane";
      p = axis === "x"
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    }
    put(x, y, z, b, p);
  }

  // Parapet cap at the roof line.
  if (ROOF > gr) put(x, ROOF, z, "light_gray_concrete");

  // Warm light behind some upper-floor windows, inside the air gap.
  if (!pier && !corner && u % 6 === 1) {
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && isInterior(ix, iz) && 7 > gAt(ix, iz)) {
      shroomCandidates.push([ix, 7, iz]);
    }
  }
}

// 4. Rooftop plant: small grey housings on a regular grid of interior roof cells.
for (const [x, z, gr] of cells) {
  if (!isInterior(x, z)) continue;
  if (x % 5 === 2 && z % 5 === 2 && ROOF > gr && DECK <= gr === false) {
    put(x, ROOF, z, "iron_block");
  }
}

// 5. Entrance on the street (south) face, in a bay column, nearest the middle.
const southEdge = cells
  .filter(([x, z]) => !has(x, z + 1) && x % 3 !== 0)
  .sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
if (southEdge.length) {
  const [ex, ez, egr] = southEdge[0];
  const doorState = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });
  put(ex, egr + 1, ez, "dark_oak_door", doorState("lower"));
  put(ex, egr + 2, ez, "dark_oak_door", doorState("upper"));
}

// 6. Shroomlights behind selected windows (interior air gap side).
for (const [x, y, z] of shroomCandidates) put(x, y, z, "shroomlight");

g.save(`${DIR}/${ID}.nbt`);
