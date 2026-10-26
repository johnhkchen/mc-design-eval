import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87088";
const W = 18, H = 32, D = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const map = new Map(cells.map(c => [`${c[0]},${c[1]}`, c]));
const has = (x, z) => map.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Smooth the lidar: average ground and roof over the 3x3 neighbourhood, so the
// massing becomes clean tiers instead of per-cell spikes.
const smooth = (idx) => {
  const sm = new Map();
  for (const c of cells) {
    const [x, z] = c;
    let s = 0, n = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const o = map.get(`${x + dx},${z + dz}`);
      if (o) { s += o[idx]; n++; }
    }
    sm.set(`${x},${z}`, s / n);
  }
  return sm;
};
const gndS = smooth(2);
const roofS = smooth(3);

// Front = Pennsylvania Avenue side (low z); centre line of that face
const frontXs = cells.filter(c => !has(c[0], c[1] - 1)).map(c => c[0]);
const cx = frontXs.length ? Math.round((Math.min(...frontXs) + Math.max(...frontXs)) / 2) : Math.floor(W / 2);

const FLOORS = [6, 10, 14, 18, 22, 26];

for (const c of cells) {
  const [x, z] = c;
  const key = `${x},${z}`;
  const gnd = Math.max(0, Math.round(gndS.get(key)));
  // Roof: smoothed, then tiered to whole storeys above the plinth, capped to build height
  let roof = Math.round(roofS.get(key));
  roof = Math.min(roof, 28);
  if (roof < gnd + 8) roof = gnd + 8;
  const topRel = roof - gnd;
  const edge = isEdge(x, z);
  const front = !has(x, z - 1);

  let inX = null, inZ = null;
  if (!has(x, z - 1)) { inX = x; inZ = z + 1; }
  else if (!has(x, z + 1)) { inX = x; inZ = z - 1; }
  else if (!has(x - 1, z)) { inX = x + 1; inZ = z; }
  else if (!has(x + 1, z)) { inX = x - 1; inZ = z; }
  const inward = inX !== null && has(inX, inZ) && !isEdge(inX, inZ);

  // Foundation: solid from y0 to the smoothed ground under this cell
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  for (let rel = 0; rel < topRel; rel++) {
    const y = gnd + rel;

    // Interior: air with a floor slab at each storey line and the roof slab
    if (!edge) {
      if (rel === 0 || FLOORS.includes(rel) || rel === topRel - 1) {
        put(x, y, z, "smooth_stone");
      }
      continue;
    }

    // Exterior shell
    if (rel === 0) { put(x, y, z, "polished_granite"); continue; }

    if (rel < 6) {
      if (rel === 5) { put(x, y, z, "stone_bricks"); continue; }
      if (front && Math.abs(x - cx) <= 1) { put(x, y, z, "stone_bricks"); continue; }
      if (front && Math.abs(x - cx) <= 5 && rel === 4 && (x - cx) % 2 === 0) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      if ((x + z) % 2 === 0) put(x, y, z, "calcite");
      else put(x, y, z, "light_blue_stained_glass_pane");
      continue;
    }

    if (rel === topRel - 1) { put(x, y, z, "smooth_stone"); continue; } // cornice

    const r = (rel - 6) % 4;
    if (r === 0 || r === 3) { put(x, y, z, "calcite"); continue; } // storey band and lintel
    // Window rows
    if ((x + z) % 3 === 1) {
      put(x, y, z, "light_blue_stained_glass_pane");
      if (inward && (x * 7 + z * 3 + rel) % 9 === 0) {
        put(inX, y, inZ, "glowstone");
      }
    } else {
      put(x, y, z, "calcite");
    }
  }

  // Parapet cap on exterior walls
  if (edge) put(x, gnd + topRel, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Double entrance doors at the centre of the front face
for (const c of cells) {
  const [x, z] = c;
  if (has(x, z - 1)) continue;
  if (Math.abs(x - cx) > 1) continue;
  const gnd = Math.max(0, Math.round(gndS.get(`${x},${z}`)));
  const hinge = x < cx ? "left" : "right";
  put(x, gnd + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(x, gnd + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}

// Marquee canopy line over the entrance
for (const c of cells) {
  const [x, z] = c;
  if (has(x, z - 1)) continue;
  if (Math.abs(x - cx) > 5) continue;
  const gnd = Math.max(0, Math.round(gndS.get(`${x},${z}`)));
  put(x, gnd + 5, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
