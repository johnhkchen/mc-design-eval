import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618835";

// Record: no name, 14 x 18 footprint, roof ~11 blocks above lowest ground.
// Reading: a two-storey (5 blocks per storey) reinforced-concrete commercial
// block of the 1980s-90s Xinyi/Taipei street fabric: white concrete piers,
// tiled-look quartz bands, glass shopfront below, punched window grid above,
// a cornice and parapet, and a central roof plant room.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 14, H = 23, D = 18;
const vox = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const inFp = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

function put(x, y, z, name, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, name, props);
  else vox.set(x, y, z, name);
}

// Outward facing of an edge cell (first missing neighbour), or null if interior.
function outward(x, z) {
  for (const [n, [dx, dz]] of Object.entries(FACES)) {
    if (!inFp(x + dx, z + dz)) return n;
  }
  return null;
}

function missingCount(x, z) {
  let m = 0;
  for (const [dx, dz] of Object.values(FACES)) if (!inFp(x + dx, z + dz)) m++;
  return m;
}

// Along-face coordinate used for bay rhythm.
const alongK = (face, x, z) => (face === "north" || face === "south" ? x : z);

// Pick the front: the face with the most exposed cells.
const faceLists = { north: [], south: [], west: [], east: [] };
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = outward(x, z);
  if (f) faceLists[f].push([x, z]);
}
let frontFace = "north";
for (const f of Object.keys(faceLists)) {
  if (faceLists[f].length > faceLists[frontFace].length) frontFace = f;
}
const frontList = faceLists[frontFace].sort(
  (a, b) => alongK(frontFace, a[0], a[1]) - alongK(frontFace, b[0], b[1])
);
const doorCell = frontList.length ? frontList[Math.floor(frontList.length / 2)] : null;
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

// 1. Foundations and per-cell floor slabs (ground, first-floor line, roof deck).
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");
  const edge = outward(x, z) !== null;
  if (!edge) {
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
  } else {
    put(x, gr, z, "stone_bricks"); // base course
  }
}

// 2. Facade and parapet on each edge cell.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const face = outward(x, z);
  if (!face) continue;

  const [dx, dz] = FACES[face];
  const ix = x - dx, iz = z - dz;
  const inwardOk = inFp(ix, iz);
  const k = alongK(face, x, z);
  const corner = missingCount(x, z) >= 2;
  const pier = corner || k % 3 === 0;
  const isDoor = key === doorKey;

  // Ground storey shopfront (gr+1 .. gr+3), lintel at gr+4.
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isDoor && y <= gr + 2) {
      put(x, y, z, "dark_oak_door", {
        facing: face, half: y === gr + 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      });
    } else if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane");
    }
  }
  put(x, gr + 4, z, "smooth_quartz");

  // Warm light behind some shopfront glass; lantern just inside the entrance.
  if (inwardOk && !pier && !isDoor && (k + 1) % 3 === 0) {
    put(ix, gr + 2, iz, "glowstone");
  }
  if (isDoor && inwardOk) {
    put(ix, gr + 1, iz, "lantern", { hanging: "false" });
  }

  // Storey line at the first-floor slab level.
  put(x, gr + 5, z, "smooth_quartz");

  // Upper storey (gr+6 .. gr+9): window grid with piers.
  const windowCell = !pier;
  put(x, gr + 6, z, windowCell ? "smooth_quartz" : "white_concrete");
  for (const y of [gr + 7, gr + 8]) {
    put(x, y, z, windowCell ? "glass_pane" : "white_concrete");
  }
  put(x, gr + 9, z, "smooth_quartz");

  if (windowCell && inwardOk && (k * 3 + x + z) % 5 === 0) {
    put(ix, gr + 7, iz, "shroomlight");
  }

  // Cornice and parapet.
  put(x, gr + 10, z, "smooth_quartz");
  put(x, gr + 11, z, "white_concrete");
}

// 3. Roof plant room near the centre of the roof.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z) !== null) continue;
  if (x >= 5 && x <= 8 && z >= 6 && z <= 11) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
    put(x, gr + 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

vox.save(`${DIR}/${ID}.nbt`);
