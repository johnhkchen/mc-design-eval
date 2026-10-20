import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-style commercial block: two storeys over a shopfront,
// light concrete frame with glazed bays, quartz floor bands, parapet and a rooftop plant box.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw643833853.cells.json", "utf8"));

const W = 17, H = 24, D = 20;
const ROOF = 11;   // roof deck layer (about 12 blocks above lowest ground)
const PARAPET = 12;
const CAP = 13;

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr);
const has = (x, z) => ground.has(x + "," + z);
const gOf = (x, z) => ground.get(x + "," + z);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Edge description for a footprint cell (null when interior)
const edgeInfo = (x, z) => {
  if (!has(x, z)) return null;
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  if (!(n || s || w || e)) return null;
  const alongZ = n || s;                 // facade runs along x on north/south faces
  const u = alongZ ? x : z;              // position along the facade
  const corner = (n || s) && (w || e);
  return { alongZ, u, corner, pier: corner || u % 3 !== 1, n, s, w, e };
};

// Whether a given wall cell at height y is a glazed bay
const isWindow = (x, z, y) => {
  const ei = edgeInfo(x, z);
  if (!ei || ei.pier) return false;
  const gr = gOf(x, z);
  if (y >= gr + 1 && y <= 3) return "shop";
  if (y >= 6 && y <= 9) return "upper";
  return false;
};

// Front door: south-most edge row, nearest the middle x
const maxZ = Math.max(...cells.map(c => c[1]));
const frontXs = cells.filter(c => c[1] === maxZ).map(c => c[0]).sort((a, b) => a - b);
const midX = frontXs[Math.floor(frontXs.length / 2)];
const doorX = frontXs.reduce((best, x) => Math.abs(x - midX) < Math.abs(best - midX) ? x : best, frontXs[0]);
const doorZ = maxZ;
const doorGr = gOf(doorX, doorZ);

for (const [x, z, gr] of cells) {
  // Foundation up to ground level
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at storey lines (interior and edge), roof deck on all cells
  for (const fy of [5, 10]) if (fy >= gr) put(x, fy, z, "smooth_quartz");
  if (ROOF >= gr) put(x, ROOF, z, "light_gray_concrete");

  const ei = edgeInfo(x, z);

  if (ei) {
    // Base course
    put(x, gr, z, "polished_andesite");

    // Walls between base and roof
    for (let y = gr + 1; y < ROOF; y++) {
      if (y === 5 || y === 10) continue; // floor bands already placed
      put(x, y, z, "white_concrete");
    }

    // Shopfront storey (glass bays, dark header)
    for (let y = gr + 1; y <= 4; y++) {
      if (y === 4) {
        put(x, y, z, ei.pier ? "white_concrete" : "dark_oak_planks");
        continue;
      }
      if (!ei.pier) put(x, y, z, "glass");
      else put(x, y, z, "white_concrete");
    }

    // Upper storey glazed bays with panes that connect to neighbouring bays
    for (let y = 6; y <= 9; y++) {
      if (ei.pier) { put(x, y, z, "white_concrete"); continue; }
      const conn = {};
      const dirs = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
      for (const [name, [dx, dz]] of Object.entries(dirs)) {
        conn[name] = isWindow(x + dx, z + dz, y) === "upper" ? "true" : "false";
      }
      put(x, y, z, "glass_pane", { ...conn, waterlogged: "false" });
    }

    // Parapet and cap
    put(x, PARAPET, z, "white_concrete");
    put(x, CAP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

    // Warm light behind some glazed bays (shroomlight in the air gap)
    const inward = ei.n ? [0, 1] : ei.s ? [0, -1] : ei.w ? [1, 0] : [-1, 0];
    const ix = x + inward[0], iz = z + inward[1];
    if (has(ix, iz) && !edgeInfo(ix, iz)) {
      if ((x * 7 + z * 3) % 5 === 0 && !ei.pier) {
        put(ix, 7, iz, "shroomlight");
      }
      if ((x * 5 + z * 2) % 4 === 1 && !ei.pier && z !== doorZ) {
        put(ix, 2, iz, "glowstone");
      }
    }
  }
}

// Entrance: door, canopy and hanging lantern on the front (south) face
const dgr = doorGr;
put(doorX, dgr + 1, doorZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorX, dgr + 2, doorZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let dx = -1; dx <= 1; dx++) {
  const cx = doorX + dx;
  if (has(cx, doorZ)) {
    put(cx, dgr + 3, doorZ, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
}
put(doorX, dgr + 2, doorZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(doorX, dgr + 2, doorZ + 0, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(doorX, dgr + 3, doorZ, "lantern", { hanging: "true", waterlogged: "false" });

// Rooftop plant box on interior roof cells near the centre
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (x >= 6 && x <= 9 && z >= 7 && z <= 11 && !edgeInfo(x, z)) {
    const base = gOf(x, z);
    for (let y = ROOF + 1; y <= ROOF + 2; y++) {
      if (y < H) put(x, y, z, "stone_bricks");
    }
    put(x, ROOF + 3 > H - 1 ? H - 1 : ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw643833853.nbt");
