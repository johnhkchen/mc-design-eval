import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538121661: no record, so read as a two-storey mid-century concrete shophouse
// (1960s-80s Taipei): stone-bricks foundation, polished andesite plinth, white
// concrete walls with light-grey concrete bands, glass shopfronts and upper windows,
// a quartz cornice, a parapet, and a roof deck with a small plant box.
// Ground floor = max ground; storey floors at G and G+5, roof deck at G+10,
// parapet at G+11 (about 11 blocks above the lowest ground when G is near 0).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121661";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 16, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);

const DIRS = [
  [1, 0, "east"],
  [-1, 0, "west"],
  [0, 1, "south"],
  [0, -1, "north"],
];
const exterior = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Ground-floor level = highest ground under the footprint, so every cell's
// foundation is filled up to a common plinth line.
const G = Math.max(...cells.map(([, , gr]) => gr));
if (G + 12 > H - 1) console.warn(`${ID}: roof exceeds grid (G=${G})`);

// Entrance: exterior cell on the lowest-z street edge, nearest the middle of that edge.
const ext = cells.filter(([x, z]) => exterior(x, z));
const minZ = Math.min(...ext.map(([, z]) => z));
const edge = ext.filter(([, z]) => z === minZ);
const meanX = edge.reduce((s, [x]) => s + x, 0) / edge.length;
const [dx0, dz0] = edge.reduce((best, c) =>
  Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best);
const door = { x: dx0, z: dz0 };
const outward = DIRS.find(([dx, dz]) => !has(door.x + dx, door.z + dz));
const doorFacing = outward ? outward[2] : "north";

const isDoorNear = (x, z) => Math.abs(x - door.x) + Math.abs(z - door.z) <= 1;

for (const [x, z, gc] of cells) {
  // Foundation and plinth: solid from y 0 up to the ground-floor level.
  for (let y = 0; y < G; y++) {
    put(x, y, z, y < gc ? "stone_bricks" : "polished_andesite");
  }

  if (!exterior(x, z)) {
    // Interior: air behind the glass, floor slab at the second storey, roof deck.
    put(x, G + 5, z, "smooth_quartz");
    put(x, G + 10, z, "light_gray_concrete");
    continue;
  }

  // Exterior wall column, G .. G+10, base fill then articulation.
  for (let y = G; y <= G + 10; y++) put(x, y, z, "white_concrete");

  const k = x + z;
  const pillar = k % 3 === 0;

  // Base course and shopfront (ground storey).
  put(x, G, z, "polished_andesite");
  for (let y = G + 1; y <= G + 3; y++) {
    put(x, y, z, pillar ? "light_gray_concrete" : "glass");
  }
  put(x, G + 4, z, "light_gray_concrete"); // lintel band

  // Storey line at the second floor.
  put(x, G + 5, z, "light_gray_concrete");

  // Upper window grid.
  for (let y = G + 6; y <= G + 8; y++) {
    put(x, y, z, pillar ? "white_concrete" : "glass");
  }
  put(x, G + 9, z, "light_gray_concrete"); // head band
  put(x, G + 10, z, "smooth_quartz");      // cornice

  // Parapet on the roof edge.
  put(x, G + 11, z, "white_concrete");

  // Entrance: double door with glass transom and a small canopy over the door cell and its neighbours.
  if (x === door.x && z === door.z) {
    put(x, G + 1, z, "oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, G + 2, z, "oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, G + 3, z, "glass");
  }
  if (isDoorNear(x, z)) {
    put(x, G + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm light: shroomlight on the interior floor just behind some upper windows.
for (const [x, z] of cells) {
  if (!exterior(x, z)) continue;
  const k = x + z;
  if (k % 3 === 0 || k % 7 !== 1) continue;
  for (const [dx, dz] of DIRS) {
    const ix = x - dx, iz = z - dz; // inward neighbour
    if (has(ix, iz) && !exterior(ix, iz)) {
      put(ix, G + 6, iz, "shroomlight");
      break;
    }
  }
}

// Roof plant box on the deck, centred on the footprint.
for (const [x, z] of cells) {
  if (exterior(x, z)) continue;
  if (x >= 6 && x <= 9 && z >= 8 && z <= 12) {
    put(x, G + 11, z, "gray_concrete");
    if (x >= 7 && x <= 8 && z >= 9 && z <= 11) put(x, G + 12, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
