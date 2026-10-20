import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Taipei commercial block, c. 1985-1995: five storeys on a tiled
// podium, pale tiled walls with light-blue glazing, a red terracotta sign band
// over the shopfront, and a rooftop penthouse with AC units.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw764466781.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw764466781.nbt";

const W = 25, H = 38, D = 13;
const ROOF = 26;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(key(x, z), gr);
}
const has = (x, z) => G.has(key(x, z));
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Storey floor lines: ground storey top T, then four upper storeys up to the roof.
const gmax = Math.max(...G.values());
const T = Math.max(gmax + 4, 6);
const hUp = (ROOF - T) / 4;
const levels = [T, Math.round(T + hUp), Math.round(T + 2 * hUp), Math.round(T + 3 * hUp), ROOF];

// Front = smallest z row. Entrance at the middle of that row.
const zFront = Math.min(...[...G.keys()].map((k) => Number(k.split(",")[1])));
const frontXs = [...G.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([, z]) => z === zFront)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];
const doorZ = zFront;

const g = new Voxels([W, H, D]);

for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const gnd = gr;
  const per = isPerim(x, z);
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  const corner = (n || s) && (w || e);

  // Foundation up to ground.
  for (let y = 0; y < gnd; y++) g.set(x, y, z, "stone_bricks");
  // Base course / floor slab at ground.
  g.set(x, gnd, z, per ? "polished_andesite" : "smooth_stone");

  // Floor lines (slabs and spandrel bands).
  for (const L of levels) {
    if (L > gnd && L < ROOF) g.set(x, L, z, per ? "white_concrete" : "smooth_stone");
  }
  // Roof deck.
  g.set(x, ROOF, z, per ? "white_concrete" : "light_gray_concrete");

  // Parapet and coping.
  if (per) {
    g.set(x, 27, z, "white_concrete");
    g.set(x, 28, z, "white_concrete");
    g.set(x, 29, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }

  // Storey walls on the perimeter.
  if (per) {
    const B = [gnd, ...levels.filter((L) => L > gnd)];
    for (let i = 0; i < B.length - 1; i++) {
      const lo = B[i], hi = B[i + 1];
      const h = hi - lo;
      const hiIdx = levels.indexOf(hi);
      const ground = lo === gnd && i === 0;
      const along = (n || s) ? x : z;
      const pillar = corner || along % 3 === 0;
      for (let y = lo + 1; y <= hi - 1; y++) {
        const rel = y - lo;
        const isSpandrel = ground ? rel === h - 1 : (rel === 1 || rel === h - 1);

        // Door and entrance lantern.
        if (x === doorX && z === doorZ && ground) {
          if (y === gnd + 1) {
            g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
            continue;
          }
          if (y === gnd + 2) {
            g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
            continue;
          }
          if (y === gnd + 3 && gnd + 3 < T) {
            g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
            continue;
          }
        }

        let mat;
        if (pillar) mat = "white_concrete";
        else if (isSpandrel) mat = ground ? "red_terracotta" : "white_concrete";
        else mat = ground ? "glass_pane" : "light_blue_stained_glass_pane";
        g.set(x, y, z, mat);

        // Warm light behind some upper-storey windows.
        if (!pillar && !isSpandrel && !ground && hiIdx % 2 === 1 && along % 6 === 1) {
          let dx = 0, dz = 0;
          if (n) dz = 1; else if (s) dz = -1; else if (w) dx = 1; else if (e) dx = -1;
          const ix = x + dx, iz = z + dz;
          if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Rooftop penthouse with glazed boundary, solid cap, and AC units.
for (let x = 8; x <= 16; x++) {
  for (let z = 4; z <= 8; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    const edge = x === 8 || x === 16 || z === 4 || z === 8;
    for (let y = ROOF + 1; y <= ROOF + 2; y++) {
      if (edge) {
        const corner = (x === 8 || x === 16) && (z === 4 || z === 8);
        g.set(x, y, z, corner || (x + z) % 3 === 0 ? "white_concrete" : "light_blue_stained_glass_pane");
      }
    }
    g.set(x, ROOF + 3, z, "smooth_stone");
  }
}
for (const [ax, az] of [[4, 3], [20, 9], [4, 9]]) {
  if (has(ax, az) && !isPerim(ax, az)) g.set(ax, ROOF + 1, az, "iron_block");
}

g.save(OUT);
