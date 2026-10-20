import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century Xinyi-era shophouse: cream tile walls, stone base, glass shopfront,
// a storey band at each floor, a parapet and rooftop plant.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542009188";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 21, H = 23, D = 11;
const g = new Voxels([W, H, D]);

// Footprint lookup, with ground normalised so the lowest ground under the building is y 0.
const G = new Map();
const minGround = Math.min(...cells.map((c) => c[2]));
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr - minGround);
const has = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter(([d]) => {
  const [dx, dz] = DIRS[d];
  return !has(x + dx, z + dz);
});

// Primary facade per exterior cell: prefer the street (north/south) face.
const primaryFace = (x, z) => {
  const ex = exposed(x, z);
  if (ex.length === 0) return null;
  for (const d of ["N", "S", "W", "E"]) if (ex.includes(d)) return d;
  return null;
};

// Entrance: a single-exposed north-face cell nearest the middle of the frontage.
const northOnly = [];
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  const ex = exposed(x, z);
  if (ex.length === 1 && ex[0] === "N") northOnly.push(x);
}
const midX = (Math.min(...northOnly, Infinity) + Math.max(...northOnly, -Infinity)) / 2;
const doorX = northOnly.length
  ? northOnly.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), northOnly[0])
  : null;
const doorZ = doorX === null ? null : (() => {
  // the north-most cell in that column
  let zz = 0;
  while (has(doorX, zz + 1)) zz++;
  return zz;
})();

const STOREY = 5;
const STOREYS = 2;

for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  const b = ground(x, z);
  const ex = exposed(x, z);
  const exterior = ex.length > 0;
  const corner = ex.length >= 2;
  const face = primaryFace(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs at every storey line and the roof (all footprint cells).
  for (let s = 0; s <= STOREYS; s++) {
    const y = b + s * STOREY;
    const exteriorBand = exterior && s > 0 && s < STOREYS;
    const block = s === 0 ? "stone_bricks" : exteriorBand ? "light_gray_concrete" : "smooth_stone";
    g.set(x, y, z, block);
  }

  // Parapet on the roof edge.
  if (exterior) {
    g.set(x, b + STOREYS * STOREY + 1, z, "smooth_stone_slab", {
      type: "bottom", waterlogged: "false",
    });
  }

  // Rooftop plant on some interior roof cells.
  if (!exterior && x % 6 === 3 && z % 4 === 2) {
    g.set(x, b + STOREYS * STOREY + 1, z, "iron_block");
  }

  if (!exterior) continue;

  // Along-wall index for window rhythm.
  const [dx, dz] = face ? DIRS[face] : [0, 0];
  const u = face === "N" || face === "S" ? x : z;
  const isPier = corner || u % 3 === 0;
  const isDoor = face === "N" && ex.length === 1 && x === doorX && z === doorZ;

  for (let s = 0; s < STOREYS; s++) {
    const fb = b + s * STOREY;
    for (let r = 1; r <= 4; r++) {
      const y = fb + r;
      if (isPier) {
        g.set(x, y, z, "white_terracotta");
        continue;
      }
      if (isDoor) {
        if (s === 0 && r === 1) {
          g.set(x, y, z, "oak_door", {
            facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else if (s === 0 && r === 2) {
          g.set(x, y, z, "oak_door", {
            facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
          });
        } else if (s === 0 && r === 3) {
          g.set(x, y, z, "glass");
        } else if (s === 0 && r === 4) {
          g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
        } else {
          g.set(x, y, z, "white_terracotta");
        }
        continue;
      }
      if (r === 4) {
        g.set(x, y, z, "white_terracotta"); // lintel
      } else if (s === 1 && r === 1) {
        g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // sill
      } else {
        g.set(x, y, z, "glass");
      }
    }
  }

  // Warm light behind some upper/ground glass, in the interior cell inside the facade.
  if (!isPier && !isDoor && u % 6 === 2 && face) {
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && exposed(ix, iz).length === 0) {
      g.set(ix, b + 2, iz, "glowstone");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
