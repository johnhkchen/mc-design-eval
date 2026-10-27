// Mt Eden / Eden Terrace: a two-storey 1920s plastered commercial block with a shopfront on the ground floor, sash
// windows above, a cornice and parapet, and a taller corner pavilion on the NW corner where the lidar roof reads 9-10.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095572134.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_1095572134.nbt`;

const g = new Voxels([13, 23, 10]);
const foot = new Map(cells.map(([x, z, gr, roof]) => [`${x},${z}`, { gr, roof }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
// outward neighbours: [dx, dz, facing name]
const SIDES = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

// classify each footprint cell: perimeter (has an outward neighbour), corner (two), pavilion (lidar roof >= 9 => 11 blocks)
const info = new Map();
for (const [x, z, gr, roof] of cells) {
  const outs = SIDES.filter(([dx, dz]) => !inFoot(x + dx, z + dz));
  info.set(`${x},${z}`, { x, z, gr, roof, outs, perim: outs.length > 0, corner: outs.length >= 2, pav: roof >= 9 });
}
const at = (x, z) => info.get(`${x},${z}`);

// the front door: the middle of the north-facing single-side perimeter cells (the shopfront's street side)
const singles = [...info.values()].filter((c) => c.outs.length === 1);
const north = singles.filter((c) => c.outs[0][1] === -1);
const door = (north.length ? north : singles)[Math.floor((north.length ? north : singles).length / 2)];

// relative levels above each cell's ground (rel 0 = its ground): 0 plinth/floor, 1-3 shopfront (fascia 3), 4 floor
// slab and string course, 5-7 upper storey (windows 5-6, head 7), 8 roof deck and cornice, 9 parapet (pavilion: wall),
// 10 pavilion parapet
const panes = [];
for (const c of info.values()) {
  const { x, z, gr: b, outs, perim, corner, pav } = c;
  const put = (rel, block, state) => g.set(x, b + rel, z, block, state);
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");   // foundation to the lowest ground
  if (!perim) {
    put(0, "smooth_stone"); put(4, "smooth_stone"); put(8, "smooth_stone");
    if (pav) put(9, "smooth_stone");
    continue;
  }
  const [dx, dz] = outs[0] ?? [0, 0];
  const along = dx !== 0 ? z : x;   // along the face: z for an east/west wall, x for a north/south one
  const pier = corner || along % 3 === 0;
  const isDoor = door && door.x === x && door.z === z;
  const pillar = (rel) => put(rel, "quartz_pillar", { axis: "y" });
  put(0, "stone_bricks"); put(4, "stone_bricks"); put(8, "stone_bricks");   // plinth, string course, cornice
  if (corner) { for (const r of [1, 2, 3, 5, 6, 7, 9]) pillar(r); }
  else if (isDoor) {
    const f = outs[0][2];
    put(1, "dark_oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(2, "dark_oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(3, "dark_oak_planks");
  } else if (pier) { for (const r of [1, 2, 3, 5, 6, 7]) put(r, "quartz_block"); }
  else {
    put(1, "glass"); put(2, "glass"); put(3, "dark_oak_planks");              // shop glazing under a dark fascia
    put(5, "glass_pane"); put(6, "glass_pane"); put(7, "dark_oak_planks");   // sash windows under a dark head
    panes.push([x, b + 5, z], [x, b + 6, z]);
  }
  if (pav) {
    if (pier) put(9, "quartz_block"); else { put(9, "glass_pane"); panes.push([x, b + 9, z]); }
    put(10, corner ? "quartz_pillar" : "quartz_block", corner ? { axis: "y" } : undefined);   // pavilion parapet
  } else {
    put(9, corner ? "quartz_pillar" : "quartz_block", corner ? { axis: "y" } : undefined);   // body parapet
  }
}

// warm light: glowstone just inside a shopfront / upper window pane, hanging lanterns under the upper ceiling
for (const c of info.values()) {
  if (!c.perim || c.corner || c.outs.length !== 1) continue;
  const [dx, dz] = c.outs[0];
  const along = dx !== 0 ? c.z : c.x;
  if (door && door.x === c.x && door.z === c.z) continue;
  if (along % 3 === 0) continue;
  const inward = at(c.x - dx, c.z - dz);
  if (!inward || inward.perim) continue;
  if (along % 6 === 2) g.set(inward.x, c.gr + 1, inward.z, "glowstone");
  if (along % 6 === 1) g.set(inward.x, c.gr + 5, inward.z, "glowstone");
}
for (const c of info.values()) {
  if (!c.perim && !c.pav && (c.x + c.z) % 5 === 0) g.set(c.x, c.gr + 7, c.z, "lantern", { hanging: "true", waterlogged: "false" });
}

// two rooftop air-handling units on the body's open roof (interior, not under the pavilion)
const roofCand = [...info.values()].filter((c) => !c.perim && !c.pav && c.x > 3 && c.x < 10);
if (roofCand.length) {
  for (const i of [Math.floor(roofCand.length * 0.3), Math.floor(roofCand.length * 0.7)]) {
    const c = roofCand[i]; g.set(c.x, c.gr + 9, c.z, "light_gray_concrete");
  }
}

// glass panes connect to whatever stands beside them (wall piers, neighbouring panes), not to air
for (const [x, y, z] of panes) {
  const link = (dx, dz) => g.val(x + dx, y, z + dz) !== 0;
  g.set(x, y, z, "glass_pane", { north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)), waterlogged: "false" });
}

const stats = g.save(OUT);
console.log("wrote", OUT, stats);
