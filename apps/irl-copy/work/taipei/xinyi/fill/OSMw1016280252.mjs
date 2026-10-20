import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280252";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 7 x 21 footprint, roof top at about y 21, four storeys of 5 blocks, parapet to 21.
const W = 7, H = 33, D = 21;
const g = new Voxels([W, H, D]);

const ROOF = 20;      // roof deck layer
const PARAPET = 21;   // parapet layer on exterior cells
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const exteriorOf = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isExterior = (x, z) => {
  const e = exteriorOf(x, z);
  return e.N || e.S || e.W || e.E;
};

// Entrance: front (north, z=0 side) cell nearest x=3.
const frontCells = cells.filter(([x, z]) => !has(x, z - 1));
let entrance = null;
for (const [x, z, gr] of frontCells) {
  if (!entrance || Math.abs(x - 3) < Math.abs(entrance.x - 3)) {
    entrance = { x, z, gr };
  }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ext = exteriorOf(x, z);
  const exterior = isExterior(x, z);

  // Pick primary exterior face and along-facade index.
  let face = null, idx = 0, inX = 0, inZ = 0;
  if (ext.N) { face = "N"; idx = x; inX = 0; inZ = 1; }
  else if (ext.S) { face = "S"; idx = x; inX = 0; inZ = -1; }
  else if (ext.W) { face = "W"; idx = z; inX = 1; inZ = 0; }
  else if (ext.E) { face = "E"; idx = z; inX = -1; inZ = 0; }

  const isEntranceCell = entrance && entrance.x === x && entrance.z === z;

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      g.set(x, y, z, "gray_concrete");
      continue;
    }
    if (!exterior) {
      // Interior: only floor slabs at storey lines, otherwise air.
      if (y % 5 === 0) g.set(x, y, z, "white_concrete");
      continue;
    }

    const yy = y % 5;
    const k = Math.floor(y / 5);

    if (yy === 0) {
      // Storey line.
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (yy === 4) {
      // Spandrel band under the next storey line.
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // yy 1..3: window zone.
    const isWindow = idx % 2 === 1 && idx >= 1;
    const glass = k === 0 ? "cyan_stained_glass" : "light_blue_stained_glass";

    if (face === "N" && k === 0) {
      // Shopfront on the front face: glass across the bay, piers at the ends.
      if (idx >= 1 && idx <= 5) {
        g.set(x, y, z, glass);
      } else {
        g.set(x, y, z, "white_concrete");
      }
      continue;
    }

    if (isWindow) {
      g.set(x, y, z, glass);
      // Warm light behind some windows, in the interior air cell.
      const xi = x + inX, zi = z + inZ;
      if (yy === 2 && idx % 4 === 1 && k % 2 === 0 && has(xi, zi) && !isExterior(xi, zi)) {
        g.set(xi, y, zi, "glowstone");
      }
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // Parapet on the exterior edge.
  if (exterior) g.set(x, PARAPET, z, "smooth_stone");
}

// Entrance: double door on the front, recessed canopy above.
if (entrance) {
  const { x: ex, z: ez, gr } = entrance;
  if (gr + 1 <= 4) {
    g.set(ex, gr, ez, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(ex, gr + 1, ez, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
  // Canopy: dark stair row over the entrance bay at the storey-0 top band.
  for (const dx of [-1, 0, 1]) {
    const cx = ex + dx;
    if (has(cx, ez) && cx >= 0 && cx < W) {
      g.set(cx, 4, ez, "dark_oak_stairs", {
        facing: "north", half: "top", shape: "straight", waterlogged: "false",
      });
    }
  }
}

// Roof plant: a modest mechanical box on interior roof cells.
for (let x = 2; x <= 4; x++) {
  for (let z = 8; z <= 12; z++) {
    if (!has(x, z) || isExterior(x, z)) continue;
    for (let y = PARAPET; y <= 23; y++) {
      g.set(x, y, z, "stone_bricks");
    }
  }
}
// Small lit cap on the plant box.
if (has(3, 10)) g.set(3, 24, 10, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
