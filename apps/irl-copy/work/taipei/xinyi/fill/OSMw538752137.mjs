import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752137";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// footprint: key -> ground
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(key(x, z), Math.max(0, Math.round(gr)));
const at = (x, z) => foot.has(key(x, z));
const groundAt = (x, z) => foot.get(key(x, z));
const facesOf = (x, z) => Object.keys(DIRS).filter(n => !at(x + DIRS[n][0], z + DIRS[n][1]));

// safe setter
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// perimeter cells grouped by outward face
const faceCells = { north: [], south: [], west: [], east: [] };
for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  for (const f of facesOf(x, z)) faceCells[f].push({ x, z, gr });
}
const alongOf = (f, x, z) => (f === "north" || f === "south") ? x : z;
const faceRange = {};
for (const f of Object.keys(faceCells)) {
  const ts = faceCells[f].map(c => alongOf(f, c.x, c.z));
  faceRange[f] = ts.length ? [Math.min(...ts), Math.max(...ts)] : [0, 0];
}

// entrance: middle cell of the longest outward face
const doorFace = Object.keys(faceCells).sort((a, b) => faceCells[b].length - faceCells[a].length)[0];
const doorList = [...faceCells[doorFace]].sort((a, b) => alongOf(doorFace, a.x, a.z) - alongOf(doorFace, b.x, b.z));
const doorCell = doorList.length >= 3 ? doorList[Math.floor(doorList.length / 2)] : null;
const doorKey = doorCell ? key(doorCell.x, doorCell.z) : null;

// pillars every 3 blocks along a face, always at its ends and at corners
const isPillar = (x, z, f) => {
  const t = alongOf(f, x, z);
  const [tMin, tMax] = faceRange[f];
  return (t - tMin) % 3 === 0 || t === tMax || facesOf(x, z).length > 1;
};

const pane = (f) => {
  const ns = f === "north" || f === "south";
  return ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// ---- pass 1: footprint columns ----
for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  const fs = facesOf(x, z);
  const perim = fs.length > 0;

  // foundation below grade
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // floor slabs and roof slab
  put(x, gr, z, perim ? "polished_andesite" : "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 10, z, perim ? "light_gray_concrete" : "gray_concrete");

  if (!perim) continue;

  const f0 = fs[0];
  const pillar = fs.some(f => isPillar(x, z, f));
  const isDoor = doorKey === k && fs.includes(doorFace);

  // storey 1 shopfront
  if (isDoor) {
    put(x, gr + 1, z, "dark_oak_door", { facing: doorFace, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: doorFace, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "glass_pane", pane(doorFace));
  } else {
    for (const y of [gr + 1, gr + 2, gr + 3]) {
      if (pillar) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", pane(f0));
    }
  }
  put(x, gr + 4, z, "light_gray_concrete");   // shopfront fascia
  put(x, gr + 5, z, "light_gray_concrete");   // storey line

  // storey 2 windows
  for (const y of [gr + 6, gr + 7, gr + 8]) {
    if (pillar) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane", pane(f0));
  }
  put(x, gr + 9, z, "light_gray_concrete");   // spandrel
  put(x, gr + 10, z, "light_gray_concrete");  // cornice
  put(x, gr + 11, z, "white_concrete");       // parapet
}

// ---- pass 2: warm lights set just inside some windows, standing on the floor ----
for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  const fs = facesOf(x, z);
  if (!fs.length) continue;
  const f0 = fs[0];
  if (fs.some(f => isPillar(x, z, f))) continue;
  const [dx, dz] = DIRS[f0];
  const ix = x - 2 * dx, iz = z - 2 * dz; // two cells inside, keeping an air gap behind the glass
  if (!at(ix, iz)) continue;
  const t = alongOf(f0, x, z);
  const gr2 = groundAt(ix, iz);
  if (t % 6 === 2) put(ix, gr2 + 6, iz, "shroomlight");
  if (t % 6 === 5) put(ix, gr2 + 1, iz, "glowstone");
}

// ---- pass 3: roof plant on interior roof cells ----
for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  if (facesOf(x, z).length) continue;
  const inCore = x >= 8 && x <= 14 && z >= 5 && z <= 11;
  const inAC = (x === 3 || x === 4) && (z === 3 || z === 4);
  if (inCore) {
    put(x, gr + 11, z, "light_gray_concrete");
    if (x >= 9 && x <= 13 && z >= 6 && z <= 10) put(x, gr + 12, z, "light_gray_concrete");
  }
  if (inAC) put(x, gr + 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
