// 1630 Connecticut Ave NW (Dupont Circle), Commercial-Office-Large: a c.1960s pale-stone office block on a granite base.
// Three lidar tiers (roof 13 core, 11 mid, 10 wing) with a 3x3 mode filter so 1-cell noise doesn't jag the setbacks.
// Storeys are 2 blocks (window row over a spandrel row) from a 3-block ground floor, so the tier tops fall on storey lines.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const raw = JSON.parse(readFileSync(`${DIR}/DC61604.cells.json`, "utf8"));
const W = 15, D = 11, H = 25;

// footprint: g = ground (foundation top), roof = lidar roof height above y 0
const fp = new Map();
for (const [x, z, g, roof] of raw) fp.set(`${x},${z}`, { g, roof });
const inFp = (x, z) => fp.has(`${x},${z}`);
const cellAt = (x, z) => fp.get(`${x},${z}`);

// 3x3 mode of the lidar tier over footprint neighbours (ties keep the cell's own value)
const modeTop = new Map();
for (const [x, z, , roof] of raw) {
  const count = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = cellAt(x + dx, z + dz); if (n) count.set(n.roof, (count.get(n.roof) || 0) + 1);
  }
  let best = roof, bestN = count.get(roof) || 0;
  for (const [v, n] of count) if (n > bestN) { best = v; bestN = n; }
  modeTop.set(`${x},${z}`, best);
}
for (const [k, c] of fp) c.top = modeTop.get(k);

// the faces a building cell is exposed on (outside the footprint, or above the neighbour's roof)
const DIRS = { "-z": [0, -1], "+z": [0, 1], "-x": [-1, 0], "+x": [1, 0] };
function exposed(x, y, z) {
  const out = [];
  for (const [k, [dx, dz]] of Object.entries(DIRS)) {
    const n = cellAt(x + dx, z + dz);
    if (!n || y >= n.top) out.push(k);
  }
  return out;
}

const g = new Voxels([W, H, D]);
const windows = [];
const GLASS = "light_blue_stained_glass_pane";
const PANE = (axis) => (axis === "z"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the entrance: two doors in the north (z = 0) face, under a recessed portico
const isDoor = (x, y, z) => z === 0 && (x === 9 || x === 10) && (y === 1 || y === 2);
const doorState = (x, y) => ({
  facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 9 ? "left" : "right", open: "false", powered: "false",
});

// one facade cell: the base course, shopfront or window row, storey spandrels, piers between the glass
function facade(x, y, z, ex) {
  if (isDoor(x, y, z)) return ["dark_oak_door", doorState(x, y)];
  if (y === 0 || y === 1) return ["polished_granite", null];         // base course and sill
  const exZ = ex.filter((d) => d.endsWith("z")), exX = ex.filter((d) => d.endsWith("x"));
  const corner = exZ.length > 0 && exX.length > 0;
  const axis = exZ.length ? "z" : "x", u = axis === "z" ? x : z;
  const windowRow = y === 2 || (y % 2 === 0);                          // rows 2, 4, 6 ... ; odd rows are spandrels
  if (!windowRow) return ["smooth_quartz", null];
  if (corner || u % 2 === 0) return ["quartz_pillar", null];          // piers between the glass, and the corners
  return [GLASS, PANE(axis)];
}

// Pass 1: the massing, shell and interiors
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.top; y++) {
    if (y < c.g) { g.set(x, y, z, "polished_granite"); continue; }   // foundation
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }   // base course / ground slab
    const ex = exposed(x, y, z);
    if (y === c.top - 1) {                                            // roof: a cornice ring on the exposed edge, plain roof inside
      if (ex.length) {
        g.set(x, y, z, "smooth_quartz");
        g.set(x, y + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      } else g.set(x, y, z, "stone");
      continue;
    }
    if (ex.length) {                                                  // the shell
      const [name, state] = facade(x, y, z, ex);
      g.set(x, y, z, name, state);
      if (name === GLASS) {
        const axis = ex.some((d) => d.endsWith("z")) ? "z" : "x";
        const [dx, dz] = DIRS[ex.find((d) => d.endsWith(axis))].map((v) => -v);   // inward
        windows.push({ x, y, z, dx, dz, axis, u: axis === "z" ? x : z, inner: [x + dx, y, z + dz] });
      }
      continue;
    }
    if (y >= 3 && y % 2 === 1) g.set(x, y, z, "smooth_stone");        // a floor slab per storey
    // else an air gap: no interiors
  }
}

// Pass 2: each window is recessed one block behind the face (its reveal gives the piers and sills their shadow); the
// glass sits in the inner cell, with an air gap behind it. Warm light goes in that gap in some windows.
for (const w of windows) {
  const inner = w.inner, behind = [w.x + 2 * w.dx, w.y, w.z + 2 * w.dz];
  if (!inFp(inner[0], inner[2]) || exposed(...inner).length) continue;   // narrow corner: keep the window flush
  g.set(w.x, w.y, w.z, "air");
  g.set(inner[0], inner[1], inner[2], GLASS, PANE(w.axis));
  if (!((w.u * 5 + w.y) % 7 === 0)) continue;
  if (!inFp(behind[0], behind[2]) || exposed(...behind).length) continue;
  if ((w.u + w.y) % 3 === 0) g.set(behind[0], behind[1], behind[2], "glowstone");
  else g.set(behind[0], behind[1], behind[2], "lantern", { hanging: "false", waterlogged: "false" });
}
for (const x of [9, 10]) g.set(x, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Pass 3: roof equipment on the mid tier (2-block plant boxes with grilles), spaced on the flat roof
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (c.top !== 11 || (x % 4) !== 2 || (z % 3) !== 1) continue;
  if (exposed(x, c.top - 1, z).length) continue;
  g.set(x, 11, z, "light_gray_concrete");
  g.set(x, 12, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
}

const out = `${DIR}/DC61604.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries`);
