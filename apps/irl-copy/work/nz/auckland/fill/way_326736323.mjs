import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A two-storey 1930s Deco shop-and-flat in cream plaster on a flat site (every cell's ground is 0). The lidar roof
// heights (6..9) are smoothed by a 3x3 median over the footprint and snapped to three tiers: a one-storey wing (6),
// the two-storey body (8), and the body with a one-block plant room (9). Walls are the footprint's edge cells, with a
// ground-floor shopfront on the street (north) face, a storey band at y 4, a cornice cap, and glass panes in the
// window bays. The interior is air apart from a floor slab at y 0 and y 4 and a roof slab at the top row.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_326736323.cells.json`, "utf8"));
const X = 8, Y = 22, Z = 14;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const inF = (x, z) => raw.has(key(x, z));
const median = (v) => { v.sort((a, b) => a - b); return v[v.length >> 1]; };

// tier: the lidar roof, smoothed over the 3x3 footprint neighbourhood and snapped to 6 / 8 / 9
const tier = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) v.push(raw.get(key(x + dx, z + dz)));
  const m = median(v);
  return m >= 9 ? 9 : m <= 6 ? 6 : 8;
};
// the sides of a cell that face outside the footprint: N is -z (the street face), S is +z, W is -x, E is +x
const exposed = (x, z) => {
  const f = [];
  if (!inF(x, z - 1)) f.push("N");
  if (!inF(x, z + 1)) f.push("S");
  if (!inF(x - 1, z)) f.push("W");
  if (!inF(x + 1, z)) f.push("E");
  return f;
};
// inward direction of each face: the cell one step in from the wall
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
// window bays: piers every third cell along a face. A cell on the diagonal steps has two exposed faces; it takes a bay
// on whichever face has one, so the east and west flanks keep their windows
const bay = (x, z, f) => (f === "N" || f === "S" ? x : z) % 3 !== 0;
const bayFace = (x, z, f) => f.find((side) => bay(x, z, side));
const isWindowCell = (x, z, f) => bayFace(x, z, f) !== undefined;

const g = new Voxels([X, Y, Z]);
const panes = new Set();
const door = new Set(["4,1,0", "4,2,0"]);   // x,y,z of the shopfront door (lower and upper halves)
const lit = [];

for (const k of raw.keys()) {
  const [x, z] = k.split(",").map(Number);
  const h = tier(x, z);
  const f = exposed(x, z);
  const ring = f.length > 0;
  for (let y = 0; y < h; y++) {
    if (!ring) {
      // interior: floor slabs at 0 and 4, roof slab on the top row, air between
      if (y === 0 || y === 4 || y === h - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const dk = `${x},${y},${z}`;
    if (door.has(dk) && z === 0) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }
    if (y === 4) { g.set(x, y, z, "polished_andesite_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === h - 1) { g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
    const ground = y === 1 || y === 2;
    const upper = h >= 8 && (y === 5 || y === 6);
    if (ground && (f.includes("N") && z === 0 && x >= 3 && x <= 5 || isWindowCell(x, z, f))) {
      g.set(x, y, z, "glass_pane"); panes.add(dk); continue;
    }
    if (upper && isWindowCell(x, z, f)) {
      g.set(x, y, z, "glass_pane"); panes.add(dk);
      const [dx, dz] = inward[bayFace(x, z, f)];
      if ((x * 3 + z * 7 + y) % 4 === 0) lit.push([x + dx, z + dz]);
      continue;
    }
    g.set(x, y, z, "smooth_quartz");
  }
}

// warm light behind some upper windows: a glowstone in the interior cell just inside the wall
for (const [x, z] of lit) if (inF(x, z) && !exposed(x, z).length) g.set(x, 5, z, "glowstone");

// a lantern hangs under the shopfront's ceiling slab, lit through the glass
g.set(4, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });

// a small plant room on the roof of the interior 2x2 (rows above the tier roof)
for (const [x, z] of [[3, 6], [4, 6], [3, 7], [4, 7]]) {
  const h = tier(x, z);
  g.set(x, h, z, "stone_bricks"); g.set(x, h + 1, z, "stone_bricks");
}

// pane connections: a pane joins a neighbouring pane or solid wall on each side
const WALL = /quartz|andesite|brick|stone/;
const at = (x, y, z) => { const v = g.get(x, y, z); return v ? v.block : null; };
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const side = (nx, nz) => { const b = at(nx, y, nz); return b && (b === "minecraft:glass_pane" || WALL.test(b)) ? "true" : "false"; };
  g.set(x, y, z, "glass_pane", { north: side(x, z - 1), south: side(x, z + 1), west: side(x - 1, z), east: side(x + 1, z), waterlogged: "false" });
}

const info = g.save(`${DIR}/way_326736323.nbt`);
console.log(JSON.stringify(info));
