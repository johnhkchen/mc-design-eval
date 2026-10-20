import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 17 x 17 footprint, roof about 11 blocks above lowest ground: a two-storey
// tiled-concrete shophouse block with a shopfront, a light-blue glass upper
// storey on white concrete piers, a parapet, and rooftop AC plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1156915709";
const W = 17, H = 23, D = 17;

const BELT = 5;    // storey line between the two floors
const DECK = 10;   // roof deck level
const CAP = 11;    // parapet cap (roof about 11 above lowest ground)

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));
const cells = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(`${x},${z}`, Math.min(9, Math.max(0, Math.round(gr - minG))));
}

const key = (x, z) => `${x},${z}`;
const has = (x, z) => cells.has(key(x, z));
const gAt = (x, z) => cells.get(key(x, z));

// Outward faces of a footprint cell (faces with no neighbouring footprint cell).
function outward(x, z) {
  return Object.keys(DIRS).filter((d) => {
    const [dx, dz] = DIRS[d];
    return !has(x + dx, z + dz);
  });
}

const isNS = (d) => d === "north" || d === "south";
const faceIndex = (x, z, d) => (isNS(d) ? x : z);

// Lowest index along each face, so bays start at the face's first cell.
const faceMin = {};
for (const [k] of cells) {
  const [x, z] = k.split(",").map(Number);
  for (const d of outward(x, z)) {
    const i = faceIndex(x, z, d);
    faceMin[d] = faceMin[d] === undefined ? i : Math.min(faceMin[d], i);
  }
}

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: foundations, floor slabs, walls, parapet, per cell.
for (const [k, gr] of cells) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z);
  const edge = out.length > 0;
  const corner = out.length > 1;

  // Foundation fill from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  // Floor slabs at each level above ground (interior floors and roof deck).
  if (!edge) {
    S(x, gr, z, "smooth_stone");
    if (BELT >= gr) S(x, BELT, z, "smooth_stone");
    S(x, DECK, z, "light_gray_concrete");
    // Plant on the roof: AC units on a rhythm of interior cells.
    if (x % 6 === 3 && z % 6 === 3) S(x, CAP, z, "iron_block");
    continue;
  }

  // Facade cell.
  S(x, gr, z, "polished_andesite"); // base course

  // Ground storey: shopfront with piers and glass.
  for (let y = gr + 1; y <= 4; y++) {
    let pier = corner;
    let mat = "glass";
    for (const d of out) {
      const rel = faceIndex(x, z, d) - faceMin[d];
      if (rel % 3 === 0) pier = true;
    }
    S(x, y, z, pier ? "stone_bricks" : "glass");
  }

  // Storey line belt.
  if (BELT >= gr) S(x, BELT, z, "white_concrete");

  // Upper storey: glass windows in white concrete piers, with a transom.
  for (let y = 6; y <= 9; y++) {
    if (y < gr) continue;
    let pier = corner;
    for (const d of out) {
      const rel = faceIndex(x, z, d) - faceMin[d];
      if (rel % 3 === 0) pier = true;
    }
    if (pier) S(x, y, z, "white_concrete");
    else if (y === 8) S(x, y, z, "white_concrete");
    else S(x, y, z, "light_blue_stained_glass");
  }

  // Parapet and cap.
  if (DECK >= gr) S(x, DECK, z, "white_concrete");
  S(x, CAP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: main entrance on the face with the most cells, with door and canopy.
const faceCount = {};
for (const [k] of cells) {
  const [x, z] = k.split(",").map(Number);
  for (const d of outward(x, z)) faceCount[d] = (faceCount[d] || 0) + 1;
}
const mainFace = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];

const faceCells = [];
for (const [k] of cells) {
  const [x, z] = k.split(",").map(Number);
  if (outward(x, z).includes(mainFace)) faceCells.push({ x, z, i: faceIndex(x, z, mainFace) });
}
faceCells.sort((a, b) => a.i - b.i);
const mid = faceCells[Math.floor(faceCells.length / 2)];

if (mid) {
  const gr = gAt(mid.x, mid.z);
  // Canopy over the entrance and its two neighbours, at the top of the shopfront.
  for (const c of faceCells) {
    if (Math.abs(c.i - mid.i) <= 1 && 4 >= gr) {
      S(c.x, 4, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // Door, two blocks tall, facing outward.
  if (gr + 2 <= 4) {
    S(mid.x, gr + 1, mid.z, "oak_door", {
      facing: mainFace, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    S(mid.x, gr + 2, mid.z, "oak_door", {
      facing: mainFace, half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

// Pass 3: warm lights set just inside some windows.
for (const [k, gr] of cells) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z);
  if (out.length !== 1) continue; // straight facade cells only
  const d = out[0];
  const rel = faceIndex(x, z, d) - faceMin[d];
  const [dx, dz] = DIRS[d];
  const ix = x - dx, iz = z - dz; // cell just inside the facade
  if (!has(ix, iz)) continue;
  if (rel % 6 === 2 && 7 >= gAt(ix, iz) && gAt(ix, iz) <= 9) {
    S(ix, 7, iz, "glowstone");
  } else if (rel % 6 === 1 && gr <= 1 && 2 > gr) {
    S(ix, 2, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
