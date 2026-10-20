import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001386";
const W = 6, H = 26, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) {
  raw.set(key(x, z), { g: Math.max(0, Math.min(H - 8, gr | 0)), r: Math.min(H - 4, roof | 0) });
}

// Smooth lidar roof noise: average each roof over its 3x3 neighbourhood,
// then round to whole blocks so tiers read as clean flat setbacks.
const map = new Map();
for (const [k, { g: gr, r: rr }] of raw) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz));
    if (c) { sum += c.r; n++; }
  }
  let top = Math.round(sum / n);
  if (top < gr + 4) top = gr + 4;
  map.set(k, { g: gr, r: Math.min(H - 5, top) });
}

const NORM = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const cellFaces = (x, z) =>
  Object.keys(NORM).filter((n) => {
    const [dx, dz] = NORM[n];
    return !map.has(key(x + dx, z + dz));
  });
const faceIdx = (n, x, z) => (n === "north" || n === "south" ? x : z);

// Classify a facade voxel: returns a kind or null (leave body brick)
function winKind(n, x, z, y, gr, rr) {
  const idx = faceIdx(n, x, z);
  if (y >= rr - 3) return null;
  if (y < gr + 4) {
    if (y === gr) return "base";
    if (y === gr + 3) return "lintel";
    if (idx % 3 === 0) return "pier";
    return "shop";
  }
  if ((y - gr - 4) % 3 === 0) return "line";
  if (idx % 3 === 0) return "pier";
  return "glass";
}

// Pass 1: stone foundation, brick body, roof surface
for (const [k, { g: gr, r: rr }] of map) {
  const [x, z] = k.split(",").map(Number);
  const perim = cellFaces(x, z).length > 0;
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < rr; y++) {
    if (!perim && y === rr - 1) g.set(x, y, z, "smooth_stone");
    else g.set(x, y, z, "bricks");
  }
}

// Pass 2: cornice, parapet cap, and facade articulation
const windows = [];
for (const [k, { g: gr, r: rr }] of map) {
  const [x, z] = k.split(",").map(Number);
  const faces = cellFaces(x, z);
  if (faces.length === 0) continue;

  // Cornice: stone course with chiselled crown, then a slab cap on the parapet
  for (let y = Math.max(gr, rr - 3); y < rr; y++) {
    g.set(x, y, z, y === rr - 1 ? "chiseled_stone_bricks" : "stone_bricks");
  }
  g.set(x, rr, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  for (let y = gr; y < rr - 3; y++) {
    let kind = null, face = null;
    for (const n of faces) {
      const kk = winKind(n, x, z, y, gr, rr);
      if (kk === "glass" || kk === "shop") { kind = kk; face = n; break; }
      if (kind === null && kk) { kind = kk; face = n; }
    }
    if (!kind) continue;

    if (kind === "base") g.set(x, y, z, "polished_granite");
    else if (kind === "lintel" || kind === "line") g.set(x, y, z, "stone_bricks");
    else if (kind === "pier") {
      if (y < gr + 4) g.set(x, y, z, "polished_granite");
    } else if (kind === "shop") {
      g.set(x, y, z, "glass");
      windows.push({ x, z, y, n: face, shop: true });
    } else if (kind === "glass") {
      g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      windows.push({ x, z, y, n: face, shop: false });
    }
  }
}

// Pass 3: air gap behind glass, with warm glowstone in some upper windows
for (const w of windows) {
  const [dx, dz] = NORM[w.n];
  const ix = w.x - dx, iz = w.z - dz;
  if (!map.has(key(ix, iz))) continue;
  if (cellFaces(ix, iz).length > 0) continue;
  const { g: gr, r: rr } = map.get(key(ix, iz));
  if (w.y < gr + 1 || w.y >= rr - 3) continue;
  g.set(ix, w.y, iz, "air");
  if (!w.shop && (ix + iz + w.y) % 4 === 0) g.set(ix, w.y, iz, "glowstone");
}

// Pass 4: entrance on a street-facing ground cell, framed by piers
let doorDone = false;
for (const n of ["south", "north", "west", "east"]) {
  if (doorDone) break;
  for (const [k, { g: gr, r: rr }] of map) {
    if (doorDone) break;
    const [x, z] = k.split(",").map(Number);
    if (!cellFaces(x, z).includes(n)) continue;
    if (faceIdx(n, x, z) !== 2) continue;
    if (gr + 2 >= rr - 3) continue;
    // Stone stoop-level threshold so the door reads from the street
    g.set(x, gr, z, "dark_oak_door", { facing: n, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: n, half: "upper", hinge: "left", open: "false", powered: "false" });
    // Lantern beside the door on the storefront piers, sitting on the stone pier block
    const [ox, oz] = n === "south" || n === "north" ? [x, z] : [x, z];
    doorDone = true;
  }
}

// Pass 5: roof equipment, chimney stacks on interior roof cells
for (const [k, { r: rr }] of map) {
  const [x, z] = k.split(",").map(Number);
  if (cellFaces(x, z).length > 0) continue;
  if ((x * 2 + z * 3) % 11 !== 4) continue;
  if (rr + 2 >= H) continue;
  g.set(x, rr, z, "bricks");
  g.set(x, rr + 1, z, "bricks");
  g.set(x, rr + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
