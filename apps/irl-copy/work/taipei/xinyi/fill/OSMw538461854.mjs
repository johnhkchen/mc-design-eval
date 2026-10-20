import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538461854: unrecorded low-rise commercial block, Xinyi district.
// Read as a 1970s-80s Taipei street-front block: two storeys of ~5 blocks,
// stone base and cornice, white-tiled piers, glass shopfront with a red
// fascia band, pane-glass upper windows, and a rooftop parapet with AC units.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538461854";
const W = 17, H = 23, D = 27;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const cellSet = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => cellSet.has(`${x},${z}`);

const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  g.set(x, y, z, id, props);
}

// Shell faces: exposed sides of each footprint cell.
const shellFaces = new Map();
const dirCount = Object.fromEntries(DIRS.map(([n]) => [n, 0]));
for (const [x, z] of cells) {
  const faces = DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));
  if (faces.length) {
    shellFaces.set(`${x},${z}`, faces);
    for (const [n] of faces) dirCount[n]++;
  }
}

// Primary (street) facade: the side with the most exposed cells.
const primaryName = Object.entries(dirCount).sort((a, b) => b[1] - a[1])[0][0];
const primary = DIRS.find(([n]) => n === primaryName);
const [, prDx, prDz] = primary;
const primaryU = [];
for (const [key, faces] of shellFaces) {
  if (faces.some(([n]) => n === primaryName)) {
    const [x, z] = key.split(",").map(Number);
    primaryU.push(prDz !== 0 ? x : z);
  }
}
primaryU.sort((a, b) => a - b);
const doorU = primaryU.length ? primaryU[Math.floor(primaryU.length / 2)] : 0;

for (const [x, z, gr0] of cells) {
  const gr = Math.min(12, Math.max(0, gr0 | 0));          // ground offset above y0
  const roof = Math.min(H - 1, Math.max(11, gr + 10));    // roof ~11 above lowest ground

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = shellFaces.get(`${x},${z}`);

  // Interior: floor slabs per storey, roof deck, sparse roof equipment. No interior rooms.
  if (!faces) {
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, roof - 1, z, "light_gray_concrete");
    if ((x * 3 + z * 5) % 11 === 0) put(x, roof, z, "iron_block");
    continue;
  }

  // Shell cell.
  const corner = faces.length >= 2;
  const face = faces.find(([n]) => n === primaryName) || faces[0];
  const [faceName, fDx, fDz] = face;
  const u = fDz !== 0 ? x : z;
  const pillar = corner || u % 3 === 0;
  const isDoorCell = faces.some(([n]) => n === primaryName) && u === doorU;

  // Floor slab at ground level and storey line.
  put(x, gr, z, "stone_bricks");      // plinth course
  put(x, gr + 5, z, "smooth_stone");  // storey line
  // Parapet and cornice
  put(x, roof - 1, z, "stone_bricks");
  put(x, roof, z, "stone_brick_wall");

  // Ground storey: shopfront.
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (y === gr + 4) {
      put(x, y, z, "red_concrete"); // fascia / canopy band
      continue;
    }
    if (isDoorCell && y <= gr + 2) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", {
        facing: faceName,
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (pillar) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass");
    }
  }

  // Upper storey: window grid with frames, a few lit panes.
  for (let y = gr + 6; y <= roof - 2; y++) {
    if (pillar) {
      put(x, y, z, "white_concrete");
    } else if (((u + y) % 7) === 0) {
      put(x, y, z, "glowstone");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
