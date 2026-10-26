import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62673.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62673.nbt";

const W = 11, H = 28, D = 19;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const map = new Map();
for (const c of cells) map.set(key(c[0], c[1]), c);
const has = (x, z) => map.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => {
  const xEdge = !has(x - 1, z) || !has(x + 1, z);
  const zEdge = !has(x, z - 1) || !has(x, z + 1);
  return xEdge && zEdge;
};

const hash = (x, y, z) =>
  (((Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647)) >>> 0) % 100);

// Smooth the lidar roof into one clean tier: median of roof heights, snapped to whole storeys (3 blocks)
const roofVals = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const medianRoof = roofVals[Math.floor(roofVals.length / 2)];
const groundVals = cells.map(c => Math.round(c[2]));
const minGround = Math.min(...groundVals);
let R = minGround + Math.round((medianRoof - minGround) / 3) * 3;
R = Math.max(minGround + 12, Math.min(H - 3, R));
const TOP = R;

const minZ = Math.min(...cells.map(c => c[1]));
const centreX = (Math.min(...cells.map(c => c[0])) + Math.max(...cells.map(c => c[0]))) / 2;

const STONE = "stone_bricks";
const BODY = "light_gray_concrete";
const TRIM = "white_concrete";
const GLASS = "light_blue_stained_glass_pane";
const SLAB = "light_gray_concrete";
const CAP = "smooth_stone_slab";

for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = Math.max(0, Math.min(H - 6, Math.round(c[2])));
  const top = TOP;
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, STONE);

  if (!edge) {
    // Interior: floor slabs per storey and a solid roof slab; air gaps elsewhere
    for (let y = gr; y < top; y++) {
      const rel = y - gr;
      if (rel === 0 || (rel >= 4 && (rel - 4) % 3 === 0) || y === top - 1) {
        g.set(x, y, z, SLAB);
      }
    }
    continue;
  }

  // Facade cells
  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const mullion = (x % 3 === 0) || (z % 3 === 0);

    if (corner) {
      // Full-height corner piers for articulation
      g.set(x, y, z, rel === 0 ? STONE : TRIM);
      continue;
    }

    if (rel === 0) {
      g.set(x, y, z, STONE); // base course
    } else if (y === top - 1) {
      g.set(x, y, z, CAP); // projecting cap over cornice line
    } else if (y === top - 2) {
      g.set(x, y, z, TRIM); // cornice band
    } else if (rel < 4) {
      // Ground-floor shopfront
      if (rel === 3) g.set(x, y, z, TRIM);
      else g.set(x, y, z, mullion ? TRIM : GLASS);
    } else {
      const o = (rel - 4) % 3;
      if (o === 0) {
        g.set(x, y, z, SLAB); // spandrel
      } else if (mullion) {
        g.set(x, y, z, TRIM);
      } else if (o === 2 && hash(x, y, z) < 6) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, GLASS);
      }
    }
  }
}

// Single rooftop plant room, centred on the footprint
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const cx0 = Math.min(...xs), cx1 = Math.max(...xs), cz0 = Math.min(...zs), cz1 = Math.max(...zs);
const px0 = Math.round(cx0 + (cx1 - cx0) * 0.3), px1 = Math.round(cx0 + (cx1 - cx0) * 0.7);
const pz0 = Math.round(cz0 + (cz1 - cz0) * 0.3), pz1 = Math.round(cz0 + (cz1 - cz0) * 0.7);
for (const c of cells) {
  const x = c[0], z = c[1];
  if (x < px0 || x > px1 || z < pz0 || z > pz1) continue;
  if (isEdge(x, z)) continue;
  if (TOP + 2 > H) continue;
  g.set(x, TOP, z, BODY);
  g.set(x, TOP + 1, z, BODY);
}

// Main entrance: north face cell nearest the centre line, with oak doors and a lantern
let door = null;
for (const c of cells) {
  if (c[1] !== minZ || !isEdge(c[0], c[1]) || isCorner(c[0], c[1])) continue;
  if (!door || Math.abs(c[0] - centreX) < Math.abs(door[0] - centreX)) door = c;
}
if (door) {
  const dx = door[0], dz = door[1];
  const dg = Math.max(0, Math.min(H - 6, Math.round(door[2])));
  g.set(dx, dg + 1, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, dg + 2, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(dx, dg + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(OUT);
