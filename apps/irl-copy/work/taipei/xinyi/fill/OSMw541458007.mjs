import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458007";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 1980s Taipei low-rise commercial: two storeys over a shopfront ground floor,
// white tiled concrete walls, light-grey bands, glass upper windows, parapet with
// rooftop plant. Front faces +z (the exposed side with no footprint cell beyond).
const W = 40, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Block for the street (+z) facade at height h above the cell's ground (1..11).
function frontBlock(x, h) {
  if (h === 11) return { id: "smooth_stone_slab", props: { type: "bottom", waterlogged: "false" } };
  if (h === 10) return { id: BAND };
  if (h === 5) return { id: BAND };
  if (h === 4) {
    if (x >= 1 && x <= 3) return { id: "dark_oak_slab", props: { type: "top", waterlogged: "false" } };
    return { id: BAND };
  }
  if (h <= 3) {
    if (x % 5 === 0) return { id: WALL };
    if (x === 2) {
      if (h === 1) return { id: "oak_door", props: { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" } };
      if (h === 2) return { id: "oak_door", props: { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" } };
      return { id: "glass" };
    }
    return { id: "glass" };
  }
  // h 6..9: upper storey windows
  if (x % 5 === 0) return { id: WALL };
  if (h === 6 || h === 9) return { id: BAND };
  return { id: "glass_pane", props: PANE_EW };
}

for (const [x, z, gr] of cells) {
  const G = Math.round(gr);

  // foundation under every footprint cell
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // floor slabs (ground, storey 2) and roof slab
  put(x, G, z, "smooth_stone");
  put(x, G + 5, z, "smooth_quartz");
  put(x, G + 10, z, BAND);

  const exP = !has(x, z + 1);
  const exM = !has(x, z - 1);
  const exX = !has(x - 1, z) || !has(x + 1, z);
  const edge = exP || exM || exX;

  if (!edge) {
    // interior: rooftop plant boxes on the roof slab
    if (x % 8 >= 3 && x % 8 <= 4 && z >= 3 && z <= 6) {
      put(x, G + 11, z, "gray_concrete");
      put(x, G + 12, z, "gray_concrete");
    }
    continue;
  }

  for (let h = 1; h <= 11; h++) {
    const y = G + h;
    let id = WALL, props;
    if (exP) {
      const f = frontBlock(x, h);
      id = f.id; props = f.props;
    } else if (exM) {
      // rear: plain wall with a simple window rhythm
      if (h === 4 || h === 5 || h === 10 || h === 11) id = h === 11 ? "smooth_stone_slab" : BAND;
      if (h === 11) props = { type: "bottom", waterlogged: "false" };
      if (h >= 6 && h <= 9 && x % 2 === 1) { id = "glass_pane"; props = PANE_EW; }
    } else {
      // gable/ends: plain tiled wall with bands
      if (h === 4 || h === 5 || h === 10) id = BAND;
      if (h === 11) { id = "smooth_stone_slab"; props = { type: "bottom", waterlogged: "false" }; }
    }
    put(x, y, z, id, props);
  }

  // warm light behind some street-facing upper windows (interior cell behind)
  if (exP && x % 10 === 7 && has(x, z - 1)) {
    const gi = ground.get(key(x, z - 1));
    put(x, gi + 7, z - 1, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
