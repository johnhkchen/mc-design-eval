import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, footprint 19 x 16, roof ~11 blocks above lowest ground.
// Reading: a two-storey (2 x 5 block) commercial block with a parapet, the sort of
// rendered concrete shophouse-plus-office that fills Taipei's older low-rise streets.
// Ground storey: shopfront glazing and a central door. Upper storey: punched windows
// on a 3-block bay rhythm, with warm lights behind some glass for dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542017375";
const W = 19, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, y] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), y);
}

const inF = (x, z) => ground.has(key(x, z));
// Outward normals of faces that touch the outside of the footprint.
const exposed = (x, z) => {
  const out = [];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!inF(x + dx, z + dz)) out.push([dx, dz]);
  }
  return out;
};
const facingOf = (dx, dz) =>
  dx === 1 ? "east" : dx === -1 ? "west" : dz === 1 ? "south" : "north";

// Front = the direction shared by the most single-face perimeter cells.
const dirCount = new Map();
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  const ex = exposed(x, z);
  if (ex.length === 1) {
    const k = ex[0].join(",");
    dirCount.set(k, (dirCount.get(k) || 0) + 1);
  }
}
let frontKey = "0,1", best = -1;
for (const [k, n] of dirCount) if (n > best) { best = n; frontKey = k; }
const [FDX, FDZ] = frontKey.split(",").map(Number);

// Door column: the median u along the front face.
const frontUs = [];
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  if (ex.length === 1 && ex[0][0] === FDX && ex[0][1] === FDZ) {
    frontUs.push(FDX !== 0 ? z : x);
  }
}
frontUs.sort((a, b) => a - b);
const doorU = frontUs.length ? frontUs[Math.floor(frontUs.length / 2)] : -1;

for (const [x, z, gc] of cells) {
  if (!(x >= 0 && x < W && z >= 0 && z < D)) continue;
  const ex = exposed(x, z);
  const ring = ex.length > 0;
  const corner = ex.length >= 2;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  // Storey lines: rel 0 base/floor, rel 5 belt course, rel 10 roof/cornice.
  g.set(x, gc, z, ring ? "polished_andesite" : "smooth_stone");
  g.set(x, gc + 5, z, ring ? "smooth_quartz" : "smooth_stone");
  g.set(x, gc + 10, z, ring ? "smooth_quartz" : "light_gray_concrete");

  if (!ring) {
    // Roof equipment on the inner roof: AC units and a planter.
    if (x % 7 === 3 && z % 6 === 2) g.set(x, gc + 11, z, "iron_block");
    if (x % 7 === 5 && z % 6 === 4) g.set(x, gc + 11, z, "oak_leaves");
    continue;
  }

  // Ring walls: storeys and parapet.
  for (const r of [1, 2, 3, 4, 6, 7, 8, 9, 11]) {
    g.set(x, gc + r, z, "white_concrete");
  }
  g.set(x, gc + 11, z, "smooth_stone_slab");

  if (corner) continue; // corner columns stay solid pilasters

  const [dx, dz] = ex[0];
  const u = dx !== 0 ? z : x;
  const pier = u % 3 === 0;
  const isFront = dx === FDX && dz === FDZ;
  const ix = x - dx, iz = z - dz; // inner cell behind this face
  const innerOpen = inF(ix, iz) && exposed(ix, iz).length === 0;

  if (pier) continue; // pilaster column keeps the wall

  // Ground storey shopfront glazing.
  if (isFront && u === doorU) {
    g.set(x, gc + 1, z, "dark_oak_door", {
      facing: facingOf(dx, dz), half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gc + 2, z, "dark_oak_door", {
      facing: facingOf(dx, dz), half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gc + 3, z, "white_concrete");
  } else {
    for (const r of [1, 2, 3]) g.set(x, gc + r, z, "light_blue_stained_glass_pane");
    // Shroomlight behind some shopfront glass for warmth at dusk.
    if (innerOpen && (u + gc) % 6 === 4) g.set(ix, gc + 2, iz, "shroomlight");
  }

  // Upper storey windows: sill, glazing, head.
  g.set(x, gc + 6, z, "smooth_quartz");
  for (const r of [7, 8]) g.set(x, gc + r, z, "light_blue_stained_glass_pane");
  if (innerOpen && (u + gc) % 6 === 1) g.set(ix, gc + 7, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
