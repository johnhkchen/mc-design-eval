import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341554073";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 9 x 19 x 9. Roof cap at y=7 (about 7 blocks above the lowest ground).
const W = 9, H = 19, D = 9, ROOF = 7;
const g = new Voxels([W, H, D]);

// Per-cell ground, clamped so the storey and parapet still fit below the roof.
const gm = new Map();
for (const [x, z, gr] of cells) {
  gm.set(`${x},${z}`, Math.max(0, Math.min(4, Math.round(gr))));
}
const has = (x, z) => gm.has(`${x},${z}`);
const doorProps = (half) => ({
  facing: "south", half, hinge: "left", open: "false", powered: "false",
});

// Pass 1: foundation, base course, walls, cornice, parapet, roof cap.
for (const [key, gr] of gm) {
  const [x, z] = key.split(",").map(Number);

  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const outN = !has(x, z - 1);
  const outS = !has(x, z + 1);
  const outW = !has(x - 1, z);
  const outE = !has(x + 1, z);
  const edge = outN || outS || outW || outE;

  if (!edge) {
    // Interior: floor slab only, air above (no interiors).
    g.set(x, gr, z, "smooth_stone");
  } else {
    // Base course, white tiled walls, cornice band, parapet.
    g.set(x, gr, z, "stone_bricks");
    for (let y = gr + 1; y <= 4; y++) g.set(x, y, z, "white_terracotta");
    g.set(x, 5, z, "stone_bricks");
    g.set(x, 6, z, "white_terracotta");
  }

  // Flat roof cap over every footprint cell.
  g.set(x, ROOF, z, "smooth_stone");
}

// Pass 2: openings, shopfront, awning, and warm lights, face by face.
for (const [key, gr] of gm) {
  const [x, z] = key.split(",").map(Number);
  const faces = [
    { name: "N", out: !has(x, z - 1), t: x, inward: [x, z + 1] },
    { name: "S", out: !has(x, z + 1), t: x, inward: [x, z - 1] },
    { name: "W", out: !has(x - 1, z), t: z, inward: [x + 1, z] },
    { name: "E", out: !has(x + 1, z), t: z, inward: [x - 1, z] },
  ];

  for (const f of faces) {
    if (!f.out) continue;
    const t = f.t;

    if (f.name === "S") {
      // Street frontage: shopfront with entrance at the centre bay.
      for (let y = gr + 1; y <= Math.min(4, gr + 2); y++) {
        if (t === 4) {
          const half = y === gr + 1 ? "lower" : "upper";
          g.set(x, y, z, "oak_door", doorProps(half));
        } else if (t === 0 || t === 8 || t === 3 || t === 5) {
          g.set(x, y, z, "stone_bricks");
        } else {
          g.set(x, y, z, "glass");
        }
      }
      // Awning band above the shopfront.
      if (gr + 3 <= 4) g.set(x, gr + 3, z, "red_concrete");
    } else {
      // Upper and side windows: glass panes between piers at t = 0, 4, 8.
      for (let y = gr + 1; y <= Math.min(4, gr + 3); y++) {
        if ([1, 2, 3, 5, 6, 7].includes(t)) {
          g.set(x, y, z, "glass_pane");
        }
      }
    }

    // Warm lights behind a couple of window bays per face.
    if ([2, 6].includes(t) && 3 > gr && has(f.inward[0], f.inward[1])) {
      g.set(f.inward[0], 3, f.inward[1], "shroomlight");
    }
  }
}

// Roof equipment: a small plant box on the roof, centred.
for (let x = 3; x <= 5; x++) {
  for (let z = 3; z <= 5; z++) {
    if (has(x, z)) {
      g.set(x, ROOF + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
