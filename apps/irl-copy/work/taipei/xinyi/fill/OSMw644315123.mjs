import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw644315123";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 10 x 11 footprint, roof about 11 blocks above lowest ground.
// Read as a 1980s-90s Xinyi mid-rise: two storeys of ~5 blocks, white tiled
// walls, grey concrete bands, a stone plinth, a shopfront-style ground floor
// with a glazed grid above, a flat roof with parapet and rooftop water tank.
const W = 10, H = 23, D = 11;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const onNS = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const onEW = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const isWall = (x, z) => onNS(x, z) || onEW(x, z);
const lo = (y) => (y < 5 ? 0 : 5);   // storey base: ground 0, upper 5

// Entrance: straight north-facing wall cell nearest the footprint centre
const cxMean = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let door = null;
{
  let best = Infinity;
  for (const [x, z, gy] of cells) {
    if (!has(x, z - 1) && has(x - 1, z) && has(x + 1, z) && gy + 1 <= 4) {
      const d = Math.abs(x - cxMean);
      if (d < best) { best = d; door = { x, z, gy }; }
    }
  }
  if (!door) {
    for (const [x, z, gy] of cells) {
      if (!has(x, z - 1) && gy + 1 <= 4) { door = { x, z, gy }; break; }
    }
  }
}

// Foundation, walls, windows, floors
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone");

  const wall = isWall(x, z);
  const ns = onNS(x, z);
  const ew = onEW(x, z);
  const windowable = wall && ns !== ew;   // exactly one outward direction
  const coord = ns ? x : z;               // position along the face
  const isDoor = door && door.x === x && door.z === z;

  for (let y = gy; y <= 9; y++) {
    if (wall) {
      if (y === gy && gy < 5) {
        g.set(x, y, z, "stone_bricks");                 // plinth course
      } else if (y === 4 || y === 9) {
        g.set(x, y, z, "gray_concrete");                // storey lines
      } else if (y === 5) {
        g.set(x, y, z, "white_concrete");              // upper sill course
      } else {
        const r = y - lo(y);                            // 1..3 window rows
        const winRow = r >= 1 && r <= 3;
        const gridOk = lo(y) === 0 || coord % 2 === 1; // shopfront vs grid
        if (windowable && winRow && gridOk && !isDoor) {
          const props = ns
            ? { north: "false", south: "false",
                east: has(x + 1, z) ? "true" : "false",
                west: has(x - 1, z) ? "true" : "false",
                waterlogged: "false" }
            : { east: "false", west: "false",
                north: has(x, z - 1) ? "true" : "false",
                south: has(x, z + 1) ? "true" : "false",
                waterlogged: "false" };
          g.set(x, y, z, "light_blue_stained_glass_pane", props);
        } else {
          g.set(x, y, z, "quartz_block");               // piers and corners
        }
      }
    } else {
      // interior floor slabs at ground and upper storey lines
      if (y === gy || y === 5) g.set(x, y, z, "smooth_stone");
    }
  }

  // Roof slab over the whole footprint
  if (gy <= 10) g.set(x, 10, z, "gray_concrete");

  // Parapet cornice on the perimeter
  if (wall) g.set(x, 11, z, "smooth_stone");
}

// Warm lights behind some windows (glowstone in the room behind the glass)
for (const [x, z, gy] of cells) {
  if (!isWall(x, z)) continue;
  const ns = onNS(x, z), ew = onEW(x, z);
  if (ns === ew) continue;
  let ix = x, iz = z;
  if (!has(x, z - 1)) iz = z + 1;
  else if (!has(x, z + 1)) iz = z - 1;
  else if (!has(x - 1, z)) ix = x + 1;
  else if (!has(x + 1, z)) ix = x - 1;
  if (!has(ix, iz) || isWall(ix, iz)) continue;
  const coord = ns ? x : z;
  for (const base of [0, 5]) {
    const y = base + 2;
    if (y <= gy || y > 8) continue;
    if ((coord + base) % 4 === 0) g.set(ix, y, iz, "glowstone");
  }
}

// Entrance door and light behind it
if (door) {
  const { x, z, gy } = door;
  g.set(x, gy, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gy + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  if (has(x, z + 1) && !isWall(x, z + 1)) g.set(x, gy + 1, z + 1, "glowstone");
}

// Roof equipment: water tank and AC plant on interior roof cells near the centre
const interior = cells.filter(([x, z]) => !isWall(x, z));
if (interior.length) {
  const mx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const mz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  const sorted = [...interior].sort((a, b) =>
    Math.hypot(a[0] - mx, a[1] - mz) - Math.hypot(b[0] - mx, b[1] - mz));
  const [tx, tz] = sorted[0];
  g.set(tx, 11, tz, "white_concrete");
  g.set(tx, 12, tz, "white_concrete");
  if (sorted[1]) {
    const [ax, az] = sorted[1];
    g.set(ax, 11, az, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
