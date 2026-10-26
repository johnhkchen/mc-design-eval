import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87090";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 3, H = 20, D = 14;
const g = new Voxels([W, H, D]);

const SLAB_B = { type: "bottom", waterlogged: "false" };
const STAIR_N = { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" };

// Clean lidar: smooth roof per cell so the massing steps in tiers, never below the storey minimum.
const raw = new Map();
let minGround = Infinity;
for (const [x, z, gr, roof] of cells) {
  raw.set(`${x},${z}`, { gr: Math.round(gr), roof: Math.round(roof) });
  minGround = Math.min(minGround, Math.round(gr));
}
const roofAt = (x, z) => {
  const c = raw.get(`${x},${z}`);
  return c ? c.roof : 0;
};

// Per-cell roof: average with neighbours along z, then quantise to 3-block storeys.
const roofSmooth = (x, z) => {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) {
    const zz = z + dz;
    if (zz < 0 || zz >= D) continue;
    sum += roofAt(x, zz);
    n++;
  }
  const avg = sum / n;
  return Math.round(avg);
};

const isPerim = (x, z) => x === 0 || x === 2 || z === 0 || z === D - 1;

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const c = raw.get(`${x},${z}`);
  const gr = c.gr;
  const top = Math.min(H - 1, Math.max(gr + 3, roofSmooth(x, z)));
  const perim = isPerim(x, z);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const k = y - gr;

    // Roof deck / cornice at the top course, so no column is open at the top.
    if (y === top - 1) {
      if (perim) g.set(x, y, z, "stone_brick_slab", SLAB_B);
      else g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Storey floor and string courses, full footprint, every 3 blocks.
    if (k % 3 === 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    if (perim) {
      const onXFace = x === 0 || x === 2;
      const winLevel = k % 3 === 1 || k % 3 === 2;
      if (onXFace && winLevel && z % 2 === 1) {
        // Vacant: some openings boarded, the rest glazed.
        g.set(x, y, z, z % 4 === 1 ? "oak_planks" : "glass");
      } else {
        g.set(x, y, z, "bricks");
      }
    } else {
      // Interior air behind glass, with warm light in some rooms.
      if (x === 1 && k % 3 === 1 && z % 4 === 2) g.set(x, y, z, "glowstone");
    }
  }
}

// Entrance: a centred door on the street front (z = 0), with a stoop step, placed after the walls.
{
  const c = raw.get(`1,0`);
  if (c) {
    const gr = c.gr;
    // Clear the door column and set it as a proper two-high door.
    g.set(1, gr, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(1, gr + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Stoop: a single stair in front of the door, sitting on the ground surface.
    if (gr > 0) g.set(1, gr - 1, 0, "stone_brick_stairs", STAIR_N);
  }
}

g.save(`${DIR}/${ID}.nbt`);
