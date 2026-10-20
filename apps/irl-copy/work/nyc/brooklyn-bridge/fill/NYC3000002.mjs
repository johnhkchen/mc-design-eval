import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000002";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 43, H = 42, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  cellMap.set(key(x, z), { x, z, gr: Math.round(gr), rf: Number(rf) });
}
const has = (x, z) => cellMap.has(key(x, z));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Smooth lidar roof heights over 3x3 neighbourhoods, snap to even blocks (2-block storeys)
for (const c of cellMap.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = cellMap.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.rf; n++; }
  }
  const avg = sum / n;
  c.gr = clamp(c.gr, 0, H - 12);
  c.rt = clamp(2 * Math.round(avg / 2), c.gr + 6, H - 6);
}

const exposed = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
const isCorner = (x, z) => (!has(x, z - 1) || !has(x, z + 1)) && (!has(x - 1, z) || !has(x + 1, z));
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "zmin";
  if (!has(x, z + 1)) return "zmax";
  if (!has(x - 1, z)) return "xmin";
  return "xmax";
};
const faceInfo = {
  zmin: { ix: 0, iz: 1 },
  zmax: { ix: 0, iz: -1 },
  xmin: { ix: 1, iz: 0 },
  xmax: { ix: -1, iz: 0 },
};

// Entrance: centre of the street (zmin) face, among non-corner exposed cells
const zminXs = [];
for (const c of cellMap.values()) {
  if (!has(c.x, c.z - 1) && !isCorner(c.x, c.z)) zminXs.push(c.x);
}
const doorX = zminXs.length
  ? Math.round(zminXs.reduce((a, b) => a + b, 0) / zminXs.length)
  : Math.floor(W / 2);

// Face u-ranges for window rhythm
const uMin = {};
for (const c of cellMap.values()) {
  if (!exposed(c.x, c.z) || isCorner(c.x, c.z)) continue;
  const f = faceOf(c.x, c.z);
  const u = (f === "zmin" || f === "zmax") ? c.x : c.z;
  uMin[f] = uMin[f] === undefined ? u : Math.min(uMin[f], u);
}

// 1. Massing: foundation, brick body, roof cap
for (const c of cellMap.values()) {
  const { x, z, gr, rt } = c;
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < rt; y++) g.set(x, y, z, "bricks");
  if (!exposed(x, z)) g.set(x, rt - 1, z, "smooth_stone");
}

// 2. Facades
for (const c of cellMap.values()) {
  const { x, z, gr, rt } = c;
  if (!exposed(x, z)) continue;

  // Cornice band and parapet crown
  g.set(x, rt - 2, z, "smooth_stone");
  g.set(x, rt - 1, z, "stone_bricks");
  g.set(x, rt, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  const corner = isCorner(x, z);
  const face = faceOf(x, z);

  if (corner) {
    for (let y = gr; y <= rt - 3; y++) g.set(x, y, z, "stone_bricks");
    continue;
  }

  const { ix, iz } = faceInfo[face];
  const u = (face === "zmin" || face === "zmax") ? x : z;
  const rel = u - uMin[face];

  // Entrance: forced onto the street face regardless of the window rhythm
  if (face === "zmin" && x === doorX) {
    const ix1 = x + ix, iz1 = z + iz;
    g.set(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (has(ix1, iz1)) {
      g.set(ix1, gr, iz1, "air");
      g.set(ix1, gr + 1, iz1, "air");
    }
    // Stone surround: lintel over the door, and a lantern beside it at the lintel line
    g.set(x, gr + 2, z, "stone_bricks");
    g.set(x, gr + 3, z, "stone_bricks");
    continue;
  }

  const windowCol = rel % 4 === 1 || rel % 4 === 2;
  if (!windowCol) continue;

  const ix1 = x + ix, iz1 = z + iz;
  const ix2 = x + 2 * ix, iz2 = z + 2 * iz;

  for (let y = gr; y <= rt - 3; y++) {
    const h = y - gr;

    if (h < 2) {
      // Shopfront glass
      g.set(x, y, z, "glass_pane");
      if (has(ix1, iz1)) g.set(ix1, y, iz1, "air");
    } else if (h % 2 === 0) {
      // Storey line across the window column
      g.set(x, y, z, "stone_bricks");
    } else {
      // Upper window with air gap; some lit deeper inside
      g.set(x, y, z, "glass_pane");
      if (has(ix1, iz1)) g.set(ix1, y, iz1, "air");
      const lit = ((x * 5 + z * 3 + h * 7) % 7) === 0;
      if (lit && has(ix2, iz2)) g.set(ix2, y, iz2, "glowstone");
    }
  }
}

// 3. Roof equipment: brick chimneys with slab caps
for (const c of cellMap.values()) {
  const { x, z, rt } = c;
  if (exposed(x, z)) continue;
  if (x % 10 === 5 && z % 8 === 4) {
    g.set(x, rt, z, "bricks");
    g.set(x, rt + 1, z, "bricks");
    g.set(x, rt + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
