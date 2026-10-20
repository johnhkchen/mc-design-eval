import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 225 Front Street, South Street Seaport: an 1822 Federal-era brick
// warehouse-residence with a shopfront at street level and four storeys above.
const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001337.cells.json", "utf8")
);

const W = 6, H = 26, D = 16;
const g = new Voxels([W, H, D]);

const info = new Map();
for (const [x, z, gr, roof] of cells) info.set(`${x},${z}`, { g: gr, R: roof });
const has = (x, z) => info.has(`${x},${z}`);

const exposed = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isPerim = (x, z) => { const e = exposed(x, z); return e.N || e.S || e.W || e.E; };
const isCorner = (x, z) => { const e = exposed(x, z); return (e.N || e.S) && (e.W || e.E); };

// Building-wide levels: one flat cornice, one storey grid.
const gs = cells.map(c => c[2]);
const gmin = Math.min(...gs);
const gmax = Math.max(...gs);
const rs = cells.map(c => c[3]).sort((a, b) => a - b);
const medR = rs[Math.floor(rs.length / 2)];
const T = Math.max(medR - 1, gmax + 9); // cornice course, shared by every cell
const GT = gmin + 3;                    // top of the shopfront band
const isFloor = (y) => y >= gmin + 4 && y < T && (y - gmin - 4) % 3 === 0;

// Street-front entrance: a north-exposed, non-corner cell near the middle of the run.
const northCells = cells
  .filter(([x, z]) => exposed(x, z).N && !isCorner(x, z))
  .sort((a, b) => a[0] - b[0]);
const doorCell = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;
const doorX = doorCell ? doorCell[0] : -1;
const doorZ = doorCell ? doorCell[1] : -1;

for (const [x, z] of cells) {
  const { g: gr } = info.get(`${x},${z}`);
  const perim = isPerim(x, z);
  const corner = isCorner(x, z);
  const e = exposed(x, z);
  const shopTop = Math.max(GT, gr + 3);

  // Foundation from y 0 up to the cell's own ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "granite");

  // Base course at the cell's ground; interior floor planks.
  g.set(x, gr, z, perim ? "polished_granite" : "spruce_planks");

  for (let y = gr + 1; y <= T - 1; y++) {
    if (isFloor(y)) {
      // Floor slab inside; pale stone belt course on the outside.
      g.set(x, y, z, perim ? "smooth_quartz" : "spruce_planks");
      continue;
    }
    if (!perim) continue; // interior air

    if (y <= shopTop) {
      // Ground-floor shopfront.
      if (corner) {
        g.set(x, y, z, "stone_bricks");
        continue;
      }
      const isDoorCell = x === doorX && z === doorZ && e.N;
      const nextToDoor = e.N && z === doorZ && Math.abs(x - doorX) === 1;
      if (isDoorCell && y <= gr + 2) {
        g.set(x, y, z, "oak_door", {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (nextToDoor && y <= gr + 2) {
        g.set(x, y, z, "dark_oak_planks"); // door surround
      } else if (y === shopTop) {
        g.set(x, y, z, "dark_oak_planks"); // sign band
      } else {
        g.set(x, y, z, "glass");
      }
      continue;
    }

    if (corner) {
      g.set(x, y, z, "bricks");
      continue;
    }

    // Upper storeys: two window rows per storey, red brick between.
    const rel = (y - gmin - 4) % 3;
    const onNS = e.N || e.S;
    const idx = onNS ? x : z;
    const isWindow = (rel === 1 || rel === 2) && idx % 2 === 1;
    if (isWindow) {
      g.set(x, y, z, "glass");
      if (rel === 1) {
        let ix = x, iz = z;
        if (e.N) iz = z + 1;
        else if (e.S) iz = z - 1;
        else if (e.W) ix = x + 1;
        else if (e.E) ix = x - 1;
        const inside = has(ix, iz) && !isPerim(ix, iz);
        if (inside && (x + z + y) % 3 === 0) {
          g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // Flat roof: stone cornice and parapet on the edge, roof deck inside.
  if (perim) {
    g.set(x, T, z, "smooth_quartz");
    g.set(x, T + 1, z, "stone_bricks");
  } else {
    g.set(x, T, z, "smooth_stone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001337.nbt");
