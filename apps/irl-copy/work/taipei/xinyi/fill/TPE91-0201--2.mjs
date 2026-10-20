import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${base}/TPE91-0201--2.cells.json`, "utf8"));

const W = 5, H = 23, D = 60;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground height (absolute, y 0 = lowest ground)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// bounds-safe setter; props optional
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS = "light_blue_stained_glass";   // full blocks: panes without connections render as posts
const PIER = "white_concrete";
const BAND = "light_gray_concrete";

for (const [x, z, gr] of cells) {
  const sideW = !has(x - 1, z);
  const sideE = !has(x + 1, z);
  const sideN = !has(x, z - 1);
  const sideS = !has(x, z + 1);
  const edge = sideW || sideE || sideN || sideS;
  const xSide = sideW || sideE;
  const endSide = sideN || sideS;

  // foundation fills from y 0 up to this cell's ground (downhill cells get extra storeys)
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // pier: vertical white concrete at every 4th bay; corners always piers
  const pier = edge && ((xSide && z % 4 === 0) || (endSide && (x === 0 || x === 4)));

  // ground floor slab / polished granite base course on facades
  put(x, gr, z, edge ? "polished_granite" : "smooth_stone");

  if (edge) {
    // storey 1 shopfront: y gr+1 .. gr+3 glazing or piers, gr+4 lintel band
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, pier ? PIER : GLASS);
    put(x, gr + 4, z, BAND);

    // storey 2: floor line gr+5, glazing gr+6..gr+8, spandrel gr+9
    put(x, gr + 5, z, BAND);
    for (let y = gr + 6; y <= gr + 8; y++) put(x, y, z, pier ? PIER : GLASS);
    put(x, gr + 9, z, PIER);

    // parapet with quartz cornice cap
    put(x, gr + 10, z, PIER);
    put(x, gr + 11, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // interior: floor slabs per storey, air between, roof slab at gr+10
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, BAND);
    // rooftop AC units
    if (x === 2 && z % 6 === 3) put(x, gr + 11, z, "iron_block");
  }
}

// Warm light behind the street-side glass (x=1 is the interior air behind x=0)
for (const [x, z, gr] of cells) {
  if (x === 1 && has(0, z) && z % 8 === 2) put(1, gr + 7, z, "glowstone");
  if (x === 1 && has(0, z) && z % 8 === 6) put(1, gr + 2, z, "shroomlight");
}

// Street entrance on the x=0 frontage at z=30: dark oak door, dark lintel canopy, lit lobby
if (has(0, 30)) {
  const gr = ground.get("0,30");
  put(0, gr + 1, 30, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(0, gr + 2, 30, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  // dark canopy over the entrance, carried across the glazed shopfront bays
  for (let zz = 28; zz <= 32; zz++) {
    if (has(0, zz)) put(0, gr + 4, zz, "black_concrete");
  }
  put(0, gr + 3, 30, "stone_brick_slab", { type: "top", waterlogged: "false" });
  if (has(1, 30)) put(1, gr + 1, 30, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${base}/TPE91-0201--2.nbt`);
