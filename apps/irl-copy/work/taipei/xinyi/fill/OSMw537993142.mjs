import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993142";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 16, H = 23, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height (rounded)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => ground.has(`${x},${z}`);

const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

// Put a block only inside the canvas.
function put(x, y, z, id, props) {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Two-storey mid-century-to-1990s Taipei commercial block:
// granite plinth, shopfront glass with red fascia, white concrete upper
// storey with panes between mullions, light grey storey bands and parapet.
// Storey 1: gr+1..gr+4 (shopfront, fascia at gr+4)
// Storey 2: gr+6..gr+9 (windows at gr+7..gr+8)
// Roof slab at gr+10; small plant box on top at gr+11.
for (const [x, z, gr0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.round(gr0);

  const nb = {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const edge = nb.n || nb.s || nb.w || nb.e;
  const zFace = nb.n || nb.s;
  const xFace = nb.w || nb.e;
  const corner = zFace && xFace;

  // Foundation from y 0 up to ground, then the floor slab at ground level.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "stone_bricks");

  // Position along the facade (mullions every 3 cells, corners always solid).
  const c = zFace ? x - minX : z - minZ;
  const mull = corner || c % 3 === 0;

  // Front (north, low z) door column, placed near the centre of the front.
  const doorX = minX + 7;
  const isDoor = nb.n && x === doorX && z === minZ;

  if (edge) {
    // Ground storey: granite base course, shopfront glass, red fascia.
    if (isDoor) {
      put(x, gr + 1, z, "dark_oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      put(x, gr + 2, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      put(x, gr + 3, z, "white_concrete");
      put(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else {
      put(x, gr + 1, z, "polished_granite");
      if (mull) {
        put(x, gr + 2, z, "white_concrete");
        put(x, gr + 3, z, "white_concrete");
      } else {
        put(x, gr + 2, z, "light_blue_stained_glass");
        put(x, gr + 3, z, "light_blue_stained_glass");
      }
      put(x, gr + 4, z, "red_concrete");
    }

    // Storey line between the two floors.
    put(x, gr + 5, z, "light_gray_concrete");

    // Upper storey: wall, panes between mullions, sill/cornice bands.
    put(x, gr + 6, z, "white_concrete");
    if (mull) {
      put(x, gr + 7, z, "white_concrete");
      put(x, gr + 8, z, "white_concrete");
    } else {
      const paneProps = zFace
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, gr + 7, z, "light_blue_stained_glass_pane", paneProps);
      put(x, gr + 8, z, "light_blue_stained_glass_pane", paneProps);
    }
    put(x, gr + 9, z, "light_gray_concrete");

    // Parapet on the roof edge.
    put(x, gr + 10, z, "light_gray_concrete");
  } else {
    // Interior: floor slabs only, air elsewhere.
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
  }

  // Warm light behind selected upper windows (interior cell next to the wall).
  if (edge && !mull && c % 6 === 2) {
    let ix = x, iz = z;
    if (nb.n) iz = z + 1;
    else if (nb.s) iz = z - 1;
    else if (nb.w) ix = x + 1;
    else if (nb.e) ix = x - 1;
    if (has(ix, iz) && !(ix !== x || iz !== z ? false : true)) {
      const inner =
        !has(ix, iz - 1) === false && !has(ix, iz + 1) === false &&
        !has(ix - 1, iz) === false && !has(ix + 1, iz) === false;
      if (inner) put(ix, gr + 7, iz, "glowstone");
    }
  }
}

// Roof plant box in the centre of the roof, above the parapet line.
for (const [x, z, gr0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.round(gr0);
  const lx = x - minX, lz = z - minZ;
  const interior = has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z);
  if (interior && (lx === 6 || lx === 7) && (lz === 3 || lz === 4)) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
