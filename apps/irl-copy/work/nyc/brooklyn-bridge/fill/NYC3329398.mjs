import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3329398.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3329398.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 10, H = 18, D = 24;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inside = new Map();
for (const [x, z, ground, roof] of cells) {
  inside.set(key(x, z), { x, z, gr: Math.round(ground), roof });
}

// Smooth lidar roof heights over a 3x3 neighbourhood, then snap to 2-block storey tiers
for (const c of inside.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = inside.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.roof; n++; }
  }
  c.roofSmooth = sum / n;
}

const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

const PANE_OFF = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };

function exposure(x, z) {
  return {
    N: !inside.has(key(x, z - 1)),
    S: !inside.has(key(x, z + 1)),
    W: !inside.has(key(x - 1, z)),
    E: !inside.has(key(x + 1, z)),
  };
}

// Entrance: street-facing (north-exposed, lowest z) cell nearest the middle of that run
const doorXs = cells
  .filter(([x, z]) => z === minZ && !inside.has(key(x, z - 1)))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = doorXs.length ? doorXs[Math.floor(doorXs.length / 2)] : -1;
const doorZ = minZ;

const glowSpots = [];

for (const c of inside.values()) {
  const { x, z, gr } = c;
  // Snap to even storey tiers; keep at least two storeys above the cell's ground
  const top = Math.max(gr + 4, Math.round(c.roofSmooth / 2) * 2);
  const ex = exposure(x, z);
  const facade = ex.N || ex.S || ex.E || ex.W;
  const corner = (ex.N || ex.S) && (ex.E || ex.W);
  const singleSide = facade && !corner;

  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!facade) {
    // Interior: open air with a floor slab per storey and a roof slab
    for (let y = gr; y <= top; y++) {
      if ((y - gr) % 2 === 0) g.set(x, y, z, "smooth_stone");
    }
    continue;
  }

  // Facade shell: brick, with a stone base course and thin stone storey lines
  for (let y = gr; y < top; y++) {
    const r = y - gr;
    if (r === 0) g.set(x, y, z, "stone_bricks");        // base course
    else if (r % 2 === 0) g.set(x, y, z, "smooth_stone"); // storey line
    else g.set(x, y, z, "bricks");
  }

  // Roof cap and parapet
  g.set(x, top, z, "smooth_stone");
  g.set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  if (singleSide) {
    const idx = (ex.N || ex.S) ? x - minX : z - minZ;
    const isWindowBay = idx % 2 === 1;
    const panes = (ex.N || ex.S)
      ? { east: "true", west: "true" }
      : { north: "true", south: "true" };

    for (let y = gr; y < top; y++) {
      const r = y - gr;
      if (r % 2 !== 1) continue;
      const storey = (r - 1) / 2;

      if (x === doorX && z === doorZ && storey === 0) continue; // doorway

      if (storey === 0) {
        g.set(x, y, z, "glass_pane", { ...PANE_OFF, ...panes }); // shopfront
      } else if (isWindowBay) {
        g.set(x, y, z, "glass_pane", { ...PANE_OFF, ...panes });
        if (idx % 4 === 1) {
          const inward = ex.N ? [x, z + 1] : ex.S ? [x, z - 1] : ex.W ? [x + 1, z] : [x - 1, z];
          const inCell = inside.get(key(inward[0], inward[1]));
          const ie = exposure(inward[0], inward[1]);
          if (inCell && !(ie.N || ie.S || ie.E || ie.W)) {
            glowSpots.push([inward[0], y, inward[1]]);
          }
        }
      }
    }
  }
}

// Entrance: a recessed doorway framed by stone, two blocks tall
if (doorX >= 0) {
  const d = inside.get(key(doorX, doorZ));
  const gr = d.gr;
  g.set(doorX, gr, doorZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, gr + 1, doorZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Stone lintel over the door sits in the storey line already; mark the jambs in stone
  for (const dx of [-1, 1]) {
    const jx = doorX + dx;
    if (inside.has(key(jx, doorZ))) {
      const jc = inside.get(key(jx, doorZ));
      g.set(jx, jc.gr + 1, doorZ, "stone_bricks");
      g.set(jx, jc.gr + 2, doorZ, "stone_bricks");
    }
  }
}

// Warm light behind some window bays
for (const [x, y, z] of glowSpots) g.set(x, y, z, "glowstone");

g.save(OUT);
