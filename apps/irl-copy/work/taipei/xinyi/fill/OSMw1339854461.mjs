import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${base}/OSMw1339854461.cells.json`, "utf8"));

const W = 10, H = 19, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.round(gr));
const has = (x, z) => G.has(key(x, z));
const groundAt = (x, z) => G.get(key(x, z));
const maxG = Math.max(...G.values());

// Roof slab sits 7 blocks above the lowest ground (lidar record), raised if the plot climbs.
const R = Math.max(7, maxG + 6);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Door: middle of the south (+z) street face, if the footprint has one.
const southEdge = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const out = outward(x, z);
  if (out.length === 1 && out[0][0] === 0 && out[0][1] === 1) southEdge.push(x);
}
southEdge.sort((a, b) => a - b);
const doorX = southEdge.length ? southEdge[Math.floor(southEdge.length / 2)] : null;
const doorZ = doorX === null ? null : cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => x === doorX && outward(x, z).some(([dx, dz]) => dx === 0 && dz === 1))
  .map(([, z]) => z)[0];

const glassProps = (axisZ) => axisZ
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, floors, roof slab, walls, parapet.
for (const [x, z, rawG] of cells) {
  const gg = Math.round(rawG);
  const out = outward(x, z);
  const edge = out.length > 0;
  const corner = out.length >= 2;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");
  // Ground floor slab (base course on the edge).
  put(x, gg, z, edge ? "stone_bricks" : "smooth_stone");
  // Roof slab over the whole footprint.
  put(x, R, z, "light_gray_concrete");

  if (!edge) continue;

  const primary = out[0];
  const axisZ = primary[0] === 0; // front/back face: panes run along x
  const along = axisZ ? x : z;
  const isDoorCell = doorX !== null && x === doorX && z === doorZ;

  for (let y = gg + 1; y <= R - 1; y++) {
    if (y === R - 1) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === R - 2) { put(x, y, z, "light_gray_concrete"); continue; }
    // Shopfront / window band.
    if (isDoorCell && (y === gg + 1 || y === gg + 2)) {
      put(x, y, z, "oak_door", {
        facing: "south",
        half: y === gg + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (corner || along % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane", glassProps(axisZ));
    }
  }

  // Parapet ring.
  put(x, R + 1, z, "white_concrete");
}

// Pass 2: interior light (lantern inside the door, glowstone behind shopfront mullion gaps).
if (doorX !== null && doorZ !== null) {
  const zIn = doorZ - 1;
  if (has(doorX, zIn) && outward(doorX, zIn).length === 0) {
    const gi = groundAt(doorX, zIn);
    put(doorX, gi + 1, zIn, "lantern", { hanging: "false", waterlogged: "false" });
  }
}
for (const [x, z, rawG] of cells) {
  const out = outward(x, z);
  if (out.length > 0) continue;
  const gg = Math.round(rawG);
  // Interior cells one step in from the south ring, lit behind the glass gaps.
  const onInnerSouthRow = z === D - 3 || (doorZ !== null && z === doorZ - 1);
  if (onInnerSouthRow && x % 3 === 2 && !(doorX !== null && Math.abs(x - doorX) <= 0 && z === doorZ)) {
    put(x, gg + 2, z, "glowstone");
  }
}

// Roof plant: a small 2x2 box on interior roof cells near the centre.
for (const [x, z, rawG] of cells) {
  if (outward(x, z).length > 0) continue;
  if ((x === 3 || x === 4) && (z === 3 || z === 4)) {
    put(x, R + 1, z, "light_gray_concrete");
    put(x, R + 2, z, (x === 3 && z === 3) ? "iron_block" : "light_gray_concrete");
  }
}

g.save(`${base}/OSMw1339854461.nbt`);
