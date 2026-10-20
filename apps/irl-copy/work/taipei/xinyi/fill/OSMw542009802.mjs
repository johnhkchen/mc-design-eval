import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542009802";
const W = 12, H = 23, D = 6;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Ground per cell, clamped so the parapet (ground + 11) stays inside the volume.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.min(gr, H - 12));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const v = new Voxels([W, H, D]);

const GLASS = "light_blue_stained_glass_pane";
// Pane connections follow the wall they sit in.
const paneProps = (face) => (face === "N" || face === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Street frontage is the north (z minimum) face. Door sits mid-frontage.
const nXs = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x).sort((a, b) => a - b);
const doorX = nXs.length ? nXs[Math.floor(nXs.length / 2)] : -1;

const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

for (const [x, z] of cells) {
  const gr = gnd(x, z);
  const perim = isPerim(x, z);
  const face = !has(x, z - 1) ? "N" : !has(x, z + 1) ? "S" : !has(x - 1, z) ? "W" : !has(x + 1, z) ? "E" : null;
  const idx = (face === "N" || face === "S") ? x : z;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) v.set(x, y, z, "stone_bricks");

  // Ground-floor slab, then floor slabs at storey lines (+5) and roof (+10).
  v.set(x, gr, z, perim ? "stone_bricks" : "smooth_stone");
  v.set(x, gr + 5, z, perim ? "smooth_quartz" : "light_gray_concrete");
  v.set(x, gr + 10, z, perim ? "smooth_quartz" : "light_gray_concrete");

  if (!perim) continue;

  const pillarEvery = face === "N" ? 4 : 3;
  const isPillar = idx % pillarEvery === 0;

  for (const rel of [1, 2, 3, 4, 6, 7, 8, 9, 11]) {
    const y = gr + rel;

    // Parapet
    if (rel === 11) {
      v.set(x, y, z, idx % 4 === 0 ? "smooth_quartz" : "white_concrete");
      continue;
    }

    // Shopfront and door on the street face
    if (rel <= 4) {
      if (face === "N" && x === doorX) {
        if (rel === 1) { v.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (rel === 2) { v.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        v.set(x, y, z, rel === 3 ? "white_concrete" : "smooth_quartz");
        continue;
      }
      if (isPillar) { v.set(x, y, z, "white_concrete"); continue; }
      if (rel === 4) { v.set(x, y, z, "smooth_quartz"); continue; }
      if (face !== "N" && rel === 1) { v.set(x, y, z, "white_concrete"); continue; }
      v.set(x, y, z, GLASS, paneProps(face));
      continue;
    }

    // Upper storey
    if (rel === 6) { v.set(x, y, z, "smooth_quartz"); continue; }
    if (rel === 9) { v.set(x, y, z, "white_concrete"); continue; }
    if (isPillar) { v.set(x, y, z, "white_concrete"); continue; }
    v.set(x, y, z, GLASS, paneProps(face));
  }

  // Warm light in the room behind some windows (interior air cell).
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && !isPerim(ix, iz) && !isPillar) {
    const gi = gnd(ix, iz);
    if (idx % 3 === 1) v.set(ix, gi + 2, iz, "glowstone");
    if (idx % 3 === 2) v.set(ix, gi + 7, iz, "shroomlight");
  }
}

// Roof plant on the interior roof slab.
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  const gr = gnd(x, z);
  if ((x === 3 || x === 4) && z === 2) v.set(x, gr + 11, z, "iron_block");
  if (x === 8 && z === 3) v.set(x, gr + 11, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

v.save(`${DIR}/${ID}.nbt`);
