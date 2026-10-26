import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${SRC}/DC55846.cells.json`, "utf8"));

const W = 14, H = 23, D = 10;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> { gr: ground, r: lidar roof height (absolute) }
const cmap = new Map();
for (const c of cells) cmap.set(`${c[0]},${c[1]}`, { gr: c[2], r: c[3] });
const has = (x, z) => cmap.has(`${x},${z}`);

const isPer = (x, z) =>
  !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const minZ = Math.min(...cells.map((c) => c[1]));
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const maxZ = Math.max(...cells.map((c) => c[1]));

// Smoothed roof: one absolute level for the whole block (lidar noise removed).
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const T = Math.min(19, roofs[Math.floor(roofs.length / 2)]);

// Entrance: middle cell of the street-facing (min z) wall.
const frontXs = cells.filter((c) => c[1] === minZ).map((c) => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const WIN = (rel) => rel % 3 !== 0; // window rows: rel 1-2, 4-5, 7-8
const LIGHT_EVERY = 11;

// Penthouse region (interior only), centred on the roof.
const PH = { x0: 5, x1: 8, z0: 3, z1: 6 };
const inPH = (x, z) => x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1;
const phBoundary = (x, z) =>
  x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;

const tops = new Map();

// Pass 1: foundation, floors, walls, lid, parapet, penthouse.
for (const [k, { gr }] of cmap) {
  const [x, z] = k.split(",").map(Number);
  const top = Math.max(gr + 8, T);            // absolute roof level for this cell
  const tr = Math.min(top - gr, 21 - gr);     // relative roof height
  tops.set(k, { gr, tr });

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const per = isPer(x, z);
  const corner = (x === minX || x === maxX) && (z === minZ || z === maxZ);

  for (let rel = 0; rel <= tr; rel++) {
    const y = gr + rel;

    if (rel === tr) {
      if (per) g.set(x, y, z, "stone_brick_wall");
      continue;
    }
    if (rel === tr - 1) {
      g.set(x, y, z, "smooth_stone");          // roof lid over every cell
      continue;
    }
    if (per && rel === 0) {
      g.set(x, y, z, "polished_andesite");     // base course
      continue;
    }
    if (rel % 3 === 0) {
      g.set(x, y, z, "stone");                 // full floor slabs
      continue;
    }
    if (!per) continue;                        // interior air

    if (rel === tr - 2) {
      g.set(x, y, z, "stone_bricks");          // cornice band
      continue;
    }

    const pier = corner || (x + z) % 3 === 0;
    if (pier) {
      g.set(x, y, z, "bricks");
    } else if (WIN(rel)) {
      g.set(x, y, z, "glass_pane", {
        north: "true", south: "true", east: "true", west: "true",
        waterlogged: "false",
      });
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // Penthouse on the roof: floor slab, walls ring with windows, full cap.
  if (!per && inPH(x, z)) {
    const yb = gr + tr;     // first storey above lid
    g.set(x, yb, z, "stone");                  // base slab
    if (phBoundary(x, z)) {
      const wall = (x + z) % 2 === 0 ? "glass_pane" : "bricks";
      const props = wall === "glass_pane"
        ? { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" }
        : undefined;
      g.set(x, yb + 1, z, wall, props);
    }
    g.set(x, yb + 2, z, "stone_bricks");       // cap
  }
}

// Pass 2: entrance door on the street wall with a lintel above.
{
  const k = `${doorX},${minZ}`;
  if (cmap.has(k)) {
    const { gr, tr } = tops.get(k);
    if (tr >= 4) {
      g.set(doorX, gr + 1, minZ, "oak_door", {
        facing: "north", half: "lower", hinge: "left",
        open: "false", powered: "false",
      });
      g.set(doorX, gr + 2, minZ, "oak_door", {
        facing: "north", half: "upper", hinge: "left",
        open: "false", powered: "false",
      });
      g.set(doorX, gr + 3, minZ, "stone_bricks");
    }
  }
}

// Pass 3: warm light behind some windows (glowstone in the room behind the glass).
for (const [k, { gr, tr }] of tops) {
  const [x, z] = k.split(",").map(Number);
  if (!isPer(x, z)) continue;
  const pier = ((x === minX || x === maxX) && (z === minZ || z === maxZ)) || (x + z) % 3 === 0;
  if (pier) continue;
  for (let rel = 1; rel < tr - 2; rel++) {
    if (!WIN(rel)) continue;
    if (((x * 7 + z * 3 + rel) % LIGHT_EVERY) !== 0) continue;
    if (z === minZ && x === doorX && rel <= 2) continue;
    const dx = x === minX ? 1 : x === maxX ? -1 : 0;
    const dz = z === minZ ? 1 : z === maxZ ? -1 : 0;
    const ix = x + dx, iz = z + dz;
    if (!has(ix, iz) || isPer(ix, iz) || inPH(ix, iz)) continue;
    g.set(ix, gr + rel, iz, "glowstone");
  }
}

g.save(`${SRC}/DC55846.nbt`);
