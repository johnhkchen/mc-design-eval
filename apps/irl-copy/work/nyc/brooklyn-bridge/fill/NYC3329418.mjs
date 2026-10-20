import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3329418";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 31, D = 15;
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr0, ro0] of cells) {
  raw.set(k(x, z), { gr: Math.max(0, Math.round(gr0)), ro: Math.round(ro0) });
}
const has = (x, z) => raw.has(k(x, z));
const missingSides = (x, z) =>
  (has(x - 1, z) ? 0 : 1) + (has(x + 1, z) ? 0 : 1) +
  (has(x, z - 1) ? 0 : 1) + (has(x, z + 1) ? 0 : 1);

// Smooth the lidar roof over a 3x3 neighbourhood, then quantise to 3-block storeys.
const cellMap = new Map();
for (const [x, z] of cells) {
  const c = raw.get(k(x, z));
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const nb = raw.get(k(x + dx, z + dz));
    if (nb) { sum += nb.ro; n++; }
  }
  const avg = sum / n;
  let storeys = Math.max(2, Math.round((avg - c.gr) / 3));
  let ro = c.gr + storeys * 3;
  if (ro > H - 5) ro = H - 5;
  cellMap.set(k(x, z), { gr: c.gr, ro });
}

// Street frontage = minimum-z perimeter edge; entrance sits near its middle.
let minZ = Infinity;
for (const [x, z] of cells) if (missingSides(x, z) > 0) minZ = Math.min(minZ, z);
const frontCells = cells.filter(([x, z]) => z === minZ && missingSides(x, z) > 0);
let entrance = null;
if (frontCells.length) {
  const mx = frontCells.reduce((s, c) => s + c[0], 0) / frontCells.length;
  entrance = frontCells.reduce((best, c) =>
    Math.abs(c[0] - mx) < Math.abs(best[0] - mx) ? c : best)[0];
}

for (const [x, z] of cells) {
  const { gr, ro } = cellMap.get(k(x, z));
  const ms = missingSides(x, z);
  const perim = ms > 0;
  const corner = ms >= 2;
  const front = perim && z === minZ;

  // plinth from y0 to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < ro - 1; y++) {
    const rel = y - gr;
    const band = rel % 3 === 0;
    const ground = rel < 3;
    if (!perim) { g.set(x, y, z, "bricks"); continue; }
    if (corner) { g.set(x, y, z, "stone_bricks"); continue; }
    if (band) {
      // base course / storey line; ground storey base slightly heavier
      g.set(x, y, z, rel === 0 ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (ground) {
      // shopfront: continuous glass with brick piers every third cell
      if ((x + z) % 3 === 0) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "glass_pane");
    } else {
      // upper storeys: window bays alternating with brick piers
      if ((x + z) % 2 === 0) {
        if (((x * 5 + z * 3 + y) % 9) === 0) g.set(x, y, z, "shroomlight");
        else g.set(x, y, z, "glass_pane");
      } else {
        g.set(x, y, z, "bricks");
      }
    }
  }

  const top = ro - 1;
  if (perim) {
    g.set(x, top, z, "smooth_stone");          // cornice
    g.set(x, ro, z, "stone_brick_wall");       // parapet
  } else {
    g.set(x, top, z, "gray_concrete");         // flat roof
    // sparse brick chimneys on interior roof
    if (x % 6 === 2 && z % 5 === 2 && ro + 2 < H) {
      g.set(x, ro, z, "bricks");
      g.set(x, ro + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Framed entrance on the street frontage.
if (entrance !== null) {
  const { gr } = cellMap.get(k(entrance, minZ));
  // stone surround
  for (const dx of [-1, 1]) {
    const sx = entrance + dx;
    if (has(sx, minZ) && missingSides(sx, minZ) > 0) {
      g.set(sx, gr + 1, minZ, "stone_bricks");
      g.set(sx, gr + 2, minZ, "stone_bricks");
    }
  }
  g.set(entrance, gr + 2, minZ, "smooth_stone");   // lintel
  g.set(entrance, gr, minZ, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(entrance, gr + 1, minZ, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // warm lanterns flanking the door on the shopfront
  for (const dx of [-3, 3]) {
    const lx = entrance + dx;
    if (has(lx, minZ) && missingSides(lx, minZ) > 0) {
      g.set(lx, cellMap.get(k(lx, minZ)).gr + 1, minZ, "lantern", {
        hanging: "false", waterlogged: "false",
      });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
