import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538401854";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 26, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Footprint lookup and per-cell ground
const ground = new Map();
let minG = Infinity, minZ = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
  minZ = Math.min(minZ, z);
}
const inFoot = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !inFoot(x + 1, z) || !inFoot(x - 1, z) || !inFoot(x, z + 1) || !inFoot(x, z - 1);

// Vertical levels: 1960s-80s five-storey-scale shophouse reduced to two storeys
const base = minG;          // lowest ground
const F1 = base + 5;        // ground storey ceiling / upper floor slab
const ROOF = base + 10;     // roof deck / parapet cap level

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance: middle of the front (lowest z) row
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const x0 = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slabs only, air otherwise
    if (gr <= F1) put(x, gr, z, "stone");
    if (F1 >= gr) put(x, F1, z, "stone");
    if (ROOF >= gr) put(x, ROOF, z, "stone");
    continue;
  }

  // Perimeter walls, gr up to ROOF
  for (let y = gr; y <= ROOF; y++) {
    let b, p;
    const isEntrance = z === minZ && x === x0;
    if (y === ROOF) {
      b = "smooth_quartz_slab"; p = { type: "bottom", waterlogged: "false" };
    } else if (y === gr) {
      b = "polished_andesite";                       // base course
    } else if (y < F1) {
      // Ground storey shopfront
      if (isEntrance && y <= gr + 2) {
        continue; // door placed below
      }
      if ((x + z) % 3 === 0) b = "smooth_quartz";    // pillar
      else { b = "glass_pane"; }                     // shopfront glass
    } else if (y === F1) {
      b = "smooth_quartz";                           // storey line
    } else if (y === ROOF - 1) {
      b = "smooth_quartz";                           // cornice band
    } else {
      // Upper storey window grid with frames
      if ((x + z) % 3 === 0) b = "quartz_pillar";
      else b = "light_blue_stained_glass_pane";
    }
    put(x, y, z, b, p);
  }

  // Floor slabs at storey levels for this cell
  if (gr <= F1) put(x, gr, z, "stone");
}

// Entrance door and canopy on the front row
for (const [x, z, gr] of cells) {
  if (z !== minZ || x !== x0) continue;
  put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "glass_pane");
}
for (const [x, z, gr] of cells) {
  if (z === minZ && Math.abs(x - x0) <= 1 && x0 >= 0 && F1 - 1 >= gr) {
    put(x, F1 - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm lights behind some glass, on the interior side of the wall
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dz]) => [x + dx, z + dz])
    .find(([nx, nz]) => inFoot(nx, nz) && !isEdge(nx, nz));
  if (!inward) continue;
  const [nx, nz] = inward;
  if ((x + z) % 6 === 1 && F1 + 2 < H) put(nx, F1 + 2, nz, "shroomlight");
  if ((x + z) % 6 === 4 && gr + 2 < F1) put(nx, gr + 2, nz, "glowstone");
}

// Roof equipment: a few plant boxes and a small mechanical housing
for (const [x, z, gr] of cells) {
  if (isEdge(x, z) || ROOF < gr) continue;
  if (x % 7 === 3 && z === Math.floor(D / 2)) {
    put(x, ROOF + 1, z, "smooth_quartz");
    if (ROOF + 2 < H) put(x, ROOF + 2, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
