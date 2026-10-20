import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752129";
const W = 24, H = 23, D = 15;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => groundAt.has(`${x},${z}`);
const groundOf = (x, z) => groundAt.get(`${x},${z}`);

// Base level = lowest ground under the footprint (y 0 reference).
const F = Math.min(...cells.map(([, , gr]) => Math.round(gr)));
// Keep the roof and roof plant inside the 23-block volume.
const clampG = (gr) => Math.min(gr, F + 8);

// Storey plan (relative to F), a 2-storey mid-rise commercial block:
//   F        plinth / base course
//   F+1..F+3 ground-floor shopfront glass (storey 1, ~4 m)
//   F+4      lintel spandrel
//   F+5      belt course / floor slab
//   F+6..F+8 upper-floor window bands
//   F+9      upper spandrel
//   F+10     parapet coping and roof deck (roof height ~11 blocks)
//   F+11..   rooftop plant
const ROOF = F + 10;
const WALL = "light_gray_concrete";
const TRIM = "white_concrete";
const GLASS = "light_blue_stained_glass";
const BASE = "stone_bricks";
const COPING = "smooth_stone";

const vox = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) vox.set(x, y, z, block, props);
  else vox.set(x, y, z, block);
};

// Entrance: the front (lowest z) edge, middle cell of that row.
const zMin = Math.min(...cells.map(([, z]) => z));
const frontXs = cells.filter(([, z]) => z === zMin).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];
const doorZ = zMin;

const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Pass 1: foundations, walls, floors, roof for every footprint cell.
for (const [x0, z0, gRaw] of cells) {
  const x = x0, z = z0;
  const g = clampG(Math.round(gRaw));
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);

  // Solid foundation from y 0 up to this cell's ground.
  for (let y = 0; y < g; y++) put(x, y, z, BASE);

  for (let y = g; y <= ROOF; y++) {
    if (edge) {
      if (y === ROOF) { put(x, y, z, COPING); continue; }
      if (y === F + 5) { put(x, y, z, TRIM); continue; }
      if (y === F + 4 || y === F + 9) { put(x, y, z, WALL); continue; }
      if (y === F) { put(x, y, z, BASE); continue; }

      const ground = y >= F + 1 && y <= F + 3;
      const upper = y >= F + 6 && y <= F + 8;
      if (ground) {
        // Shopfront: continuous glass, piers only at corners.
        put(x, y, z, corner ? TRIM : GLASS);
      } else if (upper) {
        // Upper floors: vertical piers every third bay.
        const pier = corner || (x + z) % 3 === 0;
        put(x, y, z, pier ? TRIM : GLASS);
      } else {
        put(x, y, z, WALL);
      }
    } else {
      // Interior: floor slabs per storey and roof deck, air otherwise.
      if (y === F || y === F + 5 || y === ROOF) put(x, y, z, WALL);
    }
  }
}

// Pass 2: entrance, canopy/lintel and door.
for (const x of frontXs) {
  // Lintel band above the shopfront at the front edge.
  if (Math.abs(x - doorX) <= 1) put(x, F + 4, zMin, COPING);
}
const doorG = clampG(Math.round(groundOf(doorX, doorZ)));
// Door sits on the ground-floor level of its cell.
put(doorX, doorG, doorZ, "oak_door", {
  facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
});
put(doorX, doorG + 1, doorZ, "oak_door", {
  facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
});
// Hanging lantern under the entrance lintel.
put(doorX, F + 3, doorZ, "lantern", { hanging: "true", waterlogged: "false" });

// Pass 3: warm lights behind shopfront and upper glass (interior air gap).
let lightIdx = 0;
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (isEdge(x, z)) continue;
  // Only interior cells that sit directly behind a glazed edge cell.
  const behindGlass = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
    .some(([nx, nz]) => has(nx, nz) && isEdge(nx, nz) && !isCorner(nx, nz));
  if (!behindGlass) continue;
  lightIdx++;
  if ((x * 7 + z * 3) % 5 !== 0) continue;
  const g = clampG(Math.round(groundOf(x, z)));
  const lowY = Math.max(F + 1, g);
  if (lowY <= F + 3 && lowY === F + 1) {
    // Ground-floor glow, standing on the floor slab.
    put(x, F + 1, z, lightIdx % 2 ? "glowstone" : "shroomlight");
  }
  if (F + 6 <= ROOF - 1) {
    // Upper-floor glow, standing on the storey-2 slab.
    put(x, F + 6, z, "glowstone");
  }
}

// Pass 4: rooftop plant (air-conditioning boxes and a small mast).
for (const [x, z, gRaw] of cells) {
  if (isEdge(x, z)) continue;
  if (F + 11 > H - 1) break;
  if (x % 7 === 3 && z % 5 === 2) put(x, F + 11, z, "iron_block");
  else if (x % 7 === 5 && z % 4 === 1) put(x, F + 11, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}
// Corner roof mast near the middle of the roof, if it fits.
const mastCell = cells.find(([x, z]) => !isEdge(x, z) && x % 4 === 1 && z % 3 === 1);
if (mastCell && F + 13 < H) {
  const [mx, mz] = mastCell;
  for (let y = F + 11; y <= F + 12; y++) put(mx, y, mz, "lightning_rod");
}

vox.save(`${DIR}/${ID}.nbt`);
