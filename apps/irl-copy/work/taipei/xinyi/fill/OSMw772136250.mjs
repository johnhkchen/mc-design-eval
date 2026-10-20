import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772136250";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint: key "x,z" -> ground height (clamped to a sane foundation range)
const S = new Map();
for (const [x, z, gr] of cells) {
  S.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(gr))));
}
const has = (x, z) => S.has(`${x},${z}`);
const DIRS = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] };
const facesOf = (x, z) =>
  Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));

// Floor levels (relative to lowest ground y=0):
// y1 floor slab / plinth, y2-5 storey 1 (shopfront), y6 string course/slab,
// y7-10 storey 2, y11 roof slab / cornice, y12 parapet, y13 roof plant.
const ground = [...S.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr, perim: facesOf(x, z).length > 0 };
});

// 1. Foundations and interior clearance
for (const { x, z, gr } of ground) {
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone");
  for (let y = 2; y <= gr; y++) g.set(x, y, z, "air");
}

// 2. Floor slabs, base course, cornice, roof
for (const { x, z, perim } of ground) {
  g.set(x, 1, z, perim ? "stone_bricks" : "light_gray_concrete");
  g.set(x, 6, z, perim ? "stone_bricks" : "light_gray_concrete");
  g.set(x, 11, z, perim ? "stone_bricks" : "gray_concrete");
  if (perim) g.set(x, 12, z, "smooth_quartz"); // parapet
}

// 3. Choose entrance: prefer south face (z max), else first available face
const allPerim = ground.filter(c => c.perim);
let doorFace = null;
for (const pref of ["south", "north", "east", "west"]) {
  if (allPerim.some(c => { const f = facesOf(c.x, c.z); return f.length === 1 && f[0] === pref; })) {
    doorFace = pref; break;
  }
}
let doorCell = null;
if (doorFace) {
  const onFace = allPerim.filter(c => {
    const f = facesOf(c.x, c.z);
    return f.length === 1 && f[0] === doorFace;
  });
  const idxOf = c => (doorFace === "east" || doorFace === "west" ? c.z : c.x);
  const mid = (Math.min(...onFace.map(idxOf)) + Math.max(...onFace.map(idxOf))) / 2;
  const candidates = onFace.filter(c => idxOf(c) % 4 === 2);
  const pool = candidates.length ? candidates : onFace;
  doorCell = pool.sort((a, b) => Math.abs(idxOf(a) - mid) - Math.abs(idxOf(b) - mid))[0];
}

// 4. Walls with pilasters, shopfront glass, upper windows, bands and lintels
for (const c of allPerim) {
  const { x, z } = c;
  const fs = facesOf(x, z);

  if (fs.length >= 2) {
    // Corner: full pilaster column
    for (let y = 2; y <= 10; y++) g.set(x, y, z, "polished_andesite");
    continue;
  }

  const f = fs[0];
  const idx = (f === "east" || f === "west") ? z : x;
  const pillar = idx % 4 === 0;
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z && f === doorFace;

  for (let y = 2; y <= 10; y++) {
    let id = "smooth_quartz";
    if (pillar) id = "polished_andesite";
    else if (y >= 2 && y <= 4) id = "light_blue_stained_glass"; // shopfront
    else if (y === 5 || y === 6) id = "stone_bricks";           // lintel + string course
    else if (y === 7) id = "smooth_quartz";                     // sill
    else if (y === 8 || y === 9) id = (idx % 8 === 5 && y === 8) ? "shroomlight" : "gray_stained_glass";
    else if (y === 10) id = "stone_bricks";                     // upper lintel
    g.set(x, y, z, id);
  }

  if (isDoor) {
    const props = { facing: f, hinge: "left", open: "false", powered: "false" };
    g.set(x, 2, z, "dark_oak_door", { ...props, half: "lower" });
    g.set(x, 3, z, "dark_oak_door", { ...props, half: "upper" });
    g.set(x, 4, z, "stone_bricks");
  }
}

// 5. Warm interior lanterns visible through the shopfront at dusk
for (const c of ground) {
  if (c.perim) continue;
  if ((c.x + c.z) % 5 === 0) {
    g.set(c.x, 2, c.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 6. Roof: parapet already placed; add rooftop plant box and vents
for (const c of ground) {
  if (c.perim) continue;
  if (c.x >= 8 && c.x <= 14 && c.z >= 5 && c.z <= 11) {
    g.set(c.x, 12, c.z, "light_gray_concrete");
    if ((c.x + c.z) % 3 === 0) g.set(c.x, 13, c.z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
