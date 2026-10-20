import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw541374052: no record, so this is a two-storey, 1970s-80s Taipei commercial block.
// White tiled concrete facade, a stone base, a shopfront ground storey with a red fascia,
// an upper storey of blue-tinted window bands, a stone-slab parapet, and a flat roof deck.
// The lidar roof height (about 11 blocks above lowest ground) sets the parapet at B+10.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541374052";
const W = 27, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const foot = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, Math.round(gr)]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
const FACES = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const missing = (x, z) =>
  Object.keys(FACES).filter(f => !inFoot(x + FACES[f][0], z + FACES[f][1]));

const minG = Math.min(...cells.map(c => Math.round(c[2])));
const B = minG;          // lowest ground: base of the ground storey
const SLAB = B + 5;      // second-floor line (5-block storeys)
const ROOF = B + 10;     // top course of the parapet (roof about 11 above lowest ground)

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, graw] of cells) {
  const gr = Math.round(graw);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = missing(x, z);

  // Interior cell: floor slabs and roof deck, air between (no interiors).
  if (faces.length === 0) {
    put(x, gr, z, "smooth_stone");
    if (SLAB > gr) put(x, SLAB, z, "smooth_stone");
    put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Perimeter cell: the cell itself is the facade wall.
  const face = faces[0];
  const [dx, dz] = FACES[face];
  const u = (face === "n" || face === "s") ? x : z;   // position along the facade
  const entrance = face === "s" && x === 13;           // street-side centre entrance

  for (let y = gr; y <= ROOF; y++) {
    let id = "white_concrete";
    let props;

    if (y === ROOF) {
      id = "stone_brick_slab";
      props = { type: "top", waterlogged: "false" };
    } else if (y === gr) {
      id = "polished_andesite";                       // base course
    } else if (y === SLAB) {
      id = "smooth_stone";                            // storey line
    } else if (y < SLAB) {
      // Ground storey: shopfront glass with piers, red fascia at the top.
      if (y === SLAB - 1) {
        id = "red_terracotta";
      } else if (u % 3 === 0) {
        id = "polished_andesite";
      } else {
        id = "glass_pane";
        props = PANE;
      }
    } else {
      // Upper storey: blue-tinted window bands, head course at the top.
      if (y === ROOF - 1) {
        id = "light_gray_concrete";
      } else if (u % 3 === 0) {
        id = "light_gray_concrete";
      } else {
        id = "light_blue_stained_glass_pane";
        props = PANE;
      }
    }

    put(x, y, z, id, props);
  }

  // Entrance: double-height door under a lintel, on the street side.
  if (entrance) {
    put(x, gr + 1, z, "oak_door", DOOR("lower"));
    put(x, gr + 2, z, "oak_door", DOOR("upper"));
    put(x, gr + 3, z, "light_gray_concrete");
  }

  // Warm light: a glowstone on the floor slab behind some upper windows.
  if (u % 4 === 1 && u % 3 !== 0) {
    const ix = x - dx, iz = z - dz;
    if (inFoot(ix, iz) && missing(ix, iz).length === 0) {
      put(ix, SLAB + 1, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
