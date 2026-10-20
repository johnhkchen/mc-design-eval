import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1980s Taipei commercial block: cream tiled walls, glass shopfront,
// stone base, storey bands, flat roof with coping, plant on the roof.
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw772098878";
const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));

const W = 19, H = 23, D = 24;
const ROOF = 11;      // roof deck level (about 11 above lowest ground)
const BAND = 5;       // first-floor / second-floor line
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, Math.max(0, gr));
const has = (x, z) => map.has(`${x},${z}`);
const nb = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [x + dx, z + dz]);
const perim = (x, z) => nb(x, z).some(([a, b]) => !has(a, b));
const ring = (x, z) => !perim(x, z) && nb(x, z).some(([a, b]) => has(a, b) && perim(a, b));

const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

// Entrance: a perimeter cell on the minZ face, nearest the middle of the face.
const frontCells = cells.filter(([x, z]) => z === minZ && perim(x, z)).map(([x]) => x);
const doorX = frontCells.length
  ? frontCells.reduce((a, b) => (Math.abs(b - cx) < Math.abs(a - cx) ? b : a))
  : -1;

// Bay index along the facade (3-block rhythm: pillar then two windows).
const bayOf = (x, z) => {
  const edgeX = z === minZ || z === maxZ;
  const idx = edgeX ? x - minX : z - minZ;
  return idx % 3;
};

// Foundation, walls, floors and roof for every footprint cell.
for (const [x, z] of cells) {
  const gr = map.get(`${x},${z}`);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (gr >= ROOF) continue;

  if (perim(x, z)) {
    const isDoor = x === doorX && z === minZ;
    const bay = bayOf(x, z);

    for (let y = gr; y <= 10; y++) {
      if (y <= 4) {
        // Ground-floor shopfront
        if (isDoor) {
          if (y === gr) {
            g.set(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          } else if (y === gr + 1) {
            g.set(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          } else {
            g.set(x, y, z, "smooth_quartz");
          }
        } else if (bay === 0) {
          g.set(x, y, z, "polished_andesite");
        } else {
          g.set(x, y, z, "light_blue_stained_glass");
        }
      } else if (y === BAND) {
        g.set(x, y, z, "smooth_stone");           // storey line
      } else if (y <= 9) {
        // Upper storeys: framed glass bays
        g.set(x, y, z, bay === 0 ? "white_concrete" : "light_blue_stained_glass");
      } else {
        g.set(x, y, z, "smooth_quartz");          // head band
      }
    }
    // Ground-floor base course at the very bottom on the street face
    if (gr <= 4 && !isDoor) g.set(x, gr, z, "polished_andesite");

    // Parapet: wall to roof, coping cap on top
    g.set(x, ROOF, z, "smooth_quartz");
    g.set(x, ROOF + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else if (ring(x, z)) {
    // Air gap behind the glass, with floor slab at the storey line
    if (BAND >= gr) g.set(x, BAND, z, "light_gray_concrete");
    g.set(x, ROOF, z, "light_gray_concrete");

    // Warm light behind some windows (shroomlight at the window's height)
    const behind = nb(x, z).find(([a, b]) => has(a, b) && perim(a, b) && bayOf(a, b) === 1);
    if (behind && (x + z) % 2 === 0 && 7 >= gr) g.set(x, 7, z, "shroomlight");
  } else {
    // Core: solid mass, roof deck on top
    for (let y = gr; y <= 10; y++) g.set(x, y, z, "white_concrete");
    g.set(x, ROOF, z, "light_gray_concrete");
  }
}

// Roof plant: a central water tank, a few AC units, and an antenna rod.
for (const [x, z] of cells) {
  if (perim(x, z)) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (d <= 2.2 && ROOF + 1 < H) {
    g.set(x, ROOF + 1, z, "iron_block");
    g.set(x, ROOF + 2, z, "iron_block");
  } else if ((x + z) % 5 === 0 && z - minZ <= 6) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
  }
}
const rodX = Math.round(cx), rodZ = Math.round(cz);
if (has(rodX, rodZ)) {
  for (let y = ROOF + 3; y <= ROOF + 5; y++) g.set(rodX, y, rodZ, "lightning_rod");
}

g.save(`${SRC}.nbt`);
