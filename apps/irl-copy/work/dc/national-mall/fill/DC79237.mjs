// DC79237: a 1930s Federal-style office block on the Mall (Federal Triangle idiom): pale limestone walls, a stone
// base, quartz string courses and cornice, three storeys on a 12-block body with a 13-block attic pavilion and a
// 8-block wing. Walls are a one-cell shell with an air gap behind the glass and a floor slab per storey; the roof
// tiers are clean flat steps, and every storey, step and roof stands on the course under it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79237.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell

const g = new Voxels([22, 25, 27]);

// Lidar roof heights, smoothed into three flat tiers: wing 8, body 12, attic pavilion 13.
const tier = (roof) => (roof <= 8 ? 8 : roof >= 13 ? 13 : 12);
const key = (x, z) => `${x},${z}`;
const H = new Map();
for (const [x, z, , roof] of cells) H.set(key(x, z), tier(roof));
const inF = (x, z) => H.has(key(x, z));
const hAt = (x, z) => H.get(key(x, z));

const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
// the outward faces of a cell (no footprint beside it) and the lower tiers it steps down to
const sides = (x, z) => {
  const h = hAt(x, z), outs = [], steps = [];
  for (const [d, dx, dz] of DIRS) {
    if (!inF(x + dx, z + dz)) outs.push([d, dx, dz]);
    else if (hAt(x + dx, z + dz) < h) steps.push([d, dx, dz]);
  }
  return { outs, steps };
};
const perimOf = (x, z) => { const s = sides(x, z); return s.outs.length + s.steps.length > 0; };

const STRING = [5, 9];                       // quartz string courses between storeys
const BANDS = [[2, 4], [6, 8], [10, 11]];    // window bands, ground floor to top storey
const inBand = (y) => BANDS.some(([lo, hi]) => y >= lo && y <= hi);
const bandMid = (y) => { const [lo, hi] = BANDS.find(([lo, hi]) => y >= lo && y <= hi); return Math.floor((lo + hi) / 2); };
const pane = (d) => (d === "north" || d === "south"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const pier = { axis: "y" };

// the entrance: the middle of the north-facing street front
const northFront = cells.filter(([x, z]) => sides(x, z).outs.some(([d]) => d === "north")).map(([x]) => x).sort((a, b) => a - b);
const doorX = northFront[Math.floor(northFront.length / 2)];
const doorZ = Math.min(...cells.filter(([x]) => x === doorX).map(([, z]) => z));

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const h = hAt(x, z), { outs, steps } = sides(x, z), perim = outs.length + steps.length > 0;
  g.set(x, 0, z, "stone_bricks");                                // foundation under every cell
  if (!perim) {                                                  // hollow inside: floor slab per storey, a roof deck
    for (const y of [1, 5, 9]) if (y < h) g.set(x, y, z, "smooth_stone");
    g.set(x, h, z, "smooth_stone");
    continue;
  }
  const facade = outs.length > 0, corner = outs.length >= 2;
  const [, fdx, fdz] = outs[0] ?? [];
  const idx = outs.length === 1 && (outs[0][0] === "north" || outs[0][0] === "south") ? x : z;
  const isPier = corner || (facade && idx % 3 === 0);
  for (let y = 1; y < h; y++) {
    if (y === 1) { g.set(x, y, z, "stone_bricks"); continue; }                  // base course
    if (!facade) { g.set(x, y, z, STRING.includes(y) ? "smooth_quartz" : "calcite"); continue; }   // step walls: plain
    if (isPier) { g.set(x, y, z, "quartz_pillar", pier); continue; }
    if (STRING.includes(y)) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (inBand(y) && y < h) {
      g.set(x, y, z, "glass_pane", pane(outs[0][0]));
      // a warm lamp in the room behind some panes (air between glass and lamp, lamps off the floor slabs)
      const ix = x - fdx, iz = z - fdz;
      if (inF(ix, iz) && !perimOf(ix, iz) && y === bandMid(y) && idx % 2 === 0)
        g.set(ix, y, iz, idx % 4 === 0 ? "glowstone" : "shroomlight");
      continue;
    }
    g.set(x, y, z, "calcite");
  }
  if (facade) {
    const isDoor = x === doorX && z === doorZ;
    if (isDoor) {
      g.set(x, 2, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, 3, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, 4, z, "stone_brick_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
    }
  }
  g.set(x, h, z, "smooth_quartz");                                  // cornice course on every perimeter cell
  if (facade) g.set(x, h + 1, z, corner ? "quartz_pillar" : "calcite", corner ? pier : undefined);   // parapet, piered at corners only
}

// roof equipment: two air-handler blocks on the body roof, on the deck, clear of the parapet
const boxes = [];
for (const [x, z] of cells) {
  if (boxes.length >= 2) break;
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => inF(x + dx, z + dz) && hAt(x + dx, z + dz) === 12 && !perimOf(x + dx, z + dz));
  if (!ok || boxes.some(([bx, bz]) => Math.abs(bx - x) < 3 && Math.abs(bz - z) < 3)) continue;
  boxes.push([x, z]);
}
for (const [x, z] of boxes) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(x + dx, 13, z + dz, "iron_block");

// a lantern on two body corners, standing on the parapet piers
const corners = cells.filter(([x, z]) => sides(x, z).outs.length >= 2 && hAt(x, z) === 12);
for (const [x, z] of corners.slice(0, 2)) g.set(x, 14, z, "lantern", { hanging: "false", waterlogged: "false" });

const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79237.nbt");
console.log(`DC79237: ${r.blocks} blocks, ${r.palette} palette entries`);
