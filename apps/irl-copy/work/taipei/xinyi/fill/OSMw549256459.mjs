import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw549256459.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw549256459.nbt";

// 34 x 20 footprint, roof about 35 blocks above lowest ground: a 1990s-era
// seven-storey office block with a shopfront ground floor, white concrete
// piers and spandrels, blue glass, a stone cornice, parapet and a plant penthouse.
const W = 34, H = 47, D = 20;
const ROOF = 35;        // roof slab level (7 storeys x 5)
const FLOOR = 5;        // storey height in blocks

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));

// Depth from the outside: 1 = facade ring, 2 = air gap behind glass, 3+ = solid core.
const depth = new Map();
const queue = [];
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z)) {
    depth.set(k, 1);
    queue.push([x, z]);
  }
}
for (let qi = 0; qi < queue.length; qi++) {
  const [x, z] = queue[qi];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !depth.has(key(nx, nz))) {
      depth.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}

// Which outside face a facade cell sits on, and its position along that face.
function face(x, z) {
  if (!has(x, z - 1)) return { dir: "north", along: x, last: W - 1 };
  if (!has(x, z + 1)) return { dir: "south", along: x, last: W - 1 };
  if (!has(x - 1, z)) return { dir: "west", along: z, last: D - 1 };
  if (!has(x + 1, z)) return { dir: "east", along: z, last: D - 1 };
  return { dir: "north", along: x, last: W - 1 };
}

// Main entrance: north face, cell nearest the middle of the frontage.
let entranceKey = null;
{
  let best = Infinity;
  for (const [k] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (depth.get(k) !== 1 || has(x, z - 1)) continue;
    if (x < 2 || x > W - 3) continue;
    const dist = Math.abs(x - 17);
    if (dist < best) { best = dist; entranceKey = k; }
  }
}

const g = new Voxels([W, H, D]);

for (const [k, g0] of ground) {
  const [x, z] = k.split(",").map(Number);
  const d = depth.get(k);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  if (g0 >= ROOF) continue;

  for (let y = g0; y < ROOF; y++) {
    const band = y % FLOOR;
    const storey = Math.floor(y / FLOOR);

    if (d === 1) {
      const f = face(x, z);
      const pier = f.along === 0 || f.along === f.last || f.along % 3 === 0;

      if (k === entranceKey) {
        if (y === g0) {
          g.set(x, y, z, "dark_oak_door", { facing: f.dir, half: "lower", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (y === g0 + 1) {
          g.set(x, y, z, "dark_oak_door", { facing: f.dir, half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (y === g0 + 2) {
          // Canopy/lintel over the entrance, spanning three cells of frontage.
          const isCanopy = [-1, 0, 1].some(o => {
            const [ex, ez] = f.dir === "north" || f.dir === "south" ? [x + o, z] : [x, z + o];
            return `${ex},${ez}` in Object.fromEntries([[`${ex},${ez}`, 1]]) || (depth.get(key(ex, ez)) === 1 && has(ex, ez));
          });
          if (isCanopy) {
            g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
            continue;
          }
        }
      }

      if (band === 0 || band === 4) {
        g.set(x, y, z, "white_concrete");
      } else if (storey === 0) {
        // Shopfront: blue-green glass with white piers.
        g.set(x, y, z, pier ? "white_concrete" : "cyan_stained_glass");
      } else {
        g.set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      }
    } else if (d === 2) {
      // Air gap behind the glass, floor slab per storey, occasional warm lanterns.
      if (band === 0) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (band === 1 && storey > 0 && ((x * 7 + z * 3 + storey) % 5 === 0)) {
        g.set(x, y, z, "lantern", { hanging: "false" });
      }
    } else {
      // Structural core.
      g.set(x, y, z, "light_gray_concrete");
    }
  }

  // Cornice at roof level, roof slab over the rest.
  g.set(x, ROOF, z, d === 1 ? "smooth_stone" : "light_gray_concrete");

  // Parapet ring on the facade.
  if (d === 1) g.set(x, ROOF + 1, z, "white_concrete");

  // Plant penthouse in the middle of the roof.
  const inPenthouse = d >= 4 && Math.abs(x - 16.5) <= 7 && Math.abs(z - 9.5) <= 4;
  if (inPenthouse) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      const edge = d === 4 || Math.abs(x - 16.5) >= 6.5 || Math.abs(z - 9.5) >= 3.5;
      g.set(x, y, z, edge ? "light_gray_concrete" : "gray_concrete");
    }
    g.set(x, ROOF + 4, z, "smooth_stone");
    if (x === 16 && z === 9) {
      for (let y = ROOF + 5; y <= ROOF + 7; y++) g.set(x, y, z, "lightning_rod");
    }
  }
}

g.save(OUT);
