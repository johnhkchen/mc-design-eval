// NYC1090672: 10 West 48th Street, a 2017 Midtown speculative office tower, built from its lidar massing.
// The lidar roof is snapped to flat tiers of three-block storeys (9, 15, 18, 24, 27); lidar holes ringed by
// building take the lowest neighbouring tier; roof <= 1 is open (plaza or light well). Each building column
// is solid from y 0 to its tier: a perimeter ring of glass curtain wall with spandrels, granite base, cornice
// and lobby, and interior floor slabs per storey with an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1090672.cells.json`, "utf8"));

const W = 20, D = 25, H = 38;
const TIERS = [9, 15, 18, 24, 27];
const PANE = "light_blue_stained_glass_pane", MULLION = "gray_concrete", SLAB = "light_gray_concrete";
const GRANITE = "calcite";             // the limestone base, piers and cornice
const ROOF = { 9: "moss_block", 15: "gray_concrete", 18: "gray_concrete", 24: "smooth_stone", 27: "gray_concrete" };
const DOOR_X = [9, 10];
const D4 = [[0, -1], [0, 1], [1, 0], [-1, 0]];       // N, S, E, W (north = low z, uptown)
const N = 0, S = 1, E = 2, W_ = 3;

const key = (x, z) => `${x},${z}`;
const col = new Map();
for (const [x, z, ground, roof] of cells) {
  const top = roof <= 1 ? 0 : TIERS.reduce((a, b) => (Math.abs(b - roof) < Math.abs(a - roof) ? b : a));
  col.set(key(x, z), { ground, top });
}
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D;
const topAt = (x, z) => (inside(x, z) ? col.get(key(x, z)).top : -1);

// lidar holes: an open cell ringed by building on three or more sides takes the lowest of those tiers
for (const [k, c] of col) {
  if (c.top !== 0) continue;
  const [x, z] = k.split(",").map(Number);
  const nb = D4.map(([dx, dz]) => topAt(x + dx, z + dz)).filter((t) => t > 0);
  if (nb.length >= 3) c.top = Math.min(...nb);
}

// sides of the column at height y that face outside the footprint, an open court, or a neighbour below y
const exposed = (x, z, y) => D4.flatMap(([dx, dz], i) => {
  const t = topAt(x + dx, z + dz);
  return t < 0 || t <= y ? [i] : [];
});

const g = new Voxels([W, H, D]);
const lit = [];                                       // glass cells eligible for a warm light behind them

for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  if (c.top === 0) { g.set(x, 0, z, "smooth_stone"); continue; }     // plaza, court floor
  for (let y = 0; y < c.top; y++) {
    const ex = exposed(x, z, y);
    const top = y === c.top - 1;
    if (ex.length === 0) {                              // interior: floor slabs, roof, air between
      if (top) g.set(x, y, z, ROOF[c.top]);
      else if (y % 3 === 0) g.set(x, y, z, SLAB);
      continue;
    }
    if (top) { g.set(x, y, z, GRANITE); continue; }     // cornice
    if (y % 3 === 0) {                                  // spandrel, plinth at the base
      g.set(x, y, z, y === 0 ? GRANITE : (y === 3 && z === 0 && x >= 8 && x <= 11 ? "stone" : SLAB));
      continue;
    }
    const corner = (ex.includes(N) || ex.includes(S)) && (ex.includes(E) || ex.includes(W_));
    if (corner) { g.set(x, y, z, MULLION); continue; }
    const streetFace = ex.includes(N) && z === 0;       // the 48th Street frontage
    const outsideFace = ex.some((i) => topAt(x + D4[i][0], z + D4[i][1]) < 0);
    const coord = ex.includes(N) || ex.includes(S) ? x : z;
    if (y < 3 && streetFace) {                          // shopfront with a double lobby door
      if (DOOR_X.includes(x)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 9 ? "left" : "right", open: "false", powered: "false",
        });
      } else g.set(x, y, z, coord % 3 === 0 ? GRANITE : PANE);
      continue;
    }
    if (y < 3 && outsideFace) { g.set(x, y, z, GRANITE); continue; }   // solid base on the other street sides
    if (coord % 2 === 0) g.set(x, y, z, MULLION);       // curtain-wall mullions
    else { g.set(x, y, z, PANE); lit.push([x, y, z]); }
  }
}

// warm lights: some windows keep a lamp in the air gap behind the glass (on a floor slab, so it is supported)
for (const [x, y, z] of lit) {
  if (y % 3 !== 1 || ((x * 7 + z * 11 + y * 5) % 9) !== 0) continue;
  for (const [dx, dz] of D4) {
    const nx = x - dx, nz = z - dz;                     // the side away from the outside
    if (!inside(nx, nz) || topAt(nx, nz) <= y || exposed(nx, nz, y).length) continue;
    g.set(nx, y, nz, "lantern", { hanging: "false" });
    break;
  }
}

// the lobby lantern hangs under the storey-two slab, inside the entrance
g.set(9, 2, 1, "lantern", { hanging: "true" });

// the spine's corner lanterns on its cornice
for (const [x, z] of [[0, 0], [2, 0], [0, 17], [2, 17]]) g.set(x, 27, z, "lantern", { hanging: "false" });

// roof plant on the setback and the main roof
const box = (x0, x1, z0, z1, y0, y1, b) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) g.set(x, y, z, b);
};
box(4, 5, 13, 14, 24, 25, "light_gray_concrete");
box(12, 13, 6, 7, 18, 19, "light_gray_concrete");

// the green roof of the south wing: azaleas on the moss where the roof is open to sky
for (const [x, z] of [[2, 21], [5, 23], [8, 21], [10, 23]]) {
  if (topAt(x, z) === 9 && exposed(x, z, 8).length === 0) g.set(x, 9, z, "flowering_azalea");
}

// pane connections: each pane joins the solid or pane neighbours in its wall plane
const panes = [];
for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const b = g.get(x, y, z);
  if (b && b.block === `minecraft:${PANE}`) panes.push([x, y, z]);
}
const solid = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, y, z] of panes) {
  g.set(x, y, z, PANE, {
    east: solid(x + 1, y, z), north: solid(x, y, z - 1), south: solid(x, y, z + 1), west: solid(x - 1, y, z), waterlogged: false,
  });
}

const stats = g.save(`${DIR}/NYC1090672.nbt`);
console.log(`NYC1090672: ${stats.blocks} blocks, ${stats.palette} palette entries, ${panes.length} panes`);
