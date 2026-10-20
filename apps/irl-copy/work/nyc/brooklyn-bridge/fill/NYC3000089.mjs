import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000089";
const W = 37, H = 21, D = 27;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const S = new Map();
for (const [x, z, gr, rf] of cells) {
  const G = Math.min(H - 4, Math.max(0, Math.round(gr)));
  const R = Math.min(H - 3, Math.max(G + 3, Math.round(rf)));
  S.set(k(x, z), { x, z, G, R });
}

// smooth the lidar roof heights: one averaging pass over each cell and its neighbours
{
  const rawR = new Map();
  for (const c of S.values()) rawR.set(k(c.x, c.z), c.R);
  for (const c of S.values()) {
    let sum = 0, n = 0;
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = k(c.x + dx, c.z + dz);
      if (rawR.has(key)) { sum += rawR.get(key); n++; }
    }
    c.R = Math.min(H - 3, Math.max(c.G + 3, Math.round(sum / n)));
  }
}

function exposed(x, z) {
  const f = [];
  if (!S.has(k(x, z - 1))) f.push("n");
  if (!S.has(k(x, z + 1))) f.push("s");
  if (!S.has(k(x - 1, z))) f.push("w");
  if (!S.has(k(x + 1, z))) f.push("e");
  return f;
}

const cellsArr = [...S.values()];
for (const c of cellsArr) {
  const f = exposed(c.x, c.z);
  c.faces = f;
  c.face = f[0] ?? null;
}

// 1. foundations, walls, interior floor slabs, roof deck
for (const c of cellsArr) {
  const { x, z, G, R } = c;
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  if (c.face) {
    for (let y = G; y <= R - 1; y++) {
      const h = y - G;
      const u = (c.face === "n" || c.face === "s") ? x : z;
      let blk;
      if (h === 0) blk = "polished_andesite";
      else if (h % 2 === 0) blk = "white_concrete";
      else blk = (u % 3 !== 0) ? "glass" : "bricks";
      if (y === R - 1) blk = "white_concrete"; // cornice band
      g.set(x, y, z, blk);
    }
    // parapet cap as a continuous slab row instead of posts
    g.set(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    for (let y = G; y <= R - 2; y++) {
      if ((y - G) % 2 === 0) g.set(x, y, z, "smooth_stone"); // storey floors
    }
    g.set(x, R - 1, z, "smooth_stone"); // roof deck
  }
}

// 2. entrance on the north (or south) street face, near the centre, with a surround
let door = null;
for (const dir of ["n", "s"]) {
  const cands = cellsArr
    .filter((c) => c.faces.includes(dir))
    .sort((a, b) => Math.abs(a.x - 18) - Math.abs(b.x - 18));
  if (cands.length) { door = { c: cands[0], dir }; break; }
}
if (door) {
  const { c, dir } = door;
  const facing = dir === "n" ? "north" : "south";
  // stone surround: flanking piers and a lintel over the door
  for (const dx of [-1, 1]) {
    const nx = c.x + dx;
    const nc = S.get(k(nx, c.z));
    if (nc && exposed(nx, c.z).includes(dir)) {
      for (let y = c.G; y <= c.G + 2 && y < nc.R - 1; y++) g.set(nx, y, c.z, "polished_andesite");
    }
  }
  g.set(c.x, c.G + 2, c.z, "polished_andesite"); // lintel
  g.set(c.x, c.G, c.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, c.G + 1, c.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// 3. warm light behind some windows (glowstone in the first interior layer)
for (const c of cellsArr) {
  if (!c.face) continue;
  for (let y = c.G + 1; y <= c.R - 2; y += 2) {
    const h = y - c.G;
    const u = (c.face === "n" || c.face === "s") ? c.x : c.z;
    if (u % 3 === 0) continue;
    if (((c.x * 7 + c.z * 3 + h * 5) % 9) !== 0) continue;
    let ix = c.x, iz = c.z;
    if (c.face === "n") iz = c.z + 1;
    else if (c.face === "s") iz = c.z - 1;
    else if (c.face === "w") ix = c.x + 1;
    else if (c.face === "e") ix = c.x - 1;
    if (S.has(k(ix, iz)) && exposed(ix, iz).length === 0) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

// 4. smaller rooftop plant on the interior of the roof
for (const c of cellsArr) {
  if (c.face) continue;
  if (c.x < 15 || c.x > 21 || c.z < 11 || c.z > 15) continue;
  g.set(c.x, c.R, c.z, "light_gray_concrete");
  if (c.R + 1 < H) g.set(c.x, c.R + 1, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
