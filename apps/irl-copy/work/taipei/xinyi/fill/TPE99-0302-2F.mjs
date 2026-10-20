import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE99-0302-2F: 2010 Xinyi-style mid-rise office/retail block, 5 storeys.
// Pale quartz and white concrete frame, light-blue glass curtain wall,
// stone base, a few lit office windows at dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE99-0302-2F.cells.json`, "utf8"));

const W = 26, H = 38, D = 2;
const ROOF = 26;                          // roof surface, blocks above lowest ground
const SLABS = new Set([5, 10, 15, 20]);   // storey floor / spandrel rows
const CORNICE = 24;
const DECK = 25;                          // roof deck; top surface at y = 26

const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const groundAt = new Map();
for (const [x, z, ground] of cells) {
  groundAt.set(`${x},${z}`, clamp(Math.round(ground), 0, ROOF - 3));
}

// Entrance sits on the lowest street-side cell nearest the centre, so the
// door opens at grade and is never buried in the foundation.
let doorX = 13;
{
  let best = Infinity;
  for (let x = 0; x < W; x++) {
    const gr = groundAt.get(`${x},0`);
    if (gr === undefined) continue;
    const score = gr * 100 + Math.abs(x - 13);
    if (score < best) { best = score; doorX = x; }
  }
}
const doorGround = groundAt.get(`${doorX},0`) ?? 0;

// Sparse warm glow just behind the glass on the inner side (z = 1).
function isGlow(x, y) {
  return x % 6 === 2 && (y === 8 || y === 13 || y === 18 || y === 23) && ((x * 5 + y) % 4 === 0);
}

for (const [x, z, ground] of cells) {
  const gr = groundAt.get(`${x},${z}`);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) {
    g.set(x, y, z, "stone");
  }

  // Superstructure from the cell's ground up to the roof deck.
  for (let y = gr; y <= DECK; y++) {
    if (y === gr) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (SLABS.has(y) || y === CORNICE) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === DECK) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    const isPillar = x % 3 === 0 || x === W - 1;
    if (isPillar) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    if (z === 0) {
      g.set(x, y, z, "light_blue_stained_glass_pane", {
        north: "false",
        south: "false",
        east: "true",
        west: "true",
        waterlogged: "false",
      });
    } else if (isGlow(x, y)) {
      g.set(x, y, z, "glowstone");
    }
  }

  // Parapet piers stand above the roof deck on the street face, one per bay.
  if (z === 0 && (x % 3 === 0 || x === W - 1)) {
    g.set(x, DECK + 1, z, "white_concrete");
  }

  // Roof plant: low boxes on the deck, west end.
  if (x >= 4 && x <= 6) {
    g.set(x, ROOF, z, "light_gray_concrete");
  }
}

// Entrance: two-high dark oak door on the street face, lintel and canopy above.
{
  const x = doorX;
  const z = 0;
  const gr = doorGround;
  g.set(x, gr + 1, z, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gr + 2, z, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Door-width pillars either side, lintel at the door head, and a quartz canopy slab.
  for (const dx of [-1, 1]) {
    const px = x + dx;
    if (px < 0 || px >= W) continue;
    if (groundAt.get(`${px},${z}`) === undefined) continue;
    for (let y = gr + 1; y <= 4; y++) g.set(px, y, z, "white_concrete");
  }
  for (let y = gr + 3; y <= 4; y++) g.set(x, y, z, "white_concrete");
  for (const dx of [-1, 0, 1]) {
    const px = x + dx;
    if (px < 0 || px >= W) continue;
    if (groundAt.get(`${px},${z}`) === undefined) continue;
    g.set(px, gr + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Lightning rod on the roof.
g.set(13, ROOF, 0, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
g.set(13, ROOF + 1, 0, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/TPE99-0302-2F.nbt`);
