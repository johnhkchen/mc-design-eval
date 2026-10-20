import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540893368";
const cells = JSON.parse(readFileSync(`${base}.cells.json`, "utf8"));

const W = 14, H = 23, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Storey levels relative to minG:
// r0 ground slab, r1-4 ground storey, r5 floor line, r6-9 upper storey,
// r10 roof slab / cornice, r11 parapet (roof ~11 above lowest ground)
const top = minG + 11;

// 1. Foundations: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Ground floor slab and per-cell floor lines
for (const [x, z, gr] of cells) {
  put(x, minG, z, "smooth_quartz");
}

// 3. Walls, floors, windows, doors
for (const [x, z, gr] of cells) {
  const missing = [];
  if (!has(x, z - 1)) missing.push("N");
  if (!has(x, z + 1)) missing.push("S");
  if (!has(x - 1, z)) missing.push("W");
  if (!has(x + 1, z)) missing.push("E");
  const perim = missing.length > 0;
  const corner = (missing.includes("N") || missing.includes("S")) &&
                 (missing.includes("W") || missing.includes("E"));
  const zFace = missing.includes("N") || missing.includes("S"); // wall runs along x
  const along = zFace ? x : z;
  const isDoor = missing.includes("N") && (x === 6 || x === 7) && gr <= minG + 1;
  const pane = zFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const lo = Math.max(gr, minG + 1);

  for (let y = lo; y <= top; y++) {
    const r = y - minG;
    if (!perim) {
      if (r === 5 || r === 10) put(x, y, z, "smooth_quartz");
      continue;
    }
    if (r === 11) { put(x, y, z, "stone_bricks"); continue; }      // parapet
    if (r === 10) { put(x, y, z, "red_terracotta"); continue; }    // cornice band
    if (r === 9) { put(x, y, z, "smooth_quartz"); continue; }
    if (r === 6) { put(x, y, z, "smooth_quartz"); continue; }
    if (r === 5) { put(x, y, z, "red_terracotta"); continue; }     // storey line
    if (r === 4) { put(x, y, z, "smooth_quartz"); continue; }      // lintel
    if (isDoor && (r === 1 || r === 2)) {
      const hinge = x === 6 ? "left" : "right";
      const half = r === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "north", half, hinge, open: "false", powered: "false" });
      continue;
    }
    if (r === 1) { put(x, y, z, "polished_andesite"); continue; }  // plinth
    if (corner) { put(x, y, z, "quartz_pillar"); continue; }
    if (r === 2 || r === 3) {
      if (isDoor) { put(x, y, z, "smooth_quartz"); continue; }
      if (along % 3 === 0) put(x, y, z, "smooth_quartz");           // shopfront bay piers
      else put(x, y, z, "glass_pane", pane);
      continue;
    }
    if (r === 7 || r === 8) {
      if (along % 2 === 1) put(x, y, z, "glass_pane", pane);
      else put(x, y, z, "smooth_quartz");
      continue;
    }
  }
}

// 4. Warm lights behind some upper-storey windows (inside the air gap)
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z) || gr > minG + 7) continue;
  const missing = [];
  if (!has(x, z - 1)) missing.push("N");
  if (!has(x, z + 1)) missing.push("S");
  if (!has(x - 1, z)) missing.push("W");
  if (!has(x + 1, z)) missing.push("E");
  if (missing.some((m) => m === "N" || m === "S") && missing.some((m) => m === "W" || m === "E")) continue;
  const along = (missing.includes("N") || missing.includes("S")) ? x : z;
  if (along % 4 !== 3) continue;
  let ix = x, iz = z;
  if (missing.includes("N")) iz = z + 1;
  else if (missing.includes("S")) iz = z - 1;
  else if (missing.includes("W")) ix = x + 1;
  else if (missing.includes("E")) ix = x - 1;
  if (has(ix, iz) && !isPerim(ix, iz)) put(ix, minG + 7, iz, "glowstone");
}

// Warm ground-floor lantern inside the entrance bay
if (has(6, 1) && !isPerim(6, 1)) {
  put(6, minG + 4, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// 5. Rooftop water tank on interior roof cells
for (const [x, z] of [[4, 3], [5, 3], [4, 4], [5, 4]]) {
  if (!has(x, z) || isPerim(x, z)) continue;
  for (let r = 11; r <= 13; r++) put(x, minG + r, z, "white_concrete");
  put(x, minG + 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${base}.nbt`);
