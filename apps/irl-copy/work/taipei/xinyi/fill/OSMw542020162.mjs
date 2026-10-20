import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542020162";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 8 x 16 footprint, two-storey Xinyi-era shophouse with a shopfront on the z=0 (north) face.
// Per cell: foundation to its ground, floors at +0, +5, +10, parapet at +11.
const W = 8, D = 16, H = 23;
const vox = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));
const safeSet = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

const isBoundary = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Foundation and floors
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  for (let y = 0; y < gr; y++) safeSet(x, y, z, "stone_bricks");
  if (!isBoundary(x, z)) {
    safeSet(x, gr, z, "smooth_stone");
    safeSet(x, gr + 5, z, "smooth_stone");
    safeSet(x, gr + 10, z, "smooth_stone");
  } else {
    // roof surface and cornice over the whole footprint
    safeSet(x, gr + 10, z, "smooth_quartz");
  }
}

// Facade of boundary cells
for (const [x, z] of cells) {
  if (!isBoundary(x, z)) continue;
  const gr = ground.get(key(x, z));
  const onN = !has(x, z - 1);
  const onS = !has(x, z + 1);
  const onW = !has(x - 1, z);
  const onE = !has(x + 1, z);
  const corner = (onN || onS) && (onW || onE);
  const pos = (onN || onS) ? x : z;
  const pier = corner || pos % 2 === 0;

  for (let o = 0; o <= 11; o++) {
    const y = gr + o;
    if (o === 0) { safeSet(x, y, z, "stone_bricks"); continue; }
    if (o === 5) { safeSet(x, y, z, "smooth_quartz"); continue; }
    if (o === 10) { continue; } // roof surface already placed
    if (o === 11) { safeSet(x, y, z, "white_concrete"); continue; }

    // Ground-floor shopfront on the north face
    if (onN && !corner && o <= 4) {
      if (x === 3 && o === 1) { safeSet(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (x === 3 && o === 2) { safeSet(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (o === 4) { safeSet(x, y, z, "red_terracotta"); continue; }
      if (!pier) { safeSet(x, y, z, "glass_pane"); continue; }
      safeSet(x, y, z, "white_concrete"); continue;
    }

    if (pier) { safeSet(x, y, z, "white_concrete"); continue; }
    if (o === 1 || o === 6) { safeSet(x, y, z, "smooth_quartz"); continue; } // sill
    if (o === 4 || o === 9) { safeSet(x, y, z, "smooth_quartz"); continue; } // head
    if ([2, 3, 7, 8].includes(o)) { safeSet(x, y, z, "glass_pane"); continue; }
  }
}

// Warm lights behind the north shopfront/upper windows (interior cells at z = 1)
for (const [x, z] of cells) {
  if (isBoundary(x, z)) continue;
  const gr = ground.get(key(x, z));
  if (z === 1 && x === 1) safeSet(x, gr + 2, z, "shroomlight");
  if (z === 1 && x === 5) safeSet(x, gr + 7, z, "glowstone");
  if (z === 1 && x === 3) safeSet(x, gr + 7, z, "shroomlight");
}

// Roof equipment: condenser units and a small stack
for (const [x, z] of cells) {
  if (isBoundary(x, z)) continue;
  const gr = ground.get(key(x, z));
  if (x >= 2 && x <= 3 && z >= 4 && z <= 5) safeSet(x, gr + 11, z, "light_gray_concrete");
  if (x === 5 && z === 10) {
    safeSet(x, gr + 11, z, "light_gray_concrete");
    safeSet(x, gr + 12, z, "light_gray_concrete");
  }
}

vox.save(`${dir}/${id}.nbt`);
