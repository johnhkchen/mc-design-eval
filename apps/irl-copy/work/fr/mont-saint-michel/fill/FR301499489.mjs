import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499489";
const W = 14, H = 32, D = 20;
const TOP_CAP = 27;

// ---- read footprint cells: [x, z, ground, roof] ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const parsed = [];
for (const [x0, z0, gr0, roof0] of raw) {
  const x = Math.round(x0), z = Math.round(z0);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  parsed.push({ x, z, gr: Math.round(gr0), roof: roof0 });
}

// One flat main roof tier from the median lidar height; only clearly lower cells step down as a wing.
const roofs = parsed.map((c) => c.roof).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const MAIN_TOP = Math.min(TOP_CAP, Math.max(5, Math.round(medianRoof / 5) * 5));

const cells = new Map();
for (const c of parsed) {
  let top = MAIN_TOP;
  if (c.roof < medianRoof - 2.5) top = MAIN_TOP - 5;
  top = Math.max(c.gr + 5, Math.min(TOP_CAP, top));
  cells.set(`${c.x},${c.z}`, { x: c.x, z: c.z, gr: c.gr, top });
}

const inside = (x, z) => cells.has(`${x},${z}`);
const cellAt = (x, z) => cells.get(`${x},${z}`);
const isEdge = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
const mod5 = (n) => ((n % 5) + 5) % 5;

const G0 = Math.min(...[...cells.values()].map((c) => c.gr));
const CX = Math.floor(W / 2);

// entrance: south-facing (max z) edge cell in the centre column
let doorZ = -1;
for (let z = D - 1; z >= 0; z--) {
  if (inside(CX, z) && isEdge(CX, z)) { doorZ = z; break; }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- main build ----
for (const c of cells.values()) {
  const { x, z, gr, top } = c;
  const edge = isEdge(x, z);

  // foundation up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // roof deck: slate
  put(x, top, z, "deepslate_tiles");

  for (let y = gr; y < top; y++) {
    const band = mod5(y - G0);
    const storey = Math.floor((y - G0) / 5);
    const ground = storey === 0;

    if (!edge) {
      // interior: floor slabs at storey lines and a ceiling under the roof, no walls
      if (y === gr || band === 0) put(x, y, z, "smooth_stone");
      if (y === top - 1) put(x, y, z, "smooth_stone");
      continue;
    }

    // ----- facade -----
    const dxDoor = Math.abs(x - CX);
    const isDoor = ground && x === CX && z === doorZ;

    if (isDoor) {
      if (y === gr) { put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 1) { put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 2) { put(x, y, z, "stone_bricks"); continue; }
      if (y === gr + 3) { put(x, y, z, "dark_oak_planks"); continue; }
    }

    // door surround: framed piers and a fascia band over the entrance
    if (ground && doorZ >= 0 && z === doorZ && dxDoor === 1 && y >= gr + 1 && y <= gr + 3) {
      put(x, y, z, band === 4 ? "dark_oak_planks" : "stone_bricks");
      continue;
    }

    if (band === 0) {
      put(x, y, z, y === gr ? "stone_bricks" : "smooth_stone"); // plinth / string course
      continue;
    }
    if (band === 4) {
      put(x, y, z, ground ? "dark_oak_planks" : "stone_bricks"); // shop fascia / spandrel
      continue;
    }

    // window bands 1..3
    if (ground) {
      // shopfront: continuous glass with stone piers and dark frames
      if ((x + z) % 3 === 0) put(x, y, z, "stone_bricks");
      else if (y === gr + 1) put(x, y, z, "dark_oak_planks");
      else put(x, y, z, "glass_pane");
    } else {
      // upper storeys: paired window columns with stone mullions
      if ((x + z) % 3 === 1) put(x, y, z, "glass_pane");
      else put(x, y, z, "stone_bricks");
    }

    // a warm lit window: glowstone one block inside behind the glass
    if (band === 2 && ((x * 3 + z * 5 + storey) % 4 === 0)) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      let placed = false;
      for (const [dx, dz] of dirs) {
        const nx = x + dx, nz = z + dz;
        if (!inside(nx, nz) || isEdge(nx, nz)) continue;
        const n = cellAt(nx, nz);
        if (y < n.gr || y >= n.top - 1) continue;
        put(nx, y, nz, "glowstone");
        placed = true;
        break;
      }
      if (!placed) put(x, y, z, "glowstone");
    }
  }

  // cornice course on the top storey, then a flat stone parapet cap
  if (edge) {
    if (top - 1 >= gr) put(x, top - 1, z, "smooth_stone");
    put(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- rooftop chimney on an interior cell nearest the centre ----
let chim = null, best = Infinity;
for (const c of cells.values()) {
  if (isEdge(c.x, c.z)) continue;
  const d = Math.abs(c.x - CX) + Math.abs(c.z - Math.floor(D / 2));
  if (d < best) { best = d; chim = c; }
}
if (chim) {
  put(chim.x, chim.top + 1, chim.z, "stone_bricks");
  put(chim.x, chim.top + 2, chim.z, "stone_bricks");
  put(chim.x, chim.top + 3, chim.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
