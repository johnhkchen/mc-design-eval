import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109963";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const key = (x, z) => x + "," + z;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), Math.min(gr, H - 2));
const inside = (x, z) => cellMap.has(key(x, z));
const groundOf = (x, z) => cellMap.get(key(x, z));

// Storey datum from lowest ground; roof (parapet top) sits 11 blocks above it.
const minG = Math.min(...cells.map((c) => Math.min(c[2], H - 2)));
const m = Math.min(minG, 11);
const R = m + 11; // parapet row

const put = (x, y, z, b, st) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (st) g.set(x, y, z, b, st);
  else g.set(x, y, z, b);
};

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missingDirs = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));

// Entrance: middle cell of the street-facing (min z) edge.
const minZ = Math.min(...cells.map((c) => c[1]));
const frontXs = cells.filter((c) => c[1] === minZ).map((c) => c[0]).sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;
const doorZ = minZ;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = missingDirs(x, z).length > 0;
  const mull = (x + z) % 3 === 0; // pillar column
  const onRow = (x + z) % 2 === 0;

  for (let y = gr; y <= R; y++) {
    const rel = y - m;

    // Roof slab over whole footprint
    if (rel === 10) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    // Parapet on the perimeter
    if (rel === 11) {
      if (edge) put(x, y, z, "smooth_quartz");
      else if ((x * 5 + z * 3) % 9 === 0) {
        // Roof plant: small equipment blocks
        put(x, y, z, "light_gray_concrete");
      }
      continue;
    }
    if (rel === 12 && !edge && (x * 5 + z * 3) % 9 === 0) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (rel > 10) continue;

    if (edge) {
      // Facade
      if (rel === 9) {
        put(x, y, z, "quartz_block"); // cornice
      } else if (rel === 0) {
        put(x, y, z, "stone_bricks"); // base course
      } else if (rel >= 1 && rel <= 3) {
        // Shopfront / ground-floor glazing
        if (x === doorX && z === doorZ) {
          if (rel === 3) put(x, y, z, "smooth_quartz");
          else put(x, y, z, "light_blue_stained_glass");
        } else {
          put(x, y, z, mull ? "smooth_quartz" : "light_blue_stained_glass");
        }
      } else if (rel === 4) {
        put(x, y, z, "smooth_quartz"); // fascia
      } else if (rel === 5) {
        put(x, y, z, "white_concrete"); // spandrel at floor line
      } else if (rel >= 6 && rel <= 8) {
        put(x, y, z, mull ? "smooth_quartz" : "light_blue_stained_glass");
      }

      // Warm light behind some upper windows
      if (rel === 7 && !mull && onRow) {
        for (const [mx, mz] of missingDirs(x, z)) {
          const ix = x - mx, iz = z - mz;
          if (inside(ix, iz) && groundOf(ix, iz) <= y) {
            put(ix, y, iz, "glowstone");
          }
          break;
        }
      }
    } else {
      // Interior: only storey slabs and air
      if (rel === 5 && y >= gr) put(x, y, z, "smooth_stone");
    }
  }
}

// Entrance door (two-high, facing the street) and hanging lantern above.
{
  const gr = groundOf(doorX, doorZ);
  if (gr !== undefined && gr <= m + 3) {
    put(doorX, gr, doorZ, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(doorX, gr + 1, doorZ, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(doorX, gr + 2, doorZ, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof mast at a central interior cell
{
  const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
  let best = null;
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    if (missingDirs(x, z).length === 0) {
      const d = Math.abs(x - cx) + Math.abs(z - cz);
      if (!best || d < best.d) best = { x, z, d };
    }
  }
  if (best) {
    for (let y = R + 1; y <= R + 2; y++) put(best.x, y, best.z, "light_gray_concrete");
    put(best.x, R + 3, best.z, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
