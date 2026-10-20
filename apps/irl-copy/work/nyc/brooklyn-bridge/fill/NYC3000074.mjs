import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3000074.cells.json`, "utf8"));

// 1839 Federal / Greek Revival brick rowhouse-warehouse: brick walls on a brownstone
// base, three storeys, stone string courses and cornice, shopfront with a stone-framed
// entrance on the street (east) face, warm light behind some windows.
const W = 6, H = 22, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cm = new Map();
const roofs = [];
for (const row of cells) {
  const [x, z, gr0, roof0] = row;
  const gr = Math.min(H - 12, Math.max(0, Math.round(gr0)));
  roofs.push(Math.round(roof0));
  cm.set(key(x, z), { gr });
}
// one flat roof level from the median lidar height
roofs.sort((a, b) => a - b);
const T = Math.min(H - 3, roofs[Math.floor(roofs.length / 2)]);
for (const [k, v] of cm) {
  v.top = Math.min(H - 3, Math.max(T, v.gr + 9));
}

const inF = (x, z) => cm.has(key(x, z));
const faces = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isPerim = (x, z) => faces.some(([dx, dz]) => !inF(x + dx, z + dz));

// Pass 1: foundations, walls, floors, cornices, roof decks.
for (const [k, { gr, top }] of cm) {
  const [x, z] = k.split(",").map(Number);
  const nStor = Math.max(1, Math.floor((top - 1 - gr) / 3));

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isPerim(x, z)) {
    for (let s = 0; s < nStor; s++) g.set(x, gr + 3 * s, z, "spruce_planks");
    g.set(x, top - 1, z, "smooth_stone");
  } else {
    for (let y = gr; y <= top - 2; y++) g.set(x, y, z, "bricks");
    g.set(x, gr, z, "stone_bricks");
    for (let s = 1; s < nStor; s++) g.set(x, gr + 3 * s, z, "stone_bricks");
    g.set(x, top - 1, z, "stone_bricks");
  }
}

// Pass 2: window openings, shopfront, stone-framed entrance, glowing interiors.
for (const [k, { gr, top }] of cm) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const nStor = Math.max(1, Math.floor((top - 1 - gr) / 3));

  for (const [dx, dz] of faces) {
    if (inF(x + dx, z + dz)) continue;
    const idx = dx !== 0 ? z : x;
    const isFront = dx === 1;
    const inX = -dx, inZ = -dz;

    for (let s = 0; s < nStor; s++) {
      const b = gr + 3 * s;
      const r1 = b + 1, r2 = b + 2;

      if (s === 0 && isFront) {
        if (z === 10) {
          // entrance: door with stone pilasters either side and a stone lintel above
          g.set(x, r1, z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
          g.set(x, r2, z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (z === 9 || z === 11) {
          g.set(x, r1, z, "stone_bricks");
          g.set(x, r2, z, "stone_bricks");
          continue;
        }
        if (z % 4 === 0) continue; // pilaster stays brick
        g.set(x, r1, z, "glass_pane");
        g.set(x, r2, z, "glass_pane");
        continue;
      }

      if (idx % 2 === 1) {
        g.set(x, r1, z, "glass_pane");
        g.set(x, r2, z, "glass_pane");
        const ix = x + inX, iz = z + inZ;
        if (idx % 4 === 1 && inF(ix, iz) && !isPerim(ix, iz)) {
          const ic = cm.get(key(ix, iz));
          if (ic.gr === gr && r1 < ic.top - 1) g.set(ix, r1, iz, "glowstone");
        }
      }
    }
  }
}

// Pass 3: two brick chimney stacks on the roof deck.
for (const [x, z] of [[1, 2], [4, 2]]) {
  if (!inF(x, z)) continue;
  const { top } = cm.get(key(x, z));
  g.set(x, top, z, "bricks");
  g.set(x, top + 1, z, "bricks");
}

g.save(`${DIR}/NYC3000074.nbt`);
