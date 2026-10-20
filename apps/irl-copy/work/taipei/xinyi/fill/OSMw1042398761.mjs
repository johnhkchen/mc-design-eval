import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042398761";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const inFp = (x, z) => fp.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// outward normal of a footprint cell that borders open air, or null for interior
function outward(x, z) {
  if (!inFp(x + 1, z)) return [1, 0];
  if (!inFp(x - 1, z)) return [-1, 0];
  if (!inFp(x, z + 1)) return [0, 1];
  if (!inFp(x, z - 1)) return [0, -1];
  return null;
}
const isEdge = (x, z) => outward(x, z) !== null;
const faceName = ([dx, dz]) => (dx === 1 ? "east" : dx === -1 ? "west" : dz === 1 ? "south" : "north");

function pane(n) {
  // connections run along the wall, perpendicular to the outward normal
  const alongZ = n[0] !== 0;
  return {
    north: alongZ ? "true" : "false",
    south: alongZ ? "true" : "false",
    east: alongZ ? "false" : "true",
    west: alongZ ? "false" : "true",
    waterlogged: "false",
  };
}

// choose entrance: edge cell on the north (-z) side nearest the middle, else any edge cell
const edgeCells = cells.filter(([x, z]) => isEdge(x, z));
let entrance = null;
{
  const north = edgeCells.filter(([x, z]) => outward(x, z)[1] === -1);
  const pool = north.length ? north : edgeCells;
  if (pool.length) {
    const midX = Math.round(pool.reduce((s, c) => s + c[0], 0) / pool.length);
    entrance = pool.reduce((best, c) =>
      Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best);
  }
}

for (const [x, z, gr] of cells) {
  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const edge = isEdge(x, z);
  const n = edge ? outward(x, z) : null;
  const idx = x + z;
  const pier = idx % 3 === 0;

  // ground level: plinth at edges, floor inside
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");
  // mid floor between storeys
  put(x, gr + 5, z, edge ? "smooth_quartz" : "smooth_stone");
  // roof deck / parapet
  put(x, gr + 10, z, edge ? "smooth_quartz" : "gray_concrete");

  if (edge) {
    // ground floor shopfront h1..h3, sign band h4
    for (let h = 1; h <= 3; h++) {
      if (pier) put(x, gr + h, z, "black_concrete");
      else put(x, gr + h, z, "light_blue_stained_glass_pane", pane(n));
    }
    put(x, gr + 4, z, "red_concrete");

    // upper floor h6..h8 windows, h9 spandrel
    for (let h = 6; h <= 8; h++) {
      if (pier) put(x, gr + h, z, "white_concrete");
      else put(x, gr + h, z, "light_blue_stained_glass_pane", pane(n));
    }
    put(x, gr + 9, z, "smooth_quartz");

    // warm light behind some upper windows (interior air cell next to the glass)
    if (!pier && idx % 6 === 2) {
      const ix = x - n[0], iz = z - n[1];
      if (inFp(ix, iz)) put(ix, gr + 7, iz, "glowstone");
    }
    // a shroomlight behind some shopfront glass
    if (!pier && idx % 6 === 4) {
      const ix = x - n[0], iz = z - n[1];
      if (inFp(ix, iz)) put(ix, gr + 2, iz, "shroomlight");
    }
  }

  // roof plant box in the middle of the deck (interior cells only)
  if (!edge && x >= 7 && x <= 13 && z >= 6 && z <= 10) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  }
}

// entrance door on the chosen edge cell, with a warm lantern beside the door inside
if (entrance) {
  const [x, z, gr] = entrance;
  const n = outward(x, z);
  const facing = faceName(n);
  put(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "black_concrete");
  const ix = x - n[0], iz = z - n[1];
  if (inFp(ix, iz)) put(ix, gr + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
