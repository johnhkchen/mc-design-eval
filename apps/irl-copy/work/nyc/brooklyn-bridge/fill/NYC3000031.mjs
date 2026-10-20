import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000031";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 52 Jay Street, DUMBO: 1900 mixed-use brick loft block, storeys on a common
// line over a stone-base shopfront. Street frontage is the z=0 (north) side.
const W = 19, H = 20, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(key(x, z), { g: gr, r: rf });
const has = (x, z) => cellMap.has(key(x, z));

const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const even = (v) => Math.round(v / 2) * 2;

// Common storey line G; each cell's roof follows lidar in 2-block tiers.
const G = med(cells.map((c) => c[2]));
const roofOf = new Map();
for (const [x, z, gr, rf] of cells) {
  const r = Math.min(H - 4, Math.max(gr + 4, even(rf)));
  roofOf.set(key(x, z), r);
}
const roofC = (x, z) => roofOf.get(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exposed faces: N = z-1 side (street), S = z+1, W = x-1, E = x+1.
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const isEdge = (x, z) => faces(x, z).length > 0;

const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const windowWanted = (x, z, f, rel) => {
  if (f.length !== 1) return null;           // corners stay solid piers
  const face = f[0];
  if (face === "N" || face === "S") {
    if (face === "N" && rel === 1) return x >= 1 && x <= 17 ? paneX : null; // shopfront glass
    return x >= 2 && x <= 16 && (x - 2) % 3 === 0 ? paneX : null;
  }
  return z === 2 || z === 3 ? paneZ : null;
};

// 1. Foundations: edge cells to their own ground; interior to the base line.
for (const [x, z, gr] of cells) {
  const top = isEdge(x, z) ? gr : Math.max(gr, G);
  for (let y = 0; y < top; y++) put(x, y, z, "stone_bricks");
}

// 2. Exterior shell following each cell's roof tier.
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (f.length === 0) continue;
  const rc = roofC(x, z);
  for (let y = gr; y <= rc - 1; y++) {
    const rel = y - G;
    if (y === rc - 1) { put(x, y, z, "stone_bricks"); continue; }  // cornice cap
    if (rel < 0) { put(x, y, z, "bricks"); continue; }
    if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }     // base course / bulkhead
    if (rel % 2 === 0) { put(x, y, z, "smooth_stone"); continue; } // storey string course
    if (y > rc - 2) { put(x, y, z, "bricks"); continue; }
    const w = windowWanted(x, z, f, rel);
    if (w) put(x, y, z, "glass_pane", w);
    else put(x, y, z, "bricks");
  }
}

// 3. Interior floor slabs per storey and roof decks; air behind the glass.
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  const rc = roofC(x, z);
  for (let y = Math.max(gr, G); y <= rc - 1; y++) {
    const rel = y - G;
    if (y === rc - 1) put(x, y, z, "smooth_stone");
    else if (rel > 0 && rel % 2 === 0) put(x, y, z, "spruce_planks");
  }
}

// 4. Warm lights behind upper-storey windows.
for (const [x, z] of [[5, 1], [11, 1], [8, 4]]) {
  const y = G + 3;
  if (has(x, z) && !isEdge(x, z) && y <= roofC(x, z) - 2) put(x, y, z, "glowstone");
}

// 5. Street entrance at x=3 on the north face.
const doorY = Math.max(G, cellMap.get(key(3, 0))?.g ?? G);
const doorBase = { facing: "north", hinge: "left", open: "false", powered: "false" };
put(3, doorY, 0, "oak_door", { ...doorBase, half: "lower" });
put(3, doorY + 1, 0, "oak_door", { ...doorBase, half: "upper" });

// 6. Roof bulkhead: a 2x2 stair tower on the highest interior tier, with a
// lantern-lit door facing the street and a stone cap.
let best = null;
for (const [x, z] of [[14, 2], [13, 2], [14, 3], [13, 3], [7, 2], [7, 3], [8, 2], [8, 3]]) {
  if (!has(x, z) || isEdge(x, z) || !has(x + 1, z) || !has(x, z + 1) || !has(x + 1, z + 1)) continue;
  if (isEdge(x + 1, z) || isEdge(x, z + 1) || isEdge(x + 1, z + 1)) continue;
  const r = roofC(x, z);
  if (!best || r > best.r) best = { x, z, r };
}
if (best && best.r + 3 < H) {
  const { x, z, r } = best;
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    const X = x + dx, Z = z + dz;
    put(X, r, Z, "bricks");
    put(X, r + 1, Z, "bricks");
    put(X, r + 2, Z, "stone_bricks");
  }
  // Street-facing (north) door and window on the tower
  put(x, r, z, "oak_door", { ...doorBase, half: "lower" });
  put(x, r + 1, z, "oak_door", { ...doorBase, half: "upper" });
  put(x + 1, r + 1, z, "glass_pane", paneX);
  put(x, r + 1, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
