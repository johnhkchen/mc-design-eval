import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1970s-80s Xinyi commercial block: two storeys on a stone base, cream
// tiled walls, glazed bays with pilasters, a stone cornice and parapet, a shopfront
// entrance on the south face, and a central plant penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403753";
const W = 18, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);
const maxG = Math.max(...ground.values());

// Roof plane: about 11 blocks above the lowest ground; taller if the slope needs it.
const R = Math.min(H - 4, Math.max(11, maxG + 6));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const FACES = [
  [0, -1, "north"],
  [0, 1, "south"],
  [1, 0, "east"],
  [-1, 0, "west"],
];

// Exposed faces per cell, and whether the face position index lands on a pier.
const exposed = (x, z) => FACES.filter(([dx, dz]) => !has(x + dx, z + dz));
const isPierOn = (x, z, dx) => {
  const i = dx === 0 ? x : z;
  return i % 3 === 0;
};
const isEdge = (x, z) => exposed(x, z).length > 0;
const isPier = (x, z) => exposed(x, z).some(([dx, dz]) => isPierOn(x, z, dx));

// Entrance: middle cell of the south face.
const southCells = [];
for (let x = 0; x < W; x++) if (has(x, D - 1) === false && has(x, D - 2)) {}
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (has(x, z) && !has(x, z + 1)) southCells.push(x);
}
southCells.sort((a, b) => a - b);
const doorX = southCells.length ? southCells[Math.floor(southCells.length / 2)] : -1;
const doorZ = (() => {
  for (let z = D - 1; z >= 0; z--) if (has(doorX, z)) return z;
  return -1;
})();

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!has(x, z)) continue;
  const G = gOf(x, z);
  const edge = isEdge(x, z);
  const pier = isPier(x, z);

  // Foundation under each cell, up to its own ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // Storeys: floor slab at each base, walls between slabs.
  for (let k = 0, b = G; b < R - 1; k++, b += 5) {
    // Floor slab / base course.
    if (edge && k === 0) put(x, b, z, "polished_granite");
    else if (edge) put(x, b, z, "smooth_quartz");
    else put(x, b, z, "white_concrete");

    if (!edge) continue;
    const top = Math.min(b + 4, R - 2);
    for (let y = b + 1; y <= top; y++) {
      if (pier) {
        put(x, y, z, "quartz_pillar");
      } else if (y === b + 4) {
        put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      } else if (y === b + 1) {
        put(x, y, z, k === 0 ? "light_blue_stained_glass" : "polished_andesite");
      } else if (y === b + 2 || y === b + 3) {
        put(x, y, z, "light_blue_stained_glass");
      } else {
        put(x, y, z, "smooth_quartz");
      }
    }
  }

  // Roof slab over the whole footprint.
  put(x, R - 1, z, "light_gray_concrete");

  // Parapet on the edge.
  if (edge) put(x, R, z, "stone_bricks");
}

// Warm lanterns standing on the floor just inside some window bays.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!has(x, z) || !isEdge(x, z) || isPier(x, z)) continue;
  for (const [dx, dz] of FACES) {
    if (has(x + dx, z + dz)) continue;
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz) || isEdge(ix, iz)) continue;
    const i = dx === 0 ? x : z;
    if (i % 6 !== 1) continue;
    const b = gOf(ix, iz);
    // Ground-storey and upper-storey lanterns, one per bay on the floor slab.
    for (let k = 0, bb = b; bb < R - 1; k++, bb += 5) {
      if (bb + 1 <= R - 2) put(ix, bb + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Shopfront entrance on the south face: double-height door, lintel, canopy band.
if (doorZ >= 0) {
  const G = gOf(doorX, doorZ);
  const b = G;
  put(doorX, b + 1, doorZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, b + 2, doorZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(doorX, b + 3, doorZ, "stone_bricks");
  for (const dx of [-1, 1]) {
    const cx = doorX + dx;
    if (has(cx, doorZ) && !has(cx, doorZ + 1)) {
      put(cx, b + 3, doorZ, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// Roof plant penthouse, centred on the roof slab.
for (let x = 6; x <= 11; x++) for (let z = 5; z <= 10; z++) {
  if (!has(x, z)) continue;
  put(x, R, z, "smooth_quartz");
  put(x, R + 1, z, "smooth_quartz");
  put(x, R + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
