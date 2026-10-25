import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499742";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 31, D = 21;

// ---- footprint --------------------------------------------------------------
const cellList = cells.map(([x, z, g, r]) => ({ x, z, g, r, key: `${x},${z}` }));
const map = new Map(cellList.map((c) => [c.key, c]));
const has = (x, z) => map.has(`${x},${z}`);
const K = (x, y, z) => `${x},${y},${z}`;

// smoothed massing: one storey base, one wall top, one roof top
const gMin = Math.min(...cellList.map((c) => c.g));
const sortedR = cellList.map((c) => c.r).sort((a, b) => a - b);
const medR = sortedR[Math.floor(sortedR.length / 2)];
const B = gMin;                       // storey row base
const twGlobal = gMin + 15;           // 3 storeys x 5 blocks
const roofTop = Math.min(Math.max(twGlobal + 3, Math.round(medR)), H - 4);
const Hr = roofTop - twGlobal;        // hip roof depth

// inward distance from the outside edge
const dist = new Map();
const queue = [];
for (const c of cellList) {
  c.mW = !has(c.x - 1, c.z); c.mE = !has(c.x + 1, c.z);
  c.mN = !has(c.x, c.z - 1); c.mS = !has(c.x, c.z + 1);
  if (c.mW || c.mE || c.mN || c.mS) { dist.set(c.key, 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const cur = queue[i];
  const d0 = dist.get(cur.key);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nk = `${cur.x + dx},${cur.z + dz}`;
    if (map.has(nk) && !dist.has(nk)) { dist.set(nk, d0 + 1); queue.push(map.get(nk)); }
  }
}

for (const c of cellList) {
  c.d = dist.get(c.key) || 1;
  const xFace = (c.mW || c.mE) && !(c.mN || c.mS);
  const zFace = (c.mN || c.mS) && !(c.mW || c.mE);
  if ((c.mW || c.mE) && (c.mN || c.mS)) c.kind = "corner";
  else if (xFace) { c.kind = "faceX"; c.u = c.z; c.dx = c.mW ? 1 : -1; c.dz = 0; }
  else if (zFace) { c.kind = "faceZ"; c.u = c.x; c.dx = 0; c.dz = c.mN ? 1 : -1; }
  else c.kind = "inner";
  c.tw = Math.max(c.g + 3, twGlobal);
  c.r = roofTop;
  c.sloped = roofTop > c.tw;
  c.chim = c.d >= Hr + 1 && c.x % 7 === 3 && c.z % 7 === 3;
}

// ---- entrance: south face, centred ------------------------------------------
const southFaces = cellList
  .filter((c) => c.kind === "faceZ" && c.mS && c.d === 1)
  .sort((a, b) => a.x - b.x);
const door = southFaces.length ? southFaces[Math.floor(southFaces.length / 2)] : null;
const doorKey = door ? door.key : null;
const doorBase = door ? door.g : 0;

// door surround: granite jambs and lintel on the same face
const surround = new Set();
if (door) {
  for (const du of [-1, 1]) {
    const c2 = map.get(`${door.x + du},${door.z}`);
    if (c2 && c2.kind === "faceZ") {
      for (let y = doorBase; y <= doorBase + 3; y++) surround.add(K(c2.x, y, c2.z));
    }
  }
  for (let y = doorBase + 3; y <= doorBase + 3; y++) surround.add(K(door.x, y, door.z));
}

// ---- pockets (air behind windows) and light spots ---------------------------
const pockets = new Map();
for (const c of cellList) {
  if (c.kind !== "faceX" && c.kind !== "faceZ") continue;
  if (c.u % 3 === 0 || c.key === doorKey) continue;
  const ix = c.x + c.dx, iz = c.z + c.dz;
  if (!has(ix, iz)) continue;
  const inner = map.get(`${ix},${iz}`);
  if (inner.d < 2) continue;
  for (let s = 0; s < 3; s++) {
    for (let o = 1; o <= 3; o++) {
      const y = B + 5 * s + o;
      if (y >= c.tw || y < c.g) continue;
      let val = "air";
      if (o === 2 && (c.u + s) % 4 === 0) val = "light";
      pockets.set(K(ix, y, iz), val);
    }
  }
}
if (door) {
  const ix = door.x + door.dx, iz = door.z + door.dz;
  for (const y of [doorBase + 1, doorBase + 2]) pockets.set(K(ix, y, iz), "air");
}

// lanterns beside the door, hanging under the lintel row
const lanternKeys = new Set();
if (door) {
  for (const du of [-2, 2]) {
    const c2 = map.get(`${door.x + du},${door.z}`);
    if (c2 && c2.kind === "faceZ" && c2.mS && c2.u % 3 !== 0) {
      const y = doorBase + 3;
      if (y < c2.tw) lanternKeys.add(K(c2.x, y, c2.z));
    }
  }
}

// ---- block selection --------------------------------------------------------
function blockAt(c, y) {
  const { x, z, g, tw, d } = c;
  if (y < g) return ["stone_bricks"];

  if (y >= tw) {
    if (c.sloped) {
      if (y < roofTop) return d >= 1 + (y - tw) ? ["deepslate_tiles"] : null;
      if (c.chim && y <= roofTop + 2) return ["bricks"];
      return null;
    }
    if (y === tw) return d >= 2 ? ["deepslate_tiles"] : ["stone_brick_wall"];
    return null;
  }

  if (d >= 2) {
    const v = pockets.get(K(x, y, z));
    if (v === "light") return ["shroomlight"];
    if (v === "air") return null;
    return ["granite"];
  }

  // outer wall (d === 1)
  if (c.kind === "corner") return ["polished_granite"];
  if (c.key === doorKey) {
    if (y === doorBase) return ["oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (y === doorBase + 1) return ["oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (y === doorBase + 3) return ["polished_granite"];
  }
  if (surround.has(K(x, y, z))) return ["polished_granite"];
  if (lanternKeys.has(K(x, y, z))) return ["lantern", { hanging: "true", waterlogged: "false" }];

  const o = (y - B) % 5;
  if (o === 0) return ["smooth_stone"];
  if (o === 4) return ["chiseled_stone_bricks"];
  const u = c.u ?? x;
  if (u % 3 === 0) return ["polished_granite"];
  if (o >= 1 && o <= 3) return ["glass_pane"];
  return ["granite"];
}

// ---- build ------------------------------------------------------------------
const g = new Voxels([W, H, D]);
for (const c of cellList) {
  for (let y = 0; y < H; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    const [name, props] = b;
    if (props) g.set(c.x, y, c.z, name, props);
    else g.set(c.x, y, c.z, name);
  }
}
g.save(`${DIR}/${ID}.nbt`);
