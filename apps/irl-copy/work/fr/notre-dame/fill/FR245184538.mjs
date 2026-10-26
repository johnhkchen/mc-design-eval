// FR245184538: a residential block, 1600, stone. Built from the footprint cells only: a solid plinth and floor under
// every cell, exterior walls one block thick, air behind the glass, a slab per floor, and the lidar's roof tiers
// (8 / 7 / 6 blocks, smoothed into three flat levels) capped with a parapet of slabs and deepslate slates.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184538.cells.json`, "utf8"));   // [x, z, ground, roof]

const g = new Voxels([8, 24, 13]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inside.has(key(x, z));
// which sides of a cell face outside the footprint
const exposure = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });

// the lidar's roof, smoothed into three flat tiers
const tier = (r) => (r >= 8 ? 8 : r === 7 ? 7 : 6);

// the front (north, z = 0) entrance: the centre bay of the front row
const DOOR = [5, 0];

for (const [x, z, ground, roofRaw] of cells) {
  const R = tier(roofRaw);
  const ex = exposure(x, z);
  const ext = ex.n || ex.s || ex.w || ex.e;
  const alongZ = ex.n || ex.s;               // the wall runs east-west: its bays are x
  const t = alongZ ? x : z;
  const bay = alongZ ? (x % 2 === 1) : (z % 2 === 1);   // glass in odd bays, stone piers in even
  const inward = ex.n ? [x, z + 1] : ex.s ? [x, z - 1] : ex.w ? [x + 1, z] : [x - 1, z];

  for (let y = 0; y < R; y++) {
    // foundation under a raised cell, then the floor and roof
    if (y <= ground) { put(x, y, z, "stone_bricks"); continue; }                    // foundation, plinth, floor
    if (y === R - 1) {                                                              // roof covering
      if (ext) put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });   // parapet
      else put(x, y, z, z % 3 === 0 ? "polished_deepslate" : "deepslate_tiles");            // slate courses
      continue;
    }
    if (R === 8 && y === 6) {                                                       // attic floor
      put(x, y, z, ext ? "chiseled_stone_bricks" : "stone_bricks");
      continue;
    }
    if (y === ground + 3) {                                                         // storey line / floor slab
      put(x, y, z, ext ? "smooth_stone" : "stone_bricks");
      continue;
    }
    if (!ext) continue;                                                             // interior: air

    // exterior wall, one block thick
    const row = y - ground;
    const windowRow = row === 1 || row === 2 || row === 4 || row === 5;
    if (!windowRow || !bay) { put(x, y, z, "calcite"); continue; }

    // the door: lower and upper halves in the front bay
    if (x === DOOR[0] && z === DOOR[1] && (row === 1 || row === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "south", half: row === 1 ? "lower" : "upper", hinge: "left",
        open: "false", powered: "false",
      });
      continue;
    }

    // a warm light in some windows: the footprint is one cell deep at its edges, so there is no room behind the
    // glass for a lamp, and the lit pane is a glowstone in the opening; the rest are glass panes in their frames
    if ((x + z + y) % 5 === 0) { put(x, y, z, "glowstone"); continue; }
    put(x, y, z, "glass_pane", alongZ
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" });
  }
}

// a pair of brick chimney stacks on the roof
for (const [cx, cz] of [[5, 6], [2, 8]]) {
  const cell = cells.find(([x, z]) => x === cx && z === cz);
  if (!cell) continue;
  const top = tier(cell[3]);
  put(cx, top, cz, "bricks"); put(cx, top + 1, cz, "bricks");
  put(cx, top + 2, cz, "brick_slab", { type: "top", waterlogged: "false" });
}

const stats = g.save(`${DIR}/FR245184538.nbt`);
console.log(JSON.stringify(stats));
