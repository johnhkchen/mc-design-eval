import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001618";

// 91 Columbia Heights, 1899 Brooklyn Heights walk-up: brownstone base,
// brick upper storeys on a 3-block storey pitch, stone string courses,
// one flat cornice roof for the whole block.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 20, H = 28, D = 6;
const g = new Voxels([W, H, D]);

const info = new Map();
const roofVals = [];
for (const c of cells) {
  const [x, z, gr0, roof0] = c;
  const gr = Math.max(0, Math.round(gr0));
  roofVals.push(Math.round(roof0 / 2) * 2);
  info.set(`${x},${z}`, { x, z, gr });
}

// One flat roof tier: the most common lidar roof (two-block quantised), clamped.
const counts = new Map();
for (const r of roofVals) counts.set(r, (counts.get(r) || 0) + 1);
let roofT = roofVals[0];
let best = -1;
for (const [r, n] of counts) if (n > best) { best = n; roofT = r; }
const minGr = Math.min(...[...info.values()].map(v => v.gr));
const T = Math.min(H - 3, Math.max(minGr + 8, roofT));

for (const v of info.values()) v.T = T;

const has = (x, z) => info.has(`${x},${z}`);
const ext = (x, z) =>
  has(x, z) && (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));
const front = (x, z) => has(x, z) && !has(x, z - 1);
const back = (x, z) => has(x, z) && !has(x, z + 1);

for (const { x, z, gr } of info.values()) {
  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const isExt = ext(x, z);
  const windowable = front(x, z) || back(x, z);

  if (isExt) {
    for (let y = gr; y < T; y++) {
      if (y < gr + 2) {
        g.set(x, y, z, "brown_terracotta");
        continue;
      }
      const r = (y - (gr + 2)) % 3;
      if (y === T - 1) { g.set(x, y, z, "stone_bricks"); continue; }
      if (r === 0) { g.set(x, y, z, "stone_bricks"); continue; }
      const isWin = windowable && (x % 4 === 1 || x % 4 === 2) && y <= T - 2;
      g.set(x, y, z, isWin ? "glass_pane" : "bricks");
    }
    g.set(x, T, z, "stone_brick_wall");
  } else {
    // Interior: floor slab per storey, then a continuous roof deck.
    for (let y = gr + 2; y < T - 1; y++) {
      if ((y - (gr + 2)) % 3 === 0) g.set(x, y, z, "oak_planks");
    }
  }
  // Roof deck over every cell so the massing reads as one solid roof.
  g.set(x, T - 1, z, isExt ? "stone_bricks" : "smooth_stone");
}

// Entrance: dark oak door on the street face at x=8, with lanterns flanking it.
for (const { x, z, gr } of info.values()) {
  if (front(x, z) && x === 8) {
    g.set(x, gr, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
  if (front(x, z) && (x === 7 || x === 9)) {
    g.set(x, gr + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Warm light behind some windows on the street and yard faces.
for (const { x, z, gr } of info.values()) {
  if (!(front(x, z) || back(x, z))) continue;
  const behindZ = front(x, z) ? 1 : D - 2;
  if (!has(x, behindZ) || ext(x, behindZ)) continue;
  if (x % 8 !== 1) continue;
  for (let yb = gr + 2, k = 0; yb + 2 <= T - 2; yb += 3, k++) {
    if (k % 2 !== 0) continue;
    g.set(x, yb + 1, behindZ, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
