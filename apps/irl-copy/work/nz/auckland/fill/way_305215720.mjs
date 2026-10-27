// Way 305215720: a 1970s concrete office block on a basalt plinth, six storeys over a stepped slim tower (63 blocks, 53 m)
// at its north-east corner. Each footprint cell is a column from y 0 to its tier; walls only where a cell meets air (off the
// footprint, or a lower roof), so nothing floats. Interiors are air with a floor slab per storey; glass has air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_305215720.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const N = 35, H = 75;
const g = new Voxels([N, H, N]);

const key = (x, z) => (x + 2) * 64 + (z + 2);
// lidar roof heights snapped to clean tiers: a low wing (12), the six-storey body (25), setbacks at 44 and 53, the 63 crown
const tierOf = (R) => (R <= 15 ? 12 : R <= 30 ? 25 : R <= 46 ? 44 : R <= 57 ? 53 : 63);
const FP = new Map();
for (const [x, z, G, R] of cells) FP.set(key(x, z), { x, z, G, T: tierOf(R) });
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// the side of column c at height y that meets air (off the footprint, or a lower roof); null when it is interior
function exposure(c, y) {
  if (y < c.G || y >= c.T) return null;
  for (const d of DIRS) {
    const n = FP.get(key(c.x + d[0], c.z + d[1]));
    if (!n || n.T <= y) return d;
  }
  return null;
}

// the entrance: on the lowest street frontage, nearest the middle of the block
let entrance = null;
for (const c of FP.values()) {
  const d = exposure(c, c.G);
  if (!d || c.G + 3 >= c.T) continue;
  const score = c.G * 100 + Math.abs(c.x - 17) + Math.abs(c.z - 17);
  if (!entrance || score < entrance.score) entrance = { c, d, score };
}

const panes = [];   // window glass, connected and lit after the walls are in
for (const c of FP.values()) {
  const tower = c.T >= 44;
  for (let y = 0; y < c.T; y++) {
    if (y < c.G) { g.set(c.x, y, c.z, "stone_bricks"); continue; }          // foundation to the ground
    const face = exposure(c, y);
    if (!face) {                                                              // interior: air, a floor slab per storey, a roof
      if (y === c.T - 1) g.set(c.x, y, c.z, "gray_concrete");
      else if (y === c.G || y % 4 === 0) g.set(c.x, y, c.z, "smooth_stone");
      continue;
    }
    const u = c.x + c.z;   // the mullion rhythm runs along either face
    const glass = () => {
      const block = tower || (Math.floor(y / 4) + u) % 3 === 0 ? "light_blue_stained_glass_pane" : "gray_stained_glass_pane";
      panes.push({ x: c.x, y, z: c.z, block, out: face });
    };
    if (y === c.G) g.set(c.x, y, c.z, "polished_andesite");                   // base course on the plinth
    else if (y < 4) {                                                          // shopfront: glass bays under a lintel
      if (y === 3) g.set(c.x, y, c.z, "light_gray_concrete");
      else if (u % 4 === 0) g.set(c.x, y, c.z, "white_concrete");
      else glass();
    }
    else if (y % 4 === 0) g.set(c.x, y, c.z, "smooth_stone");                  // storey line
    else if (y % 4 === 3) g.set(c.x, y, c.z, "light_gray_concrete");          // spandrel
    else if (u % 4 === 0) g.set(c.x, y, c.z, "white_concrete");              // mullion
    else glass();
  }
}

// parapet: a cap course on every exposed roof edge
for (const c of FP.values()) if (exposure(c, c.T - 1)) g.set(c.x, c.T, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

// the entrance: a glazed door with a lintel over it
if (entrance) {
  const { c, d } = entrance;
  const door = (half) => ({ facing: d[2], half, hinge: "left", open: "false", powered: "false" });
  for (let i = panes.length - 1; i >= 0; i--) if (panes[i].x === c.x && panes[i].z === c.z && panes[i].y <= c.G + 2) panes.splice(i, 1);
  g.set(c.x, c.G, c.z, "dark_oak_door", door("lower"));
  g.set(c.x, c.G + 1, c.z, "dark_oak_door", door("upper"));
  g.set(c.x, c.G + 2, c.z, "smooth_stone");
}

// lit windows: a glowstone just inside some panes (the air gap behind the glass), never on a slab row
for (const p of panes) {
  const i = FP.get(key(p.x - p.out[0], p.z - p.out[1]));
  if (!i || p.y < i.G || p.y >= i.T || p.y % 4 === 0 || exposure(i, p.y)) continue;
  if ((p.x * 7 + p.y * 3 + p.z * 5) % 7 === 0) g.set(i.x, p.y, i.z, "glowstone");
}

// roof plant: a pair of iron units on the six-storey roof, clear of the parapet
for (const c of FP.values()) {
  if (c.T !== 25 || c.x % 7 !== 4 || c.z % 6 !== 3) continue;
  const clear = DIRS.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]].map((d) => [d[0], d[1], ""]))
    .every((d) => FP.get(key(c.x + d[0], c.z + d[1]))?.T === 25);
  if (clear) { g.set(c.x, c.T, c.z, "iron_block"); g.set(c.x + 1, c.T, c.z, "iron_block"); }
}

// pane connections: a pane joins its neighbours (glass or wall) in the facade plane, and not a lamp or a door
for (const p of panes) {
  const state = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  for (const d of DIRS) {
    const b = g.get(p.x + d[0], p.y, p.z + d[1])?.block;
    if (b && b !== "minecraft:glowstone" && !b.endsWith("_door")) state[d[2]] = "true";
  }
  g.set(p.x, p.y, p.z, p.block, state);
}

const out = g.save(`${DIR}/way_305215720.nbt`);
console.log(`way_305215720: ${out.blocks} blocks, ${out.palette} palette entries, entrance at ${entrance ? `${entrance.c.x},${entrance.c.z}` : "none"}`);
