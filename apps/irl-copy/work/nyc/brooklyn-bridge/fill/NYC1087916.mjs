import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1087916";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);

const W = 64, H = 30, D = 53;
const g = new Voxels([W, H, D]);

// ---- footprint and per-cell heights ----
const cells = new Map();
for (const c of list) {
  const [x, z, gr, rf] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ground = Math.max(0, Math.min(H - 6, Math.round(gr ?? 0)));
  const roof = rf ?? (ground + 18);
  cells.set(`${x},${z}`, { x, z, ground, roofRaw: roof });
}
const has = (x, z) => cells.has(`${x},${z}`);

// ---- smooth roof heights: average the 3x3 neighbourhood, snap to 2-block storeys ----
for (const c of cells.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = cells.get(`${c.x + dx},${c.z + dz}`);
    if (o) { sum += o.roofRaw; n++; }
  }
  let top = Math.round((sum / n) / 2) * 2;
  top = Math.max(c.ground + 4, Math.min(top, H - 2));
  c.top = top;
}

// ---- foundations: solid from y0 up to each cell's ground ----
for (const { x, z, ground } of cells.values()) {
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
}

// ---- building shell ----
const lit = (a, b, c) => ((a * 7 + b * 13 + c * 5) % 11) === 0;

for (const { x, z, ground, top } of cells.values()) {
  const fN = !has(x, z - 1);
  const fS = !has(x, z + 1);
  const fW = !has(x - 1, z);
  const fE = !has(x + 1, z);
  const boundary = fN || fS || fW || fE;
  const along = (fN || fS) ? x : z;
  const cornerCell = (fN || fS) && (fW || fE);

  if (!boundary) {
    // Interior: floor slabs per storey, roof deck, air elsewhere
    for (let y = ground; y < top; y++) {
      const rel = y - ground;
      if (y === top - 1) g.set(x, y, z, "smooth_stone");
      else if (rel > 0 && rel % 2 === 0) g.set(x, y, z, "light_gray_concrete");
    }
    // Roof bulkheads: 2-block penthouses on a sparse 4x4 grid
    if (x % 6 === 3 && z % 6 === 3 && top + 2 <= H - 1) {
      g.set(x, top, z, "light_gray_concrete");
      g.set(x, top + 1, z, "stone_bricks");
    }
    continue;
  }

  // Facade cell
  for (let y = ground; y <= top; y++) {
    const rel = y - ground;
    if (y === top) { g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; } // parapet cap
    if (y === top - 1) { g.set(x, y, z, "smooth_stone"); continue; }          // cornice
    if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }              // base course
    if (rel % 2 === 0) { g.set(x, y, z, "white_concrete"); continue; }        // spandrel / floor line

    // window row
    if (cornerCell || along % 4 === 0) {
      // brick pier with stone quoins at corners
      g.set(x, y, z, cornerCell ? "stone_bricks" : "bricks");
      continue;
    }
    if (along % 4 === 1 || along % 4 === 3) {
      // window frame (white concrete jamb) on either side of the pane
      g.set(x, y, z, "white_concrete");
      continue;
    }
    // pane
    g.set(x, y, z, lit(along, rel, z) ? "glowstone" : "light_blue_stained_glass");
  }
}

// ---- street entrance on the low-z face, near the middle of the footprint ----
{
  const northCells = [...cells.values()].filter(c => !has(c.x, c.z - 1));
  if (northCells.length) {
    const minZ = Math.min(...northCells.map(c => c.z));
    const row = northCells.filter(c => c.z === minZ);
    const xs = row.map(c => c.x).sort((a, b) => a - b);
    const midX = xs[Math.floor(xs.length / 2)];
    const e = row.reduce((best, c) => Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best, row[0]);
    const { x, z, ground, top } = e;
    if (ground + 4 < top) {
      // Stone surround framing a double door
      const surround = [x - 1, x, x + 1].filter(xx => has(xx, z));
      for (const xx of surround) {
        g.set(xx, ground + 3, z, "stone_bricks");
        g.set(xx, ground + 1, z, "stone_bricks");
      }
      for (const xx of [x, x + 1].filter(xx => has(xx, z))) {
        const hinge = xx === x ? "left" : "right";
        g.set(xx, ground + 1, z, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
        g.set(xx, ground + 2, z, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
      }
      // warm lanterns flanking the entrance on the base course line
      if (has(x - 1, z)) g.set(x - 1, ground + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
      if (has(x + 2, z)) g.set(x + 2, ground + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
