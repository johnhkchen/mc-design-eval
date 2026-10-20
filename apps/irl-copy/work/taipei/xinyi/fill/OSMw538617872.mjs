import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617872";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inF = (x, z) => G.has(`${x},${z}`);
const isExt = (x, z) =>
  !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

// Entrance: middle of the northern (min z) exterior edge
const northEdge = cells.filter(([x, z]) => !inF(x, z - 1));
const fz = Math.min(...northEdge.map((c) => c[1]));
const frontXs = northEdge.filter((c) => c[1] === fz).map((c) => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }; // wall runs along z
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }; // wall runs along x

for (const [x, z, gr] of cells) {
  const mw = !inF(x - 1, z), me = !inF(x + 1, z);
  const mn = !inF(x, z - 1), ms = !inF(x, z + 1);
  const ext = mw || me || mn || ms;
  const corner = (mw || me) && (mn || ms);
  const runZ = mw || me;            // wall lies along z, so t = z
  const t = runZ ? z : x;
  const pane = runZ ? paneX : paneZ;

  // foundation fill below the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!ext) {
    // interior: floor slabs, roof deck, and rooftop plant
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "gray_concrete");
    if (x >= 3 && x <= 8 && z >= 5 && z <= 8 && (x + z) % 3 === 0) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }
    continue;
  }

  // exterior base course
  put(x, gr, z, "polished_andesite");

  if (corner) {
    for (let k = 1; k <= 9; k++) put(x, gr + k, z, "quartz_pillar", { axis: "y" });
    put(x, gr + 10, z, "quartz_block");
    continue;
  }

  const isDoor = x === doorX && z === fz;

  // ground floor: shopfront glass, piers, fascia
  for (let k = 1; k <= 3; k++) {
    if (isDoor) continue; // set below
    if (t % 3 === 0) put(x, gr + k, z, "quartz_pillar", { axis: "y" });
    else put(x, gr + k, z, "glass");
  }
  if (isDoor) {
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
  put(x, gr + 4, z, "white_concrete");

  // storey line
  put(x, gr + 5, z, "quartz_block");

  // upper storey: lintels and sills, windows on the 3-cell rhythm
  put(x, gr + 6, z, "quartz_block");
  const win = t % 3 === 1;
  for (const k of [7, 8]) {
    if (win) put(x, gr + k, z, "glass_pane", pane);
    else put(x, gr + k, z, "white_concrete");
  }
  put(x, gr + 9, z, "quartz_block");

  // parapet / cornice rim
  put(x, gr + 10, z, "quartz_block");

  // warm light behind some upper windows
  if (win && t % 6 === 1) {
    const ix = mw ? x + 1 : me ? x - 1 : x;
    const iz = mn ? z + 1 : ms ? z - 1 : z;
    if (inF(ix, iz) && !isExt(ix, iz)) {
      put(ix, gr + 8, iz, t % 12 === 1 ? "shroomlight" : "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
