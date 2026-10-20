import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538464247";
const raw = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
const arr = Array.isArray(raw) ? raw : raw.cells;
const W = 11, H = 23, D = 7;
const g = new Voxels([W, H, D]);

// footprint: key "x,z" -> ground
const fp = new Map();
for (const c of arr) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  fp.set(`${x},${z}`, gr);
}
const inFp = (x, z) => fp.has(`${x},${z}`);
const maxG = Math.max(...fp.values());
const B = maxG; // common datum: body stands on the highest ground under it

// Helpers
const isPerim = (x, z) =>
  !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

const paneProps = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const lanternHang = { hanging: "true", waterlogged: "false" };

// 1. Foundation and plinth
for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  for (let y = gr; y < B; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs and roof deck (solid across footprint at storey lines)
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  g.set(x, B + 0, z, "smooth_stone");        // ground floor slab
  g.set(x, B + 5, z, "white_concrete");      // upper floor slab
  g.set(x, B + 10, z, "light_gray_concrete"); // roof deck
}

// 3. Perimeter walls, shopfront, windows, cornice, parapet
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const u = x + z;
  const pillar = u % 3 === 0;

  // ground floor (r = 1..4)
  // base course
  g.set(x, B + 0, z, "polished_granite");
  for (let r = 1; r <= 3; r++) {
    const y = B + r;
    if (x === 5 && z === 0) {
      // entrance door, lower and upper halves; lantern above in r=3
      if (r === 1) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (r === 2) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (r === 3) {
        g.set(x, y, z, "lantern", lanternHang);
        continue;
      }
    }
    if (pillar) g.set(x, y, z, "polished_granite");
    else g.set(x, y, z, "glass_pane", paneProps);
  }
  g.set(x, B + 4, z, "brown_terracotta"); // shopfront fascia

  // upper storey (r = 6..8 windows, spandrels at 5 and 9)
  g.set(x, B + 5, z, "white_concrete");
  g.set(x, B + 9, z, "white_concrete");
  for (let r = 6; r <= 8; r++) {
    const y = B + r;
    if (pillar) g.set(x, y, z, "light_gray_concrete");
    else g.set(x, y, z, "glass_pane", paneProps);
  }

  // cornice and parapet
  g.set(x, B + 10, z, "smooth_stone");
  g.set(x, B + 11, z, "white_concrete");
}

// 4. Warm lights behind some upper windows (interior air gap, glowstone)
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const u = x + z;
  if (u % 6 !== 1 || (x === 5 && z === 0)) continue;
  let ix = x, iz = z;
  if (z === 0) iz = 1;
  else if (z === 6) iz = 5;
  else if (x === 0) ix = 1;
  else if (x === 10) ix = 9;
  if (!inFp(ix, iz) || isPerim(ix, iz)) continue;
  g.set(ix, B + 7, iz, "glowstone");
}

// 5. Rooftop equipment: two AC plant boxes on the roof deck
for (const [x, z] of [[3, 3], [7, 3]]) {
  if (inFp(x, z) && !isPerim(x, z)) g.set(x, B + 11, z, "iron_block");
}

g.save(`${dir}/${id}.nbt`);
