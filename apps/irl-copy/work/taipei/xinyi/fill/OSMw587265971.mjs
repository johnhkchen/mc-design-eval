import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw587265971";
const W = 18, H = 41, D = 15;
const TOP = 28;      // parapet cap, roof top about 29 blocks above lowest ground
const ROOF = 25;     // roof slab level (five storeys of 5 blocks)

const raw = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
const cellMap = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cellMap.set(`${x},${z}`, Math.min(24, Math.max(0, Math.round(gr))));
}
const cells = [...cellMap.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});

const inside = (x, z) => cellMap.has(`${x},${z}`);
const edgeXOf = (x, z) => !inside(x - 1, z) || !inside(x + 1, z);
const edgeZOf = (x, z) => !inside(x, z - 1) || !inside(x, z + 1);
const isPerimeter = (x, z) => edgeXOf(x, z) || edgeZOf(x, z);

const g = new Voxels([W, H, D]);

// Foundations, floor slabs, and the facade shell
for (const { x, z, gr } of cells) {
  const eX = edgeXOf(x, z);
  const eZ = edgeZOf(x, z);
  const per = eX || eZ;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) {
    g.set(x, y, z, per ? "stone_bricks" : "stone");
  }

  // Floor slabs at every storey line (0,5,10,15,20,25); the base course sits at y 0 on the perimeter
  for (const k of [0, 5, 10, 15, 20, ROOF]) {
    if (k === 0) {
      g.set(x, 0, z, per ? "stone_bricks" : "smooth_stone");
    } else if (k >= gr) {
      g.set(x, k, z, "smooth_stone");
    }
  }

  if (!per) continue;

  // Storey facades: five storeys, each 5 blocks high
  for (let i = 0; i < 5; i++) {
    const base = 5 * i;
    for (const y of [base + 1, base + 2, base + 3]) {
      let id2;
      if (eX && eZ) {
        id2 = "light_gray_concrete";                       // corner column
      } else if (eZ && x % 3 === 0) {
        id2 = "light_gray_concrete";                       // mullion on long faces
      } else if (eX && z % 3 === 0) {
        id2 = "light_gray_concrete";                       // mullion on short faces
      } else {
        id2 = "light_blue_stained_glass";                  // glazing
      }
      g.set(x, y, z, id2);
    }
    // Spandrel / storey line
    g.set(x, base + 4, z, "light_gray_concrete");
  }

  // Ground-floor entrance: door on the z=0 face at x=9, storefront glass elsewhere
  if (z === 0 && x === 9) {
    g.set(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, 3, z, "light_blue_stained_glass");
  }

  // Parapet ring above the roof slab, capped with stone slabs
  for (const y of [ROOF + 1, ROOF + 2, ROOF + 3]) {
    g.set(x, y, z, "light_gray_concrete");
  }
  g.set(x, TOP, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
}

// Helper: place only on interior (non-perimeter) footprint cells
const placeInterior = (x, y, z, id2, props) => {
  if (!inside(x, z) || isPerimeter(x, z)) return;
  g.set(x, y, z, id2, props);
};

// Rooftop mechanical penthouse, centred on the roof
for (let x = 5; x <= 12; x++) {
  for (let z = 4; z <= 10; z++) {
    if (!inside(x, z)) continue;
    const ring = x === 5 || x === 12 || z === 4 || z === 10;
    if (ring) {
      g.set(x, ROOF + 1, z, "light_gray_concrete");
      g.set(x, ROOF + 2, z, "light_gray_concrete");
      g.set(x, TOP, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
    }
    // Penthouse roof slab at y 27
    g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
}
// Louvres on the penthouse south face
for (const x of [6, 8, 10]) {
  if (inside(x, 4)) g.set(x, ROOF + 1, 4, "iron_bars");
}

// Interior warm lights: lanterns on alternate floors, glowstone and shroomlight behind the glass
for (const i of [1, 3]) {
  for (const x of [5, 9, 13]) {
    placeInterior(x, 5 * i + 1, 3, "lantern", { hanging: "false" });
  }
}
for (const i of [0, 2, 4]) {
  placeInterior(3, 5 * i + 2, 1, "glowstone");
  placeInterior(14, 5 * i + 2, 13, "shroomlight");
}

g.save(`${dir}/${id}.nbt`);
