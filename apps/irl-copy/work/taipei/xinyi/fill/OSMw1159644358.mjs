import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1159644358";
const W = 24, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
const has = (x, z) => ground.has(`${x},${z}`);

// Roof about 11 blocks above the lowest ground; storey line at +6 (5 + 1 course).
const top = Math.min(H - 1, minG + 11);
const F2 = minG + 6;

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Exterior faces of a footprint cell: N = -z side, S = +z side, W = -x side, E = +x side.
const faceList = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const inwardOf = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const entranceCandidates = [];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the cell's ground, base course on top.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  put(x, gr, z, "stone_bricks");

  const f = faceList(x, z);

  if (f.length === 0) {
    // Interior: floor slabs only, air behind the glass.
    put(x, gr, z, "smooth_quartz");
    if (F2 > gr) put(x, F2, z, "smooth_quartz");
    put(x, top, z, "light_gray_concrete");
    // Roof plant on a sparse grid.
    if (x % 6 === 3 && z % 6 === 3 && top + 1 < H) {
      put(x, top + 1, z, "smooth_stone");
      if (top + 2 < H) put(x, top + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Ring (facade) cell.
  const ns = f.find((d) => d === "N" || d === "S");
  const primary = ns || f[0];
  const along = ns ? x : z;
  const corner = f.length >= 2;
  const pier = corner || along % 3 === 0;

  if (f.includes("N")) entranceCandidates.push({ x, z, gr, along: x });

  for (let y = gr + 1; y <= top; y++) {
    if (y === top) { put(x, y, z, "white_concrete"); continue; }        // parapet
    if (y === top - 1) {                                                // cornice
      put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === F2) { put(x, y, z, "smooth_stone"); continue; }           // storey line
    if (y < F2) {
      // Ground storey: shopfront with pier columns and a lintel at the top.
      if (y === F2 - 1 || pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    } else {
      // Upper storey: window grid with frames.
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Warm lights behind glass in the interior air gap.
  if (!pier && primary) {
    const [dx, dz] = inwardOf[primary];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && faceList(ix, iz).length === 0) {
      if (along % 6 === 1 && gr + 2 < F2 - 1) put(ix, gr + 2, iz, "glowstone");
      if (along % 6 === 4 && F2 + 2 < top - 1) put(ix, F2 + 2, iz, "glowstone");
    }
  }
}

// Entrance on the north face, near the middle of the frontage.
if (entranceCandidates.length) {
  const cx = (W - 1) / 2;
  entranceCandidates.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
  const e = entranceCandidates[0];
  const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(e.x, e.gr + 1, e.z, "dark_oak_door", { ...door, half: "lower" });
  put(e.x, e.gr + 2, e.z, "dark_oak_door", { ...door, half: "upper" });
  // Small canopy over the entrance, on the wall cell and the cell inside it.
  const slab = { type: "bottom", waterlogged: "false" };
  put(e.x, e.gr + 3, e.z, "stone_brick_slab", slab);
  if (has(e.x, e.z + 1) && faceList(e.x, e.z + 1).length === 0) {
    put(e.x, e.gr + 3, e.z + 1, "stone_brick_slab", slab);
  }
}

g.save(`${DIR}/${ID}.nbt`);
