import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334991479";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 19, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, f] of cells) ground.set(`${x},${z}`, f);
const has = (x, z) => ground.has(`${x},${z}`);
const missing = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !has(x + dx, z + dz)).length;
const isExterior = (x, z) => missing(x, z) > 0;
const isCorner = (x, z) => missing(x, z) >= 2;

// Street-side (south, +z) face: cells with no neighbour on +z. Entrance at the middle of that frontage.
const frontXs = cells.filter(([x, z]) => !has(x, z + 1)).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;
const isDoorCell = (x, z) => x === doorX && !has(x, z + 1);

const glassProps = (x, z) => ({
  north: String(has(x, z - 1)),
  south: String(has(x, z + 1)),
  east: String(has(x + 1, z)),
  west: String(has(x - 1, z)),
  waterlogged: "false",
});

for (const [x, z, f0] of cells) {
  const f = Math.max(0, Math.min(f0, H - 8));

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < f; y++) g.set(x, y, z, "stone_bricks");

  if (isExterior(x, z)) {
    const corner = isCorner(x, z);
    // Base course
    g.set(x, f, z, "polished_andesite");

    // Shopfront storey (rel 1..3): glass grid with frames, door at entrance
    for (let r = 1; r <= 3; r++) {
      const y = f + r;
      if (corner) {
        g.set(x, y, z, "smooth_quartz");
      } else if (isDoorCell(x, z)) {
        if (r === 1) {
          g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (r === 2) {
          g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else {
          g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        }
      } else {
        g.set(x, y, z, "glass_pane", glassProps(x, z));
      }
    }

    // Lintel / storey line (rel 4): red band, quartz at corners
    g.set(x, f + 4, z, corner ? "smooth_quartz" : "red_concrete");

    // Cornice (rel 5) and parapet (rel 6)
    g.set(x, f + 5, z, corner ? "smooth_quartz" : "light_gray_concrete");
    g.set(x, f + 6, z, "smooth_quartz");
  } else {
    // Interior: floor slab at base, air gap up to roof deck
    g.set(x, f, z, "smooth_stone");
    g.set(x, f + 5, z, "gray_concrete");
  }
}

// Warm light behind some shopfront glass (interior cell just inside the street wall)
for (const [x, z, f0] of cells) {
  if (!isExterior(x, z) || isCorner(x, z) || isDoorCell(x, z)) continue;
  if (has(x, z + 1) || x % 3 !== 0) continue;
  const iz = z - 1;
  if (!has(x, iz) || isExterior(x, iz)) continue;
  const fi = Math.max(0, Math.min(ground.get(`${x},${iz}`), H - 8));
  g.set(x, fi + 2, iz, "glowstone");
}

// Roof plant: a small equipment block group and a lightning rod on interior roof
for (const [x, z, f0] of cells) {
  if (isExterior(x, z)) continue;
  const f = Math.max(0, Math.min(f0, H - 8));
  if (x >= 3 && x <= 4 && z >= 3 && z <= 4) {
    g.set(x, f + 6, z, "iron_block");
  }
}
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
if (has(cx, cz) && !isExterior(cx, cz)) {
  const f = Math.max(0, Math.min(ground.get(`${cx},${cz}`), H - 8));
  g.set(cx, f + 7, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
