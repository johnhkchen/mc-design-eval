import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542017364";
const W = 7, H = 23, D = 20;

// Two-storey (about 5 blocks each) mid-rise office/shop block in 1980s-90s Taipei style:
// white concrete piers, tinted glass bays, red terracotta fascia, flat roof with parapet
// and a rooftop plant box. Everything stands on the cell's own ground.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [x, z, gr] of cells) {
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground line: base course on the facade, floor on the interior.
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // Second-storey floor slab (interior) at gr+5.
  if (!edge) put(x, gr + 5, z, "smooth_stone");

  // Roof slab over the whole footprint at gr+10.
  put(x, gr + 10, z, "light_gray_concrete");

  // Rooftop plant box, centred on the roof.
  if (!edge && x >= 2 && x <= 4 && z >= 8 && z <= 11) {
    put(x, gr + 11, z, "light_gray_concrete");
    if (x === 3 && z === 9) put(x, gr + 12, z, "iron_bars");
  }

  if (!edge) {
    // Warm lights set back behind the glass on the 2nd storey.
    if (x === 1 && z % 8 === 3) put(x, gr + 7, z, "shroomlight");
    if (x === 5 && z % 8 === 15) put(x, gr + 7, z, "shroomlight");
    // Warm glow behind the shopfront glass.
    if (x === 1 && z % 8 === 6) put(x, gr + 2, z, "glowstone");
    continue;
  }

  // ---- Facade (edge cells) ----
  // Pier index runs along the long faces (z) or the short faces (x).
  const i = (x === 0 || x === 6) ? z : x;
  const pier = i % 4 === 0;

  // Storey 1: shopfront glass between piers, rows gr+1..gr+3.
  for (let y = gr + 1; y <= gr + 3; y++) {
    put(x, y, z, pier ? "white_concrete" : "glass");
  }
  // Storey 1 fascia in red terracotta at gr+4.
  put(x, gr + 4, z, "red_terracotta");

  // Storey 2 floor line, sill, window bays, head.
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 6, z, pier ? "white_concrete" : "quartz_block");
  for (let y = gr + 7; y <= gr + 8; y++) {
    put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass_pane");
  }
  put(x, gr + 9, z, "light_gray_concrete");

  // Parapet and coping.
  put(x, gr + 11, z, "white_concrete");
  put(x, gr + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Main entrance on the north short face, centred.
  if (z === 0 && x === 3) {
    put(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false"
    });
    put(x, gr + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false"
    });
  }
}

g.save(`${DIR}/${ID}.nbt`);
