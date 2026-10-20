import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 40 x 24 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey, late-20th-century commercial block: white concrete and
// smooth quartz piers, a glazed shopfront at street level, a window band above,
// a cornice and parapet, roof plant on the deck, and one central entrance.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690433";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 40, H = 23, D = 24;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => Math.max(0, Math.round(ground.get(`${x},${z}`) ?? 0));

// Perimeter: any footprint cell with a missing 4-neighbour.
const isPerim = (x, z) => has(x, z) && (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Door position: middle of the south (max z) face.
let maxZ = -Infinity;
for (const [, z] of cells) maxZ = Math.max(maxZ, z);
const southXs = cells.filter(([, z]) => z === maxZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

// Pass 1: foundations, walls, floors, roof deck, plant, lanterns.
for (const [x, z] of cells) {
  const gr = groundAt(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const N = !has(x, z - 1), S = !has(x, z + 1), Wf = !has(x - 1, z), E = !has(x + 1, z);
  const perim = N || S || Wf || E;

  if (!perim) {
    // Interior: floor slab at y 5, roof deck at y 10, air between.
    if (gr <= 5) put(x, 5, z, "light_gray_concrete");
    if (gr <= 10) put(x, 10, z, "light_gray_concrete");
    // Roof plant on the deck.
    if (x % 8 === 4 && z % 7 === 3) put(x, 11, z, "iron_block");
    // Warm hanging lanterns in the ground-floor ceiling.
    if (gr <= 4 && x % 6 === 3 && z % 6 === 3) {
      put(x, 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
    continue;
  }

  // Perimeter wall.
  const corner = (N || S) && (Wf || E);
  const onNS = N || S;
  const t = onNS ? x : z;
  const pier = corner || t % 4 === 0;
  const paneProps = onNS
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = gr; y <= 11; y++) {
    if (y === gr) {
      put(x, y, z, "smooth_stone");
    } else if (y <= 3) {
      put(x, y, z, pier ? "smooth_quartz" : "glass");
    } else if (y === 4) {
      put(x, y, z, "smooth_quartz");
    } else if (y === 5) {
      put(x, y, z, "white_concrete");
    } else if (y === 6) {
      put(x, y, z, pier ? "smooth_quartz" : "white_concrete");
    } else if (y === 7 || y === 8) {
      if (pier) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
    } else if (y === 9) {
      put(x, y, z, pier ? "smooth_quartz" : "white_concrete");
    } else if (y === 10) {
      put(x, y, z, "smooth_quartz");
    } else {
      put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    }
  }

  // Entrance on the south face, centred.
  if (z === maxZ && x === doorX && gr + 2 <= 3) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "smooth_quartz");
  }
}

// Pass 2: warm shroomlights just inside some upper-storey windows.
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const N = !has(x, z - 1), S = !has(x, z + 1), Wf = !has(x - 1, z), E = !has(x + 1, z);
  if ((N || S) && (Wf || E)) continue; // corner
  const onNS = N || S;
  const t = onNS ? x : z;
  if (t % 4 === 0 || t % 8 !== 2) continue;
  let ix = x, iz = z;
  if (N) iz = z + 1;
  else if (S) iz = z - 1;
  else if (Wf) ix = x + 1;
  else if (E) ix = x - 1;
  if (has(ix, iz) && !isPerim(ix, iz)) {
    const gr = groundAt(ix, iz);
    if (gr <= 7) put(ix, 7, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
