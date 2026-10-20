import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833595";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 13 x 19, volume 23 high. Two storeys of 5 blocks plus a cornice,
// roof surface about 11 blocks above the lowest ground: a 1980s-style
// white-tiled commercial block with grey concrete bands and a glass shopfront.
const W = 13, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);

const B = Math.min(...cells.map((c) => c[2]));   // lowest ground under the footprint
const OUT = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
};

function faces(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(OUT)) {
    if (!G.has(key(x + dx, z + dz))) out.push(name);
  }
  return out;
}

// Glass pane connection states for a pane sitting on a given facade.
function paneFor(face) {
  if (face === "north" || face === "south") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

const inRange = (y) => y >= 0 && y < H;
const put = (x, y, z, id, st) => { if (inRange(y)) g.set(x, y, z, id, st); };

// Pass 1: foundations, facades, interior floor slabs and roof.
for (const [x, z, gr] of cells) {
  const fs = faces(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (fs.length === 0) {
    // Interior cell: air between slabs, floor at ground, slabs at each storey line and the roof.
    put(x, gr, z, "smooth_stone");
    if (B + 5 >= gr) put(x, B + 5, z, "light_gray_concrete");
    if (B + 10 >= gr) put(x, B + 10, z, "light_gray_concrete");
    // Roof equipment on the cap.
    if (((x * 2 + z * 3) % 11) === 0) put(x, B + 11, z, "iron_block");
    continue;
  }

  // Facade cell.
  const f = fs[0];
  const idx = (f === "north" || f === "south") ? x : z;
  const bay = idx % 3 !== 0;                       // two window bays, then a pier
  const entrance = f === "south" && x === 6 && fs.includes("south");

  for (let y = gr; y <= B + 10; y++) {
    let blk = "white_concrete";
    let st;
    if (y === gr) {
      blk = "stone_bricks";                         // base course
    } else if (y <= B + 3) {
      // Ground-floor shopfront.
      if (bay) blk = "glass";
    } else if (y === B + 4 || y === B + 5 || y === B + 10) {
      blk = "light_gray_concrete";                  // lintel, storey line, cornice
    } else if (y === B + 6 || y === B + 9) {
      if (bay) blk = "light_gray_concrete";         // window frame heads and sills
    } else {
      // Upper-storey windows (B+7, B+8).
      if (bay) { blk = "glass_pane"; st = paneFor(f); }
    }
    put(x, y, z, blk, st);
  }

  if (entrance) {
    const doorBase = { facing: "south", hinge: "left", open: "false", powered: "false" };
    put(x, gr + 1, z, "dark_oak_door", { ...doorBase, half: "lower" });
    put(x, gr + 2, z, "dark_oak_door", { ...doorBase, half: "upper" });
    put(x, gr + 3, z, "lantern", { hanging: "true" });
  }
}

// Pass 2: warm lights behind some upper-storey windows, in the interior cell just inside.
for (const [x, z, gr] of cells) {
  const fs = faces(x, z);
  if (fs.length === 0) continue;
  const f = fs[0];
  const idx = (f === "north" || f === "south") ? x : z;
  const bay = idx % 3 !== 0;
  if (!bay || idx % 6 !== 1) continue;
  const [ox, oz] = OUT[f];
  const ix = x - ox, iz = z - oz;
  if (!G.has(key(ix, iz))) continue;
  if (faces(ix, iz).length !== 0) continue;
  const igr = G.get(key(ix, iz));
  if (B + 7 < igr) put(ix, B + 7, iz, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
