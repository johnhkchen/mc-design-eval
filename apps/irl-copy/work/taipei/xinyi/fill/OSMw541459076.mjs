import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541459076";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 11 x 23 x 11 volume: two 5-block storeys, flat roof, parapet and rooftop plant.
const W = 11, H = 23, D = 11;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  const h = Math.round(gr);
  ground.set(key(x, z), h);
  maxG = Math.max(maxG, h);
}

// Floor level of the ground storey: the highest cell ground, clamped so the parapet and plant fit in H.
const B = Math.min(maxG, 10);

const inside = (x, z) => ground.has(key(x, z));
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Directions: missing neighbour means that side is an exterior face.
const DIRS = [
  { name: "south", dx: 0, dz: 1 },
  { name: "north", dx: 0, dz: -1 },
  { name: "east", dx: 1, dz: 0 },
  { name: "west", dx: -1, dz: 0 },
];

const glassPane = (face) => {
  const ew = face === "south" || face === "north";
  return {
    north: ew ? "false" : "true",
    south: ew ? "false" : "true",
    east: ew ? "true" : "false",
    west: ew ? "true" : "false",
    waterlogged: "false",
  };
};

const exteriorFaces = (x, z) => DIRS.filter((d) => !inside(x + d.dx, z + d.dz));

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  // Foundation / plinth from y 0 up to the floor level.
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  const faces = exteriorFaces(x, z);
  const perimeter = faces.length > 0;

  // Floor slabs for interior cells.
  if (!perimeter) {
    put(x, B, z, "smooth_stone");
    put(x, B + 5, z, "smooth_stone");
  }

  if (!perimeter) continue;

  // Pick the primary exterior face for articulation.
  const face = faces.find((f) => f.name === "south") || faces.find((f) => f.name === "north")
    || faces.find((f) => f.name === "east") || faces[0];
  const idx = face.name === "south" || face.name === "north" ? x : z;
  const isPier = idx % 3 === 0 || idx === 10;
  const isFront = face.name === "south";
  const isEntranceBay = idx >= 4 && idx <= 6;

  for (let s = 0; s < 2; s++) {
    const base = B + 5 * s;
    for (let dy = 0; dy < 5; dy++) {
      const y = base + dy;
      if (dy === 4) {
        put(x, y, z, "light_gray_concrete"); // storey line / cornice band
      } else if (dy === 0) {
        put(x, y, z, s === 0 ? "polished_andesite" : "light_gray_concrete");
      } else {
        // Ground storey, front facade: shopfront with entrance.
        if (s === 0 && isFront) {
          if (isPier) {
            put(x, y, z, "white_concrete");
          } else if (dy === 3) {
            if (isEntranceBay) put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
            else put(x, y, z, "glass_pane", glassPane(face.name));
          } else if (isEntranceBay && idx === 5 && dy === 1) {
            put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          } else if (isEntranceBay && idx === 5 && dy === 2) {
            put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          } else {
            put(x, y, z, "glass_pane", glassPane(face.name));
          }
        } else if (isPier) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, "glass_pane", glassPane(face.name));
        }
      }
    }
  }

  // Warm light: glowstone just inside a few upper-storey windows.
  const wx = face.name === "east" || face.name === "west" ? 0 : 0;
  if (!isPier && idx % 3 === 1 && (x + z) % 2 === 0) {
    const ix = x - face.dx;
    const iz = z - face.dz;
    if (inside(ix, iz) && exteriorFaces(ix, iz).length === 0) {
      put(ix, B + 5 + 2, iz, "glowstone");
    }
  }
}

// Roof slab over every footprint cell, then the parapet and its capping course.
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  put(x, B + 10, z, "light_gray_concrete");
  if (exteriorFaces(x, z).length > 0) {
    put(x, B + 11, z, "white_concrete");
    put(x, B + 12, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  }
}

// Rooftop plant: a small penthouse ring around a central AC unit, centred on the footprint.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (!inside(x, z)) continue;
    if (dx === 0 && dz === 0) put(x, B + 11, z, "iron_block");
    else put(x, B + 11, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
