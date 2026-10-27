import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 1095570518: a two-storey brick commercial block with a shopfront, a string course, a lintel band and a
// parapet (c. 1920s-30s Auckland), with a lower wing on its south-east side. Cells are [x, z, ground, roof].
// Each cell is one block of the shell (walls, windows) or of the interior (floor slabs only, no rooms).
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570518.cells.json", "utf8"));
const H = 23;
const g = new Voxels([8, H, 8]);
const plan = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof: Math.min(roof, H) }]));
const inF = (x, z) => plan.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const outward = (x, z) => Object.keys(DIRS).filter(d => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const DOOR = [2, 1];   // the entrance on the north (street) face, set between solid piers so its thin panel does not open a hole

// a window pane runs along the wall: its arms connect to the wall on either side
const pane = (face) => ({
  north: face === "E" || face === "W" ? "true" : "false",
  south: face === "E" || face === "W" ? "true" : "false",
  east: face === "N" || face === "S" ? "true" : "false",
  west: face === "N" || face === "S" ? "true" : "false",
  waterlogged: "false",
});

const shell = [];
for (const c of plan.values()) {
  const { x, z, ground, roof: R } = c;
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");   // foundation up to the lidar ground
  const out = outward(x, z);
  if (!out.length) {
    // interior: a floor slab per storey and the roof deck, sitting on the walls around; no rooms
    for (const y of [ground, 4, R - 2]) if (y < R) g.set(x, y, z, "smooth_stone");
    continue;
  }
  shell.push(c);
  const door = x === DOOR[0] && z === DOOR[1];
  const bay = out.length === 1 && (x + z) % 2 === 1;   // windows alternate along each straight run; corners and piers stay solid
  const face = out[0];
  for (let y = ground; y < R; y++) {
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                     // plinth course
    if (door && (y === 1 || y === 2)) {
      g.set(x, y, z, "oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y <= 2) {                                                                  // shopfront: glass bays between brick piers, stone quoins
      if (bay) g.set(x, y, z, "glass_pane", pane(face));
      else g.set(x, y, z, out.length > 1 ? "stone_bricks" : "bricks");
      continue;
    }
    if (y === 3) { g.set(x, y, z, "dark_oak_planks"); continue; }                  // shopfront fascia
    if (y === 4 || y === 7 && y < R - 1 || y === R - 1) { g.set(x, y, z, "smooth_quartz"); continue; }  // string course, lintel, coping
    if ((y === 5 || y === 6) && bay) { g.set(x, y, z, "glass_pane", pane(face)); continue; }                 // upper windows
    g.set(x, y, z, "bricks");                                                      // brick wall and parapet
  }
}

// warm light: glowstone and hanging lanterns just inside some of the upper and ground bays (the interior is air)
for (const c of shell) {
  const out = outward(c.x, c.z);
  if (out.length !== 1 || (c.x + c.z) % 2 !== 1) continue;
  const [dx, dz] = DIRS[out[0]];
  const ix = c.x - dx, iz = c.z - dz;
  if (!inF(ix, iz) || outward(ix, iz).length) continue;
  if ((c.x + c.z) % 4 === 3) g.set(ix, 5, iz, "glowstone");
  else if (c.roof > 4) g.set(ix, 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof plant on the deck of the tower's interior (one unit, grey)
if (inF(3, 4) && inF(4, 4) && plan.get("3,4").roof === 10) {
  g.set(3, 9, 4, "polished_andesite");
  g.set(4, 9, 4, "polished_andesite");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570518.nbt";
console.log(g.save(out));
