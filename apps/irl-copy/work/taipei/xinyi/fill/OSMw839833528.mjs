import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833528";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 23 x 30 footprint, roof about 40 blocks above the lowest ground.
// Read as a c.1990s-2000s Xinyi office block: 8 storeys of 5 blocks, white concrete
// piers, light-grey spandrels, blue-tinted glazing, stone plinth, cornice and parapet,
// a ground-floor shopfront with one entrance, and rooftop plant with a mast.
const W = 23, H = 52, D = 30, TOP = 40;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const key = (x, z) => x * 1000 + z;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));
const exposed = (x, z) => ({
  N: !has(x, z - 1), // z decreasing side
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isExt = (x, z) => {
  const e = exposed(x, z);
  return e.N || e.S || e.W || e.E;
};

// Main entrance: the north-facing (or south-facing) exposed cell nearest the mid-width.
let entrance = null;
{
  const northCells = cells.filter(([x, z]) => exposed(x, z).N).map(([x, z]) => [x, z]);
  if (northCells.length) {
    const xs = northCells.map((c) => c[0]).sort((a, b) => a - b);
    const mid = xs[Math.floor(xs.length / 2)];
    let best = northCells[0];
    for (const c of northCells) if (Math.abs(c[0] - mid) < Math.abs(best[0] - mid)) best = c;
    entrance = { x: best[0], z: best[1], facing: "north" };
  }
}

// Pass 1: foundations, interior floors, roof deck, exterior envelope.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!isExt(x, z)) {
    // Interior cell: no interior fit-out, just a floor slab per storey and the roof deck.
    if (gr < TOP) put(x, gr, z, "smooth_stone");
    for (let k = 1; k <= 8; k++) {
      const y = 5 * k;
      if (y > gr && y < TOP) put(x, y, z, "smooth_stone");
    }
    if (gr <= TOP) put(x, TOP, z, "gray_concrete");
    continue;
  }

  // Exterior cell: facade runs along x for N/S faces, along z for E/W faces.
  const e = exposed(x, z);
  const u = (e.N || e.S) ? x : z;
  const pier = u % 3 === 0;

  // Plinth at ground level.
  put(x, gr, z, "stone_bricks");

  for (let y = gr + 1; y < TOP; y++) {
    const inGroundStorey = y < 5;
    if (y % 5 === 0 || y % 5 === 4) {
      put(x, y, z, "light_gray_concrete"); // floor line / lintel spandrel
    } else if (pier) {
      put(x, y, z, inGroundStorey ? "stone_bricks" : "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Cornice and parapet.
  put(x, TOP, z, "smooth_stone");
  put(x, TOP + 1, z, "white_concrete");
  put(x, TOP + 2, z, "white_concrete");
}

// Pass 2: entrance with doors, transom and lintel.
if (entrance) {
  const { x, z, facing } = entrance;
  const gr = G.get(key(x, z));
  put(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "light_gray_concrete");
}

// Pass 3: warm lights behind some upper-storey windows (in the air gap, inside the glass).
for (const [x, z, gr] of cells) {
  if (!isExt(x, z)) continue;
  const e = exposed(x, z);
  const u = (e.N || e.S) ? x : z;
  if (u % 3 === 0) continue; // piers, not windows
  let dx = 0, dz = 0;
  if (e.N) dz = 1;
  else if (e.S) dz = -1;
  else if (e.W) dx = 1;
  else if (e.E) dx = -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isExt(ix, iz)) continue;
  for (let k = 1; k <= 7; k++) {
    const y = 5 * k + 2;
    if (y <= gr || y >= TOP) continue;
    if ((u + k) % 4 === 0) put(ix, y, iz, "glowstone");
  }
}

// Pass 4: rooftop plant box and mast, centred on the footprint.
const cx = 11, cz = 15;
for (let x = 7; x <= 15; x++) {
  for (let z = 9; z <= 21; z++) {
    if (!has(x, z)) continue;
    for (let y = TOP + 1; y <= TOP + 4; y++) put(x, y, z, "light_gray_concrete");
  }
}
// Louvred band on the plant box, one row high.
for (let x = 8; x <= 14; x++) {
  if (has(x, 9)) put(x, TOP + 2, 9, "iron_bars");
  if (has(x, 21)) put(x, TOP + 2, 21, "iron_bars");
}
// Mast and lightning rod.
for (let y = TOP + 5; y <= TOP + 9; y++) put(cx, y, cz, "iron_bars");
put(cx, TOP + 10, cz, "lightning_rod", { facing: "up" });

g.save(`${DIR}/${ID}.nbt`);
