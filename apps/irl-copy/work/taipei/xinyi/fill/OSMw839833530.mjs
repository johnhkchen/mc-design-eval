import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833530";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 11;
const TOP = 11;            // parapet top, ~11 blocks above lowest ground
const SLAB_1 = 5;          // first floor slab
const ROOF_DECK = 10;      // roof deck
const g = new Voxels([W, H, D]);

// footprint lookup: key "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFoot = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) =>
  !inFoot(x - 1, z) || !inFoot(x + 1, z) || !inFoot(x, z - 1) || !inFoot(x, z + 1);

// position along the facade, so piers repeat every 4 blocks and turn the corners
const northSouth = (x, z) => !inFoot(x, z - 1) || !inFoot(x, z + 1);
const faceT = (x, z) => (northSouth(x, z) ? x : z);
const isPier = (x, z) => {
  const t = faceT(x, z);
  const tMax = northSouth(x, z) ? W - 1 : D - 1;
  return t % 4 === 0 || t === 0 || t === tMax;
};

// inward neighbour for lantern placement
const inward = (x, z) => {
  if (!inFoot(x, z - 1)) return [x, z + 1];
  if (!inFoot(x, z + 1)) return [x, z - 1];
  if (!inFoot(x - 1, z)) return [x + 1, z];
  return [x - 1, z];
};

// 1. Foundation, base course, floor slabs, roof deck, parapet, facade
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const pier = edge && isPier(x, z);

  // foundation under the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = Math.max(gr, 0); y <= TOP; y++) {
    if (y === gr) {
      // base course on the street edge, floor slab inside
      if (edge) g.set(x, y, z, "polished_andesite");
      else g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === SLAB_1) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === ROOF_DECK) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === TOP) {
      if (edge) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!edge) continue; // interior air gap

    // ground-floor storey: y in (gr, 4]
    if (y > gr && y <= 4) {
      if (pier || y === 4) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "glass");
      continue;
    }
    // upper storey: y in [6, 9]
    if (y >= 6 && y <= 9) {
      if (pier || y === 9) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "light_blue_stained_glass_pane");
    }
  }
}

// 2. Entrance on the south face, with door and framing
const doorX = 9;
const doorZ = D - 1;
if (inFoot(doorX, doorZ) && isEdge(doorX, doorZ)) {
  const gr = ground.get(`${doorX},${doorZ}`);
  const dy = gr + 1;
  g.set(doorX, dy, doorZ, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, dy + 1, doorZ, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // transom above the door
  if (dy + 2 <= 4) g.set(doorX, dy + 2, doorZ, "light_blue_stained_glass_pane");
}

// 3. Warm lights behind some upper windows (glowstone in the air gap)
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z) || isPier(x, z)) continue;
  if (faceT(x, z) % 8 !== 2) continue;
  const [ix, iz] = inward(x, z);
  if (inFoot(ix, iz) && !isEdge(ix, iz)) g.set(ix, 7, iz, "glowstone");
}
// a few warm lamps in the ground-floor shopfronts
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z) || isPier(x, z)) continue;
  if (faceT(x, z) % 8 !== 5) continue;
  const [ix, iz] = inward(x, z);
  if (inFoot(ix, iz) && !isEdge(ix, iz) && gr + 2 <= 4) g.set(ix, gr + 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// 4. Roof plant: two concrete condenser housings on the roof deck
for (const [x, z] of [[...ground.keys()].map((k) => k.split(",").map(Number))].flat()) {
  if (isEdge(x, z)) continue;
  if (x % 6 === 3 && z % 4 === 2) {
    g.set(x, TOP, z, "light_gray_concrete");
    g.set(x, TOP + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
