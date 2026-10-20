import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1079141.cells.json`, "utf8"));

const W = 6, H = 25, D = 6;
const g = new Voxels([W, H, D]);

// Per-cell ground (terrain) and one smoothed flat roof tier for the whole block.
const raw = cells.map(([x, z, gr, roof]) => ({ x, z, gr: Math.max(0, Math.round(gr)), roof: Math.round(roof) }));
const roofs = raw.map((c) => c.roof).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const R = Math.min(H - 5, Math.max(medianRoof, 8));

const cm = new Map();
for (const c of raw) cm.set(`${c.x},${c.z}`, { gr: Math.min(c.gr, R - 4) });

const has = (x, z) => cm.has(`${x},${z}`);
const zs = [...cm.keys()].map((k) => Number(k.split(",")[1]));
const minZ = Math.min(...zs);
const doorX = has(2, minZ) ? 2 : has(3, minZ) ? 3
  : Math.min(...[...cm.keys()].filter((k) => Number(k.split(",")[1]) === minZ).map((k) => Number(k.split(",")[0])));

const isCore = (x, z) => x >= 2 && x <= 3 && z >= 2 && z <= 3;

for (const [key, { gr }] of cm) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const exN = !has(x, z - 1), exS = !has(x, z + 1);
  const exW = !has(x - 1, z), exE = !has(x + 1, z);
  const ex = exN || exS || exW || exE;
  const t = (exN || exS) ? x : z;
  const bayOK = ex && t >= 1 && t <= 4;

  for (let y = gr; y < R; y++) {
    const rel = y - gr;
    const top = y === R - 1;
    let id = "bricks";
    let props;

    if (!ex) {
      id = "bricks";
    } else if (top) {
      id = "stone_bricks";                     // cornice
    } else if (rel === 0) {
      id = "polished_andesite";                // base course
    } else if (rel <= 2) {
      id = bayOK ? "glass" : "bricks";         // shopfront band
    } else if (rel % 3 === 0) {
      id = "smooth_stone";                     // storey line
    } else {
      id = bayOK ? "glass_pane" : "bricks";    // two-row windows
      if (bayOK && t === 2 && rel % 6 === 4) id = "shroomlight";
    }

    // Entrance door on the north facade
    const isDoor = exN && z === minZ && x === doorX && (rel === 1 || rel === 2);
    if (isDoor) {
      id = "oak_door";
      props = {
        facing: "north",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    }

    g.set(x, y, z, id, props);
  }

  if (isCore(x, z)) {
    // Central roof bulkhead, two blocks tall, then its own cap
    g.set(x, R, z, "bricks");
    g.set(x, R + 1, z, "stone_bricks");
    g.set(x, R + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Flat roof cap
    g.set(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${dir}/NYC1079141.nbt`);
