import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Single-storey Xinyi-era shophouse: red brick with a terracotta sign band,
// stone base, glazed shopfront, and a parapet with a small rooftop unit.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341355196";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 19, D = 4;
const ROOF = 7;              // roof about 7 blocks above lowest ground
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inF = new Set(cells.map(([x, z]) => key(x, z)));
const cellList = cells.map(([x, z, gr]) => [x, z, Math.round(gr)]);

const glassN = { east: "false", north: "true", south: "true", west: "false", waterlogged: "false" };
const glassE = { east: "true", north: "false", south: "false", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cellList) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  const miss = {
    n: !inF.has(key(x, z - 1)),
    s: !inF.has(key(x, z + 1)),
    w: !inF.has(key(x - 1, z)),
    e: !inF.has(key(x + 1, z)),
  };
  const facade = miss.n || miss.s || miss.w || miss.e;
  const corner = (miss.n || miss.s) && (miss.w || miss.e);
  const frontFace = miss.n;                 // north face is the street front
  const isDoor = frontFace && !corner && x === 2;
  const top = Math.max(ROOF, gr + 5);       // roof level for this cell

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Interior floor slab at ground level
  if (!facade) g.set(x, gr, z, "smooth_stone");

  for (let y = gr; y < top; y++) {
    const r = y - gr;

    if (!facade) {
      if (r === 3) g.set(x, y, z, "smooth_stone");            // ceiling slab
      else if (r === top - 1) g.set(x, y, z, "stone_bricks"); // roof deck
      continue;                                               // air behind glass
    }

    if (r === 0) {
      g.set(x, y, z, "polished_andesite");                    // base course
    } else if (r === top - 1) {
      g.set(x, y, z, "smooth_stone");                         // parapet cap
    } else if (r === 4) {
      g.set(x, y, z, "red_terracotta");                       // sign band
    } else if (r === 3) {
      g.set(x, y, z, "stone_bricks");                         // lintel course
    } else if (r === 1 || r === 2) {
      if (isDoor) {
        g.set(x, y, z, "oak_door", {
          facing: "north",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (corner) {
        g.set(x, y, z, "bricks");
      } else {
        const p = frontFace || miss.s ? glassE : glassN;
        g.set(x, y, z, "glass_pane", p);
      }
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // Interior warm light and rooftop unit
  if (!facade && x === 2 && z === 1) {
    g.set(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
  if (!facade && x === 1 && z === 2) {
    g.set(x, top, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
