import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458732";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey mid-century commercial block: cream terrazzo-style walls, grey concrete piers,
// stone base course, storey spandrels, a parapet, and a shopfront ground floor.
const W = 19, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inFp = new Set(cells.map(([x, z]) => key(x, z)));
const groundAt = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => inFp.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const WALL = "smooth_quartz";
const PIER = "light_gray_concrete";
const BASE = "stone_bricks";
const SLAB = "smooth_stone";
const FOUND = "stone";

// Per-cell body: foundation, floors, perimeter walls.
for (const [x, z, gr] of cells) {
  const base = gr;

  // Foundation from y=0 up to ground.
  for (let y = 0; y < base; y++) put(x, y, z, FOUND);

  // Storey slab (top of storey 1) and roof slab (top of storey 2).
  put(x, base + 5, z, SLAB);
  put(x, base + 10, z, "gray_concrete");

  const f = faces(x, z);
  if (f.length === 0) continue; // interior cell: air above the slabs

  const corner = f.length > 1;
  const face = f[0];
  const idx = (face === "N" || face === "S") ? x : z;
  const isPier = corner || idx % 3 === 0;

  for (let dy = 0; dy <= 11; dy++) {
    const y = base + dy;
    let id = WALL;
    let props;

    if (dy === 0) id = BASE;                       // base course
    else if (dy === 4 || dy === 9) id = WALL;      // spandrel band
    else if (dy === 11) id = WALL;                 // parapet
    else if ((dy >= 1 && dy <= 3) || (dy >= 6 && dy <= 8)) {
      // window bands: piers or glass panes
      if (isPier) id = PIER;
      else {
        id = "glass_pane";
        props = (face === "N" || face === "S")
          ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      }
    } else if (dy === 5) id = SLAB;                // storey line
    else if (dy === 10) id = "smooth_stone_slab";  // cornice course

    put(x, y, z, id, props);
  }

  // Warm lights behind some upper and lower panes (interior side of the glass).
  if (!isPier && idx % 6 === 1) {
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && faces(ix, iz).length === 0) {
      put(ix, base + 2, iz, "glowstone");
      put(ix, base + 7, iz, "shroomlight");
    }
  }
}

// Entrance: door on the north face near the middle, with a hood and a hanging lantern.
const northCells = cells
  .filter(([x, z]) => !has(x, z - 1) && faces(x, z).length === 1)
  .sort((a, b) => a[0] - b[0]);
if (northCells.length) {
  const midX = (Math.min(...cells.map(c => c[0])) + Math.max(...cells.map(c => c[0]))) / 2;
  const [dx0, dz0, gr0] = northCells.reduce((best, c) =>
    Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best);
  const b = gr0;
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(dx0, b + 1, dz0, "dark_oak_door", doorProps("lower"));
  put(dx0, b + 2, dz0, "dark_oak_door", doorProps("upper"));
  put(dx0, b + 3, dz0, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

  // Canopy band across the entrance bay.
  for (const dx of [-1, 0, 1]) {
    if (has(dx0 + dx, dz0)) put(dx0 + dx, b + 4, dz0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
  // Hanging lantern just inside the door.
  if (has(dx0, dz0 + 1)) put(dx0, b + 4, dz0 + 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Roof equipment: a few plant boxes on the roof terrace, inside the parapet.
for (const [x, z, gr] of cells) {
  if (faces(x, z).length !== 0) continue;
  if (x % 6 === 2 && z % 5 === 2 && gr + 11 < H) {
    put(x, gr + 11, z, PIER);
  }
}

g.save(`${DIR}/${ID}.nbt`);
