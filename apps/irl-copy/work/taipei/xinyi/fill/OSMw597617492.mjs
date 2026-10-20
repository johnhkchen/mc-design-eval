import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 國家大第: 1990s Taiwanese mid-rise residential block over ground-floor shops.
// Six storeys of about 5 blocks, flat roof with parapet, pale tiled concrete
// facade, blue-tinted glass, dark granite base, a lobby door and canopy on the
// street side, and a few warm lit windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw597617492";
const W = 54, H = 43, D = 20;

const TOP = 30;                 // roof deck layer; parapet sits on it at 31-32
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_quartz";
const ROOF = "smooth_stone";
const CAP = "smooth_stone_slab";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inFp = (x, z) => ground.has(key(x, z));
const perim = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
// only place on footprint cells
const onFp = (x, y, z, id, p) => { if (inFp(x, z)) put(x, y, z, id, p); };

// storey base heights for a cell standing on ground gr; storeys run to the next base or TOP
function storeys(gr) {
  const b = [gr];
  for (let v = 5; v <= 25; v += 5) if (v >= gr + 4) b.push(v);
  return b;
}

const paneProps = (longSide) =>
  longSide
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, gr] of cells) {
  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const bs = storeys(gr);
  const edge = perim(x, z);
  const longSide = z === 0 || z === D - 1;
  const s = longSide ? x : z;
  const pier = x === 0 || x === W - 1 || s % 3 === 0;

  for (let i = 0; i < bs.length; i++) {
    const b = bs[i];
    const nb = i + 1 < bs.length ? bs[i + 1] : TOP;

    if (!edge) {
      // interior: floor slab only, air above (no interiors)
      put(x, b, z, FLOOR);
      continue;
    }

    // storey line / base course
    put(x, b, z, i === 0 ? BASE : BAND);

    if (i === 0) {
      // commercial ground floor
      const entrance = z === 0 && x === 26;
      const canopy = z === 0 && x >= 23 && x <= 29;
      if (entrance) {
        put(x, b + 1, z, "dark_oak_door", doorProps("lower"));
        put(x, b + 2, z, "dark_oak_door", doorProps("upper"));
      } else {
        for (let y = b + 1; y <= b + 2; y++) {
          if (pier) put(x, y, z, WALL);
          else put(x, y, z, GLASS, paneProps(longSide));
        }
      }
      // fascia / canopy row above the shopfronts
      for (let y = b + 3; y <= nb - 2; y++) {
        if (canopy && y === b + 3) put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        else put(x, y, z, WALL);
      }
      put(x, nb - 1, z, BAND);
    } else {
      // residential storey: window grid with piers
      for (let y = b + 1; y <= nb - 2; y++) {
        if (pier) put(x, y, z, WALL);
        else if ((x * 7 + y * 13 + z * 3) % 11 === 0) put(x, y, z, "glowstone");
        else put(x, y, z, GLASS, paneProps(longSide));
      }
      put(x, nb - 1, z, BAND);
    }
  }

  // roof deck, then parapet and cap on the perimeter
  put(x, TOP, z, ROOF);
  if (edge) {
    put(x, TOP + 1, z, WALL);
    put(x, TOP + 2, z, CAP, { type: "bottom", waterlogged: "false" });
  }
}

// roof equipment: plant room and water tank, only on footprint cells
for (let x = 8; x <= 13; x++)
  for (let z = 6; z <= 11; z++) {
    onFp(x, TOP + 1, z, BAND);
    onFp(x, TOP + 2, z, BAND);
    onFp(x, TOP + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
for (let x = 38; x <= 40; x++)
  for (let z = 5; z <= 7; z++) {
    for (let y = TOP + 1; y <= TOP + 4; y++) onFp(x, y, z, WALL);
    onFp(x, TOP + 5, z, CAP, { type: "bottom", waterlogged: "false" });
  }

g.save(`${DIR}/${ID}.nbt`);
