import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833565.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833565.nbt";

const W = 17, H = 23, D = 20;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// Footprint lookup
const key = (x, z) => x + "," + z;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), gr);
const has = (x, z) => groundOf.has(key(x, z));

// Outward directions: name -> [dx, dz] of the neighbour that must be missing
const VEC = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposedOf = (x, z) =>
  Object.keys(VEC).filter((n) => {
    const [dx, dz] = VEC[n];
    return !has(x + dx, z + dz);
  });

// Lowest ground sets y reference; roof ~11 blocks above it (2 storeys + parapet)
const base = Math.min(...cells.map((c) => c[2]));
const top = Math.min(base + 11, H - 3);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Deterministic variety
const hh = (x, y, z) => Math.abs(x * 31 + z * 17 + y * 7) % 5;

// Choose entrance: a south-facing exposed cell nearest the median x, else any exposed cell
let doorFace = "south";
let southCells = cells.filter(([x, z]) => exposedOf(x, z).includes("south"));
if (southCells.length === 0) {
  doorFace = null;
  southCells = cells.filter(([x, z]) => exposedOf(x, z).length > 0);
}
southCells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const doorCell = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;
if (!doorFace && doorCell) doorFace = exposedOf(doorCell[0], doorCell[1])[0];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const exp = exposedOf(x, z);
  const isEdge = exp.length > 0;

  if (!isEdge) {
    // Interior: floor slab per storey, air gap otherwise, roof deck on top
    if (gr + 5 < top) put(x, gr + 5, z, "smooth_stone");
    if (top > gr) put(x, top, z, "light_gray_concrete");
    // Sparse rooftop plant
    if (hh(x, top, z) === 0 && top + 1 < H) put(x, top + 1, z, "iron_block");
    continue;
  }

  const f = exp[0];
  const [vx, vz] = VEC[f];
  const along = f === "north" || f === "south" ? x : z;
  const isDoorCell =
    doorCell && doorCell[0] === x && doorCell[1] === z && f === doorFace;

  // Inward neighbour, used for warm lights behind glass
  const ix = x - vx, iz = z - vz;
  const inwardInterior = has(ix, iz) && exposedOf(ix, iz).length === 0;

  for (let y = gr + 1; y <= top; y++) {
    const rel = y - gr;

    if (rel === top - gr) {
      // Cornice / parapet cap
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (rel === 1) {
      if (isDoorCell) {
        put(x, y, z, "dark_oak_door", {
          facing: f, half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else {
        put(x, y, z, "stone_bricks"); // plinth
      }
      continue;
    }

    if (rel === 2 && isDoorCell) {
      put(x, y, z, "dark_oak_door", {
        facing: f, half: "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (rel === 2 || rel === 3) {
      // Shopfront / ground-floor glazing with piers
      if (along % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass");
      if ((rel === 2) && inwardInterior && hh(x, y, z) === 0 && along % 3 !== 0) {
        put(ix, y, iz, "shroomlight");
      }
      continue;
    }

    if (rel === 4) {
      put(x, y, z, "red_terracotta"); // shopfront fascia
      continue;
    }

    if (rel === 5) {
      put(x, y, z, "light_gray_concrete"); // storey line
      continue;
    }

    // Upper storey: window band with white spandrels and piers
    if ((rel === 7 || rel === 8) && along % 3 !== 0) {
      put(x, y, z, "glass");
      if (rel === 7 && inwardInterior && hh(x, y, z) === 1) {
        put(ix, y, iz, "shroomlight");
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

g.save(OUT);
