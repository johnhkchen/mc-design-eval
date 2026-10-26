import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC53977.cells.json`, "utf8"));

const W = 12, D = 24, H = 35;
const g = new Voxels([W, H, D]);

const S = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};
const key = (x, z) => `${x},${z}`;
const isEdge = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// ---- Raw per-cell data from lidar ----
const raw = new Map();
for (const [x, z, gr, ro] of cells) {
  raw.set(key(x, z), {
    x, z,
    gy: Math.max(0, Math.round(gr)),
    nsRaw: Math.max(1, Math.round((Math.round(ro) - Math.max(0, Math.round(gr))) / 3)),
  });
}

// ---- Smooth storey count over a 3x3 neighbourhood (removes lidar noise) ----
const info = new Map();
for (const c of raw.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.nsRaw; n++; }
  }
  let ns = Math.round(sum / n);
  // clean flat tiers: never fewer than 6 storeys, never more than 8
  ns = Math.min(8, Math.max(6, ns));
  // setback on the front and back rows: one storey lower
  if ((c.z <= 1 || c.z >= D - 2) && ns >= 7) ns -= 1;
  info.set(key(c.x, c.z), { x: c.x, z: c.z, gy: c.gy, ns, top: c.gy + 3 * ns });
}

// one flat main roof level for the penthouse and plant
let maxNs = 0;
for (const c of info.values()) if (c.x >= 3 && c.x <= 8 && c.z >= 8 && c.z <= 15) maxNs = Math.max(maxNs, c.ns);

// ---- Main massing ----
for (const c of info.values()) {
  const { x, z, gy, ns, top } = c;
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  const idx = (x === 0 || x === W - 1) ? z : x;
  const pier = corner || idx % 2 === 0;

  // foundation up to the cell's ground
  for (let y = 0; y < gy; y++) S(x, y, z, "stone_bricks");

  for (let s = 0; s < ns; s++) {
    const b = gy + 3 * s;
    const topStorey = s === ns - 1;
    // storey line / floor slab; ground storey gets a dark base course
    S(x, b, z, s === 0 ? "polished_granite" : "smooth_quartz");

    if (edge) {
      for (let dy = 1; dy <= 2; dy++) {
        if (topStorey && dy === 2) break;   // roof deck takes this course
        S(x, b + dy, z, pier ? "white_concrete" : "gray_stained_glass_pane");
      }
    }
  }

  // roof deck over every cell
  S(x, top - 1, z, "smooth_stone");

  // cornice / parapet on the perimeter
  if (edge) S(x, top, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// ---- Entrance on the street face (z = 0) ----
for (const c of info.values()) {
  const { x, z, gy } = c;
  if (z !== 0 || x < 4 || x > 7) continue;
  S(x, gy + 2, z, "smooth_quartz");                 // lintel over the bay
  if (x === 5 || x === 6) {
    const hinge = x === 5 ? "left" : "right";
    S(x, gy, z, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    S(x, gy + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  }
}

// ---- Warm light behind the glass (interior side of some window bays) ----
for (const c of info.values()) {
  const { x, z, ns, gy } = c;
  if (!isEdge(x, z) || isCorner(x, z)) continue;
  const idx = (x === 0 || x === W - 1) ? z : x;
  if (idx % 4 !== 1) continue;
  let ix = x, iz = z;
  if (x === 0) ix = 1; else if (x === W - 1) ix = W - 2;
  else if (z === 0) iz = 1; else if (z === D - 1) iz = D - 2;
  const inner = info.get(key(ix, iz));
  if (!inner || isEdge(ix, iz)) continue;
  for (let s = 0; s < ns - 1; s += 2) {
    const b = gy + 3 * s;
    if (b + 1 < inner.top) S(ix, b + 1, iz, "glowstone");
  }
}

// ---- Penthouse tier on the central core (flat, only on the main roof level) ----
if (maxNs >= 6) {
  for (const c of info.values()) {
    const { x, z, ns, top } = c;
    if (x < 3 || x > 8 || z < 8 || z > 15 || ns !== maxNs) continue;
    const boundary = x === 3 || x === 8 || z === 8 || z === 15;
    const corner = (x === 3 || x === 8) && (z === 8 || z === 15);
    const idx = (x === 3 || x === 8) ? z : x;
    if (boundary) {
      for (let dy = 0; dy <= 1; dy++) {
        const glass = !corner && idx % 2 === 1;
        S(x, top + dy, z, glass ? "gray_stained_glass_pane" : "smooth_quartz");
      }
    }
    S(x, top + 2, z, "light_gray_concrete");          // penthouse roof
  }
  const pen = info.get(key(5, 11));
  if (pen && pen.ns === maxNs) S(5, pen.top, 11, "shroomlight");
}

// ---- Roof plant on the main roof level ----
for (let x = 1; x <= 2; x++) for (let z = 4; z <= 6; z++) {
  const c = info.get(key(x, z));
  if (!c || c.ns !== maxNs) continue;
  S(x, c.top, z, "light_gray_concrete");
  S(x, c.top + 1, z, "iron_block");
}

g.save(`${DIR}/DC53977.nbt`);
