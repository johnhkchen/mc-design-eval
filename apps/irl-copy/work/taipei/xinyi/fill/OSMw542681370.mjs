import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Decided type: two-storey 1980s-90s Taipei commercial block,
// concrete frame with pale wall tiles, grey aluminium-look mullions, a shopfront
// on the street face, a storey line every 5 blocks, a parapet, and a roof water tank.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542681370.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542681370.nbt";

const W = 12, H = 23, D = 8;
const g = new Voxels([W, H, D]);

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const perim = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const SLAB = { type: "bottom", waterlogged: "false" };
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Front door: centre of the south (max-z) street face.
const doorX = Math.floor((minX + maxX) / 2);
const doorZ = maxZ;
const DOOR_LOWER = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };

// Roof water tank: 2x2 of interior cells near the middle.
const tankX = [Math.floor((minX + maxX) / 2) - 1, Math.floor((minX + maxX) / 2)];
const tankZ = [Math.floor((minZ + maxZ) / 2) - 1, Math.floor((minZ + maxZ) / 2)];

for (const [x, z, b] of cells) {
  // Foundation below the cell's ground, then base course at ground level.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");
  put(x, b, z, "smooth_stone");

  const isPerim = perim(x, z);

  if (!isPerim) {
    // Interior: air gap, floor slabs at each storey line and at the roof.
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 10, z, "smooth_stone");
    if (tankX.includes(x) && tankZ.includes(z)) {
      put(x, b + 11, z, "white_concrete");
      put(x, b + 12, z, "smooth_stone");
    }
    continue;
  }

  const nFace = !has(x, z - 1);
  const sFace = !has(x, z + 1);
  const wFace = !has(x - 1, z);
  const eFace = !has(x + 1, z);
  const corner = (nFace || sFace) && (wFace || eFace);
  const onNS = nFace || sFace;

  // Column index along the face, used for the window rhythm.
  const idx = onNS ? x : z;
  const isPillarCol = corner || idx % 2 === 0;
  const paneProps = onNS ? PANE_NS : PANE_EW;
  const isFront = sFace && x === doorX && z === doorZ;

  // Ground storey: b+1..b+4. Upper storey: b+6..b+9. Storey lines at b+5 and b+10.
  for (let y = b + 1; y <= b + 10; y++) {
    let id = "white_concrete";
    let props;

    if (y === b + 5 || y === b + 10) {
      id = "smooth_stone"; // storey line / cornice band
    } else if (isPillarCol) {
      id = "gray_concrete"; // mullion / pier
    } else if (y >= b + 1 && y <= b + 3) {
      id = "light_blue_stained_glass_pane"; // shopfront glass
      props = paneProps;
    } else if (y >= b + 7 && y <= b + 8) {
      id = "light_blue_stained_glass_pane"; // upper window
      props = paneProps;
    }

    if (isFront && (y === b + 1 || y === b + 2)) {
      id = "oak_door";
      props = y === b + 1 ? DOOR_LOWER : DOOR_UPPER;
    }

    put(x, y, z, id, props);
  }

  // Parapet cap on the roof edge.
  put(x, b + 11, z, "smooth_stone_slab", SLAB);

  // Warm light behind some upper-storey windows: glowstone in the interior cell
  // just inside the glass, only where that interior cell exists.
  if (!isPillarCol && !isFront && idx % 4 === 1) {
    let ix = x, iz = z;
    if (nFace) iz = z + 1;
    else if (sFace) iz = z - 1;
    else if (wFace) ix = x + 1;
    else if (eFace) ix = x - 1;
    if (has(ix, iz) && !perim(ix, iz)) {
      put(ix, b + 7, iz, "glowstone");
    }
  }
}

g.save(OUT);
