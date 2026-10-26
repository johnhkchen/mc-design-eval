import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const CELLS = `${DIR}/DC76612.cells.json`;
const OUT = `${DIR}/DC76612.nbt`;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 17, H = 21, D = 9;
const g = new Voxels([W, H, D]);

// Palette: 1920s-50s Washington office block, pale stone-clad, stone base,
// light-glazed bays, a continuous cornice cap and dark piers at the corners.
const PIER_A = "calcite";
const PIER_B = "white_concrete";
const CORNER = "polished_andesite";
const SPANDREL = "smooth_stone";
const SILL = "stone_brick_slab";
const BASE = "stone_bricks";
const GLASS = "light_gray_stained_glass_pane";
const DOOR = "dark_oak_door";

const cm = new Map();
for (const [x, z, gr, rf] of cells) cm.set(`${x},${z}`, { ground: gr, roof: rf });
const has = (x, z) => cm.has(`${x},${z}`);

const put = (x, y, z, name, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

const faces = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

// Pass 1: massing, foundation, storey lines, bays, cornice and roof.
for (const [x, z, gr, rf0] of cells) {
  const rf = Math.min(H - 1, Math.max(rf0, gr + 4));
  const m = faces(x, z);
  const nMiss = [m.N, m.S, m.W, m.E].filter(Boolean).length;
  const perim = nMiss > 0;
  const corner = nMiss >= 2;
  const onNS = m.N || m.S;
  const idxAlong = onNS ? x : z;

  // Foundation below grade
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  for (let y = gr; y < rf; y++) {
    const rel = y - gr;

    if (y === rf - 1) {
      // Roof cap: a continuous cornice slab on the perimeter, plain stone inside
      if (perim) {
        put(x, y, z, SILL, { type: "top", waterlogged: "false" });
      } else {
        put(x, y, z, SPANDREL);
      }
      continue;
    }

    if (!perim) {
      // Interior core, floor slab at each storey line
      put(x, y, z, rel % 3 === 0 ? SPANDREL : PIER_A);
      continue;
    }

    if (rel === 0) {
      put(x, y, z, BASE); // base course
      continue;
    }

    if (corner) {
      put(x, y, z, CORNER);
      continue;
    }

    if (rel % 3 === 0) {
      // Storey line: sill course under each window row
      put(x, y, z, SILL, { type: "bottom", waterlogged: "false" });
      continue;
    }

    if (idxAlong % 2 === 1) {
      // Glazed bay: pane strip running along the face
      const props = onNS
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, GLASS, props);
    } else {
      // Pier between bays, alternating pale tones by storey for rhythm
      const storey = Math.floor(rel / 3);
      put(x, y, z, storey % 2 === 0 ? PIER_A : PIER_B);
    }
  }

  // Roof plant on the interior roof cap
  if (!perim && (x === 4 || x === 10) && z === 4 && rf + 1 < H) {
    put(x, rf, z, "iron_block");
  }
}

// Pass 2: recess bays so each glazed bay has an air gap behind the glass (lit in places).
for (const [x, z, gr, rf0] of cells) {
  const rf = Math.min(H - 1, Math.max(rf0, gr + 4));
  const m = faces(x, z);
  const nMiss = [m.N, m.S, m.W, m.E].filter(Boolean).length;
  if (nMiss === 0 || nMiss >= 2) continue;
  const onNS = m.N || m.S;
  const idx = onNS ? x : z;
  if (idx % 2 !== 1) continue;

  const dx = m.W ? 1 : m.E ? -1 : 0;
  const dz = m.N ? 1 : m.S ? -1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;

  for (let rel = 1; rel <= 2; rel++) {
    const y = gr + rel;
    if (y >= rf - 1) continue;
    const lit = rel === 1 && (x * 3 + z * 5 + gr) % 7 === 0;
    put(ix, y, iz, lit ? "glowstone" : "air");
  }
}

// Pass 3: entrance on the front (lowest z) face, centred, with a vestibule behind.
const zMin = Math.min(...cells.map((c) => c[1]));
const frontXs = cells.filter((c) => c[1] === zMin).map((c) => c[0]).sort((a, b) => a - b);
const cx = frontXs[Math.floor(frontXs.length / 2)];
const frontCell = cm.get(`${cx},${zMin}`);
if (frontCell) {
  const gr = frontCell.ground;
  const rf = Math.min(H - 1, Math.max(frontCell.roof, gr + 4));
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  // Vestibule behind the door
  if (has(cx, zMin + 1)) {
    for (let rel = 1; rel <= 2; rel++) {
      const y = gr + rel;
      if (y < rf - 1) put(cx, y, zMin + 1, "air");
    }
  }
  put(cx, gr + 1, zMin, DOOR, doorProps("lower"));
  put(cx, gr + 2, zMin, DOOR, doorProps("upper"));
}

g.save(OUT);
