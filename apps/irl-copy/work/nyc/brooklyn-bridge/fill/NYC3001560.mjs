import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001560";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(`${x},${z}`, { gr: Math.round(gr), roof: Math.round(roof) });
}
let G = Infinity;
for (const c of map.values()) G = Math.min(G, c.gr);

const isPerimeter = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const isFront = (x, z) => z === 0;
const isBack = (x, z) => z === D - 1;
const isSide = (x, z) => x === 0 || x === W - 1;

const isWindow = (x, z) => {
  if ((isFront(x, z) || isBack(x, z)) && (x === 1 || x === 4)) return true;
  if (isSide(x, z) && (z === 2 || z === 5 || z === 8 || z === 11)) return true;
  return false;
};

const DOOR_X = 2;

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = map.get(`${x},${z}`);
    if (!c) continue;
    const { gr, roof } = c;
    const per = isPerimeter(x, z);

    // Foundation: solid stone up to the cell's ground.
    for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

    const topWall = roof - 2;
    const cornice = roof - 1;

    for (let y = gr; y <= topWall; y++) {
      const rel = y - G;
      const even = rel % 2 === 0;

      if (per) {
        let block = "bricks";
        if (y < G + 2) block = "stone_bricks";                 // base course
        else if (even) block = "smooth_stone_slab";            // stone band at each storey line
        else if (isWindow(x, z)) block = "glass_pane";         // window light
        g.set(x, y, z, block);
      } else {
        if (even) g.set(x, y, z, "spruce_planks");             // floor slab, air above
      }
    }

    if (!per && gr <= topWall) g.set(x, gr, z, "spruce_planks");

    // Stone cornice band just under the roof.
    if (cornice >= gr) {
      g.set(x, cornice, z, per ? "smooth_stone" : "smooth_stone");
    }

    // Solid stone parapet on the perimeter, as a slab so it reads as a coping.
    if (per && roof < H) {
      g.set(x, roof, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Entrance: oak door in a stone frame, with a stone stoop step on the inside.
{
  const c = map.get(`${DOOR_X},0`);
  if (c && c.gr + 2 <= c.roof - 2) {
    const base = { facing: "north", hinge: "left", open: "false", powered: "false" };
    g.set(DOOR_X, c.gr, 0, "oak_door", { ...base, half: "lower" });
    g.set(DOOR_X, c.gr + 1, 0, "oak_door", { ...base, half: "upper" });
    // Stoop step in front of the door, on the interior side at ground level.
    const sc = map.get(`${DOOR_X},1`);
    if (sc && sc.gr === c.gr) {
      g.set(DOOR_X, c.gr, 1, "stone_brick_stairs", {
        facing: "north", half: "bottom", shape: "straight", waterlogged: "false",
      });
    }
  }
}

// Warm lights behind some windows.
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!isPerimeter(x, z) || !isWindow(x, z)) continue;
    const c = map.get(`${x},${z}`);
    if (!c) continue;
    const ix = isSide(x, z) ? (x === 0 ? 1 : W - 2) : x;
    const iz = isFront(x, z) ? 1 : isBack(x, z) ? D - 2 : z;
    for (let y = c.gr; y <= c.roof - 2; y++) {
      const rel = y - G;
      if (rel % 2 !== 1) continue;
      const storey = (rel - 1) / 2;
      if (storey % 2 === 0 && (x + z) % 2 === 0) {
        g.set(ix, y, iz, "shroomlight");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
