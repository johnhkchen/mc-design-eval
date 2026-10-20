import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 25 x 10 footprint, roof about 7 blocks above the lowest ground.
// Read as a one-storey 1990s Taipei commercial block: a stone base, a
// shopfront storey of glass in aluminium-look pilasters, a red awning over
// the entrance, a cornice and a parapet. Lit shroomlights sit behind some
// windows. Walls rise from each cell's own ground to one common roof line.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw661755102";
const W = 25, H = 19, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(`${x},${z}`, Math.min(gr, H - 1));
const inFootprint = (x, z) => groundAt.has(`${x},${z}`);

const Y0 = Math.min(...cells.map(c => Math.min(c[2], H - 1)));  // lowest ground
const TOP = Y0 + 7;                                              // roof line: blocks up to Y0+6

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => { if (y >= 0 && y < H) g.set(x, y, z, id, props); };

const GLASS_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const pillar = x => x % 6 === 0;
const doorX = 9;

// Shopfront glass band behind the street facade (z = 0), rows rel 1..3.
const frontGlass = (x, rel) => rel >= 1 && rel <= 3 && !pillar(x) && !(x === doorX && rel <= 2);
// Back facade (z = D-1) windows at rel 2..3.
const backGlass = (x, rel) => rel >= 2 && rel <= 3 && x % 4 === 2 && !pillar(x);
const lightX = new Set([3, 15, 21]);

function interiorBlock(x, rel, z) {
  if (rel === 6) return ["light_gray_concrete"];                 // roof deck
  if (z === 1 && frontGlass(x, rel)) return ["air"];             // air gap behind street glass
  if (z === D - 2 && backGlass(x, rel)) return ["air"];          // air gap behind back glass
  if (z === 1 && rel === 2 && lightX.has(x)) return ["shroomlight"]; // warm light behind glass
  return ["white_concrete"];
}

function frontBlock(x, rel) {
  if (rel === 0) return ["stone_bricks"];                        // base course
  if (rel >= 1 && rel <= 3) {
    if (x === doorX && rel === 1) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (x === doorX && rel === 2) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (pillar(x)) return ["light_gray_concrete"];               // pilasters
    if (frontGlass(x, rel)) return ["glass_pane", GLASS_NS];
    return ["glass_pane", GLASS_NS];
  }
  if (rel === 4) return (x >= 7 && x <= 11) ? ["red_terracotta"] : ["smooth_stone"]; // awning / storey line
  if (rel === 5) return ["smooth_stone"];                        // cornice
  return ["white_concrete"];                                     // parapet
}

function backBlock(x, rel) {
  if (rel === 0) return ["stone_bricks"];
  if (backGlass(x, rel)) return ["glass_pane", GLASS_NS];
  if (rel === 4 || rel === 5) return ["smooth_stone"];
  if (pillar(x) && rel >= 1 && rel <= 5) return ["light_gray_concrete"];
  return ["white_concrete"];
}

function endBlock(rel) {
  if (rel === 0) return ["stone_bricks"];
  if (rel === 5) return ["smooth_stone"];
  return ["white_concrete"];
}

for (const [x, z] of [...groundAt.keys()].map(k => k.split(",").map(Number))) {
  const gr = groundAt.get(`${x},${z}`);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Walls and roof from this cell's ground up to the common roof line.
  for (let y = gr; y < Math.min(TOP, H); y++) {
    const rel = y - Y0;
    let blk;
    if (z === 0) blk = frontBlock(x, rel);
    else if (z === D - 1) blk = backBlock(x, rel);
    else if (x === 0 || x === W - 1) blk = endBlock(rel);
    else blk = interiorBlock(x, rel, z);

    if (blk[0] === "air") continue;
    put(x, y, z, blk[0], blk[1]);
  }
}

// Roof equipment: two air-conditioning plant boxes on the roof deck.
const plant = [
  { x0: 3, x1: 4, z0: 3, z1: 4, h: 2 },
  { x0: 19, x1: 20, z0: 5, z1: 6, h: 1 },
];
for (const p of plant) {
  for (let x = p.x0; x <= p.x1; x++) {
    for (let z = p.z0; z <= p.z1; z++) {
      if (!inFootprint(x, z)) continue;
      if (groundAt.get(`${x},${z}`) >= TOP) continue;
      for (let h = 0; h < p.h; h++) put(x, TOP + h, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
