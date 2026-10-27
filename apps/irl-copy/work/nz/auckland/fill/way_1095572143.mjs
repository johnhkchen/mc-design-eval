// Way 1095572143: a 9 x 12 single-storey interwar brick shop with a parapet, on Mt Eden's flat ground (lidar roof 6 above y0).
// Read as: stone plinth, a shopfront on the street face (glass, dark oak posts, a door), brick side walls with paired-pane
// windows over a stone sill, a polished string course and a stone coping, a dark flat roof with a plant unit.
// Storey 1 is y 0-3 (plinth + 3 courses, the 4-block storey), the parapet is y 4-5. Interior is an air gap; floor is y 0,
// ceiling y 4. Nothing sits on air: every layer stands on the one below and each cell's column runs y 0 up to its roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572143.cells.json", "utf8"));
const g = new Voxels([9, 19, 12]);

const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inside = (x, z) => fp.has(`${x},${z}`);
const TOP = Math.max(...cells.map((c) => c[3])) - 1;                 // 5: the coping and the roof surface
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };
const DOOR_FACING = { N: "north", S: "south", W: "west", E: "east" };
const ext = (x, z) => Object.keys(DIR).filter((d) => !inside(x + DIR[d][0], z + DIR[d][1]));

// The street face is the exterior side with the most exposed cells (it is the long one, so the shopfront reads).
const faceCount = { N: 0, S: 0, E: 0, W: 0 };
for (const [x, z] of cells) for (const d of ext(x, z)) faceCount[d]++;
const front = Object.keys(faceCount).reduce((a, b) => (faceCount[b] > faceCount[a] ? b : a));

// Classify the boundary: corners are quoins, others sit on one face (their primary face, front or side).
const boundary = cells.filter(([x, z]) => ext(x, z).length > 0);
// A quoin is a true two-face corner only: the stair-stepped edge makes many one-cell notches that would read as corners.
const isCorner = (x, z) => { const f = ext(x, z); return f.length === 2 && f.some((d) => d === "N" || d === "S") && f.some((d) => d === "E" || d === "W"); };
const shopCells = boundary.filter(([x, z]) => !isCorner(x, z) && ext(x, z)[0] === front);
const doorCell = shopCells[Math.floor(shopCells.length / 2)];

// Footprint layers: plinth at y 0, parapet/roof at y TOP, ceiling at y 4 over the interior, air between.
for (const [x, z] of cells) {
  g.set(x, 0, z, "stone_bricks");
  if (!ext(x, z).length) {
    g.set(x, 4, z, "smooth_stone");                                  // interior ceiling = storey slab
    g.set(x, TOP, z, "gray_concrete");                                // flat roof membrane
  }
}

// Boundary: a sill course, the walls, the string course and the coping.
for (const [x, z] of boundary) {
  const f = ext(x, z), d = f[0];
  g.set(x, 1, z, "stone_bricks");                                    // base course
  g.set(x, 4, z, "polished_andesite");                               // string course under the parapet
  g.set(x, TOP, z, "stone_bricks");                                  // coping
  if (isCorner(x, z)) {                                              // a brick corner, dressed in stone at the base and coping
    for (let y = 2; y <= 3; y++) g.set(x, y, z, "bricks");
    continue;
  }
  if (d === front) {                                                  // shopfront: glass, dark oak posts, fascia, door
    const i = d === "N" || d === "S" ? x : z;
    const isDoor = x === doorCell[0] && z === doorCell[1];
    g.set(x, 3, z, "dark_oak_planks");                               // fascia
    if (isDoor) {
      const st = { facing: DOOR_FACING[d], hinge: "left", open: "false", powered: "false" };
      g.set(x, 1, z, "dark_oak_door", { ...st, half: "lower" });
      g.set(x, 2, z, "dark_oak_door", { ...st, half: "upper" });
    } else if (i % 3 === 0) {
      for (let y = 1; y <= 3; y++) g.set(x, y, z, "dark_oak_log", { axis: "y" });
    } else {
      g.set(x, 1, z, "glass");
      g.set(x, 2, z, "glass");
      const ix = x + DIR[OPP[d]][0], iz = z + DIR[OPP[d]][1];        // the inside cell behind the glass
      if (inside(ix, iz) && !ext(ix, iz).length && i % 2 === 1) g.set(ix, 2, iz, "glowstone");
    }
    continue;
  }
  // side wall: paired panes in the brick, a window on every other cell along the wall
  const alongX = d === "N" || d === "S";
  const i = alongX ? x : z;
  const panes = alongX
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  for (const y of [2, 3]) {
    if (i % 2 === 0) g.set(x, y, z, "glass_pane", panes);
    else g.set(x, y, z, "bricks");
  }
  const ix = x + DIR[OPP[d]][0], iz = z + DIR[OPP[d]][1];
  if (i % 4 === 0 && inside(ix, iz) && !ext(ix, iz).length) g.set(ix, 2, iz, "shroomlight");
}

// Roof plant: a 2 x 2 condenser unit on four interior roof cells, standing on the membrane.
const interior = (x, z) => inside(x, z) && !ext(x, z).length;
outer: for (const [x, z] of cells) {
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (!interior(x + dx, z + dz)) continue outer;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(x + dx, TOP + 1, z + dz, "light_gray_concrete");
  break;
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572143.nbt");
console.log(`way_1095572143: ${out.blocks} blocks, palette ${out.palette}, front ${front}, door at ${doorCell}`);
