import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no building data. Interpreted as a 1990s two-storey Xinyi commercial block:
// stone-clad base, white concrete piers, blue-tinted glazing, stone storey bands,
// a shopfront ground floor with a central entrance, and a parapet with rooftop plant.
// Roof top sits about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738218";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gm = new Map();
for (const [x, z, gr] of cells) gm.set(key(x, z), gr);
const has = (x, z) => gm.has(key(x, z));
const exposed = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isExt = (ex) => ex.n || ex.s || ex.w || ex.e;

const GLASS = "light_blue_stained_glass_pane";
const glassProps = (ns) =>
  ns
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: foundations, floors, walls, parapet
for (const [x, z, gr] of cells) {
  if (gr + 12 >= H) continue;
  const ex = exposed(x, z);
  const ext = isExt(ex);
  const ns = ex.n || ex.s;
  const i = ns ? x : z;
  const pierEdge = ns ? (x === 0 || x === W - 1) : (z === 0 || z === D - 1);
  const pier = pierEdge || i % 3 === 0;

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs / storey lines
  const floorId = ext ? "stone_bricks" : "smooth_stone";
  put(x, gr + 5, z, floorId);
  put(x, gr + 10, z, floorId);

  if (!ext) continue;

  // Ground floor shopfront (gr+1..gr+4)
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (pier) put(x, y, z, "stone_bricks");
    else put(x, y, z, GLASS, glassProps(ns));
  }

  // Upper storey (gr+6..gr+9): sill at gr+6, glazing gr+7..gr+9
  for (let y = gr + 6; y <= gr + 9; y++) {
    if (pier) put(x, y, z, "white_concrete");
    else if (y === gr + 6) put(x, y, z, "smooth_stone");
    else put(x, y, z, GLASS, glassProps(ns));
  }

  // Parapet on exterior cells
  put(x, gr + 11, z, "white_concrete");
}

// Pass 2: entrance on the south face, centred
const southCells = cells
  .filter(([x, z]) => exposed(x, z).s)
  .sort((a, b) => a[0] - b[0]);
if (southCells.length) {
  const [dx, dz, dg] = southCells[Math.floor(southCells.length / 2)];
  const doorBase = {
    facing: "south",
    hinge: "left",
    open: "false",
    powered: "false",
  };
  put(dx, dg + 1, dz, "dark_oak_door", { ...doorBase, half: "lower" });
  put(dx, dg + 2, dz, "dark_oak_door", { ...doorBase, half: "upper" });
  // Canopy lantern hung from the storey band above the entrance
  put(dx, dg + 4, dz, "lantern", { hanging: "true", waterlogged: "false" });
  // Entrance light: a warm glow inside the lobby
  if (has(dx, dz - 1) && !isExt(exposed(dx, dz - 1))) {
    put(dx, dg + 2, dz - 1, "glowstone");
  }
}

// Pass 3: warm lights behind some north-facing upper windows
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  if (!ex.n || gr + 12 >= H) continue;
  if (x % 3 === 0 || x % 6 !== 1) continue;
  if (!has(x, z + 1)) continue;
  const gi = gm.get(key(x, z + 1));
  if (isExt(exposed(x, z + 1))) continue;
  put(x, gi + 8, z + 1, "glowstone");
}

// Pass 4: rooftop plant on interior cells (air-conditioning boxes and a rod)
for (const [x, z, gr] of cells) {
  if (gr + 12 >= H) continue;
  if (isExt(exposed(x, z))) continue;
  if (x % 5 === 2 && z % 4 === 1) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
  if (x === 10 && z === 5) {
    put(x, gr + 11, z, "iron_block");
    put(x, gr + 12, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
